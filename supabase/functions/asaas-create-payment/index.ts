/**
 * asaas-create-payment
 *
 * Creates a charge through the psychologist's Asaas subaccount.
 * Asaas + nb_payments are the operational source of truth; the legacy ledger is not used.
 */

import {
    ASAAS_ENV,
    corsResponse,
    createAsaasPayment,
    errorResponse,
    findOrCreateAsaasCustomer,
    getAsaasPixQrCode,
    getAuthenticatedUser,
    getFinancialAccount,
    getFinancialAccountAsaasApiKey,
    jsonResponse,
    supabaseAdmin,
    type AsaasBillingType,
} from '../_shared/asaas-client.ts';
import {
    estimatePaymentFee,
    normalizePaymentMethod,
    normalizePaymentState,
} from '../_shared/neurofinance-financial.ts';
import { ensureFinancialEntryForCharge } from '../_shared/financial-management.ts';
import {
    requireEntitlementForUser,
    subscriptionAccessErrorResponse,
} from '../_shared/subscription-access.ts';

const BILLING_TYPE_MAP: Record<string, AsaasBillingType> = {
    pix: 'PIX',
    card: 'CREDIT_CARD',
    boleto: 'BOLETO',
    undefined: 'UNDEFINED',
};

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return corsResponse();

    try {
        const user = await getAuthenticatedUser(req);
        await requireEntitlementForUser(
            {
                id: user.id,
                email: user.email,
                user_metadata: user.user_metadata,
            },
            'neurofinance',
        );

        const body = await req.json();

        const {
            patient_id,
            appointment_id,
            amount,
            payment_method,
            payment_methods,
            description,
            due_date,
            patient_name,
            patient_cpf,
            patient_email,
            financial_entry_id,
        } = body;

        const resolvedMethod =
            payment_method ||
            (Array.isArray(payment_methods) ? payment_methods[0] : null) ||
            'pix';

        if (!amount || amount <= 0) {
            return errorResponse('Valor inválido.', 400);
        }

        const financialAccount = await getFinancialAccount(user.id);
        const subApiKey = await getFinancialAccountAsaasApiKey(financialAccount);

        if (!financialAccount || !subApiKey) {
            return errorResponse('Conta financeira não configurada. Complete o onboarding primeiro.', 403);
        }

        let patientData = {
            name: patient_name || 'Paciente',
            cpfCnpj: patient_cpf || '',
            email: patient_email,
            externalReference: patient_id || undefined,
        };

        if (patient_id && (!patient_name || !patient_cpf)) {
            const { data: patient } = await supabaseAdmin
                .from('patients')
                .select('name, cpf, email')
                .eq('id', patient_id)
                .maybeSingle();

            if (patient) {
                patientData = {
                    ...patientData,
                    name: patient.name || patientData.name,
                    cpfCnpj: patient.cpf || patientData.cpfCnpj,
                    email: patient.email || patientData.email,
                };
            }
        }

        const asaasCustomer = await findOrCreateAsaasCustomer(subApiKey, {
            name: patientData.name,
            cpfCnpj: patientData.cpfCnpj,
            email: patientData.email,
            externalReference: patient_id,
        });

        const billingType = BILLING_TYPE_MAP[String(resolvedMethod).toLowerCase()] || 'UNDEFINED';
        const normalizedMethod = normalizePaymentMethod(billingType);
        const feeEstimate = await estimatePaymentFee(amount, normalizedMethod, 1);
        const initialState = normalizePaymentState({ status: 'PENDING' }, 'PAYMENT_CREATED');
        const valueReais = amount / 100;
        const today = new Date().toISOString().split('T')[0];

        const asaasPayment = await createAsaasPayment(subApiKey, {
            customer: asaasCustomer.id,
            billingType,
            value: valueReais,
            dueDate: due_date || today,
            description: description || 'Cobrança NeuroFinance',
            externalReference: appointment_id || patient_id || user.id,
        });

        let pixQrCode = null;
        let pixCopyPaste = null;

        if (billingType === 'PIX' && asaasPayment.id) {
            try {
                const qrData = await getAsaasPixQrCode(subApiKey, asaasPayment.id);
                pixQrCode = qrData.encodedImage;
                pixCopyPaste = qrData.payload;
            } catch (qrErr) {
                console.error('[asaas-create-payment] QR code fetch error:', qrErr);
            }
        }

        const financialEntry = await ensureFinancialEntryForCharge({
            userId: user.id,
            financialEntryId: financial_entry_id || null,
            patientId: patient_id || null,
            appointmentId: appointment_id || null,
            amount,
            description: description || 'Cobranca NeuroFinance',
            dueDate: due_date || today,
            paymentMethod: normalizedMethod,
        });

        const { data: paymentRecord, error: insertErr } = await supabaseAdmin
            .from('nb_payments')
            .insert({
                user_id: user.id,
                patient_id: patient_id || null,
                appointment_id: appointment_id || null,
                financial_entry_id: financialEntry?.id || null,
                financial_account_id: financialAccount.id,
                provider: 'asaas',
                provider_payment_id: asaasPayment.id,
                provider_status: String(asaasPayment.status || 'PENDING').toUpperCase(),
                payment_method_type: normalizedMethod,
                status: initialState.legacyStatus,
                normalized_status: initialState.normalizedStatus,
                funds_status: initialState.fundsStatus,
                gross_amount: amount,
                platform_fee_amount: feeEstimate.estimatedFee || 0,
                estimated_fee_amount: feeEstimate.estimatedFee,
                actual_fee_amount: null,
                net_amount: feeEstimate.netAmount ?? amount,
                fee_rule_id: feeEstimate.feeRuleId,
                installments: 1,
                channel: 'online',
                reconciliation_status: 'estimated',
                currency: 'brl',
                description: description || 'Cobrança',
                pix_qr_code: pixQrCode,
                pix_copy_paste: pixCopyPaste,
                checkout_url: asaasPayment.invoiceUrl,
                expires_at: due_date || null,
                metadata: {
                    financial_entry_id: financialEntry?.id || null,
                    asaas_payment_id: asaasPayment.id,
                    asaas_customer_id: asaasCustomer.id,
                    asaas_invoice_url: asaasPayment.invoiceUrl,
                    asaas_bank_slip_url: asaasPayment.bankSlipUrl || null,
                    billing_type: billingType,
                    source: 'neurofinance',
                },
            })
            .select()
            .single();

        if (insertErr) throw insertErr;

        if (financialEntry?.id) {
            const { error: entryLinkError } = await supabaseAdmin
                .from('financial_entries')
                .update({
                    neurofinance_charge_id: paymentRecord.id,
                    idempotency_key: financialEntry.idempotency_key || `neurofinance:charge:${paymentRecord.id}`,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', financialEntry.id);

            if (entryLinkError) throw entryLinkError;
        }

        return jsonResponse({
            success: true,
            payment_id: paymentRecord.id,
            financial_entry_id: financialEntry?.id || null,
            asaas_payment_id: asaasPayment.id,
            status: 'pending',
            amount,
            checkout_url: asaasPayment.invoiceUrl,
            invoice_url: asaasPayment.invoiceUrl,
            bank_slip_url: asaasPayment.bankSlipUrl || null,
            pix_qr_code: pixQrCode,
            pix_copy_paste: pixCopyPaste,
            billing_type: billingType,
            asaas_environment: ASAAS_ENV,
        });
    } catch (error: any) {
        const accessResponse = subscriptionAccessErrorResponse(error);
        if (accessResponse) return accessResponse;

        console.error('asaas-create-payment error:', error);
        return errorResponse(
            'Não foi possível criar a cobrança agora. Confira os dados e tente novamente.',
            error?.status || 500,
            { code: 'PAYMENT_CREATE_UNAVAILABLE' }
        );
    }
});
