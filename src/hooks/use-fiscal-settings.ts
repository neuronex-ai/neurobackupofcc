import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/SessionContextProvider';

export interface FiscalSettings {
  id: string;
  user_id: string;
  company_name: string | null;
  cnpj: string | null;
  municipal_inscription: string | null;
  service_code: string | null;
  iss_aliquot: number | null;
  rps_serie: string | null;
  rps_number: number | null;
  auto_issue: boolean | null;
  fiscal_provider?: 'asaas' | null;
  asaas_municipal_service_id?: string | null;
  asaas_municipal_service_name?: string | null;
  // Focus NFe fields
  focus_nfe_api_key?: string | null;
  focus_nfe_environment?: 'homologacao' | 'producao';
  municipal_code?: string | null;
}

const fetchFiscalSettings = async (userId: string): Promise<FiscalSettings | null> => {
  const { data, error } = await supabase
    .from('user_fiscal_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
};

const upsertFiscalSettings = async (settings: Partial<FiscalSettings>, userId:string) => {
  const { data, error } = await supabase
    .from('user_fiscal_settings')
    .upsert({ ...settings, user_id: userId }, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export const useFiscalSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const query = useQuery({
    queryKey: ['fiscalSettings', userId],
    queryFn: () => fetchFiscalSettings(userId!),
    enabled: !!userId,
  });

  const mutation = useMutation({
    mutationFn: (settings: Partial<FiscalSettings>) => {
      if (!userId) throw new Error("Usuário não autenticado");
      return upsertFiscalSettings(settings, userId);
    },
    onSuccess: () => {
      toast.success("Configurações fiscais salvas com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['fiscalSettings', userId] });
    },
    onError: (error) => {
      toast.error(`Erro ao salvar configurações: ${error.message}`);
    }
  });

  return {
    settings: query.data,
    isLoading: query.isLoading,
    saveSettings: mutation.mutate,
    isSaving: mutation.isPending,
  };
};
