/**
 * asaas-pix-out
 *
 * Sends a Pix transfer from the psychologist's Asaas subaccount to an external Pix key.
 * The available balance is read from Asaas, not from the deprecated local ledger.
 */

import {
    corsResponse,
    createAsaasTransfer,
    errorResponse,
    getAsaasBalance,
    getAuthenticatedUser,
    getFinancialAccount,
    getFinancialAccountAsaasApiKey,
    jsonResponse,
    supabaseAdmin,
} from '../_shared/asaas-client.ts';

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return corsResponse();

    try {
        const user = await getAuthenticatedUser(req);
        const { amount, pix_key, description, type = 'transfer' } = await req.json();

        if (!amount || amount <= 0) {
            return errorResponse('Valor inválido para transferência.');
        }

        if (!pix_key) {
            return errorResponse('Chave Pix é obrigatória.');
        }

        const financialAccount = await getFinancialAccount(user.id);
        const subApiKey = getFinancialAccountAsaasApiKey(financialAccount);

        if (!financialAccount || !subApiKey) {
            return errorResponse('Conta financeira não configurada.', 403);
        }

        const asaasBalance = await getAsaasBalance(subApiKey);
        const availableBalance = Math.round((asaasBalance.balance || 0) * 100);

        if (amount > availableBalance) {
            return errorResponse(`Saldo insuficiente. Saldo disponível: R$ ${(availableBalance / 100).toFixed(2)}`);
        }

        const transfer = await createAsaasTransfer(subApiKey, {
            value: amount / 100,
            operationType: 'PIX',
            pixAddressKey: pix_key,
            description: description || (type === 'pay'
                ? `Pagamento Pix: ${pix_key}`
                : `Transferência Pix para ${pix_key}`),
        });

        const { data: paymentRecord, error: insertError } = await supabaseAdmin
            .from('nb_payments')
            .insert({
                user_id: user.id,
                financial_account_id: financialAccount.id,
                payment_method_type: 'pix',
                provider: 'asaas',
                status: 'processing',
                gross_amount: -amount,
                net_amount: -amount,
                platform_fee_amount: 0,
                description: description || `Transferência Pix para ${pix_key}`,
                metadata: {
                    pix_key,
                    type,
                    asaas_transfer_id: transfer.id,
                    source: 'neurofinance_pix_out',
                },
                paid_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (insertError) throw insertError;

        return jsonResponse({
            success: true,
            payment_id: paymentRecord.id,
            asaas_transfer_id: transfer.id,
            amount,
            pix_key,
            status: 'processing',
        });
    } catch (error: any) {
        console.error('asaas-pix-out error:', error);
        return errorResponse(error.message || 'Internal error', 500);
    }
});
