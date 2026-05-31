import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Transaction } from '@/types';
import { useAuth } from '@/components/auth/SessionContextProvider';

const fetchPatientTransactions = async (patientId: string, userId: string): Promise<Transaction[]> => {
  // Busca transações que estão ligadas a um appointment que, por sua vez, está ligado ao patientId.
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      appointment:appointment_id!inner (patient_id)
    `)
    .eq('user_id', userId)
    .eq('appointment.patient_id', patientId) // Filtra pelo patient_id na tabela de appointments
    .order('date', { ascending: false });

  if (error) {
    console.error('Erro ao buscar transações do paciente:', error);
    throw new Error(error.message);
  }

  // Mapeia de volta para o tipo Transaction, removendo o objeto 'appointment' do join
  return data.map(t => {
    // @ts-ignore
    delete t.appointment;
    return t as Transaction;
  }) || [];
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