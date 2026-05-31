/**
 * asaas-webhook
 *
 * Receives and processes webhooks from Asaas.
 * Auth: validates `asaas-access-token` header against ASAAS_WEBHOOK_TOKEN env var.
 *
 * Asaas sends at-least-once delivery — must handle duplicates.
 *
 * Key events:
 *   PAYMENT_RECEIVED / PAYMENT_CONFIRMED — mark payment as paid, post ledger
 *   PAYMENT_OVERDUE — mark payment as expired
 *   PAYMENT_REFUNDED / PAYMENT_REFUND_IN_PROGRESS — handle refunds
 *   PAYMENT_DELETED — mark payment as canceled
 *   TRANSFER_CREATED / TRANSFER_DONE / TRANSFER_FAILED — payouts
 *
 * POST /asaas-webhook  (no auth JWT — validated by webhook token)
 */

import {
    supabaseAdmin,
    corsResponse,
    jsonResponse,
    errorResponse,
    validateAsaasWebhookToken,
    isAsaasEventProcessed,
    persistAsaasEvent,
    markAsaasEventProcessed,
    markAsaasEventFailed,
    createLedgerEntries,
    calculateFees,
} from '../_shared/asaas-client.ts';

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return corsResponse();

    try {
        // 1. Validate webhook token
        if (!validateAsaasWebhookToken(req)) {
            console.error('[asaas-webhook] Invalid webhook token');
            return errorResponse('Unauthorized', 401);
        }

        const body = await req.json();
        const event = body.event as string;
        const payment = body.payment as any;

        if (!event) {
            return errorResponse('Missing event type', 400);
        }

        // Generate unique event ID for idempotency
        // Asaas doesn't send a unique event ID, so we compose one
        const asaasPaymentId = payment?.id || body?.transfer?.id || 'unknown';
        const eventId = `${event}_${asaasPaymentId}_${Date.now()}`;

        console.log(`[asaas-webhook] Received: ${event}, paymentId: ${asaasPaymentId}`);

        // 2. Check idempotency (use paymentId + event as key for dedup)
        const dedupKey = `${event}_${asaasPaymentId}`;
        const alreadyProcessed = await isAsaasEventProcessed(dedupKey);
        if (alreadyProcessed) {
            console.log(`[asaas-webhook] Event already processed: ${dedupKey}`);
            return jsonResponse({ received: true, duplicate: true });
        }

        // 3. Persist event
        await persistAsaasEvent(event, dedupKey, body);

        // 4. Route to handler
        try {
            switch (event) {
                case 'PAYMENT_RECEIVED':
                case 'PAYMENT_CONFIRMED':
                    await handlePaymentConfirmed(payment);
                    break;

                case 'PAYMENT_OVERDUE':
                    await handlePaymentOverdue(payment);
                    break;

                case 'PAYMENT_REFUNDED':
                case 'PAYMENT_REFUND_IN_PROGRESS':
                    await handlePaymentRefunded(payment, event);
                    break;

                case 'PAYMENT_DELETED':
                    await handlePaymentDeleted(payment);
                    break;

                case 'PAYMENT_CREATED':
                case 'PAYMENT_UPDATED':
                case 'PAYMENT_AWAITING_RISK_ANALYSIS':
                    // Informational — log only
                    console.log(`[asaas-webhook] Info event: ${event}`);
                    break;

                case 'TRANSFER_CREATED':
                case 'TRANSFER_PENDING':
                    await handleTransferPending(body.transfer);
                    break;

                case 'TRANSFER_DONE':
                    await handleTransferDone(body.transfer);
                    break;

                case 'TRANSFER_FAILED':
                case 'TRANSFER_CANCELLED':
                    await handleTransferFailed(body.transfer, event);
                    break;

                default:
                    console.log(`[asaas-webhook] Unhandled event: ${event}`);
            }

            await markAsaasEventProcessed(dedupKey);

        } catch (handlerError: any) {
            console.error(`[asaas-webhook] Handler error for ${event}:`, handlerError);
            await markAsaasEventFailed(dedupKey, handlerError.message);
        }

        // Always return 200 to Asaas to prevent retries on our handled events
        return jsonResponse({ received: true });

    } catch (error: any) {
        console.error('asaas-webhook error:', error);
        return jsonResponse({ received: true, error: error.message }, 200);
    }
});

// ─────────────────────────────────────────────────────────────
// Payment handlers
// ─────────────────────────────────────────────────────────────

async function handlePaymentConfirmed(payment: any) {
    if (!payment?.id) return;

    // Find the nb_payment record
    const { data: nbPayment, error } = await supabaseAdmin
        .from('nb_payments')
        .select('*')
        .eq('provider_payment_id', payment.id)
        .maybeSingle();

    if (!nbPayment) {
        console.warn(`[asaas-webhook] Payment not found for Asaas ID: ${payment.id}`);
        return;
    }

    if (nbPayment.status === 'paid') {
        console.log(`[asaas-webhook] Payment already marked as paid: ${nbPayment.id}`);
        return;
    }

    // Update payment status
    const valueCentavos = Math.round((payment.value || 0) * 100);
    const netValueCentavos = Math.round((payment.netValue || payment.value || 0) * 100);

    await supabaseAdmin
        .from('nb_payments')
        .update({
            status: 'paid',
            paid_at: payment.paymentDate || new Date().toISOString(),
            net_amount: netValueCentavos,
            metadata: {
                ...nbPayment.metadata,
                asaas_payment_date: payment.paymentDate,
                asaas_confirmed_date: payment.confirmedDate,
                asaas_billing_type: payment.billingType,
                asaas_transaction_receipt_url: payment.transactionReceiptUrl,
            },
            updated_at: new Date().toISOString(),
        })
        .eq('id', nbPayment.id);

    // Create ledger entries — payment received + fee
    const { totalFee } = calculateFees(valueCentavos);

    await createLedgerEntries(nbPayment.user_id, [
        {
            accountType: 'main',
            direction: 'credit',
            entryType: 'payment_received',
            amount: valueCentavos,
            status: 'posted',
            referenceType: 'payment',
            referenceId: nbPayment.id,
            providerObjectId: payment.id,
            description: `Pagamento confirmado: R$${(valueCentavos / 100).toFixed(2)}`,
        },
        {
            accountType: 'fees',
            direction: 'debit',
            entryType: 'fee',
            amount: totalFee,
            status: 'posted',
            referenceType: 'payment',
            referenceId: nbPayment.id,
            providerObjectId: payment.id,
            description: `Taxa NeuroBank: R$${(totalFee / 100).toFixed(2)}`,
        },
    ]);

    // Notify user (optional — can fire async notification)
    console.log(`[asaas-webhook] Payment confirmed: ${nbPayment.id}, value: R$${(valueCentavos / 100).toFixed(2)}`);
}

