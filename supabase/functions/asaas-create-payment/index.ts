/**
 * asaas-create-payment
 *
 * Creates a charge (cobrança) via Asaas API on the psychologist's sub-account.
 * Supports PIX, BOLETO, CREDIT_CARD, and UNDEFINED (customer chooses).
 *
 * POST /asaas-create-payment
 * Body: {
 *   patient_id?: string,
 *   appointment_id?: string,
 *   amount: number,           // in centavos
 *   payment_method: 'pix' | 'card' | 'boleto' | 'undefined',
 *   description?: string,
 *   due_date?: string,        // YYYY-MM-DD (default: today)
 *   patient_name?: string,
 *   patient_cpf?: string,
 *   patient_email?: string,
 * }
 */

import {
    supabaseAdmin,
    corsResponse,
    jsonResponse,
    errorResponse,
    getAuthenticatedUser,
    getFinancialAccount,
    createAsaasPayment,
    getAsaasPixQrCode,
    findOrCreateAsaasCustomer,
    calculateFees,
    createLedgerEntries,
    getFinancialAccountAsaasApiKey,
    ASAAS_ENV,
    type AsaasBillingType,
} from '../_shared/asaas-client.ts';

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
        const body = await req.json();

        const {
            patient_id,
            appointment_id,
            amount,           // centavos
            payment_method,
            payment_methods,  // array from frontend
            description,
            due_date,
            patient_name,
            patient_cpf,
            patient_email,
        } = body;

        // Resolve payment method: accept both singular and array
        const resolvedMethod = payment_method
            || (Array.isArray(payment_methods) ? payment_methods[0] : null)
            || 'pix';

        console.log('[asaas-create-payment] user_id:', user.id, 'amount:', amount, 'method:', resolvedMethod);

        if (!amount || amount <= 0) {
            return errorResponse('Valor inválido', 400);
        }

        // 1. Get financial account
        const financialAccount = await getFinancialAccount(user.id);
        console.log('[asaas-create-payment] financialAccount found:', !!financialAccount, 'id:', financialAccount?.id);

        // Typed column is authoritative; metadata is a legacy fallback.
        const subApiKey = getFinancialAccountAsaasApiKey(financialAccount);

        if (!financialAccount || !subApiKey) {
            console.error('[asaas-create-payment] No API key found for financial account:', financialAccount?.id);
            return errorResponse('Conta financeira não configurada. Complete o onboarding primeiro.', 403);
        }

        // 2. Find or create customer in Asaas subconta
        let patientData = {
            name: patient_name || 'Paciente',
            cpfCnpj: patient_cpf || '',
            email: patient_email,
            externalReference: patient_id || undefined,
        };

        // If patient_id provided, enrich from DB
        if (patient_id && (!patient_name || !patient_cpf)) {
            const { data: patient } = await supabaseAdmin
                .from('patients')
                .select('name, cpf, email')
                .eq('id', patient_id)
                .maybeSingle();

            if (patient) {
                patientData.name = patient.name || patientData.name;
                patientData.cpfCnpj = patient.cpf || patientData.cpfCnpj;
                patientData.email = patient.email || patientData.email;
            }
        }

        const asaasCustomer = await findOrCreateAsaasCustomer(subApiKey, {
            name: patientData.name,
            cpfCnpj: patientData.cpfCnpj,
            email: patientData.email,
            externalReference: patient_id,
        });

        // 3. Map billing type
        const billingType = BILLING_TYPE_MAP[String(resolvedMethod).toLowerCase()] || 'UNDEFINED';

        // 4. Calculate fees
        const { totalFee, netAmount } = calculateFees(amount);
        const valueReais = amount / 100; // Asaas expects R$ not centavos

        // 5. Create payment in Asaas
        const today = new Date().toISOString().split('T')[0];

        const asaasPayment = await createAsaasPayment(subApiKey, {
            customer: asaasCustomer.id,
            billingType,
            value: valueReais,
            dueDate: due_date || today,
            description: description || `Cobrança NeuroBank`,
            externalReference: appointment_id || patient_id || user.id,
        });

        // 6. Get Pix QR code if applicable
        let pixQrCode = null;
        let pixCopyPaste = null;

        if (billingType === 'PIX' && asaasPayment.id) {
            try {
                const qrData = await getAsaasPixQrCode(subApiKey, asaasPayment.id);
                pixQrCode = qrData.encodedImage;   // base64 image
                pixCopyPaste = qrData.payload;      // copy-paste string
            } catch (qrErr) {
                console.error('[asaas-create-payment] QR code fetch error:', qrErr);
            }
        }

        // 7. Store payment in DB
        const { data: paymentRecord, error: insertErr } = await supabaseAdmin
            .from('nb_payments')
            .insert({
                user_id: user.id,
                patient_id: patient_id || null,
                appointment_id: appointment_id || null,
                financial_account_id: financialAccount.id,
                provider: 'asaas',
                provider_payment_id: asaasPayment.id,
                payment_method_type: resolvedMethod === 'undefined' ? null : resolvedMethod,
                status: 'pending',
                gross_amount: amount,
                platform_fee_amount: totalFee,
                net_amount: netAmount,
                currency: 'brl',
                description: description || `Cobrança`,
                pix_qr_code: pixQrCode,
                pix_copy_paste: pixCopyPaste,
                checkout_url: asaasPayment.invoiceUrl,
                expires_at: due_date || null,
                metadata: {
                    asaas_payment_id: asaasPayment.id,
                    asaas_customer_id: asaasCustomer.id,
                    asaas_invoice_url: asaasPayment.invoiceUrl,
                    asaas_bank_slip_url: asaasPayment.bankSlipUrl || null,
                    billing_type: billingType,
                },
            })
            .select()
            .single();

        if (insertErr) throw insertErr;

        // 8. Create pending ledger entries (optional — tables may not exist yet)
        try {
            await createLedgerEntries(user.id, [
                {
                    accountType: 'pending',
                    direction: 'credit',
                    entryType: 'payment_received',
                    amount: amount,
                    status: 'pending',
                    referenceType: 'payment',
                    referenceId: paymentRecord.id,
                    providerObjectId: asaasPayment.id,
                    description: `Cobrança pendente: R$${(amount / 100).toFixed(2)}`,
                },
            ]);
        } catch (ledgerErr) {
            console.warn('[asaas-create-payment] Ledger entry creation skipped (tables may not exist):', ledgerErr);
        }

        return jsonResponse({
            success: true,
            payment_id: paymentRecord.id,
            asaas_payment_id: asaasPayment.id,
            status: 'pending',
            amount: amount,
            checkout_url: asaasPayment.invoiceUrl,
            invoice_url: asaasPayment.invoiceUrl,
            bank_slip_url: asaasPayment.bankSlipUrl || null,
            pix_qr_code: pixQrCode,
            pix_copy_paste: pixCopyPaste,
            billing_type: billingType,
            asaas_environment: ASAAS_ENV,
        });

    } catch (error: any) {
        console.error('asaas-create-payment error:', error);
        return errorResponse(error.message || 'Internal error', 500);
    }
});
