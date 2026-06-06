/**
 * asaas-payout
 *
 * Requests a transfer from the psychologist's Asaas subaccount to a bank account or Pix key.
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
        const body = await req.json().catch(() => ({}));

        const financialAccount = await getFinancialAccount(user.id);
        const subApiKey = getFinancialAccountAsaasApiKey(financialAccount);

        if (!financialAccount || !subApiKey) {
            return errorResponse('Conta financeira não configurada. Complete o onboarding primeiro.', 403);
        }

        const asaasBalance = await getAsaasBalance(subApiKey);
        const availableBalance = Math.round((asaasBalance.balance || 0) * 100);
        const requestedAmount = body.amount || availableBalance;

        if (requestedAmount <= 0) {
            return errorResponse('Nenhum saldo disponível para saque.');
        }

        if (requestedAmount > availableBalance) {
            return errorResponse(`Saldo insuficiente. Saldo disponível: R$${(availableBalance / 100).toFixed(2)}`);
        }

        const valueReais = requestedAmount / 100;
        const operationType = body.operation_type || 'PIX';

        const transferParams: any = {
            value: valueReais,
            operationType,
            description: body.description || 'Saque NeuroFinance',
        };

        if (body.pix_address_key) {
            transferParams.pixAddressKey = body.pix_address_key;
        }

        const transfer = await createAsaasTransfer(subApiKey, transferParams);

        const { data: payoutRecord, error: insertError } = await supabaseAdmin
            .from('nb_payouts')
            .insert({
                user_id: user.id,
                financial_account_id: financialAccount.id,
                provider: 'asaas',
                provider_payout_id: transfer.id,
                amount: requestedAmount,
                status: 'pending',
                destination_summary: financialAccount.bank_name
                    ? `${financialAccount.bank_name} •••• ${financialAccount.bank_account_last4 || '****'}`
                    : 'Conta bancária vinculada',
                requested_at: new Date().toISOString(),
                metadata: {
                    asaas_transfer_id: transfer.id,
                    operation_type: operationType,
                    transfer_fee: transfer.transferFee || 0,
                    source: 'neurofinance',
                },
            })
            .select()
            .single();

        if (insertError) throw insertError;

        return jsonResponse({
            success: true,
            payout_id: payoutRecord.id,
            asaas_transfer_id: transfer.id,
            amount: requestedAmount,
            status: 'pending',
            schedule_date: transfer.scheduleDate || null,
        });
    } catch (error: any) {
        console.error('asaas-payout error:', error);
        return errorResponse(error.message || 'Internal error', 500);
    }
});
