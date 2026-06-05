import { useAuth } from '@/components/auth/SessionContextProvider';
import { isCancelledAppointmentStatus, normalizeAppointmentStatus } from '@/lib/appointment-status';
import { getAppointmentDisplayTitle } from '@/lib/appointment-utils';
import { getAppointmentKind } from '@/lib/appointment-metadata';
import { supabase } from '@/integrations/supabase/client';
import { Appointment } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { endOfMonth, formatISO, startOfMonth } from 'date-fns';

export type ActivityType =
  | 'appointment_status'
  | 'appointment_rescheduled'
  | 'payment_received'
  | 'anamnesis_updated'
  | 'note_created';

export interface DashboardActivity {
  id: string;
  type: ActivityType;
  patient_name: string;
  patient_id: string;
  date: Date;
  description: string;
  amount?: number;
  status?: string;
}

export const useDashboardActivities = (selectedDate = new Date()) => {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: ['dashboard-activities', userId, selectedDate.getFullYear(), selectedDate.getMonth()],
    queryFn: async () => {
      if (!userId) return [];

      const start = startOfMonth(selectedDate);
      const end = endOfMonth(selectedDate);
      const activities: DashboardActivity[] = [];

      const [appointmentsResult, transactionsResult, anamnesisResult, notesResult] = await Promise.all([
        supabase
          .from('appointments')
          .select('*, patients(id, name)')
          .eq('user_id', userId)
          .gte('updated_at', formatISO(start))
          .lte('updated_at', formatISO(end)),
        supabase
          .from('transactions')
          .select('id, amount, date, created_at, patient_id, patients(name)')
          .eq('user_id', userId)
          .eq('type', 'income')
          .gte('created_at', formatISO(start))
          .lte('created_at', formatISO(end)),
        supabase
          .from('patient_anamneses')
          .select('id, updated_at, patient_id, patients(name)')
          .eq('user_id', userId)
          .gte('updated_at', formatISO(start))
          .lte('updated_at', formatISO(end)),
        supabase
          .from('session_notes')
          .select('id, created_at, patient_id, patients(name)')
          .eq('user_id', userId)
          .gte('created_at', formatISO(start))
          .lte('created_at', formatISO(end)),
      ]);

      if (appointmentsResult.error) throw appointmentsResult.error;
      if (transactionsResult.error) throw transactionsResult.error;
      if (anamnesisResult.error) throw anamnesisResult.error;
      if (notesResult.error) throw notesResult.error;

      ((appointmentsResult.data || []) as Appointment[]).forEach((appointment: any) => {
        if (getAppointmentKind(appointment) !== 'session') return;

        const normalizedStatus = normalizeAppointmentStatus(appointment.status, appointment.notes);
        const patientName = appointment.patients?.name || getAppointmentDisplayTitle(appointment);
        const updatedAt = appointment.updated_at || appointment.created_at || appointment.start_time;
        const createdAt = appointment.created_at ? new Date(appointment.created_at).getTime() : 0;
        const changedAt = updatedAt ? new Date(updatedAt).getTime() : 0;
        const wasEditedAfterCreate = createdAt > 0 && changedAt - createdAt > 60000;

        activities.push({
          id: appointment.id,
          type: isCancelledAppointmentStatus(normalizedStatus) || normalizedStatus !== 'unscored'
            ? 'appointment_status'
            : 'appointment_rescheduled',
          patient_name: patientName,
          patient_id: appointment.patient_id || '',
          date: new Date(updatedAt),
          status: normalizedStatus,
          description: wasEditedAfterCreate
            ? `Agendamento atualizado para ${new Date(appointment.start_time).toLocaleDateString('pt-BR')}`
            : `Sessão registrada para ${new Date(appointment.start_time).toLocaleDateString('pt-BR')}`,
        });
      });

      transactionsResult.data?.forEach((transaction: any) => {
        activities.push({
          id: transaction.id,
          type: 'payment_received',
          patient_name: transaction.patients?.name || 'Paciente',
          patient_id: transaction.patient_id || '',
          date: new Date(transaction.created_at || transaction.date),
          description: 'Pagamento registrado',
          amount: Number(transaction.amount || 0),
        });
      });

      anamnesisResult.data?.forEach((anamnesis: any) => {
        activities.push({
          id: anamnesis.id,
          type: 'anamnesis_updated',
          patient_name: anamnesis.patients?.name || 'Paciente',
          patient_id: anamnesis.patient_id || '',
          date: new Date(anamnesis.updated_at),
          description: 'Ficha de anamnese atualizada',
        });
      });

      notesResult.data?.forEach((note: any) => {
        activities.push({
          id: note.id,
          type: 'note_created',
          patient_name: note.patients?.name || 'Paciente',
          patient_id: note.patient_id || '',
          date: new Date(note.created_at),
          description: 'Nota clínica registrada',
        });
      });

      return activities.sort((a, b) => b.date.getTime() - a.date.getTime());
    },
    enabled: !!userId,
  });
};
