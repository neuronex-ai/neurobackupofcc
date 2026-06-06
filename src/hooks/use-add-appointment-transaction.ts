import { useAuth } from '@/components/auth/SessionContextProvider';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { getUserFacingErrorMessage } from '@/lib/user-facing-error';

interface NewAppointmentTransactionData {
  appointmentId: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: Date;
  payment_method?: string;
  installments?: number;
  patient_id?: string | null;
  package_id?: string | null;
  status?: string;
}

const addAppointmentTransaction = async (data: NewAppointmentTransactionData, userId: string) => {
  const { data: newTransaction, error } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      appointment_id: data.appointmentId,
      description: data.description,
      amount: data.amount,
      type: data.type,
      category: data.category || 'Sessão',
      date: format(data.date, 'yyyy-MM-dd'),
      payment_method: data.payment_method || 'pix',
      installments: data.installments || 1,
      patient_id: data.patient_id || null,
      package_id: data.package_id || null,
      status: data.status || 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('Erro ao adicionar transação de consulta:', error);
    throw new Error(error.message);
  }

  return newTransaction;
};

export const useAddAppointmentTransaction = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  return useMutation({
    mutationFn: (data: NewAppointmentTransactionData) => {
      if (!userId) throw new Error("Usuário não autenticado.");
      return addAppointmentTransaction(data, userId);
    },
    onSuccess: (_, _variables) => {
      toast.success("Transação de consulta registrada com sucesso!");
      // Invalida queries de transações gerais e do paciente
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['patientTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['advancedCashFlow'] });
    },
    onError: (error) => {
      console.error('[useAddAppointmentTransaction] Falha ao registrar movimentação', error);
      toast.error(getUserFacingErrorMessage(error, 'save'));
    }
  });
};
