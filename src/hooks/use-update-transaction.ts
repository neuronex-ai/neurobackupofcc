import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Transaction } from '@/types';
import { format } from 'date-fns';
import { useAuth } from '@/components/auth/SessionContextProvider';
import { toast } from 'sonner';

interface UpdateTransactionData {
  id: string;
  updates: Partial<Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'appointment_id'>>;
}

const updateTransaction = async ({ id, updates }: UpdateTransactionData, userId: string) => {
  const formattedUpdates: any = { ...updates };
  if (formattedUpdates.date instanceof Date) {
    formattedUpdates.date = format(formattedUpdates.date, 'yyyy-MM-dd');
  }

  const { data, error } = await supabase
    .from('transactions')
    .update(formattedUpdates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar transação:', error);
    throw new Error(error.message);
  }

  return data;
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  return useMutation({
    mutationFn: (data: UpdateTransactionData) => {
      if (!userId) throw new Error("Usuário não autenticado.");
      return updateTransaction(data, userId);
    },
    onSuccess: () => {
      toast.success("Transação atualizada com sucesso!");
      // Invalida todas as queries de transações
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactionsByDateRange'] });
      queryClient.invalidateQueries({ queryKey: ['patientTransactions'] });
    },
    onError: (error) => {
      toast.error(`Falha ao atualizar transação: ${error.message}`);
    }
  });
};