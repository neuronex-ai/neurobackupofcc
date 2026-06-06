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
    getFinancialAccountByAsaasId,
    getFinancialAccountAsaasApiKey,
    asaasRequest,
    syncFinancialAccountFromAsaas,
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
        const resource = getWebhookResource(body);

        if (!event) {
            return errorResponse('Missing event type', 400);
        }

        const providerObjectId = resource?.id || 'unknown';
        const providerObjectType = resource?.object || inferProviderObjectType(body);
        const asaasAccountId = body?.accountStatus?.id || body?.account?.id || resource?.account || null;
        const eventId = body.id || `${event}_${providerObjectId}`;

        console.log(`[asaas-webhook] Received: ${event}, objectId: ${providerObjectId}`);

        // 2. Check idempotency using the Asaas event id when available.
        const dedupKey = String(eventId);
        const alreadyProcessed = await isAsaasEventProcessed(dedupKey);
        if (alreadyProcessed) {
            console.log(`[asaas-webhook] Event already processed: ${dedupKey}`);
            return jsonResponse({ received: true, duplicate: true });
        }

        // 3. Persist event
        await persistAsaasEvent(event, dedupKey, body, {
            asaasAccountId,
            providerObjectId,
            providerObjectType,
        });

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
                case 'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED':
                case 'PAYMENT_CHARGEBACK_REQUESTED':
                case 'PAYMENT_CHARGEBACK_DISPUTE':
                case 'PAYMENT_AWAITING_CHARGEBACK_REVERSAL':
                case 'PAYMENT_DUNNING_REQUESTED':
                case 'PAYMENT_DUNNING_RECEIVED':
                    await handlePaymentInfo(payment, event);
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
                    if (event.startsWith('ACCOUNT_STATUS_')) {
                        await handleAccountStatus(body.accountStatus, event);
                    } else {
                        console.log(`[asaas-webhook] Unhandled event: ${event}`);
                    }
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

function getWebhookResource(body: any) {
    return body?.payment ||
        body?.transfer ||
        body?.accountStatus ||
        body?.subscription ||
        body?.customer ||
        body?.invoice ||
        body?.pix ||
        null;
}

function inferProviderObjectType(body: any) {
    if (body?.payment) return 'payment';
    if (body?.transfer) return 'transfer';
    if (body?.accountStatus) return 'account_status';
    if (body?.subscription) return 'subscription';
    if (body?.customer) return 'customer';
    if (body?.invoice) return 'invoice';
    if (body?.pix) return 'pix';
    return 'unknown';
}

async function findPaymentByProviderId(paymentId: string, columns = '*') {
    const { data, error } = await supabaseAdmin
        .from('nb_payments')
        .select(columns)
        .eq('provider_payment_id', paymentId)
        .maybeSingle();

    if (error) throw error;
    if (data) return data;

    const fallback = await supabaseAdmin
        .from('nb_payments')
        .select(columns)
        .filter('metadata->>asaas_payment_id', 'eq', paymentId)
        .maybeSingle();

    if (fallback.error) throw fallback.error;
    return fallback.data;
}

async function findPayoutByProviderId(transferId: string, columns = '*') {
    const { data, error } = await supabaseAdmin
        .from('nb_payouts')
        .select(columns)
        .eq('provider_payout_id', transferId)
        .maybeSingle();

    if (error) throw error;
    if (data) return data;

    const fallback = await supabaseAdmin
        .from('nb_payouts')
        .select(columns)
        .filter('metadata->>asaas_transfer_id', 'eq', transferId)
        .maybeSingle();

    if (fallback.error) throw fallback.error;
    return fallback.data;
}

