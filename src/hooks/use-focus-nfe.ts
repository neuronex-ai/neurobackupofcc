import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface IssueInvoiceParams {
  payment_id: string;
  service_description: string;
  amount: number;
  municipal_service_id?: string;
  municipal_service_code?: string;
  municipal_service_name?: string;
}

export const useFocusNfe = () => {
  const mutation = useMutation({
    mutationFn: async (params: IssueInvoiceParams) => {
      const { data, error } = await supabase.functions.invoke('asaas-invoices', {
        body: {
          action: 'create',
          payment: params.payment_id,
          serviceDescription: params.service_description,
          value: params.amount,
          effectiveDate: new Date().toISOString().slice(0, 10),
          municipalServiceId: params.municipal_service_id,
          municipalServiceCode: params.municipal_service_code,
          municipalServiceName: params.municipal_service_name,
        }
      });

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      toast.success("Solicitação de NFS-e enviada à Asaas.");
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
