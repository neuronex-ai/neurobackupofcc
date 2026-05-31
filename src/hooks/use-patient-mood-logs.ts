import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MoodLog {
  id: string;
  mood_score: number;
  notes: string | null;
  created_at: string;
}

const fetchPatientMoodLogs = async (patientId: string): Promise<MoodLog[]> => {
  const { data, error } = await supabase
    .from('patient_mood_logs')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: true }); // Ascending for charts

  if (error) throw new Error(error.message);
  return data || [];
};

export const usePatientMoodLogs = (patientId: string) => {
  return useQuery<MoodLog[], Error>({
    queryKey: ['patientMoodLogs', patientId],
    queryFn: () => fetchPatientMoodLogs(patientId),
    enabled: !!patientId,
  });
};