import { supabase } from '@/integrations/supabase/client';
import { useInfiniteQuery } from '@tanstack/react-query';

export type TimelineItemType = 'note' | 'goal' | 'document' | 'mood' | 'transaction';

export interface TimelineItem {
  id: string;
  type: TimelineItemType;
  date: Date;
  data: any;
}

interface TimelinePage {
  items: TimelineItem[];
  nextOffset: number | null;
}

const TIMELINE_SOURCE_PAGE_SIZE = 8;

const warnTimelineSource = (source: string, error: unknown) => {
  if (error) {
    console.warn(`[PatientTimeline] Não foi possível carregar ${source}:`, error);
  }
};

const fetchPatientTimelinePage = async (
  patientId: string,
  userId: string,
  offset: number
): Promise<TimelinePage> => {
  const timeline: TimelineItem[] = [];
  const from = offset;
  const to = offset + TIMELINE_SOURCE_PAGE_SIZE - 1;
  const folderPath = `${userId}/${patientId}`;

  const [notesResult, goalsResult, moodResult, filesResult] = await Promise.all([
    supabase
      .from('session_notes')
      .select('id, created_at, notes, ai_summary')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .range(from, to),
    supabase
      .from('patient_goals')
      .select('id, created_at, description, is_completed')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .range(from, to),
    supabase
      .from('patient_mood_logs')
      .select('id, created_at, mood_score, notes')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .range(from, to),
    supabase.storage
      .from('files_psico')
      .list(folderPath, {
        limit: TIMELINE_SOURCE_PAGE_SIZE,
        offset,
        sortBy: { column: 'created_at', order: 'desc' },
      }),
  ]);

  warnTimelineSource('notas de sessão', notesResult.error);
  warnTimelineSource('metas', goalsResult.error);
  warnTimelineSource('humor', moodResult.error);
  warnTimelineSource('documentos', filesResult.error);

  notesResult.data?.forEach((note) => {
    timeline.push({
      id: note.id,
      type: 'note',
      date: new Date(note.created_at),
      data: note,
    });
  });

  goalsResult.data?.forEach((goal) => {
    timeline.push({
      id: goal.id,
      type: 'goal',
      date: new Date(goal.created_at),
      data: goal,
    });
  });

  moodResult.data?.forEach((log) => {
    timeline.push({
      id: log.id,
      type: 'mood',
      date: new Date(log.created_at),
      data: log,
    });
  });

  const visibleFiles = filesResult.data?.filter((file) => file.name !== '.emptyFolderPlaceholder') ?? [];
  visibleFiles.forEach((file) => {
    timeline.push({
      id: file.id || file.name,
      type: 'document',
      date: new Date(file.created_at || new Date().toISOString()),
      data: { ...file, path: `${folderPath}/${file.name}` },
    });
  });

  const hasMore = [
    notesResult.data?.length ?? 0,
    goalsResult.data?.length ?? 0,
    moodResult.data?.length ?? 0,
    visibleFiles.length,
  ].some((count) => count === TIMELINE_SOURCE_PAGE_SIZE);

  return {
    items: timeline.sort((a, b) => b.date.getTime() - a.date.getTime()),
    nextOffset: hasMore ? offset + TIMELINE_SOURCE_PAGE_SIZE : null,
  };
};

export const usePatientTimeline = (patientId: string) => {
  const getUserId = async () => {
    const { data } = await supabase.auth.getUser();
    return data.user?.id;
  };

  return useInfiniteQuery({
    queryKey: ['patientTimeline', patientId],
    queryFn: async ({ pageParam }) => {
      const userId = await getUserId();
      if (!userId) throw new Error('Usuário não autenticado');
      return fetchPatientTimelinePage(patientId, userId, pageParam);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
    enabled: Boolean(patientId),
    staleTime: 60_000,
  });
};
