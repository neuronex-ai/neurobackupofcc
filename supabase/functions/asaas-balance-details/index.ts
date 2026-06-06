/**
 * asaas-balance-details
 *
 * Returns balance and financial transactions from the psychologist's
 * Asaas sub-account.
 *
 * POST /asaas-balance-details
 * Body (optional): {
 *   start_date?: string,    // YYYY-MM-DD
 *   finish_date?: string,   // YYYY-MM-DD
 *   limit?: number,
 *   offset?: number,
 * }
 */

import {
    corsResponse,
    jsonResponse,
    errorResponse,
    getAuthenticatedUser,
    getFinancialAccount,
    getAsaasBalance,
    getAsaasFinancialTransactions,
    getBalanceFromAsaas,
    getFinancialAccountAsaasApiKey,
} from '../_shared/asaas-client.ts';

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return corsResponse();

    try {
        const user = await getAuthenticatedUser(req);
        const body = await req.json().catch(() => ({}));

        // 1. Get financial account
        const financialAccount = await getFinancialAccount(user.id);

        const subApiKey = getFinancialAccountAsaasApiKey(financialAccount);

        if (!financialAccount || !subApiKey) {
            return errorResponse('Conta financeira não configurada.', 403);
        }

        // 2. Get balance from Asaas
        const balanceData = await getAsaasBalance(subApiKey);

        // 3. Get balance in centavos
        const syncResult = await getBalanceFromAsaas(subApiKey);

        // 4. Get financial transactions (statement)
        let transactions = { data: [], totalCount: 0 };
        try {
            transactions = await getAsaasFinancialTransactions(subApiKey, {
                startDate: body.start_date,
                finishDate: body.finish_date,
                offset: body.offset || 0,
                limit: body.limit || 20,
            });
        } catch (txErr) {
            console.error('[asaas-balance-details] Transactions error:', txErr);
        }

        return jsonResponse({
            balance: {
                current: Math.round((balanceData.balance || 0) * 100), // centavos
                available: syncResult.available,
                pending: syncResult.pending,
            },
            transactions: transactions.data || [],
            total_transactions: transactions.totalCount || 0,
            provider: 'asaas',
        });

    } catch (error: any) {
        console.error('asaas-balance-details error:', error);
        return errorResponse(error.message || 'Internal error', 500);
    }
});
