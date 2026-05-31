import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface IssueInvoiceParams {
  invoice_id: string;
  patient_id: string;
  service_description: string;
  amount: number;
}

export const useFocusNfe = () => {
  const mutation = useMutation({
    mutationFn: async (params: IssueInvoiceParams) => {
      const { data, error } = await supabase.functions.invoke('issue-focus-nfe', {
        body: params
      });

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      toast.success("Solicitação de emissão enviada com sucesso! Aguarde o processamento.");
    },
    onError: (error) => {
      toast.error(`Erro na emissão: ${error.message}`);
    }
  });

  return {
    issueInvoice: mutation.mutate,
    isIssuing: mutation.isPending
  };
};