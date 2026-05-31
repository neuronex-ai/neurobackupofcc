/**
 * asaas-payout
 *
 * Requests a transfer (saque) from the psychologist's Asaas sub-account
 * to their linked bank account.
 *
 * POST /asaas-payout
 * Body: {
 *   amount?: number         // centavos — if omitted, transfers full available balance
 *   description?: string
 *   operation_type?: 'PIX' | 'TED'  // default: PIX
 *   pix_address_key?: string         // if transferring via Pix key
 * }
 */

import {
    supabaseAdmin,
    corsResponse,
    jsonResponse,
    errorResponse,
    getAuthenticatedUser,
    getFinancialAccount,
    getAsaasBalance,
    createAsaasTransfer,
    createLedgerEntries,
} from '../_shared/asaas-client.ts';

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return corsResponse();

    try {
        const user = await getAuthenticatedUser(req);
        const body = await req.json().catch(() => ({}));

        // 1. Get financial account
        const financialAccount = await getFinancialAccount(user.id);
        if (!financialAccount?.metadata?.asaas_api_key) {
            return errorResponse('Conta financeira não configurada. Complete o onboarding primeiro.', 403);
        }

        const subApiKey = financialAccount.metadata.asaas_api_key;

        // 2. Check balance
        const { data: ledgerBalance } = await supabaseAdmin
            .from('ledger_balances')
            .select('available_balance')
            .eq('user_id', user.id)
            .single();

        const availableBalance = ledgerBalance?.available_balance || 0;
        const requestedAmount = body.amount || availableBalance;

        if (requestedAmount <= 0) {
            return errorResponse('Nenhum saldo disponível para saque.');
        }

        if (requestedAmount > availableBalance) {
            return errorResponse(`Saldo insuficiente. Saldo disponível: R$${(availableBalance / 100).toFixed(2)}`);
        }

        // 3. Double-check against Asaas balance
        const asaasBalance = await getAsaasBalance(subApiKey);
        const asaasAvailableCentavos = Math.round((asaasBalance.balance || 0) * 100);

        if (requestedAmount > asaasAvailableCentavos) {
            return errorResponse('Valor excede o saldo disponível na Asaas. Alguns fundos podem estar pendentes.');
        }

        // 4. Create transfer in Asaas
        const valueReais = requestedAmount / 100;
        const operationType = body.operation_type || 'PIX';

        const transferParams: any = {
            value: valueReais,
            operationType,
            description: body.description || 'Saque NeuroBank',
        };

        if (body.pix_address_key) {
            transferParams.pixAddressKey = body.pix_address_key;
        }

        const transfer = await createAsaasTransfer(subApiKey, transferParams);

        // 5. Create payout record in DB
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
                },
            })
            .select()
            .single();

        if (insertError) throw insertError;

        // 6. Create payout ledger entry
        await createLedgerEntries(user.id, [
            {
                accountType: 'main',
                direction: 'debit',
                entryType: 'payout',
                amount: requestedAmount,
                status: 'posted',
                referenceType: 'payout',
                referenceId: payoutRecord.id,
                providerObjectId: transfer.id,
                description: `Saque para conta bancária: R$${(requestedAmount / 100).toFixed(2)}`,
            },
        ]);

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
