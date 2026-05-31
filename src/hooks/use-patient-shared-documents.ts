import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/SessionContextProvider';
import { usePatientData } from './use-patient-data';

interface FileObject {
  name: string;
  id: string;
  created_at: string;
  size: number;
  path: string;
}

const BUCKET_NAME = 'files_psico';

const fetchPatientSharedDocuments = async (patientId: string, therapistId: string): Promise<FileObject[]> => {
  // O caminho no storage é {therapistId}/{patientId}/
  const folderPath = `${therapistId}/${patientId}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list(folderPath, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' },
    });

  if (error) {
    console.error('Erro ao listar documentos compartilhados:', error);
    throw new Error(error.message);
  }

  // Filtra o item de pasta (que tem name: '') e mapeia para o formato FileObject
  return data
    .filter(item => item.name !== '')
    .map(item => ({
      name: item.name,
      id: item.id,
      created_at: item.created_at,
      size: item.metadata?.size || 0,
      path: `${folderPath}/${item.name}`,
    }));
};

export const usePatientSharedDocuments = () => {
  const { user } = useAuth();
  const { data: patientData, isLoading: isLoadingPatient } = usePatientData(user?.email || '');
  
  const patientId = patientData?.id;
  const therapistId = patientData?.user_id; // O user_id na tabela patients é o ID do terapeuta

  return useQuery<FileObject[], Error>({
    queryKey: ['patientSharedDocuments', patientId, therapistId],
    queryFn: () => fetchPatientSharedDocuments(patientId!, therapistId!),
    enabled: !!patientId && !!therapistId && !isLoadingPatient,
  });
};