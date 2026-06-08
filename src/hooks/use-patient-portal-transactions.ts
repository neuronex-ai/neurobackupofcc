import { useAuth } from '@/components/auth/SessionContextProvider';
import { supabase } from '@/integrations/supabase/client';
import { Transaction } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { mapFinancialEntryToTransaction } from './use-financial-entries';

const fetchPatientPortalTransactions = async (_userId: string, patientId?: string): Promise<Transaction[]> => {
  let entriesQuery = supabase
    .from('financial_entries')
    .select('*')
    .order('due_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (patientId) {
    entriesQuery = entriesQuery.eq('patient_id', patientId);
  }

  const { data: entries, error: entriesError } = await entriesQuery;

  if (!entriesError && entries && entries.length > 0) {
    return entries.map((entry) => mapFinancialEntryToTransaction(entry as any));
  }

  let legacyQuery = supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false });

  if (patientId) {
    legacyQuery = legacyQuery.eq('patient_id', patientId);
  }

  const { data, error } = await legacyQuery;

  if (error) {
    console.error('Erro ao buscar transações do paciente no portal:', error);
    throw new Error(error.message);
  }

  return data || [];
};

export const usePatientPortalTransactions = (patientId?: string) => {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery<Transaction[], Error>({
    queryKey: ['patientPortalTransactions', userId, patientId],
    queryFn: () => fetchPatientPortalTransactions(userId!, patientId),
    enabled: !!userId,
  });
};
