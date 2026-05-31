/**
 * use-NeuroFinance-statement.ts
 * 
 * Reads the financial statement/transaction history from 
 * the Asaas API via the asaas-balance-details edge function.
 * No local ledger tables are used.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/SessionContextProvider';
import { Transaction, PaymentMethod } from '@/types';
import { format, subDays } from 'date-fns';

export const useNeuroFinanceStatement = (startDate?: Date, endDate?: Date) => {
    const { user } = useAuth();

    // Use stable date strings (yyyy-MM-dd) for the query key to prevent infinite re-renders
    const queryStart = startDate ? format(startDate, 'yyyy-MM-dd') : format(subDays(new Date(), 30), 'yyyy-MM-dd');
    const queryEnd = endDate ? format(endDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');

    return useQuery<Transaction[], Error>({
        queryKey: ['NeuroFinance-statement', user?.id, queryStart, queryEnd],
        queryFn: async (): Promise<Transaction[]> => {
            if (!user?.id) throw new Error('Não autenticado');

            // Fetch transactions from the Asaas API via edge function
            const { data, error } = await supabase.functions.invoke('asaas-balance-details', {
                body: { 
                    view: 'total',
                    startDate: queryStart,
                    endDate: queryEnd,
                },
            });

            if (error) {
                console.warn('[useNeuroFinanceStatement] Edge function error:', error.message);
                return [];
            }

            // The edge function returns Transaction[] directly
            if (!data || !Array.isArray(data)) {
                return [];
            }

            // Ensure proper typing
            return (data as any[]).map(item => ({
                id: item.id || crypto.randomUUID(),
                user_id: user.id,
                description: item.description || 'Movimentação NeuroFinance',
                amount: item.amount || 0,
                type: item.type || (item.value > 0 ? 'income' : 'expense'),
                category: item.category || 'OUTROS',
                date: item.date || item.dateCreated || item.created_at,
                appointment_id: item.appointment_id || null,
                created_at: item.created_at || item.dateCreated,
                payment_method: (item.payment_method || item.billingType || 'pix') as PaymentMethod,
                status: item.status === 'CONFIRMED' || item.status === 'RECEIVED' 
                    ? 'completed' 
                    : item.status === 'completed' ? 'completed' : 'pending',
            } as Transaction));
        },
        enabled: !!user?.id,
        staleTime: 1000 * 60 * 5,
    });
};
