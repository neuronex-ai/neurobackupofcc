/**
 * Returns the real Asaas balance, current-month cash flow and open receivables.
 * Values in `summary` are cents; transaction amounts are reais.
 */

import {
    corsResponse,
    jsonResponse,
    errorResponse,
    getAuthenticatedUser,
    getFinancialAccount,
    getAsaasBalance,
    getAsaasFinancialTransactions,
    getAsaasPayments,
    getFinancialAccountAsaasApiKey,
} from '../_shared/asaas-client.ts';

const PAGE_SIZE = 100;
const MAX_PAGES = 10;
const dateOnly = (date: Date) => date.toISOString().slice(0, 10);

function currentMonthRange() {
    const now = new Date();
    return {
        start: dateOnly(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))),
        end: dateOnly(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0))),
    };
}

async function fetchAllFinancialTransactions(apiKey: string, startDate: string, finishDate: string) {
    const items: any[] = [];
    for (let page = 0; page < MAX_PAGES; page += 1) {
        const result = await getAsaasFinancialTransactions(apiKey, {
            startDate,
            finishDate,
            offset: page * PAGE_SIZE,
            limit: PAGE_SIZE,
        });
        const batch = Array.isArray(result?.data) ? result.data : [];
        items.push(...batch);
        if (!result?.hasMore || batch.length < PAGE_SIZE) break;
    }
    return items;
}

async function fetchOpenPayments(apiKey: string) {
    const items: any[] = [];
    for (let page = 0; page < MAX_PAGES; page += 1) {
        const result = await getAsaasPayments(apiKey, {
            offset: page * PAGE_SIZE,
            limit: PAGE_SIZE,
        });
        const batch = Array.isArray(result?.data) ? result.data : [];
        items.push(...batch);
        if (!result?.hasMore || batch.length < PAGE_SIZE) break;
    }
    return items.filter((payment) =>
        ['PENDING', 'CONFIRMED', 'AWAITING_RISK_ANALYSIS'].includes(
            String(payment?.status || '').toUpperCase()
        )
    );
}

function mapStatementTransaction(transaction: any, index: number) {
    const value = Number(transaction?.value || 0);
    return {
        id: String(transaction?.id || `${transaction?.date || 'transaction'}-${index}`),
        description: transaction?.description || transaction?.type || 'Movimentação Asaas',
        amount: Math.abs(value),
        type: value >= 0 ? 'income' : 'expense',
        category: transaction?.type || 'asaas',
        date: transaction?.date || new Date().toISOString(),
        created_at: transaction?.date || new Date().toISOString(),
        appointment_id: null,
        external_reference: transaction?.paymentId || transaction?.transferId || transaction?.id || null,
        origin: 'gateway_auto',
        status: 'completed',
    };
}

function mapOpenPayment(payment: any, index: number) {
    return {
        id: String(payment?.id || `payment-${index}`),
        description: payment?.description || 'Cobrança a receber',
        amount: Number(payment?.netValue ?? payment?.value ?? 0),
        type: 'income',
        category: 'receivable',
        date: payment?.estimatedCreditDate || payment?.dueDate || payment?.dateCreated || new Date().toISOString(),
        created_at: payment?.dateCreated || new Date().toISOString(),
        appointment_id: null,
        external_reference: payment?.id || null,
        origin: 'gateway_auto',
        status: String(payment?.status || 'pending').toLowerCase(),
    };
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return corsResponse();

    try {
        const user = await getAuthenticatedUser(req);
        const body = await req.json().catch(() => ({}));
        const financialAccount = await getFinancialAccount(user.id);
        const apiKey = getFinancialAccountAsaasApiKey(financialAccount);

        if (!financialAccount || !apiKey || financialAccount.status === 'account_missing') {
            return errorResponse('Conta financeira sem conexão ativa com a Asaas.', 409);
        }

        const defaultRange = currentMonthRange();
        const startDate = body.start_date || defaultRange.start;
        const finishDate = body.finish_date || defaultRange.end;
        const [balanceData, statement, openPayments] = await Promise.all([
            getAsaasBalance(apiKey),
            fetchAllFinancialTransactions(apiKey, startDate, finishDate),
            fetchOpenPayments(apiKey),
        ]);

        const normalizedStatement = statement.map(mapStatementTransaction);
        const normalizedOpenPayments = openPayments.map(mapOpenPayment);
        const totalReceived = normalizedStatement
            .filter((item) => item.type === 'income')
            .reduce((sum, item) => sum + item.amount, 0);
        const paidOut = normalizedStatement
            .filter((item) => item.type === 'expense')
            .reduce((sum, item) => sum + item.amount, 0);
        const futureReceivables = normalizedOpenPayments.reduce((sum, item) => sum + item.amount, 0);
        const feeTotal = statement
            .filter((item: any) => String(item?.type || '').includes('FEE'))
            .reduce((sum: number, item: any) => sum + Math.abs(Number(item?.value || 0)), 0);

        const view = String(body.view || 'all');
        const transactions = view === 'total'
            ? normalizedStatement.filter((item) => item.type === 'income')
            : view === 'andamento'
                ? normalizedStatement.filter((item) => item.type === 'expense')
                : view === 'futuro'
                    ? normalizedOpenPayments
                    : normalizedStatement;

        return jsonResponse({
            balance: {
                current: Math.round(Number(balanceData.balance || 0) * 100),
                available: Math.round(Number(balanceData.balance || 0) * 100),
                pending: Math.round(futureReceivables * 100),
            },
            summary: {
                available_balance: Math.round(Number(balanceData.balance || 0) * 100),
                pending_balance: Math.round(futureReceivables * 100),
                gross_volume: Math.round(totalReceived * 100),
                fees_total: Math.round(feeTotal * 100),
                net_volume: Math.round((totalReceived - paidOut) * 100),
                paid_out_balance: Math.round(paidOut * 100),
            },
            transactions,
            total_transactions: transactions.length,
            period: { start_date: startDate, finish_date: finishDate },
            provider: 'asaas',
        });
    } catch (error: any) {
        console.error('asaas-balance-details error:', error);
        return errorResponse(
            error.message || 'Não foi possível consultar os dados financeiros.',
            error?.status || 500
        );
    }
});