async function touchFinancialAccountEvent(
    financialAccountId: string | null | undefined,
    event: string
) {
    if (!financialAccountId) return;

    const { error } = await supabaseAdmin
        .from('financial_accounts')
        .update({
            last_asaas_event_type: event,
            last_asaas_event_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq('id', financialAccountId);

    if (error) console.warn('[asaas-webhook] Failed to touch financial account:', error);
}

function mapAsaasPaymentStatus(status?: string) {
    switch ((status || '').toUpperCase()) {
        case 'RECEIVED':
        case 'CONFIRMED':
        case 'RECEIVED_IN_CASH':
            return 'paid';
        case 'OVERDUE':
            return 'expired';
        case 'REFUNDED':
        case 'REFUND_REQUESTED':
            return 'refunded';
        case 'DELETED':
            return 'canceled';
        case 'AWAITING_RISK_ANALYSIS':
            return 'processing';
        default:
            return 'pending';
    }
}

function normalizeAsaasAccountStatus(accountStatus: any) {
    return {
        id: accountStatus.id,
        commercialInfoStatus:
            accountStatus.commercialInfoStatus ||
            accountStatus.commercialInfo ||
            'PENDING',
        bankAccountInfoStatus:
            accountStatus.bankAccountInfoStatus ||
            accountStatus.bankAccountInfo ||
            'PENDING',
        documentStatus:
            accountStatus.documentStatus ||
            accountStatus.documentation ||
            accountStatus.document ||
            'PENDING',
        generalStatus:
            accountStatus.generalStatus ||
            accountStatus.general ||
            'PENDING',
    };
}

async function handlePaymentConfirmed(payment: any) {
    if (!payment?.id) return;

    // Find the nb_payment record
    const nbPayment = await findPaymentByProviderId(payment.id);

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
            provider_payment_id: payment.id,
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

    await touchFinancialAccountEvent(nbPayment.financial_account_id, 'PAYMENT_CONFIRMED');

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

    await tryScheduleAutomaticInvoice(nbPayment, payment);

    // Notify user (optional — can fire async notification)
    console.log(`[asaas-webhook] Payment confirmed: ${nbPayment.id}, value: R$${(valueCentavos / 100).toFixed(2)}`);
}

async function tryScheduleAutomaticInvoice(nbPayment: any, payment: any) {
    try {
        const invoiceId = nbPayment?.metadata?.invoice_id;
        if (!invoiceId) return;

        const { data: settings } = await supabaseAdmin
            .from('user_fiscal_settings')
            .select('auto_issue, service_code, iss_aliquot, asaas_municipal_service_id, asaas_municipal_service_name')
            .eq('user_id', nbPayment.user_id)
            .maybeSingle();

        if (!settings?.auto_issue || (!settings.service_code && !settings.asaas_municipal_service_id)) return;

        const { data: financialAccount } = await supabaseAdmin
            .from('financial_accounts')
            .select('*')
            .eq('id', nbPayment.financial_account_id)
            .maybeSingle();
        const apiKey = getFinancialAccountAsaasApiKey(financialAccount);
        if (!apiKey) return;

        const scheduled = await asaasRequest('/invoices', 'POST', {
            payment: payment.id,
            serviceDescription: nbPayment.description || 'Serviços de psicologia e saúde mental',
            observations: `Emissão automática NeuroFinance para a cobrança ${payment.id}.`,
            value: Number(payment.value || 0),
            deductions: 0,
            effectiveDate: new Date().toISOString().slice(0, 10),
            municipalServiceId: settings.asaas_municipal_service_id || null,
            municipalServiceCode: settings.asaas_municipal_service_id ? null : settings.service_code,
            municipalServiceName: settings.asaas_municipal_service_name || 'Serviços de psicologia',
            taxes: {
                retainIss: false,
                iss: Number(settings.iss_aliquot || 0),
            },
        }, apiKey) as any;

        await supabaseAdmin.from('invoices').update({
            nfse_status: scheduled.status || 'SCHEDULED',
            nfse_reference: scheduled.id || null,
            updated_at: new Date().toISOString(),
        }).eq('id', invoiceId);
    } catch (error) {
        console.warn('[asaas-webhook] Automatic NFS-e scheduling deferred:', error);
    }
}

async function handlePaymentOverdue(payment: any) {
    if (!payment?.id) return;

    const nbPayment = await findPaymentByProviderId(payment.id, 'id, status, financial_account_id');

    if (!nbPayment || nbPayment.status === 'paid') return;

    await supabaseAdmin
        .from('nb_payments')
        .update({
            status: 'expired',
            provider_payment_id: payment.id,
            updated_at: new Date().toISOString(),
        })
        .eq('id', nbPayment.id);

    await touchFinancialAccountEvent(nbPayment.financial_account_id, 'PAYMENT_OVERDUE');

    console.log(`[asaas-webhook] Payment overdue: ${nbPayment.id}`);
}

async function handlePaymentRefunded(payment: any, event: string) {
    if (!payment?.id) return;

    const nbPayment = await findPaymentByProviderId(payment.id);

    if (!nbPayment) return;

    const refundValue = Math.round((payment.value || 0) * 100);

    const newStatus = event === 'PAYMENT_REFUND_IN_PROGRESS' ? 'processing' : 'refunded';

    await supabaseAdmin
        .from('nb_payments')
        .update({
            status: newStatus,
            provider_payment_id: payment.id,
            refund_amount: refundValue,
            updated_at: new Date().toISOString(),
        })
        .eq('id', nbPayment.id);

    await touchFinancialAccountEvent(nbPayment.financial_account_id, event);

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

    const nbPayment = await findPaymentByProviderId(payment.id, 'id, status, financial_account_id');

    if (!nbPayment || nbPayment.status === 'paid') return;

    await supabaseAdmin
        .from('nb_payments')
        .update({
            status: 'canceled',
            provider_payment_id: payment.id,
            updated_at: new Date().toISOString(),
        })
        .eq('id', nbPayment.id);

    await touchFinancialAccountEvent(nbPayment.financial_account_id, 'PAYMENT_DELETED');

    console.log(`[asaas-webhook] Payment deleted/canceled: ${nbPayment.id}`);
}

// ─────────────────────────────────────────────────────────────
// Transfer (payout) handlers
// ─────────────────────────────────────────────────────────────

async function handlePaymentInfo(payment: any, event: string) {
    if (!payment?.id) return;

    const nbPayment = await findPaymentByProviderId(payment.id);

    if (!nbPayment) {
        console.log(`[asaas-webhook] Info payment not found locally: ${payment.id}`);
        return;
    }

    const valueCentavos = Math.round((payment.value || 0) * 100);
    const netValueCentavos = Math.round((payment.netValue || payment.value || 0) * 100);
    const mappedStatus = mapAsaasPaymentStatus(payment.status);
    const status = nbPayment.status === 'paid' ? 'paid' : mappedStatus;

    await supabaseAdmin
        .from('nb_payments')
        .update({
            status,
            provider_payment_id: payment.id,
            gross_amount: valueCentavos || nbPayment.gross_amount,
            net_amount: netValueCentavos || nbPayment.net_amount,
            checkout_url: payment.invoiceUrl || nbPayment.checkout_url,
            metadata: {
                ...nbPayment.metadata,
                asaas_payment_id: payment.id,
                asaas_status: payment.status || null,
                asaas_billing_type: payment.billingType || null,
                asaas_invoice_url: payment.invoiceUrl || null,
                asaas_bank_slip_url: payment.bankSlipUrl || null,
                asaas_last_event: event,
            },
            updated_at: new Date().toISOString(),
        })
        .eq('id', nbPayment.id);

    await touchFinancialAccountEvent(nbPayment.financial_account_id, event);
    console.log(`[asaas-webhook] Payment info updated (${event}): ${nbPayment.id}`);
}

async function handleTransferPending(transfer: any) {
    if (!transfer?.id) return;

    const payout = await findPayoutByProviderId(transfer.id, 'id, financial_account_id');

    if (!payout) {
        console.log(`[asaas-webhook] Transfer not found in nb_payouts: ${transfer.id}`);
        return;
    }

    await supabaseAdmin
        .from('nb_payouts')
        .update({
            status: 'in_transit',
            provider_payout_id: transfer.id,
            updated_at: new Date().toISOString(),
        })
        .eq('id', payout.id);

    await touchFinancialAccountEvent(payout.financial_account_id, 'TRANSFER_PENDING');
}

async function handleTransferDone(transfer: any) {
    if (!transfer?.id) return;

    const payout = await findPayoutByProviderId(transfer.id);

    if (!payout) return;

    await supabaseAdmin
        .from('nb_payouts')
        .update({
            status: 'paid',
            provider_payout_id: transfer.id,
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq('id', payout.id);

    await touchFinancialAccountEvent(payout.financial_account_id, 'TRANSFER_DONE');

    console.log(`[asaas-webhook] Transfer completed: ${payout.id}`);
}

async function handleTransferFailed(transfer: any, event: string) {
    if (!transfer?.id) return;

    const payout = await findPayoutByProviderId(transfer.id);

    if (!payout) return;

    const status = event === 'TRANSFER_CANCELLED' ? 'canceled' : 'failed';

    await supabaseAdmin
        .from('nb_payouts')
        .update({
            status,
            provider_payout_id: transfer.id,
            updated_at: new Date().toISOString(),
        })
        .eq('id', payout.id);

    await touchFinancialAccountEvent(payout.financial_account_id, event);

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

async function handleAccountStatus(accountStatusPayload: any, event: string) {
    if (!accountStatusPayload?.id) {
        console.log(`[asaas-webhook] Account status event without account id: ${event}`);
        return;
    }

    const financialAccount = await getFinancialAccountByAsaasId(accountStatusPayload.id);
    if (!financialAccount) {
        console.log(`[asaas-webhook] Financial account not found for Asaas account: ${accountStatusPayload.id}`);
        return;
    }

    const accountStatus = normalizeAsaasAccountStatus(accountStatusPayload);
    await syncFinancialAccountFromAsaas(financialAccount.id, accountStatus);
    await touchFinancialAccountEvent(financialAccount.id, event);

    console.log(`[asaas-webhook] Account status synced (${event}): ${financialAccount.id}`);
}
