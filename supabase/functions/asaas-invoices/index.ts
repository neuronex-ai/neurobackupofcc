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
            const result = await asaasRequest('/invoices?limit=100&offset=0', 'GET', undefined, apiKey);
            return jsonResponse({ success: true, ...(result as Record<string, unknown>) });
        }

        if (action === 'municipal_services') {
            const query = body.description ? `?description=${encodeURIComponent(body.description)}` : '';
            const result = await asaasRequest(`/invoices/municipalServices${query}`, 'GET', undefined, apiKey);
            return jsonResponse({ success: true, ...(result as Record<string, unknown>) });
        }

        if (action === 'create') {
            if (!body.payment || !body.serviceDescription || !body.effectiveDate) {
                return errorResponse('Pagamento, descrição do serviço e data efetiva são obrigatórios.', 400);
            }
            const payload: Record<string, unknown> = {
                payment: body.payment,
                serviceDescription: body.serviceDescription,
                observations: body.observations,
                value: body.value,
                deductions: body.deductions || 0,
                effectiveDate: body.effectiveDate,
                municipalServiceId: body.municipalServiceId || null,
                municipalServiceCode: body.municipalServiceId ? null : body.municipalServiceCode,
                municipalServiceName: body.municipalServiceName,
                taxes: body.taxes,
            };
            const result = await asaasRequest('/invoices', 'POST', payload, apiKey);
            await recordBaasOperation(user.id, account.id, 'nfse_create', result as Record<string, unknown>, {
                amount: Number(body.value) || undefined,
                description: body.serviceDescription,
                payload,
            });
            return jsonResponse({ success: true, invoice: result });
        }

        if (action === 'authorize') {
            if (!body.id) return errorResponse('ID da NFS-e é obrigatório.', 400);
            const result = await asaasRequest(`/invoices/${encodeURIComponent(body.id)}/authorize`, 'POST', {}, apiKey);
            await recordBaasOperation(user.id, account.id, 'nfse_authorize', result as Record<string, unknown>, { payload: { id: body.id } });
            return jsonResponse({ success: true, invoice: result });
        }

        return errorResponse('Ação fiscal não suportada.', 400);
    } catch (error: any) {
        console.error('asaas-invoices error:', error);
        return errorResponse(error?.message || 'Erro ao processar NFS-e.', error?.status || 500);
    }
});
