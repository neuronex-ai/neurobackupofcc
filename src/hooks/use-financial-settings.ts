import { useAuth } from '@/components/auth/SessionContextProvider';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export interface FinancialSettings {
  id: string;
  user_id: string;
  pin_hash: string | null;
  updated_at: string;
}

const fetchFinancialSettings = async (userId: string): Promise<FinancialSettings | null> => {
  const { data, error } = await supabase
    .from('user_financial_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
};

export const useFinancialSettings = () => {
  const { user } = useAuth();

  const userId = user?.id;

  const query = useQuery({
    queryKey: ['financialSettings', userId],
    queryFn: () => fetchFinancialSettings(userId!),
    enabled: !!userId,
  });

  return {
    settings: query.data,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
};
