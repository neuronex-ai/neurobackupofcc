import { useAuth } from '@/components/auth/SessionContextProvider';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { subDays, formatISO } from 'date-fns';

export type ActivityType = 'appointment_confirmed' | 'appointment_cancelled' | 'payment_received' | 'anamnesis_updated' | 'note_created';

export interface DashboardActivity {
  id: string;
  type: ActivityType;
  patient_name: string;
  patient_id: string;
  date: Date;
  description: string;
  amount?: number;
}

export const useDashboardActivities = () => {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: ['dashboard-activities', userId],
    queryFn: async () => {
      if (!userId) return [];

      const sevenDaysAgo = formatISO(subDays(new Date(), 7));
      const activities: DashboardActivity[] = [];

      // 1. Appointmnent Activities (Confirmed/Cancelled)
      const { data: apts } = await supabase
        .from('appointments')
        .select('id, status, updated_at, start_time, patients(id, name)')
        .eq('user_id', userId)
        .gte('updated_at', sevenDaysAgo);

      apts?.forEach(apt => {
        if (apt.status === 'confirmed' || apt.status === 'cancelled') {
          activities.push({
            id: apt.id,
            type: apt.status === 'confirmed' ? 'appointment_confirmed' : 'appointment_cancelled',
            patient_name: (apt.patients as any)?.name || 'Paciente',
            patient_id: (apt.patients as any)?.id || '',
            date: new Date(apt.updated_at),
            description: `${apt.status === 'confirmed' ? 'Confirmou' : 'Cancelou'} a consulta de ${new Date(apt.start_time).toLocaleDateString()}`
          });
        }
      });

      // 2. Transaction Activities (Payments)
      const { data: trans } = await supabase
        .from('transactions')
        .select('id, amount, date, created_at, patient_id, patients(name)')
        .eq('user_id', userId)
        .eq('type', 'income')
        .gte('created_at', sevenDaysAgo);

      trans?.forEach(t => {
        activities.push({
          id: t.id,
          type: 'payment_received',
          patient_name: (t.patients as any)?.name || 'Paciente',
          patient_id: t.patient_id || '',
          date: new Date(t.created_at),
          description: `Pagamento recebido`,
          amount: t.amount
        });
      });

      // 3. Anamnesis Activities
      const { data: anamnesis } = await supabase
        .from('patient_anamneses')
        .select('id, updated_at, patient_id, patients(name)')
        .eq('user_id', userId)
        .gte('updated_at', sevenDaysAgo);

      anamnesis?.forEach(a => {
        activities.push({
          id: a.id,
          type: 'anamnesis_updated',
          patient_name: (a.patients as any)?.name || 'Paciente',
          patient_id: a.patient_id || '',
          date: new Date(a.updated_at),
          description: `Atualizou a ficha de anamnese`
        });
      });

      // Sort by date desc
      return activities.sort((a, b) => b.date.getTime() - a.date.getTime());
    },
    enabled: !!userId,
  });
};
