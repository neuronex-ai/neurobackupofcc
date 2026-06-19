/**
 * asaas-webhook
 *
 * Receives and processes webhooks from Asaas.
 * Auth: validates `asaas-access-token` header against ASAAS_WEBHOOK_TOKEN env var.
 *
 * Asaas sends at-least-once delivery — must handle duplicates.
 *
 * Key events:
 *   PAYMENT_RECEIVED / PAYMENT_CONFIRMED — mark payment as paid
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
    getFinancialAccountByAsaasId,
    getFinancialAccountAsaasApiKey,
    asaasRequest,
    normalizeAsaasAccountStatusPayload,
    syncFinancialAccountFromAsaas,
} from '../_shared/asaas-client.ts';
import {
    normalizePaymentState,
    refreshOverviewSnapshot,
    upsertAccountMovement,
    upsertPaymentFromProvider,
} from '../_shared/neurofinance-financial.ts';
import { syncFinancialEntryForPayment } from '../_shared/financial-management.ts';
import {
    dateInTimeZone,
    normalizeBillPaymentStatus,
} from '../_shared/asaas-bill-scheduling.ts';

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
        const asaasAccountId =
            body?.accountStatus?.id ||
            (typeof body?.account === 'string' ? body.account : body?.account?.id) ||
            resource?.account ||
            null;
        const webhookFinancialAccount = asaasAccountId
            ? await getFinancialAccountByAsaasId(String(asaasAccountId))
            : null;
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
                case 'PAYMENT_AUTHORIZED':
                case 'PAYMENT_ANTICIPATED':
                    await handlePaymentEvent(payment, event, webhookFinancialAccount);
                    break;

                case 'PAYMENT_OVERDUE':
                    await handlePaymentEvent(payment, event, webhookFinancialAccount);
                    break;

                case 'PAYMENT_REFUNDED':
                case 'PAYMENT_PARTIALLY_REFUNDED':
                case 'PAYMENT_REFUND_IN_PROGRESS':
                case 'PAYMENT_REFUND_DENIED':
                case 'PAYMENT_RECEIVED_IN_CASH_UNDONE':
                    await handlePaymentEvent(payment, event, webhookFinancialAccount);
                    break;

                case 'PAYMENT_DELETED':
                case 'PAYMENT_RESTORED':
                    await handlePaymentEvent(payment, event, webhookFinancialAccount);
                    break;

                case 'PAYMENT_CREATED':
                case 'PAYMENT_UPDATED':
                case 'PAYMENT_AWAITING_RISK_ANALYSIS':
                case 'PAYMENT_APPROVED_BY_RISK_ANALYSIS':
                case 'PAYMENT_REPROVED_BY_RISK_ANALYSIS':
                case 'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED':
                case 'PAYMENT_CHARGEBACK_REQUESTED':
                case 'PAYMENT_CHARGEBACK_DISPUTE':
                case 'PAYMENT_AWAITING_CHARGEBACK_REVERSAL':
                case 'PAYMENT_DUNNING_REQUESTED':
                case 'PAYMENT_DUNNING_RECEIVED':
                case 'PAYMENT_BANK_SLIP_CANCELLED':
                case 'PAYMENT_BANK_SLIP_VIEWED':
                case 'PAYMENT_CHECKOUT_VIEWED':
                case 'PAYMENT_SPLIT_CANCELLED':
                case 'PAYMENT_SPLIT_DIVERGENCE_BLOCK':
                case 'PAYMENT_SPLIT_DIVERGENCE_BLOCK_FINISHED':
                    await handlePaymentEvent(payment, event, webhookFinancialAccount);
                    break;

                case 'TRANSFER_CREATED':
                case 'TRANSFER_PENDING':
                case 'TRANSFER_IN_BANK_PROCESSING':
                case 'TRANSFER_BLOCKED':
                    await handleTransferPending(body.transfer, event);
                    break;

                case 'TRANSFER_DONE':
                    await handleTransferDone(body.transfer);
                    break;

                case 'TRANSFER_FAILED':
                case 'TRANSFER_CANCELLED':
                    await handleTransferFailed(body.transfer, event);
                    break;

                default:
                    if (event.startsWith('BILL_')) {
                        await handleBillEvent(body.bill || resource, event);
                    } else if (event.startsWith('RECEIVABLE_ANTICIPATION_')) {
                        await handleReceivableAnticipationEvent(body.anticipation || resource, event, webhookFinancialAccount);
                    } else if (event.startsWith('ACCOUNT_STATUS_')) {
                        await handleAccountStatus(body.accountStatus, event);
                    } else if (isGenericNotifiableAsaasEvent(event)) {
                        await handleGenericAsaasEvent(body, resource, event, webhookFinancialAccount);
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
        body?.bill ||
        body?.transfer ||
        body?.accountStatus ||
        body?.subscription ||
        body?.checkout ||
        body?.authorization ||
        body?.paymentInstruction ||
        body?.eligibility ||
        body?.balance ||
        body?.internalTransfer ||
        body?.mobilePhoneRecharge ||
        body?.customer ||
        body?.invoice ||
        body?.pix ||
        body?.anticipation ||
        null;
}

function inferProviderObjectType(body: any) {
    if (body?.payment) return 'payment';
    if (body?.bill) return 'bill';
    if (body?.transfer) return 'transfer';
    if (body?.accountStatus) return 'account_status';
    if (body?.subscription) return 'subscription';
    if (body?.checkout) return 'checkout';
    if (body?.authorization) return 'pix_automatic_authorization';
    if (body?.paymentInstruction) return 'pix_automatic_payment_instruction';
    if (body?.eligibility) return 'pix_automatic_eligibility';
    if (body?.balance) return 'balance';
    if (body?.internalTransfer) return 'internal_transfer';
    if (body?.mobilePhoneRecharge) return 'mobile_phone_recharge';
    if (body?.customer) return 'customer';
    if (body?.invoice) return 'invoice';
    if (body?.pix) return 'pix';
    if (body?.anticipation) return 'anticipation';
    return 'unknown';
}

const ADMIN_ONLY_ASAAS_EVENTS = new Set([
    'ACCESS_TOKEN_CREATED',
    'ACCESS_TOKEN_DELETED',
    'ACCESS_TOKEN_DISABLED',
    'ACCESS_TOKEN_ENABLED',
    'ACCESS_TOKEN_EXPIRED',
    'ACCESS_TOKEN_EXPIRING_SOON',
]);

const HISTORY_ONLY_ASAAS_EVENTS = new Set([
    'PAYMENT_BANK_SLIP_VIEWED',
    'PAYMENT_CHECKOUT_VIEWED',
]);

const GENERIC_NOTIFIABLE_PREFIXES = [
    'INVOICE_',
    'SUBSCRIPTION_',
    'CHECKOUT_',
    'BALANCE_',
    'INTERNAL_TRANSFER_',
    'PIX_AUTOMATIC_',
    'MOBILE_PHONE_RECHARGE_',
];

function isGenericNotifiableAsaasEvent(event: string) {
    return GENERIC_NOTIFIABLE_PREFIXES.some((prefix) => event.startsWith(prefix));
}

function compactEventLabel(event: string) {
    return event
        .toLowerCase()
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function amountCentsFromResource(resource: any) {
    const raw = resource?.value ??
        resource?.netValue ??
        resource?.grossValue ??
        resource?.amount ??
        resource?.anticipatedValue ??
        resource?.totalValue ??
        0;
    const numberValue = Number(raw || 0);
    return Number.isFinite(numberValue) && numberValue > 0
        ? Math.round(numberValue * 100)
        : null;
}

function asaasNotificationDescriptor(event: string, resource: any) {
    if (ADMIN_ONLY_ASAAS_EVENTS.has(event) || HISTORY_ONLY_ASAAS_EVENTS.has(event)) return null;

    const amountCents = amountCentsFromResource(resource);
    const amountText = amountCents
        ? ` no valor de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amountCents / 100)}`
        : '';
    const base = {
        title: 'Atualizacao do NeuroFinance',
        message: `Evento ${compactEventLabel(event)} recebido pela Asaas${amountText}.`,
        severity: 'info',
        priority: 'normal',
        requiresAction: false,
        nativePushEligible: false,
    };

    const table: Record<string, Partial<typeof base>> = {
        PAYMENT_AUTHORIZED: { title: 'Pagamento autorizado', message: `Uma cobranca foi autorizada${amountText}.`, severity: 'success' },
        PAYMENT_CREATED: { title: 'Cobranca criada', message: `Uma cobranca foi criada no NeuroFinance${amountText}.` },
        PAYMENT_UPDATED: { title: 'Cobranca atualizada', message: `Uma cobranca foi atualizada pela Asaas${amountText}.` },
        PAYMENT_CONFIRMED: { title: 'Pagamento confirmado', message: `Um pagamento foi confirmado${amountText}.`, severity: 'success' },
        PAYMENT_RECEIVED: { title: 'Pagamento recebido', message: `Um pagamento ficou disponivel no NeuroFinance${amountText}.`, severity: 'success' },
        PAYMENT_ANTICIPATED: { title: 'Pagamento antecipado', message: `Uma cobranca foi antecipada${amountText}.`, severity: 'success' },
        PAYMENT_OVERDUE: { title: 'Pagamento vencido', message: `Uma cobranca venceu e precisa de acompanhamento${amountText}.`, severity: 'warning', priority: 'high', requiresAction: true, nativePushEligible: true },
        PAYMENT_DELETED: { title: 'Cobranca removida', message: `Uma cobranca foi removida/cancelada${amountText}.`, severity: 'warning', priority: 'high', requiresAction: true },
        PAYMENT_RESTORED: { title: 'Cobranca restaurada', message: `Uma cobranca foi restaurada${amountText}.`, severity: 'success' },
        PAYMENT_REFUNDED: { title: 'Pagamento estornado', message: `Um pagamento foi estornado${amountText}.`, severity: 'warning', priority: 'high', requiresAction: true },
        PAYMENT_PARTIALLY_REFUNDED: { title: 'Pagamento parcialmente estornado', message: `Um pagamento teve estorno parcial${amountText}.`, severity: 'warning', priority: 'high', requiresAction: true },
        PAYMENT_REFUND_IN_PROGRESS: { title: 'Estorno em processamento', message: `Um estorno esta em processamento${amountText}.`, severity: 'info' },
        PAYMENT_REFUND_DENIED: { title: 'Estorno negado', message: `A Asaas negou uma solicitacao de estorno${amountText}.`, severity: 'destructive', priority: 'high', requiresAction: true, nativePushEligible: true },
        PAYMENT_RECEIVED_IN_CASH_UNDONE: { title: 'Baixa em dinheiro desfeita', message: `Uma baixa manual de pagamento foi desfeita${amountText}.`, severity: 'warning', priority: 'high', requiresAction: true },
        PAYMENT_AWAITING_RISK_ANALYSIS: { title: 'Pagamento em analise de risco', message: `Uma cobranca entrou em analise de risco${amountText}.`, severity: 'warning', priority: 'high', requiresAction: true },
        PAYMENT_APPROVED_BY_RISK_ANALYSIS: { title: 'Analise de risco aprovada', message: `Uma cobranca foi aprovada na analise de risco${amountText}.`, severity: 'success' },
        PAYMENT_REPROVED_BY_RISK_ANALYSIS: { title: 'Analise de risco reprovada', message: `Uma cobranca foi reprovada na analise de risco${amountText}.`, severity: 'destructive', priority: 'high', requiresAction: true, nativePushEligible: true },
        PAYMENT_CREDIT_CARD_CAPTURE_REFUSED: { title: 'Cartao recusado', message: `A captura do cartao foi recusada${amountText}.`, severity: 'destructive', priority: 'high', requiresAction: true, nativePushEligible: true },
        PAYMENT_CHARGEBACK_REQUESTED: { title: 'Chargeback solicitado', message: `Uma contestacao foi solicitada${amountText}.`, severity: 'destructive', priority: 'urgent', requiresAction: true, nativePushEligible: true },
        PAYMENT_CHARGEBACK_DISPUTE: { title: 'Chargeback em disputa', message: `Uma contestacao entrou em disputa${amountText}.`, severity: 'destructive', priority: 'urgent', requiresAction: true, nativePushEligible: true },
        PAYMENT_AWAITING_CHARGEBACK_REVERSAL: { title: 'Chargeback aguardando reversao', message: `Uma contestacao aguarda reversao${amountText}.`, severity: 'warning', priority: 'high', requiresAction: true, nativePushEligible: true },
        PAYMENT_DUNNING_REQUESTED: { title: 'Recuperacao de cobranca solicitada', message: `Uma recuperacao de cobranca foi solicitada${amountText}.`, severity: 'info' },
        PAYMENT_DUNNING_RECEIVED: { title: 'Recuperacao de cobranca recebida', message: `Uma recuperacao de cobranca foi recebida${amountText}.`, severity: 'success' },
        PAYMENT_BANK_SLIP_CANCELLED: { title: 'Boleto cancelado', message: `Um boleto foi cancelado${amountText}.`, severity: 'warning', priority: 'high', requiresAction: true },
        PAYMENT_SPLIT_CANCELLED: { title: 'Split cancelado', message: `O split de uma cobranca foi cancelado${amountText}.`, severity: 'warning', priority: 'high', requiresAction: true },
        PAYMENT_SPLIT_DIVERGENCE_BLOCK: { title: 'Divergencia de split bloqueada', message: `Uma divergencia de split bloqueou uma cobranca${amountText}.`, severity: 'destructive', priority: 'high', requiresAction: true, nativePushEligible: true },
        PAYMENT_SPLIT_DIVERGENCE_BLOCK_FINISHED: { title: 'Divergencia de split resolvida', message: `O bloqueio de divergencia de split foi finalizado${amountText}.`, severity: 'success' },
        TRANSFER_DONE: { title: 'Transferencia concluida', message: `Uma transferencia foi concluida${amountText}.`, severity: 'success' },
        TRANSFER_FAILED: { title: 'Transferencia falhou', message: `Uma transferencia falhou${amountText}.`, severity: 'destructive', priority: 'high', requiresAction: true, nativePushEligible: true },
        TRANSFER_CANCELLED: { title: 'Transferencia cancelada', message: `Uma transferencia foi cancelada${amountText}.`, severity: 'warning', priority: 'high', requiresAction: true },
        TRANSFER_BLOCKED: { title: 'Transferencia bloqueada', message: `Uma transferencia foi bloqueada pela Asaas${amountText}.`, severity: 'destructive', priority: 'high', requiresAction: true, nativePushEligible: true },
        BILL_PAID: { title: 'Conta paga', message: `Um pagamento de conta foi confirmado${amountText}.`, severity: 'success' },
        BILL_FAILED: { title: 'Pagamento de conta falhou', message: `Um pagamento de conta falhou${amountText}.`, severity: 'destructive', priority: 'high', requiresAction: true, nativePushEligible: true },
        BILL_CANCELLED: { title: 'Pagamento de conta cancelado', message: `Um pagamento de conta foi cancelado${amountText}.`, severity: 'warning', priority: 'high', requiresAction: true },
        BILL_REFUNDED: { title: 'Pagamento de conta estornado', message: `Um pagamento de conta foi estornado${amountText}.`, severity: 'warning', priority: 'high', requiresAction: true },
        RECEIVABLE_ANTICIPATION_CREDITED: { title: 'Antecipacao creditada', message: `Uma antecipacao foi creditada${amountText}.`, severity: 'success' },
        RECEIVABLE_ANTICIPATION_DENIED: { title: 'Antecipacao negada', message: `Uma antecipacao foi negada${amountText}.`, severity: 'destructive', priority: 'high', requiresAction: true, nativePushEligible: true },
        RECEIVABLE_ANTICIPATION_OVERDUE: { title: 'Antecipacao vencida', message: `Uma antecipacao ficou vencida${amountText}.`, severity: 'warning', priority: 'high', requiresAction: true, nativePushEligible: true },
        INVOICE_AUTHORIZED: { title: 'Nota fiscal autorizada', message: 'Uma NFS-e foi autorizada pela Asaas.', severity: 'success' },
        INVOICE_ERROR: { title: 'Erro na nota fiscal', message: 'A Asaas retornou erro em uma NFS-e.', severity: 'destructive', priority: 'high', requiresAction: true, nativePushEligible: true },
        INVOICE_CANCELLATION_DENIED: { title: 'Cancelamento de NFS-e negado', message: 'A Asaas negou o cancelamento de uma NFS-e.', severity: 'destructive', priority: 'high', requiresAction: true, nativePushEligible: true },
        BALANCE_VALUE_BLOCKED: { title: 'Saldo bloqueado', message: `Um valor foi bloqueado no saldo NeuroFinance${amountText}.`, severity: 'destructive', priority: 'high', requiresAction: true, nativePushEligible: true },
        BALANCE_VALUE_UNBLOCKED: { title: 'Saldo desbloqueado', message: `Um valor foi desbloqueado no saldo NeuroFinance${amountText}.`, severity: 'success' },
        PIX_AUTOMATIC_RECURRING_AUTHORIZATION_REFUSED: { title: 'Pix Automatico recusado', message: 'Uma autorizacao de Pix Automatico foi recusada pelo banco.', severity: 'destructive', priority: 'high', requiresAction: true, nativePushEligible: true },
        PIX_AUTOMATIC_RECURRING_PAYMENT_INSTRUCTION_REFUSED: { title: 'Instrucao Pix recusada', message: 'Uma instrucao de pagamento Pix Automatico foi recusada.', severity: 'destructive', priority: 'high', requiresAction: true, nativePushEligible: true },
        PIX_AUTOMATIC_RECURRING_ELIGIBILITY_UPDATED: { title: 'Elegibilidade Pix atualizada', message: 'A elegibilidade da subconta para Pix Automatico foi atualizada.', severity: 'info' },
    };

    const descriptor = { ...base, ...(table[event] || {}) };

    if (event.startsWith('ACCOUNT_STATUS_')) {
        if (event.endsWith('_REJECTED')) {
            return {
                ...descriptor,
                title: 'Cadastro Asaas requer atencao',
                message: 'A Asaas rejeitou uma etapa de cadastro da subconta NeuroFinance.',
                severity: 'destructive',
                priority: 'high',
                requiresAction: true,
                nativePushEligible: true,
            };
        }
        if (event.endsWith('_APPROVED')) {
            return {
                ...descriptor,
                title: 'Cadastro Asaas aprovado',
                message: 'Uma etapa de cadastro da subconta NeuroFinance foi aprovada.',
                severity: 'success',
            };
        }
        if (event.endsWith('_EXPIRING_SOON') || event.endsWith('_EXPIRED')) {
            return {
                ...descriptor,
                title: 'Dados comerciais precisam de revisao',
                message: 'Os dados comerciais da subconta Asaas precisam ser revisados.',
                severity: 'warning',
                priority: 'high',
                requiresAction: true,
                nativePushEligible: true,
            };
        }
    }

    return descriptor;
}

async function emitAsaasNotification(args: {
    userId?: string | null;
    financialAccountId?: string | null;
    event: string;
    resource: any;
    objectType: string;
    actionUrl?: string;
}) {
    if (!args.userId) return;

    const descriptor = asaasNotificationDescriptor(args.event, args.resource);
    if (!descriptor) return;

    const providerObjectId = String(args.resource?.id || args.resource?.payment || args.resource?.authorization?.id || args.event);
    const amountCents = amountCentsFromResource(args.resource);
    const eventId = `asaas:${args.event}:${providerObjectId}`;
    const { error } = await supabaseAdmin.rpc('emit_user_notification', {
        p_user_id: args.userId,
        p_event_id: eventId,
        p_type: `asaas_${args.event.toLowerCase()}`,
        p_category: 'financeiro',
        p_severity: descriptor.severity,
        p_title: descriptor.title,
        p_message: descriptor.message,
        p_action_url: args.actionUrl || '/financeiro',
        p_priority: descriptor.priority,
        p_data: {
            sourceModule: 'financeiro',
            financeScope: 'neurofinance',
            eventSource: 'asaas_webhook',
            provider: 'asaas',
            asaasEvent: args.event,
            providerObjectId,
            providerObjectType: args.objectType,
            financialAccountId: args.financialAccountId || null,
            subaccountId: args.financialAccountId || null,
            amountCents,
            requiresAction: descriptor.requiresAction,
            nativePushEligible: descriptor.nativePushEligible,
        },
        p_payload: {
            provider: 'asaas',
            objectType: args.objectType,
        },
        p_organization_id: null,
    });

    if (error) {
        console.warn('[asaas-webhook] Failed to emit notification:', error);
    }
}

async function findPaymentByProviderId(paymentId: string, columns = '*'): Promise<any> {
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

async function findPayoutByProviderId(transferId: string, columns = '*'): Promise<any> {
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

async function resolveFinancialAccountForPayment(paymentId: string, webhookAccount?: any) {
    if (webhookAccount?.id && webhookAccount?.user_id) return webhookAccount;

    const payment = await findPaymentByProviderId(
        paymentId,
        'financial_account_id,user_id'
    );
    if (!payment?.financial_account_id) return null;

    const { data, error } = await supabaseAdmin
        .from('financial_accounts')
        .select('*')
        .eq('id', payment.financial_account_id)
        .maybeSingle();
    if (error) throw error;
    return data;
}

async function handlePaymentEvent(payment: any, event: string, webhookAccount?: any) {
    if (!payment?.id) return;

    const financialAccount = await resolveFinancialAccountForPayment(
        payment.id,
        webhookAccount
    );

    if (!financialAccount) {
        console.warn(`[asaas-webhook] Account not found for payment ${payment.id}`);
        return;
    }

    const nbPayment = await upsertPaymentFromProvider(
        financialAccount,
        payment,
        event
    );
    if (!nbPayment) return;

    const state = normalizePaymentState(payment, event);
    const actualFee = Number(nbPayment.actual_fee_amount || 0);
    const grossAmount = Number(nbPayment.gross_amount || 0);

    if (state.fundsStatus === 'available' && actualFee > 0) {
        await upsertAccountMovement({
            userId: financialAccount.user_id,
            financialAccountId: financialAccount.id,
            movementType: 'payment_fee',
            direction: 'debit',
            amount: actualFee,
            description: 'Tarifa da cobrança',
            referenceType: 'payment',
            referenceId: payment.id,
            occurredAt: payment.paymentDate || new Date().toISOString(),
            metadata: { source: 'webhook', event },
        });
    }

    if (state.fundsStatus === 'refunded') {
        await upsertAccountMovement({
            userId: financialAccount.user_id,
            financialAccountId: financialAccount.id,
            movementType: 'refund',
            direction: 'debit',
            amount: Math.round(Number(payment.refundedValue || payment.value || 0) * 100),
            description: 'Estorno de cobrança',
            referenceType: 'payment',
            referenceId: payment.id,
            occurredAt: new Date().toISOString(),
            metadata: { source: 'webhook', event },
        });
    }

    if (state.fundsStatus === 'chargeback') {
        await upsertAccountMovement({
            userId: financialAccount.user_id,
            financialAccountId: financialAccount.id,
            movementType: 'chargeback',
            direction: 'debit',
            amount: grossAmount,
            description: 'Contestação de pagamento',
            referenceType: 'payment',
            referenceId: payment.id,
            occurredAt: new Date().toISOString(),
            metadata: { source: 'webhook', event },
        });
    }

    await refreshOverviewSnapshot(financialAccount.id);
    await touchFinancialAccountEvent(financialAccount.id, event);
    await syncFinancialEntryForPayment(nbPayment, {
        matchedBy: 'automatic',
        notes: `Webhook Asaas: ${event}`,
    });

    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
        await tryScheduleAutomaticInvoice(nbPayment, payment);
    }

    await emitAsaasNotification({
        userId: financialAccount.user_id,
        financialAccountId: financialAccount.id,
        event,
        resource: payment,
        objectType: 'payment',
        actionUrl: '/financeiro?tab=neurofinance',
    });

    console.log(`[asaas-webhook] Payment synchronized (${event}): ${nbPayment.id}`);
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

function normalizeAnticipationStatus(status: string) {
    const value = String(status || '').toUpperCase();
    if (['CREDITED', 'APPROVED', 'DONE'].includes(value)) return 'credited';
    if (['DENIED', 'REFUSED', 'REJECTED'].includes(value)) return 'denied';
    if (['CANCELLED', 'CANCELED'].includes(value)) return 'cancelled';
    if (value === 'DEBITED') return 'debited';
    if (value === 'OVERDUE') return 'overdue';
    if (value === 'SCHEDULED') return 'scheduled';
    return 'pending';
}

async function handleReceivableAnticipationEvent(anticipation: any, event: string, webhookAccount?: any) {
    if (!anticipation?.id) return;

    let financialAccount = webhookAccount;
    const providerPaymentId = anticipation.payment || anticipation.paymentId;
    let localPayment: any = null;

    if (providerPaymentId) {
        localPayment = await findPaymentByProviderId(providerPaymentId, 'id, user_id, financial_account_id, provider_payment_id');
        if (!financialAccount && localPayment?.financial_account_id) {
            const { data, error } = await supabaseAdmin
                .from('financial_accounts')
                .select('*')
                .eq('id', localPayment.financial_account_id)
                .maybeSingle();
            if (error) throw error;
            financialAccount = data;
        }
    }

    if (!financialAccount) {
        console.warn(`[asaas-webhook] Account not found for anticipation ${anticipation.id}`);
        return;
    }

    const normalizedStatus = normalizeAnticipationStatus(anticipation.status);
    const netAmount = Math.round(Number(anticipation.netValue || anticipation.anticipatedValue || anticipation.value || 0) * 100);

    await supabaseAdmin
        .from('neurofinance_anticipations')
        .upsert({
            user_id: financialAccount.user_id,
            financial_account_id: financialAccount.id,
            provider: 'asaas',
            provider_anticipation_id: anticipation.id,
            provider_status: anticipation.status || null,
            normalized_status: normalizedStatus,
            payment_id: localPayment?.id || null,
            provider_payment_id: providerPaymentId || null,
            installment_id: anticipation.installment || anticipation.installmentId || null,
            gross_amount: Math.round(Number(anticipation.totalValue || anticipation.value || 0) * 100),
            anticipated_amount: Math.round(Number(anticipation.anticipatedValue || anticipation.value || 0) * 100),
            fee_amount: Math.round(Number(anticipation.fee || anticipation.anticipationFee || 0) * 100),
            net_amount: netAmount,
            anticipation_days: Number(anticipation.anticipationDays || 0) || null,
            anticipation_date: anticipation.anticipationDate || null,
            due_date: anticipation.dueDate || null,
            requested_at: anticipation.dateCreated || new Date().toISOString(),
            credited_at: anticipation.creditedDate || null,
            documents_required: Boolean(anticipation.isDocumentationRequired),
            denial_observation: anticipation.denialObservation || null,
            provider_payload: anticipation,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'provider,provider_anticipation_id' });

    if (providerPaymentId && ['scheduled', 'credited'].includes(normalizedStatus)) {
        await supabaseAdmin
            .from('nb_payments')
            .update({ anticipated: true, updated_at: new Date().toISOString() })
            .eq('provider_payment_id', providerPaymentId);
    }

    if (normalizedStatus === 'credited' && netAmount > 0) {
        await upsertAccountMovement({
            userId: financialAccount.user_id,
            financialAccountId: financialAccount.id,
            movementType: 'anticipation_credit',
            direction: 'credit',
            amount: netAmount,
            description: 'Antecipação creditada',
            referenceType: 'anticipation',
            referenceId: anticipation.id,
            occurredAt: anticipation.creditedDate || new Date().toISOString(),
            metadata: { source: 'webhook', event },
        });
    }

    if (normalizedStatus === 'debited' && netAmount > 0) {
        await upsertAccountMovement({
            userId: financialAccount.user_id,
            financialAccountId: financialAccount.id,
            movementType: 'anticipation_debit',
            direction: 'debit',
            amount: netAmount,
            description: 'Débito de antecipação',
            referenceType: 'anticipation',
            referenceId: anticipation.id,
            occurredAt: new Date().toISOString(),
            metadata: { source: 'webhook', event },
        });
    }

    await refreshOverviewSnapshot(financialAccount.id);
    await touchFinancialAccountEvent(financialAccount.id, event);
    await emitAsaasNotification({
        userId: financialAccount.user_id,
        financialAccountId: financialAccount.id,
        event,
        resource: anticipation,
        objectType: 'anticipation',
        actionUrl: '/financeiro?tab=neurofinance',
    });
}

async function findBillPaymentByProviderResource(bill: any) {
    if (!bill?.id && !bill?.externalReference) return null;

    let query = supabaseAdmin
        .from('neurofinance_bill_payments')
        .select('*');
    query = bill?.id
        ? query.eq('provider_bill_id', bill.id)
        : query.eq('external_reference', bill.externalReference);

    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return data;
}

async function handleBillEvent(bill: any, event: string) {
    const record = await findBillPaymentByProviderResource(bill);
    if (!record) {
        console.warn(`[asaas-webhook] Bill payment not found: ${bill?.id || bill?.externalReference || event}`);
        return;
    }

    const providerStatus = String(bill?.status || event.replace(/^BILL_/, '')).toUpperCase();
    const scheduleDate = bill?.scheduleDate || record.scheduled_date;
    const status = normalizeBillPaymentStatus(providerStatus, scheduleDate, dateInTimeZone());
    const receiptUrl = bill?.transactionReceiptUrl ||
        bill?.receiptUrl ||
        record.receipt_url ||
        null;
    const failureMessage = Array.isArray(bill?.failReasons)
        ? bill.failReasons.map((reason: any) => reason?.description || reason?.message || String(reason)).join('; ')
        : bill?.failReasons
            ? String(bill.failReasons)
            : null;

    const providerPayload = {
        ...(record.provider_payload || {}),
        execution: bill || record.provider_payload?.execution || {},
        latestWebhook: {
            event,
            receivedAt: new Date().toISOString(),
            bill: bill || {},
        },
    };

    const { error } = await supabaseAdmin
        .from('neurofinance_bill_payments')
        .update({
            provider_status: providerStatus,
            status,
            amount: bill?.value != null
                ? Math.round(Number(bill.value || 0) * 100)
                : Number(record.amount || 0),
            fee_amount: bill?.fee != null
                ? Math.round(Number(bill.fee || 0) * 100)
                : Number(record.fee_amount || 0),
            due_date: bill?.dueDate || record.due_date,
            scheduled_date: scheduleDate,
            payment_date: bill?.paymentDate || record.payment_date,
            paid_at: status === 'paid' ? record.paid_at || new Date().toISOString() : record.paid_at,
            can_be_cancelled: bill?.canBeCancelled == null
                ? record.can_be_cancelled
                : Boolean(bill.canBeCancelled),
            receipt_url: receiptUrl,
            provider_payload: providerPayload,
            error_code: status === 'failed' ? event : null,
            error_message: status === 'failed' ? failureMessage || 'Pagamento não confirmado pela instituição.' : null,
            updated_at: new Date().toISOString(),
        })
        .eq('id', record.id);
    if (error) throw error;

    await refreshOverviewSnapshot(record.financial_account_id);
    await touchFinancialAccountEvent(record.financial_account_id, event);
    await emitAsaasNotification({
        userId: record.user_id,
        financialAccountId: record.financial_account_id,
        event,
        resource: bill,
        objectType: 'bill',
        actionUrl: '/financeiro?tab=neurofinance',
    });
    console.log(`[asaas-webhook] Bill synchronized (${event}): ${record.id}`);
}

async function updateSecureOutgoingTransfer(transfer: any, values: Record<string, unknown>) {
    const { data: request, error: findError } = await supabaseAdmin
        .from('neurofinance_outgoing_requests')
        .select('id, provider_payload')
        .eq('provider_operation_id', transfer.id)
        .maybeSingle();
    if (findError) throw findError;
    if (!request) return;

    const { error } = await supabaseAdmin
        .from('neurofinance_outgoing_requests')
        .update({
            ...values,
            provider_payload: {
                ...(request.provider_payload || {}),
                latestWebhook: transfer,
            },
            updated_at: new Date().toISOString(),
        })
        .eq('id', request.id);
    if (error) throw error;
}

async function handleTransferPending(transfer: any, event = 'TRANSFER_PENDING') {
    if (!transfer?.id) return;

    const payout = await findPayoutByProviderId(transfer.id, 'id,user_id,financial_account_id');

    if (!payout) {
        console.log(`[asaas-webhook] Transfer not found in nb_payouts: ${transfer.id}`);
        return;
    }

    await supabaseAdmin
        .from('nb_payouts')
        .update({
            status: 'in_transit',
            provider_status: String(transfer.status || 'PENDING').toUpperCase(),
            provider_payout_id: transfer.id,
            receipt_url: transfer.transactionReceiptUrl || null,
            provider_payload: transfer,
            updated_at: new Date().toISOString(),
        })
        .eq('id', payout.id);

    await updateSecureOutgoingTransfer(transfer, {
        status: 'in_transit',
        provider_status: String(transfer.status || 'PENDING').toUpperCase(),
        receipt_url: transfer.transactionReceiptUrl || null,
    });

    await touchFinancialAccountEvent(payout.financial_account_id, event);
    await emitAsaasNotification({
        userId: payout.user_id,
        financialAccountId: payout.financial_account_id,
        event,
        resource: transfer,
        objectType: 'transfer',
        actionUrl: '/financeiro?tab=neurofinance',
    });
}

async function handleTransferDone(transfer: any) {
    if (!transfer?.id) return;

    const payout = await findPayoutByProviderId(transfer.id);

    if (!payout) return;

    await supabaseAdmin
        .from('nb_payouts')
        .update({
            status: 'paid',
            provider_status: 'DONE',
            provider_payout_id: transfer.id,
            processed_at: new Date().toISOString(),
            completed_at: transfer.effectiveDate || transfer.confirmedDate || new Date().toISOString(),
            fee_amount: transfer.transferFee != null
                ? Math.round(Number(transfer.transferFee || 0) * 100)
                : Number(payout.fee_amount || 0),
            receipt_url: transfer.transactionReceiptUrl || payout.receipt_url || null,
            provider_payload: transfer,
            reconciliation_status: 'reconciled',
            reconciled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq('id', payout.id);

    await updateSecureOutgoingTransfer(transfer, {
        status: 'paid',
        provider_status: 'DONE',
        receipt_url: transfer.transactionReceiptUrl || payout.receipt_url || null,
        completed_at: transfer.effectiveDate || transfer.confirmedDate || new Date().toISOString(),
    });

    await upsertAccountMovement({
        userId: payout.user_id,
        financialAccountId: payout.financial_account_id,
        movementType: 'transfer',
        direction: 'debit',
        amount: Number(payout.amount || Math.round(Number(transfer.value || 0) * 100)),
        description: payout.destination_summary || 'Transferência concluída',
        referenceType: 'payout',
        referenceId: transfer.id,
        occurredAt: transfer.effectiveDate || transfer.confirmedDate || new Date().toISOString(),
        metadata: { source: 'webhook', event: 'TRANSFER_DONE' },
    });

    const transferFee = Math.round(Number(transfer.transferFee || 0) * 100);
    if (transferFee > 0) {
        await upsertAccountMovement({
            userId: payout.user_id,
            financialAccountId: payout.financial_account_id,
            movementType: 'transfer_fee',
            direction: 'debit',
            amount: transferFee,
            description: 'Tarifa da transferência',
            referenceType: 'payout',
            referenceId: transfer.id,
            occurredAt: transfer.effectiveDate || transfer.confirmedDate || new Date().toISOString(),
            metadata: { source: 'webhook', event: 'TRANSFER_DONE' },
        });
    }

    await refreshOverviewSnapshot(payout.financial_account_id);
    await touchFinancialAccountEvent(payout.financial_account_id, 'TRANSFER_DONE');
    await emitAsaasNotification({
        userId: payout.user_id,
        financialAccountId: payout.financial_account_id,
        event: 'TRANSFER_DONE',
        resource: transfer,
        objectType: 'transfer',
        actionUrl: '/financeiro?tab=neurofinance',
    });

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
            provider_status: event === 'TRANSFER_CANCELLED' ? 'CANCELLED' : 'FAILED',
            provider_payout_id: transfer.id,
            provider_payload: transfer,
            error_message: transfer.failReason || transfer.refusalReason || null,
            updated_at: new Date().toISOString(),
        })
        .eq('id', payout.id);

    await updateSecureOutgoingTransfer(transfer, {
        status,
        provider_status: event === 'TRANSFER_CANCELLED' ? 'CANCELLED' : 'FAILED',
        error_message: transfer.failReason || transfer.refusalReason || null,
    });

    await touchFinancialAccountEvent(payout.financial_account_id, event);
    await emitAsaasNotification({
        userId: payout.user_id,
        financialAccountId: payout.financial_account_id,
        event,
        resource: transfer,
        objectType: 'transfer',
        actionUrl: '/financeiro?tab=neurofinance',
    });

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

    const accountStatus = normalizeAsaasAccountStatusPayload(accountStatusPayload);
    await syncFinancialAccountFromAsaas(financialAccount.id, accountStatus, 'webhook');
    await touchFinancialAccountEvent(financialAccount.id, event);
    await emitAsaasNotification({
        userId: financialAccount.user_id,
        financialAccountId: financialAccount.id,
        event,
        resource: accountStatusPayload,
        objectType: 'account_status',
        actionUrl: '/financeiro?tab=neurofinance',
    });

    console.log(`[asaas-webhook] Account status synced (${event}): ${financialAccount.id}`);
}

async function handleGenericAsaasEvent(body: any, resource: any, event: string, webhookAccount?: any) {
    if (ADMIN_ONLY_ASAAS_EVENTS.has(event)) {
        console.log(`[asaas-webhook] Admin-only event ignored for psychologist notifications: ${event}`);
        return;
    }

    if (!webhookAccount?.user_id) {
        console.log(`[asaas-webhook] Generic event without linked account: ${event}`);
        return;
    }

    await touchFinancialAccountEvent(webhookAccount.id, event);
    await emitAsaasNotification({
        userId: webhookAccount.user_id,
        financialAccountId: webhookAccount.id,
        event,
        resource: resource || body,
        objectType: inferProviderObjectType(body),
        actionUrl: '/financeiro?tab=neurofinance',
    });
}
