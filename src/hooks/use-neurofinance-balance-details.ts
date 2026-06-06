import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/SessionContextProvider';
import { Transaction } from '@/types';

export type BalanceDetailView = 'total' | 'andamento' | 'futuro';

/**
 * Hook to fetch balance details from the Asaas BaaS API.
 * Queries the `asaas-balance-details` Edge Function.
 */
export const useNeuroFinanceBalanceDetails = (view: BalanceDetailView) => {
    const { user } = useAuth();

    return useQuery<Transaction[], Error>({
        queryKey: ['asaas-balance-details', user?.id, view],
        queryFn: async (): Promise<Transaction[]> => {
            if (!user?.id) throw new Error('Não autenticado');

            const { data, error } = await supabase.functions.invoke('asaas-balance-details', {
                body: { view },
            });

            if (error) {
                console.error('[useNeuroFinanceBalanceDetails] Error invoking function:', error);
                throw error;
            }

            return Array.isArray(data?.transactions) ? data.transactions as Transaction[] : [];
        },
        enabled: !!user?.id,
        staleTime: 1000 * 60 * 2, // 2 minutes
    });
};
