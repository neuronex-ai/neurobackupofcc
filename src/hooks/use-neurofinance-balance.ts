/**
 * use-NeuroFinance-balance.ts
 * 
 * Reads balance from the financial account sync response (Asaas API).
 * The balance is fetched from the Asaas API via the asaas-account-sync
 * edge function — no local ledger table is used.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/SessionContextProvider';

export interface NeuroFinanceBalance {
    balance: number;       // Available balance in reais (from centavos)
    pending: number;       // Pending balance in reais
    reserved: number;      // Reserved balance in reais (disputes)
    totalReceived: number; // Gross volume in reais
    feesTotal: number;     // Total fees in reais
    netVolume: number;     // Net volume in reais
    paidOut: number;       // Total paid out in reais
    raw: {
        available_balance: number;  // centavos
        pending_balance: number;
        reserved_balance: number;
        gross_volume: number;
        fees_total: number;
        net_volume: number;
        paid_out_balance: number;
    };
}

export const useNeuroFinanceBalance = () => {
    const { user } = useAuth();

    return useQuery<NeuroFinanceBalance, Error>({
        queryKey: ['NeuroFinance-balance', user?.id],
        queryFn: async () => {
            if (!user?.id) throw new Error('Não autenticado');

            // Fetch balance from the Asaas account sync endpoint
            const { data, error } = await supabase.functions.invoke('asaas-account-sync', {
                body: {},
            });

            if (error) {
                console.warn('[useNeuroFinanceBalance] Sync error:', error.message);
            }

            const availableCentavos = data?.balance?.available ?? 0;
            const pendingCentavos = data?.balance?.pending ?? 0;

            return {
                balance: availableCentavos / 100,
                pending: pendingCentavos / 100,
                reserved: 0,
                totalReceived: 0,
                feesTotal: 0,
                netVolume: 0,
                paidOut: 0,
                raw: {
                    available_balance: availableCentavos,
                    pending_balance: pendingCentavos,
                    reserved_balance: 0,
                    gross_volume: 0,
                    fees_total: 0,
                    net_volume: 0,
                    paid_out_balance: 0,
                },
            };
        },
        enabled: !!user?.id,
        staleTime: 1000 * 60 * 2,
    });
};
