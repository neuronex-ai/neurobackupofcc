/**
 * asaas-pix-out
 *
 * Sends a Pix transfer from the psychologist's Asaas sub-account
 * to an external Pix key.
 *
 * POST /asaas-pix-out
 * Body: {
 *   amount: number,          // centavos
 *   pix_key: string,
 *   description?: string,
 *   type: 'transfer' | 'pay'
 * }
 */

import {
    supabaseAdmin,
    corsResponse,
    jsonResponse,
    errorResponse,
    getAuthenticatedUser,
    getFinancialAccount,
    createAsaasTransfer,
    createLedgerEntries,
    getFinancialAccountAsaasApiKey,
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

        // 1. Get financial account
        const financialAccount = await getFinancialAccount(user.id);
        const subApiKey = getFinancialAccountAsaasApiKey(financialAccount);
        if (!financialAccount || !subApiKey) {
            return errorResponse('Conta financeira não configurada.', 403);
        }

        // 2. Check ledger balance
        const { data: balance, error: balanceError } = await supabaseAdmin
            .from('ledger_balances')
            .select('available_balance')
            .eq('user_id', user.id)
            .single();

        if (balanceError) throw balanceError;

        const availableBalance = balance?.available_balance || 0;

        if (amount > availableBalance) {
            return errorResponse(`Saldo insuficiente. Saldo disponível: R$ ${(availableBalance / 100).toFixed(2)}`);
        }

        // 3. Create Pix transfer via Asaas
        const valueReais = amount / 100;

        const transfer = await createAsaasTransfer(subApiKey, {
            value: valueReais,
            operationType: 'PIX',
            pixAddressKey: pix_key,
            description: description || (type === 'pay'
                ? `Pagamento Pix: ${pix_key}`
                : `Transferência Pix para ${pix_key}`),
        });

        // 4. Create outgoing payment record
        const { data: paymentRecord, error: insertError } = await supabaseAdmin
            .from('nb_payments')
            .insert({
                user_id: user.id,
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
                },
                paid_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (insertError) throw insertError;

        // 5. Create ledger debit entry
        await createLedgerEntries(user.id, [
            {
                accountType: 'main',
                direction: 'debit',
                entryType: 'payout',
                amount: amount,
                status: 'posted',
                referenceType: 'payment',
                referenceId: paymentRecord.id,
                stripeObjectId: transfer.id,
                description: type === 'pay'
                    ? `Pagamento Pix: ${description || pix_key}`
                    : `Transferência Pix para ${pix_key}`,
            },
        ]);

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
