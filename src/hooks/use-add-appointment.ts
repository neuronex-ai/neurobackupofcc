import { useAuth } from '@/components/auth/SessionContextProvider';
import { supabase } from '@/integrations/supabase/client';
import { Appointment, Patient } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface NewAppointmentData {
  patient_id: string | null; // Nullable for blocks
  start_time: Date;
  end_time: Date;
  type: 'presencial' | 'online' | 'block';
  notes: string;
  location: string | null;
}

// URL da Edge Function para sincronizar com Google Calendar
const GOOGLE_CALENDAR_SYNC_URL = "https://krewdaklcyzqfxkkgvqr.supabase.co/functions/v1/google-calendar-sync";

const syncAppointmentToGoogle = async (appointment: Partial<Appointment>, patient: Partial<Patient>, accessToken: string) => {
  const response = await fetch(GOOGLE_CALENDAR_SYNC_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ appointment, patient }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.details || "Falha ao sincronizar com o Google Calendar.");
  }

  return response.json();
};

const addAppointment = async (appointmentData: NewAppointmentData, userId: string, accessToken: string) => {
  // 1. Check for conflicts
  const { data: hasConflict, error: conflictError } = await supabase.rpc('check_appointment_overlap', {
    p_user_id: userId,
    p_start_time: appointmentData.start_time.toISOString(),
    p_end_time: appointmentData.end_time.toISOString(),
  });

  if (conflictError) throw new Error(conflictError.message);

  if (hasConflict) {
    throw new Error("Conflito de horário detectado! Já existe um agendamento neste período.");
  }

  let patientData: Partial<Patient> = { name: "Bloqueio de Agenda" };
  let googleEventId = null;
  let googleMeetLink = null;

  // Only fetch patient and sync if NOT a block
  if (appointmentData.type !== 'block' && appointmentData.patient_id) {
    const { data: fetchedPatient, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', appointmentData.patient_id)
      .single();

    if (patientError || !fetchedPatient) {
      throw new Error("Paciente não encontrado.");
    }
    patientData = fetchedPatient;

    try {
      toast.info("Tentando sincronizar com o Google Calendar...");
      const syncResult = await syncAppointmentToGoogle(
        {
          ...appointmentData,
          id: 'temp',
          user_id: userId,
          created_at: new Date().toISOString(),
          status: 'confirmed',
          patient_name: patientData.name,
        } as unknown as Appointment,
        patientData,
        accessToken
      );

      googleEventId = syncResult.googleEventId;
      googleMeetLink = syncResult.googleMeetLink;
      toast.success("Agendamento sincronizado com Google Calendar!");
    } catch (e: any) {
      console.warn("Google Sync Failed:", e.message);
      toast.warning(`Agendamento criado, mas falha na sincronização com Google: ${e.message}`);
    }
  }

  const { data: newAppointment, error: appointmentError } = await supabase
    .from('appointments')
    .insert({
      user_id: userId,
      patient_id: appointmentData.patient_id,
      start_time: appointmentData.start_time.toISOString(),
      end_time: appointmentData.end_time.toISOString(),
      type: appointmentData.type,
      notes: appointmentData.notes || null,
      location: appointmentData.location || null,
      status: 'confirmed',
      google_event_id: googleEventId,
      google_meet_link: googleMeetLink,
    })
    .select()
    .single();

  if (appointmentError) {
    console.error('Erro ao adicionar agendamento:', appointmentError);
    throw new Error(appointmentError.message);
  }

  return { newAppointment, patientData };
};

export const useAddAppointment = () => {
  const queryClient = useQueryClient();
  const { session, user } = useAuth();
  const userId = user?.id;
  const accessToken = session?.access_token;

  return useMutation({
    mutationFn: (data: NewAppointmentData) => {
      if (!userId || !accessToken) throw new Error("Usuário não autenticado ou sessão inválida.");
      return addAppointment(data, userId, accessToken);
    },
    onSuccess: ({ patientData }) => {
      if (patientData.name !== "Bloqueio de Agenda") {
        toast.success(`Consulta para ${patientData.name} agendada com sucesso!`);
      } else {
        toast.success("Bloqueio de horário criado.");
      }
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointmentsByDateRange'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetrics'] });
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    }
  });
};
