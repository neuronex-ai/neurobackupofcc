import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/SessionContextProvider';

interface UploadInvoiceData {
  file: File;
  invoiceId: string;
}

const BUCKET_NAME = 'files_psico';

const uploadInvoiceFile = async ({ file, invoiceId }: UploadInvoiceData, userId: string) => {
  const fileExt = file.name.split('.').pop();
  const filePath = `${userId}/invoices/${invoiceId}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return publicUrl;
};

export const useUploadInvoice = () => {
  const { user } = useAuth();
  const userId = user?.id;

  return useMutation({
    mutationFn: (data: UploadInvoiceData) => {
      if (!userId) throw new Error("Usuário não autenticado.");
      return uploadInvoiceFile(data, userId);
    }
  });
};