import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/SessionContextProvider';
import { toast } from 'sonner';
import { PersonalNote } from '@/types';

const fetchNotes = async (userId: string): Promise<PersonalNote[]> => {
  const { data, error } = await supabase
    .from('personal_notes')
    .select(`
        *,
        patient:patient_id(name)
    `)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw new Error(error.message);
  
  // Flatten patient data for easier use
  return data.map((note: any) => ({
      ...note,
      patient_name: note.patient?.name
  })) || [];
};

const createNote = async (note: Partial<PersonalNote>, userId: string) => {
    const { data, error } = await supabase
        .from('personal_notes')
        .insert({ ...note, user_id: userId })
        .select()
        .single();
    
    if (error) throw new Error(error.message);
    return data;
};

const updateNote = async (id: string, updates: Partial<PersonalNote>, userId: string) => {
    const { data, error } = await supabase
        .from('personal_notes')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data;
};

const deleteNote = async (id: string, userId: string) => {
    const { error } = await supabase
        .from('personal_notes')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
    
    if (error) throw new Error(error.message);
};

export const usePersonalNotes = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const query = useQuery({
    queryKey: ['personalNotes', userId],
    queryFn: () => fetchNotes(userId!),
    enabled: !!userId,
  });

  const createMutation = useMutation({
    mutationFn: (note: Partial<PersonalNote>) => {
        if (!userId) throw new Error("Usuário não autenticado");
        return createNote(note, userId);
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['personalNotes'] });
    },
    onError: (e) => toast.error(e.message)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: Partial<PersonalNote> }) => {
        if (!userId) throw new Error("Usuário não autenticado");
        return updateNote(id, updates, userId);
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['personalNotes'] });
    },
    onError: (e) => toast.error(e.message)
  });

  const deleteMutation = useMutation({
      mutationFn: (id: string) => {
          if (!userId) throw new Error("Usuário não autenticado");
          return deleteNote(id, userId);
      },
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['personalNotes'] });
          toast.success("Nota excluída.");
      }
  });

  return {
    notes: query.data,
    isLoading: query.isLoading,
    createNote: createMutation.mutateAsync, 
    updateNote: updateMutation.mutate,
    deleteNote: deleteMutation.mutate,
  };
};