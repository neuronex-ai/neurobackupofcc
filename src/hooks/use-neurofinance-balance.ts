/**
 * use-NeuroFinance-balance.ts
 * 
 * Reads balance and current-month cash flow directly from Asaas.
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

            const { data, error } = await supabase.functions.invoke('asaas-balance-details', {
                body: {},
            });

            if (error) {
                throw new Error(error.message);
            }

            const summary = data?.summary || {};
            const availableCentavos = summary.available_balance ?? data?.balance?.available ?? 0;
            const pendingCentavos = summary.pending_balance ?? data?.balance?.pending ?? 0;
            const grossVolume = summary.gross_volume ?? 0;
            const feesTotal = summary.fees_total ?? 0;
            const netVolume = summary.net_volume ?? 0;
            const paidOut = summary.paid_out_balance ?? 0;

            return {
                balance: availableCentavos / 100,
                pending: pendingCentavos / 100,
                reserved: 0,
                totalReceived: grossVolume / 100,
                feesTotal: feesTotal / 100,
                netVolume: netVolume / 100,
                paidOut: paidOut / 100,
                raw: {
                    available_balance: availableCentavos,
                    pending_balance: pendingCentavos,
                    reserved_balance: 0,
                    gross_volume: grossVolume,
                    fees_total: feesTotal,
                    net_volume: netVolume,
                    paid_out_balance: paidOut,
                },
            };
        },
        enabled: !!user?.id,
        staleTime: 1000 * 60 * 2,
    });
};
