import {
    asaasRequest,
    corsResponse,
    errorResponse,
    getAuthenticatedUser,
    getFinancialAccount,
    getFinancialAccountAsaasApiKey,
    jsonResponse,
    recordBaasOperation,
} from '../_shared/asaas-client.ts';

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return corsResponse();

    try {
        const user = await getAuthenticatedUser(req);
        const body = await req.json().catch(() => ({}));
        const action = body.action || 'list';
        const account = await getFinancialAccount(user.id);
        const apiKey = getFinancialAccountAsaasApiKey(account);

        if (!account || !apiKey) return errorResponse('Conta financeira não configurada.', 403);

        if (action === 'list') {
            const result = await asaasRequest('/bill?limit=100&offset=0', 'GET', undefined, apiKey);
            return jsonResponse({ success: true, ...(result as Record<string, unknown>) });
        }

        if (action === 'simulate') {
            if (!body.identificationField) return errorResponse('Linha digitável é obrigatória.', 400);
            const result = await asaasRequest('/bill/simulate', 'POST', {
                identificationField: body.identificationField,
            }, apiKey);
            return jsonResponse({ success: true, bill: result });
        }

        if (action === 'create') {
            if (!body.identificationField) return errorResponse('Linha digitável é obrigatória.', 400);
            const payload: Record<string, unknown> = {
                identificationField: body.identificationField,
                description: body.description || 'Pagamento de conta via NeuroFinance',
                externalReference: body.externalReference || crypto.randomUUID(),
            };
            if (body.scheduleDate) payload.scheduleDate = body.scheduleDate;
            if (Number(body.value) > 0) payload.value = Number(body.value);
            if (body.dueDate) payload.dueDate = body.dueDate;

            const result = await asaasRequest('/bill', 'POST', payload, apiKey);
            await recordBaasOperation(user.id, account.id, 'bill_payment', result as Record<string, unknown>, {
                amount: Number(body.value) || undefined,
                description: String(payload.description),
                payload,
            });
            return jsonResponse({ success: true, bill: result });
        }

        return errorResponse('Ação de pagamento não suportada.', 400);
    } catch (error: any) {
        console.error('asaas-bill-payment error:', error);
        return errorResponse(error?.message || 'Erro ao processar pagamento de conta.', error?.status || 500);
    }
});
