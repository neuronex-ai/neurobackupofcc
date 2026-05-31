import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Transaction } from '@/types';
import { format } from 'date-fns';
import { useAuth } from '@/components/auth/SessionContextProvider';

interface FetchTransactionsParams {
  startDate?: Date;
  endDate?: Date;
  userId: string;
  limit?: number;
}

const fetchTransactions = async ({ startDate, endDate, userId, limit = 100 }: FetchTransactionsParams): Promise<Transaction[]> => {
  let query = supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false }) // Mais recentes primeiro
    .order('created_at', { ascending: false })
    .limit(limit);

  if (startDate) {
    query = query.gte('date', format(startDate, 'yyyy-MM-dd'));
  }

  if (endDate) {
    query = query.lte('date', format(endDate, 'yyyy-MM-dd'));
  }

  const { data, error } = await query;

  if (error) {
    console.warn('Transações indisponíveis:', error.message);
    // Return empty array — table may not exist yet
    return [];
  }

  return data || [];
};

export const useTransactions = (startDate?: Date, endDate?: Date, limit: number = 500) => {
  const { user } = useAuth();
  const userId = user?.id;

  const startStr = startDate ? format(startDate, 'yyyy-MM-dd') : 'all';
  const endStr = endDate ? format(endDate, 'yyyy-MM-dd') : 'all';

  return useQuery<Transaction[], Error>({
    queryKey: ['transactions', userId, startStr, endStr, limit],
    queryFn: () => {
      if (!userId) throw new Error("Usuário não autenticado");
      return fetchTransactions({ startDate, endDate, userId, limit });
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
};