import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export type TimelineItemType = 'note' | 'goal' | 'document' | 'mood' | 'transaction';

export interface TimelineItem {
  id: string;
  type: TimelineItemType;
  date: Date;
  data: any;
}

const fetchPatientTimeline = async (patientId: string, userId: string): Promise<TimelineItem[]> => {
  const timeline: TimelineItem[] = [];

  // 1. Buscar Notas
  const { data: notes } = await supabase
    .from('session_notes')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  notes?.forEach((note) => {
    timeline.push({
      id: note.id,
      type: 'note',
      date: new Date(note.created_at),
      data: note
    });
  });

  // 2. Buscar Metas
  const { data: goals } = await supabase
    .from('patient_goals')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  goals?.forEach((goal) => {
    timeline.push({
      id: goal.id,
      type: 'goal',
      date: new Date(goal.created_at),
      data: goal
    });
  });

  // 3. Buscar Humor
  const { data: moodLogs } = await supabase
    .from('patient_mood_logs')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  moodLogs?.forEach((log) => {
    timeline.push({
      id: log.id,
      type: 'mood',
      date: new Date(log.created_at),
      data: log
    });
  });

  // 4. Buscar Documentos (Listagem do Storage)
  // Estrutura: {userId}/{patientId}/{filename}
  const folderPath = `${userId}/${patientId}`;
  const { data: files } = await supabase.storage
    .from('files_psico')
    .list(folderPath);

  files?.forEach((file) => {
    if (file.name !== '.emptyFolderPlaceholder') {
      timeline.push({
        id: file.id || file.name,
        type: 'document',
        date: new Date(file.created_at || new Date().toISOString()),
        data: { ...file, path: `${folderPath}/${file.name}` }
      });
    }
  });

  // Ordenar do mais recente para o mais antigo
  return timeline.sort((a, b) => b.date.getTime() - a.date.getTime());
};

export const usePatientTimeline = (patientId: string) => {
  // Precisamos do userId para buscar os arquivos no storage correto
  const getUserId = async () => {
    const { data } = await supabase.auth.getUser();
    return data.user?.id;
  };

  return useQuery<TimelineItem[], Error>({
    queryKey: ['patientTimeline', patientId],
    queryFn: async () => {
      const userId = await getUserId();
      if (!userId) throw new Error("Usuário não autenticado");
      return fetchPatientTimeline(patientId, userId);
    },
    enabled: !!patientId,
  });
};