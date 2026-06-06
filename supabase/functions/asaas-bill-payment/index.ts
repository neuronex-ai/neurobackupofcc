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

function cents(value: unknown) {
    return Math.round(Number(value || 0) * 100);
}

function billInput(body: Record<string, any>) {
    const identificationField = String(body.identificationField || '').replace(/\D/g, '');
    const barCode = String(body.barCode || body.barcode || '').replace(/\D/g, '');
    return { identificationField, barCode };
}

function billRow(userId: string, accountId: string, input: { identificationField?: string; barCode?: string }, payload: any, status: string) {
    return {
        user_id: userId,
        financial_account_id: accountId,
        identification_field: input.identificationField || null,
        barcode: input.barCode || null,
        status,
        amount: cents(payload?.value || payload?.amount),
        fee_amount: cents(payload?.fee),
        due_date: payload?.dueDate || payload?.due_date || null,
        scheduled_date: payload?.scheduleDate || payload?.scheduledDate || null,
        beneficiary_name: payload?.beneficiaryName || payload?.beneficiary?.name || null,
        beneficiary_document: payload?.beneficiaryDocument || payload?.beneficiary?.cpfCnpj || null,
        bank_code: payload?.bank || payload?.bankCode || null,
        bank_name: payload?.bankName || payload?.bank?.name || null,
        provider_payload: payload || {},
        updated_at: new Date().toISOString(),
    };
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return corsResponse();

    try {
        const user = await getAuthenticatedUser(req);
        const body = await req.json().catch(() => ({}));
        const action = body.action || 'list';
        const account = await getFinancialAccount(user.id);
        const apiKey = getFinancialAccountAsaasApiKey(account);

        if (!account || !apiKey) {
            return errorResponse('Sua conta ainda não está pronta para pagar contas.', 403);
        }

        if (action === 'list') {
            const result = await asaasRequest('/bill?limit=100&offset=0', 'GET', undefined, apiKey);
            return jsonResponse({ success: true, ...(result as Record<string, unknown>) });
        }

        if (action === 'simulate') {
            const input = billInput(body);
            if (!input.identificationField && !input.barCode) {
                return errorResponse('Informe a linha digitável ou o código de barras do boleto.', 400);
            }

            const simulatePayload = input.identificationField
                ? { identificationField: input.identificationField }
                : { barCode: input.barCode };
            const result = await asaasRequest('/bill/simulate', 'POST', simulatePayload, apiKey);

            const { data: record } = await supabaseAdmin
                .from('neurofinance_bill_payments')
                .insert(billRow(user.id, account.id, input, result, 'validated'))
                .select()
                .single();

            return jsonResponse({ success: true, bill: result, record });
        }

        if (action === 'create') {
            const input = billInput(body);
            if (!input.identificationField) {
                return errorResponse('Para pagar o boleto, informe a linha digitável. Se você só tiver a imagem, valide primeiro e confirme os dados encontrados.', 400);
            }

            const payload: Record<string, unknown> = {
                identificationField: input.identificationField,
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

            const { data: record } = await supabaseAdmin
                .from('neurofinance_bill_payments')
                .insert({
                    ...billRow(user.id, account.id, input, result, 'processing'),
                    provider_bill_id: (result as any)?.id || null,
                    external_reference: String(payload.externalReference),
                    description: String(payload.description),
                })
                .select()
                .single();

            return jsonResponse({ success: true, bill: result, record });
        }

        return errorResponse('Esta ação de pagamento não está disponível.', 400);
    } catch (error: any) {
        console.error('asaas-bill-payment error:', error);
        return errorResponse(error?.message || 'Não conseguimos processar este boleto agora.', error?.status || 500);
    }
});
