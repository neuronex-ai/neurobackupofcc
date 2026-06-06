import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types';
import { useAuth } from '@/components/auth/SessionContextProvider';
import { toast } from 'sonner';
import { getUserFacingErrorMessage } from '@/lib/user-facing-error';

const fetchProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    // Se não encontrar (pode acontecer no primeiro login se a trigger falhar), retorna null sem erro fatal
    return null;
  }

  return data;
};

const updateProfile = async (userId: string, updates: Partial<Profile>) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const useProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const query = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => fetchProfile(userId!),
    enabled: !!userId,
  });

  const mutation = useMutation({
    mutationFn: (updates: Partial<Profile>) => {
      if (!userId) throw new Error("User not authenticated");
      return updateProfile(userId, updates);
    },
    onSuccess: () => {
      toast.success("Perfil atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    },
    onError: (error) => {
      console.error('[useProfile] Falha ao atualizar perfil', error);
      toast.error(getUserFacingErrorMessage(error, 'save'));
    }
  });

  return {
    profile: query.data,
    data: query.data,
    isLoading: query.isLoading,
    updateProfile: mutation.mutate,
    isUpdating: mutation.isPending,
    refetch: query.refetch,
  };
};
