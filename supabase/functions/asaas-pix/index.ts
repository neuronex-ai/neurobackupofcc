import {
    asaasRequest,
    corsResponse,
    errorResponse,
    getAuthenticatedUser,
    getFinancialAccount,
    getFinancialAccountAsaasApiKey,
    jsonResponse,
    recordBaasOperation,
    supabaseAdmin,
} from '../_shared/asaas-client.ts';

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return corsResponse();

    try {
        const user = await getAuthenticatedUser(req);
        const body = await req.json().catch(() => ({}));
        const action = body.action || 'list_keys';
        const account = await getFinancialAccount(user.id);
        const apiKey = getFinancialAccountAsaasApiKey(account);

        if (!account || !apiKey) return errorResponse('Conta financeira não configurada.', 403);

        if (action === 'list_keys') {
            const result = await asaasRequest('/pix/addressKeys?limit=100&offset=0', 'GET', undefined, apiKey);
            return jsonResponse({ success: true, ...(result as Record<string, unknown>) });
        }

        if (action === 'create_key') {
            if (!body.consent) return errorResponse('É necessário confirmar o consentimento para criar a chave Pix.', 400);
            const result = await asaasRequest('/pix/addressKeys', 'POST', { type: 'EVP' }, apiKey);
            await supabaseAdmin.from('financial_accounts').update({
                pix_key_consent_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }).eq('id', account.id);
            await recordBaasOperation(user.id, account.id, 'pix_key_create', result as Record<string, unknown>);
            return jsonResponse({ success: true, key: result });
        }

        if (action === 'delete_key') {
            if (!body.id) return errorResponse('ID da chave Pix é obrigatório.', 400);
            const result = await asaasRequest(`/pix/addressKeys/${encodeURIComponent(body.id)}`, 'DELETE', undefined, apiKey);
            await recordBaasOperation(user.id, account.id, 'pix_key_delete', result as Record<string, unknown>, { payload: { id: body.id } });
            return jsonResponse({ success: true, result });
        }

        if (action === 'pay_qr_code') {
            if (!body.payload) return errorResponse('Código Pix Copia e Cola é obrigatório.', 400);
            const requestBody: Record<string, unknown> = { qrCode: { payload: body.payload } };
            if (Number(body.value) > 0) requestBody.value = Number(body.value);
            const result = await asaasRequest('/pix/qrCodes/pay', 'POST', requestBody, apiKey);
            await recordBaasOperation(user.id, account.id, 'pix_qr_payment', result as Record<string, unknown>, { amount: Number(body.value) || undefined });
            return jsonResponse({ success: true, payment: result });
        }

        return errorResponse('Ação Pix não suportada.', 400);
    } catch (error: any) {
        console.error('asaas-pix error:', error);
        return errorResponse(error?.message || 'Erro ao processar operação Pix.', error?.status || 500);
    }
});
