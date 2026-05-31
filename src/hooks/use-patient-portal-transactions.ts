import { useAuth } from '@/components/auth/SessionContextProvider';
import { supabase } from '@/integrations/supabase/client';
import { Transaction } from '@/types';
import { useQuery } from '@tanstack/react-query';

const fetchPatientPortalTransactions = async (_userId: string, patientId?: string): Promise<Transaction[]> => {
  let query = supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false });

  if (patientId) {
    query = query.eq('patient_id', patientId);
  }

  const { data, error } = await query;

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