async function handlePaymentOverdue(payment: any) {
    if (!payment?.id) return;

    const { data: nbPayment } = await supabaseAdmin
        .from('nb_payments')
        .select('id, status')
        .eq('provider_payment_id', payment.id)
        .maybeSingle();

    if (!nbPayment || nbPayment.status === 'paid') return;

    await supabaseAdmin
        .from('nb_payments')
        .update({
            status: 'expired',
            updated_at: new Date().toISOString(),
        })
        .eq('id', nbPayment.id);

    console.log(`[asaas-webhook] Payment overdue: ${nbPayment.id}`);
}

async function handlePaymentRefunded(payment: any, event: string) {
    if (!payment?.id) return;

    const { data: nbPayment } = await supabaseAdmin
        .from('nb_payments')
        .select('*')
        .eq('provider_payment_id', payment.id)
        .maybeSingle();

    if (!nbPayment) return;

    const refundValue = Math.round((payment.value || 0) * 100);

    const newStatus = event === 'PAYMENT_REFUND_IN_PROGRESS' ? 'processing' : 'refunded';

    await supabaseAdmin
        .from('nb_payments')
        .update({
            status: newStatus,
            refund_amount: refundValue,
            updated_at: new Date().toISOString(),
        })
        .eq('id', nbPayment.id);

    if (event === 'PAYMENT_REFUNDED') {
        await createLedgerEntries(nbPayment.user_id, [
            {
                accountType: 'main',
                direction: 'debit',
                entryType: 'refund',
                amount: refundValue,
                status: 'posted',
                referenceType: 'payment',
                referenceId: nbPayment.id,
                providerObjectId: payment.id,
                description: `Estorno: R$${(refundValue / 100).toFixed(2)}`,
            },
        ]);
    }

    console.log(`[asaas-webhook] Payment refund (${event}): ${nbPayment.id}`);
}

async function handlePaymentDeleted(payment: any) {
    if (!payment?.id) return;

    const { data: nbPayment } = await supabaseAdmin
        .from('nb_payments')
        .select('id, status')
        .eq('provider_payment_id', payment.id)
        .maybeSingle();

    if (!nbPayment || nbPayment.status === 'paid') return;

    await supabaseAdmin
        .from('nb_payments')
        .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
        })
        .eq('id', nbPayment.id);

    console.log(`[asaas-webhook] Payment deleted/canceled: ${nbPayment.id}`);
}

// ─────────────────────────────────────────────────────────────
// Transfer (payout) handlers
// ─────────────────────────────────────────────────────────────

async function handleTransferPending(transfer: any) {
    if (!transfer?.id) return;

    const { data: payout } = await supabaseAdmin
        .from('nb_payouts')
        .select('id')
        .eq('provider_payout_id', transfer.id)
        .maybeSingle();

    if (!payout) {
        console.log(`[asaas-webhook] Transfer not found in nb_payouts: ${transfer.id}`);
        return;
    }

    await supabaseAdmin
        .from('nb_payouts')
        .update({
            status: 'in_transit',
            updated_at: new Date().toISOString(),
        })
        .eq('id', payout.id);
}

async function handleTransferDone(transfer: any) {
    if (!transfer?.id) return;

    const { data: payout } = await supabaseAdmin
        .from('nb_payouts')
        .select('*')
        .eq('provider_payout_id', transfer.id)
        .maybeSingle();

    if (!payout) return;

    await supabaseAdmin
        .from('nb_payouts')
        .update({
            status: 'paid',
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq('id', payout.id);

    console.log(`[asaas-webhook] Transfer completed: ${payout.id}`);
}

async function handleTransferFailed(transfer: any, event: string) {
    if (!transfer?.id) return;

    const { data: payout } = await supabaseAdmin
        .from('nb_payouts')
        .select('*')
        .eq('provider_payout_id', transfer.id)
        .maybeSingle();

    if (!payout) return;

    const status = event === 'TRANSFER_CANCELLED' ? 'canceled' : 'failed';

    await supabaseAdmin
        .from('nb_payouts')
        .update({
            status,
            updated_at: new Date().toISOString(),
        })
        .eq('id', payout.id);

    // If it was a failed transfer, reverse the ledger entry
    if (status === 'failed') {
        await createLedgerEntries(payout.user_id, [
            {
                accountType: 'main',
                direction: 'credit',
                entryType: 'adjustment',
                amount: payout.amount,
                status: 'posted',
                referenceType: 'payout',
                referenceId: payout.id,
                providerObjectId: transfer.id,
                description: `Estorno de saque falho: R$${(payout.amount / 100).toFixed(2)}`,
            },
        ]);
    }

    console.log(`[asaas-webhook] Transfer ${status}: ${payout.id}`);
}
