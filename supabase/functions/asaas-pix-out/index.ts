/**
 * asaas-pix-out
 *
 * Sends a Pix transfer from the psychologist's subaccount to an external Pix key.
 * Pix-out is recorded as a payout, never as a negative payment.
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
            return errorResponse('Informe um valor válido para a transferência.');
        }

        if (!pix_key) {
            return errorResponse('Informe a chave Pix de destino.');
        }

        const financialAccount = await getFinancialAccount(user.id);
        const subApiKey = getFinancialAccountAsaasApiKey(financialAccount);

        if (!financialAccount || !subApiKey) {
            return errorResponse('Sua conta ainda não está pronta para enviar Pix.', 403);
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

        const { data: payoutRecord, error: insertError } = await supabaseAdmin
            .from('nb_payouts')
            .insert({
                user_id: user.id,
                financial_account_id: financialAccount.id,
                provider: 'asaas',
                provider_payout_id: transfer.id,
                provider_status: String(transfer.status || 'PENDING').toUpperCase(),
                operation_type: type === 'pay' ? 'pix_payment' : 'pix_transfer',
                pix_key,
                amount,
                currency: 'brl',
                status: 'pending',
                destination_type: 'pix_key',
                destination_summary: description || `Pix para ${pix_key}`,
                requested_at: new Date().toISOString(),
                metadata: {
                    pix_key,
                    type,
                    asaas_transfer_id: transfer.id,
                    source: 'neurofinance_pix_out',
                },
                provider_payload: transfer,
            })
            .select()
            .single();

        if (insertError) throw insertError;

        return jsonResponse({
            success: true,
            payout_id: payoutRecord.id,
            asaas_transfer_id: transfer.id,
            amount,
            pix_key,
            status: 'pending',
        });
    } catch (error: any) {
        console.error('asaas-pix-out error:', error);
        return errorResponse(error.message || 'Não conseguimos enviar este Pix agora.', error?.status || 500);
    }
});
