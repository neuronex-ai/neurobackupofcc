import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SessionNote } from '@/types';
import { useAuth } from '@/components/auth/SessionContextProvider';

const fetchSessionNotes = async (patientId: string, userId: string): Promise<SessionNote[]> => {
  const { data, error } = await supabase
    .from('session_notes')
    .select('*')
    .eq('patient_id', patientId)
    .eq('user_id', userId)
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