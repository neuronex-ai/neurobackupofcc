import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SessionNote } from '@/types';
import { useAuth } from '@/components/auth/SessionContextProvider';
import { toast } from 'sonner';

const fetchSessionNotes = async (patientId: string, userId: string): Promise<SessionNote[]> => {
  const { data, error } = await supabase
    .from('session_notes')
    .select('*')
    .eq('patient_id', patientId)
    .eq('user_id', userId)
    .or('review_status.is.null,review_status.eq.confirmed')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar anotações da sessão:', error);
    throw new Error(error.message);
  }

  return data || [];
};

export const useSessionNotes = (patientId: string) => {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery<SessionNote[], Error>({
    queryKey: ['sessionNotes', patientId, userId],
    queryFn: () => fetchSessionNotes(patientId, userId!),
    enabled: !!patientId && !!userId, // Only run if patientId and userId are provided
  });
};

const fetchPendingSessionReviews = async (patientId: string, userId: string): Promise<SessionNote[]> => {
  const { data, error } = await supabase
    .from('session_notes')
    .select('*')
    .eq('patient_id', patientId)
    .eq('user_id', userId)
    .eq('review_status', 'pending_review')
    .order('review_due_at', { ascending: true });

  if (error) {
    console.error('Erro ao buscar revisões pendentes:', error);
    throw new Error(error.message);
  }

  return data || [];
};

export const usePendingSessionReviews = (patientId: string) => {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery<SessionNote[], Error>({
    queryKey: ['pendingSessionReviews', patientId, userId],
    queryFn: () => fetchPendingSessionReviews(patientId, userId!),
    enabled: !!patientId && !!userId,
  });
};

export const useConfirmSessionReview = (patientId: string) => {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (noteId: string) => {
      if (!userId) throw new Error('Usuário não autenticado.');
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('session_notes')
        .update({
          review_status: 'confirmed',
          confirmed_at: now,
          confirmed_by: userId,
          locked_at: now,
        })
        .eq('id', noteId)
        .eq('patient_id', patientId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as SessionNote;
    },
    onSuccess: () => {
      toast.success('Resumo confirmado e movido para o histórico.');
      queryClient.invalidateQueries({ queryKey: ['pendingSessionReviews', patientId] });
      queryClient.invalidateQueries({ queryKey: ['sessionNotes', patientId] });
      queryClient.invalidateQueries({ queryKey: ['patientTimeline', patientId] });
      queryClient.invalidateQueries({ queryKey: ['patientSessionSummary'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Não foi possível confirmar o resumo.');
    },
  });
};
