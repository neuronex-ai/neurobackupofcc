import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/SessionContextProvider';
import { subMonths, format } from 'date-fns';

export interface UnpaidSession {
  id: string;
  start_time: string;
  patient_name: string;
  patient_id: string;
  suggested_value?: number;
}

const fetchRevenueLeakage = async (userId: string): Promise<UnpaidSession[]> => {
  // Busca sessões concluídas nos últimos 2 meses para não pesar a query
  const startDate = format(subMonths(new Date(), 2), 'yyyy-MM-dd');

  // 1. Buscar agendamentos concluídos
  const { data: appointments, error: aptError } = await supabase
    .from('appointments')
    .select('id, start_time, patient:patient_id(name, id)')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gte('start_time', startDate);

  if (aptError) throw new Error(aptError.message);

  // 2. Buscar IDs de agendamentos que JÁ possuem transação
  const appointmentIds = appointments.map(a => a.id);

  if (appointmentIds.length === 0) return [];

  const { data: transactions, error: transError } = await supabase
    .from('transactions')
    .select('appointment_id')
    .eq('user_id', userId)
    .in('appointment_id', appointmentIds);

  if (transError) throw new Error(transError.message);

  const paidAppointmentIds = new Set(transactions.map(t => t.appointment_id));

  // 3. Filtrar apenas os que NÃO estão no set de pagos
  let unpaid: UnpaidSession[] = appointments
    .filter(apt => !paidAppointmentIds.has(apt.id))
    .map(apt => {
      const patient = Array.isArray(apt.patient) ? apt.patient[0] : apt.patient;
      return {
        id: apt.id,
        start_time: apt.start_time,
        patient_name: (patient as any)?.name || 'Paciente',
        patient_id: (patient as any)?.id
      };
    });

  // 4. Buscar valor sugerido baseado na última transação de cada paciente
  const uniquePatientIds = [...new Set(unpaid.map(u => u.patient_id).filter(Boolean))];

  if (uniquePatientIds.length > 0) {
    const { data: historyData } = await supabase
      .from('transactions')
      .select(`
            amount,
            date,
            appointment:appointment_id!inner(patient_id)
        `)
      .eq('user_id', userId)
      .in('appointment.patient_id', uniquePatientIds)
      .order('date', { ascending: false });

    // Agrupar transações por paciente
    const transactionsByPatient = new Map<string, any[]>();
    historyData?.forEach((t: any) => {
      const pId = t.appointment?.patient_id;
      if (pId) {
        if (!transactionsByPatient.has(pId)) {
          transactionsByPatient.set(pId, []);
        }
        transactionsByPatient.get(pId)?.push(t);
      }
    });

    unpaid = unpaid.map(u => {
      const patientTransactions = transactionsByPatient.get(u.patient_id) || [];

      // Encontrar a transação mais recente que seja ANTERIOR ou IGUAL à data da sessão
      // Como historyData está desc (mais recente primeiro), procuramos o primeiro que satisfaz a condição
      const sessionDate = new Date(u.start_time);

      const match = patientTransactions.find(t => new Date(t.date) <= sessionDate);

      // Se não encontrar anterior, usa a mais antiga disponível (ou a mais recente absoluta se preferir, mas lógica temporal sugere 'preço vigente')
      // Fallback: use the most recent transaction found (first in list) if no prior transaction exists
      const suggested = match ? match.amount : (patientTransactions.length > 0 ? patientTransactions[0].amount : undefined);

      return {
        ...u,
        suggested_value: suggested
      };
    });
  }

  return unpaid;
};
export const useRevenueLeakage = () => {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery<UnpaidSession[], Error>({
    queryKey: ['revenueLeakage', userId],
    queryFn: () => fetchRevenueLeakage(userId!),
    enabled: !!userId,
  });
};