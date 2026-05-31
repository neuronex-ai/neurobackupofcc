import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Appointment } from '@/types';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/SessionContextProvider';

interface UpdateAppointmentData {
  id: string;
  updates: Partial<Omit<Appointment, 'id' | 'user_id' | 'created_at'>>;
}

const syncGoogleUpdate = async (googleEventId: string, updates: any, accessToken: string) => {
  try {
    await fetch("https://krewdaklcyzqfxkkgvqr.supabase.co/functions/v1/google-calendar-manage", {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'update',
        googleEventId,
        appointmentData: {
          start_time: updates.start_time,
          end_time: updates.end_time,
          notes: updates.notes
        }
      }),
    });
  } catch (e) {
    console.error("Background Google Sync Error:", e);
  }
};

const updateAppointmentFn = async ({ id, updates }: UpdateAppointmentData, userId: string, accessToken: string) => {
  // Check for conflicts if time is changing
  if (updates.start_time && updates.end_time) {
    const { data: hasConflict, error: conflictError } = await supabase.rpc('check_appointment_overlap', {
      p_user_id: userId,
      p_start_time: updates.start_time,
      p_end_time: updates.end_time,
      p_exclude_appointment_id: id
    });

    if (conflictError) throw new Error(conflictError.message);
    if (hasConflict) {
      throw new Error("Conflito de horário! Já existe um agendamento neste novo período.");
    }
  }

  const { data: existingAppointment, error: fetchError } = await supabase
    .from('appointments')
    .select(`*, patient:patient_id (name, email, phone)`)
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (fetchError || !existingAppointment) throw new Error("Agendamento não encontrado.");

  const { data: updatedAppointment, error: updateError } = await supabase
    .from('appointments')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (updateError) throw new Error(updateError.message);

  if (existingAppointment.google_event_id && (updates.start_time || updates.end_time || updates.notes)) {
    syncGoogleUpdate(existingAppointment.google_event_id, updates, accessToken);
  }

  return updatedAppointment;
};

export const useUpdateAppointment = () => {
  const queryClient = useQueryClient();
  const { session, user } = useAuth();
  const userId = user?.id;
  const accessToken = session?.access_token;

  return useMutation({
    mutationFn: (data: UpdateAppointmentData) => {
      if (!userId || !accessToken) throw new Error("Usuário não autenticado.");
      return updateAppointmentFn(data, userId, accessToken);
    },
    // --- OPTIMISTIC UI LOGIC ---
    onMutate: async (newData) => {
      // 1. Cancelar queries em andamento para não sobrescrever nosso update otimista
      await queryClient.cancelQueries({ queryKey: ['appointmentsByDateRange'] });
      await queryClient.cancelQueries({ queryKey: ['appointments'] });

      // 2. Snapshot do estado anterior (para rollback em caso de erro)
      const previousAppointments = queryClient.getQueryData(['appointmentsByDateRange']);

      // 3. Atualizar o cache otimisticamente
      queryClient.setQueriesData({ queryKey: ['appointmentsByDateRange'] }, (old: any) => {
        if (!old) return [];
        return old.map((apt: Appointment) =>
          apt.id === newData.id ? { ...apt, ...newData.updates } : apt
        );
      });

      return { previousAppointments };
    },
    onError: (error, _, context) => {
      // 4. Se der erro, reverter para o snapshot
      if (context?.previousAppointments) {
        queryClient.setQueriesData({ queryKey: ['appointmentsByDateRange'] }, context.previousAppointments);
      }
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
    onSettled: (data) => {
      // 5. Sempre refetch para garantir consistência final
      queryClient.invalidateQueries({ queryKey: ['appointmentsByDateRange'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetrics'] });

      if (data?.patient_id) {
        queryClient.invalidateQueries({ queryKey: ['patients', data.patient_id] });
      }
    }
  });
};