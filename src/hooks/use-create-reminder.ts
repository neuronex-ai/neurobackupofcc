import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/SessionContextProvider';
import { toast } from 'sonner';

const createReminder = async ({
  userId,
  title,
  dueDate,
}: {
  userId: string;
  title: string;
  dueDate: Date;
}) => {
  const { data, error } = await supabase.from('reminders').insert({
    user_id: userId,
    title,
    due_date: dueDate.toISOString(),
  });

  if (error) throw error;
  return data;
};

export const useCreateReminder = () => {
  const { user } = useAuth();
  return useMutation({
    mutationFn: (variables: { title: string; dueDate: Date }) => {
      if (!user) throw new Error('User not authenticated');
      return createReminder({ ...variables, userId: user.id });
    },
    onSuccess: () => {
      toast.success('Lembrete criado com sucesso.');
    },
    onError: (error) => {
      toast.error(`Erro ao criar lembrete: ${error.message}`);
    },
  });
};