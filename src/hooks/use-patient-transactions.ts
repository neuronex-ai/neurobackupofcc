import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Transaction } from '@/types';
import { useAuth } from '@/components/auth/SessionContextProvider';
import { fetchFinancialEntries, mapFinancialEntryToTransaction } from './use-financial-entries';

const fetchLegacyPatientTransactions = async (patientId: string, userId: string): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      appointment:appointment_id!inner (patient_id)
    `)
    .eq('user_id', userId)
    .eq('appointment.patient_id', patientId)
    .order('date', { ascending: false });

  if (error) throw new Error(error.message);

  return (data || []).map((transaction) => {
    const normalized = { ...transaction };
    delete (normalized as any).appointment;
    return normalized as Transaction;
  });
};

const fetchPatientTransactions = async (patientId: string, userId: string): Promise<Transaction[]> => {
  try {
    const entries = await fetchFinancialEntries(userId, { patientId, limit: 500 });
    return entries.map(mapFinancialEntryToTransaction);
  } catch (error) {
    console.warn('Lancamentos do paciente indisponiveis, usando transactions legado:', error);
    return fetchLegacyPatientTransactions(patientId, userId);
  }
};

export const usePatientTransactions = (patientId: string) => {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery<Transaction[], Error>({
    queryKey: ['patientTransactions', patientId, userId],
    queryFn: () => fetchPatientTransactions(patientId, userId!),
    enabled: !!patientId && !!userId,
  });
};
