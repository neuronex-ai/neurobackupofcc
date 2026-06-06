import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/SessionContextProvider';
import { getUserFacingErrorMessage } from '@/lib/user-facing-error';

interface UploadDocumentData {
  patientId: string;
  file: File;
}

const BUCKET_NAME = 'files_psico';

// Função para sanitizar o nome do arquivo
const sanitizeFileName = (fileName: string) => {
  // Remove acentos, converte para minúsculas, substitui espaços e caracteres especiais por hífens
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

const uploadDocument = async ({ patientId, file }: UploadDocumentData, userId: string) => {
  const sanitizedFileName = sanitizeFileName(file.name);
  // O caminho no storage será: {userId}/{patientId}/{sanitizedFileName}
  const filePath = `${userId}/${patientId}/${sanitizedFileName}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true, // Permite sobrescrever arquivos com o mesmo nome
    });

  if (error) {
    console.error('Erro ao fazer upload do documento:', error);
    throw new Error(error.message);
  }

  return data;
};

export const useUploadDocument = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  return useMutation({
    mutationFn: (data: UploadDocumentData) => {
      if (!userId) throw new Error("Usuário não autenticado.");
      return uploadDocument(data, userId);
    },
    onSuccess: (_, variables) => {
      toast.success(`Documento '${variables.file.name}' enviado com sucesso!`);
      // Invalida a query de documentos para o paciente específico
      queryClient.invalidateQueries({ queryKey: ['patientDocuments', variables.patientId] });
    },
    onError: (error) => {
      console.error('[useUploadDocument] Falha no envio', error);
      toast.error(getUserFacingErrorMessage(error, 'save'));
    }
  });
};
