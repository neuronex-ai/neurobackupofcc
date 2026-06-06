/**
 * use-NeuroFinance-payouts.ts
 * 
 * Manages payout operations for NeuroFinance v2.
 * Handles payout requests and lists payout history.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/SessionContextProvider';
import { toast } from 'sonner';
import { toUserFacingError } from '@/lib/user-facing-error';

export interface NeuroFinancePayout {
    id: string;
    user_id: string;
    asaas_payout_id: string | null;
    amount: number;       // centavos
    currency: string;
    status: 'pending' | 'in_transit' | 'paid' | 'failed' | 'canceled';
    destination_type: string;
    destination_summary: string | null;
    requested_at: string;
    processed_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface RequestPayoutParams {
    amount?: number;     // centavos — if omitted, payout full available balance
    description?: string;
}

// ─── List Payouts ─────────────────────────────────
export const useNeuroFinancePayouts = (limit = 30) => {
    const { user } = useAuth();

    return useQuery<NeuroFinancePayout[], Error>({
        queryKey: ['NeuroFinance-payouts', user?.id, limit],
        queryFn: async () => {
            if (!user?.id) throw new Error('Não autenticado');

            const { data, error } = await supabase
                .from('nb_payouts')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return (data || []) as NeuroFinancePayout[];
        },
        enabled: !!user?.id,
        staleTime: 1000 * 60,
    });
};

// ─── Request Payout ───────────────────────────────
export const useRequestPayout = () => {
    const queryClient = useQueryClient();

    return useMutation<{ success: boolean; payout_id: string; amount: number }, Error, RequestPayoutParams>({
        mutationFn: async (params) => {
            const response = await supabase.functions.invoke('asaas-payout', {
                body: params,
            });

            if (response.error) throw new Error(response.error.message);
            if (response.data?.error) throw new Error(response.data.error);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['NeuroFinance-payouts'] });
            queryClient.invalidateQueries({ queryKey: ['neurofinance-overview'] });
            toast.success(`Saque de R$${(data.amount / 100).toFixed(2)} solicitado com sucesso!`);
        },
        onError: (error) => {
            const friendlyError = toUserFacingError(error, 'transfer');
            toast.error(friendlyError.title, { description: friendlyError.message });
        },
    });
};
