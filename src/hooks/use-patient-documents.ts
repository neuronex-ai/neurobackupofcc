import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/SessionContextProvider';

interface FileObject {
  name: string;
  id: string;
  created_at: string;
  size: number;
  path: string;
  mimetype?: string;
}

const BUCKET_NAME = 'files_psico';

const fetchPatientDocuments = async (patientId: string, userId: string): Promise<FileObject[]> => {
  // O caminho no storage será: {userId}/{patientId}/{filename}
  const folderPath = `${userId}/${patientId}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list(folderPath, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' },
    });

  if (error) {
    console.error('Erro ao listar documentos:', error);
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
      mimetype: item.metadata?.mimetype,
    }));
};

export const usePatientDocuments = (patientId: string) => {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery<FileObject[], Error>({
    queryKey: ['patientDocuments', patientId, userId],
    queryFn: () => fetchPatientDocuments(patientId, userId!),
    enabled: !!patientId && !!userId,
  });
};