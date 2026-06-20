import {
    asaasRequest,
    corsResponse,
    errorResponse,
    getAuthenticatedUser,
    getFinancialAccount,
    getFinancialAccountAsaasApiKey,
    jsonResponse,
    recordBaasOperation,
    supabaseAdmin,
} from '../_shared/asaas-client.ts';
import {
    authorizeAsaasInvoice,
    buildAsaasInvoicePayload,
    createAndAuthorizeAsaasInvoice,
    fetchAsaasInvoice,
    persistAsaasInvoiceState,
} from '../_shared/asaas-nfse.ts';

const requiredFiscalString = (value: unknown) => String(value || '').trim();

function fiscalInfoToFormData(input: Record<string, any>) {
    const email = requiredFiscalString(input.email || input.fiscal_email);
    if (!email) throw new Error('Email fiscal e obrigatorio para configurar NFS-e na Asaas.');

    const form = new FormData();
    form.append('email', email);
    form.append('simplesNacional', String(input.simplesNacional ?? input.simples_nacional ?? true));

    const optionalFields: Record<string, unknown> = {
        municipalInscription: input.municipalInscription || input.municipal_inscription,
        culturalProjectsPromoter: input.culturalProjectsPromoter ?? input.cultural_projects_promoter,
        cnae: input.cnae,
        specialTaxRegime: input.specialTaxRegime || input.special_tax_regime,
        serviceListItem: input.serviceListItem || input.service_list_item,
        nbsCode: input.nbsCode || input.nbs_code,
        rpsSerie: input.rpsSerie || input.rps_serie,
        rpsNumber: input.rpsNumber || input.rps_number,
        loteNumber: input.loteNumber || input.lote_number,
        username: input.username,
        password: input.password,
        accessToken: input.accessToken || input.access_token,
        certificatePassword: input.certificatePassword || input.certificate_password,
        nationalPortalTaxCalculationRegime: input.nationalPortalTaxCalculationRegime || input.national_portal_tax_calculation_regime,
    };

    for (const [key, value] of Object.entries(optionalFields)) {
        if (value !== undefined && value !== null && value !== '') {
            form.append(key, String(value));
        }
    }

    if (input.certificateFileBase64) {
        const base64 = String(input.certificateFileBase64).replace(/^data:.*?;base64,/, '');
        const binary = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
        const file = new File([binary], input.certificateFilename || 'certificate.pfx', {
            type: input.certificateMimeType || 'application/x-pkcs12',
        });
        form.append('certificateFile', file);
    }

    return form;
}

async function getFiscalSettings(userId: string) {
    const { data, error } = await supabaseAdmin
        .from('user_fiscal_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
    if (error) throw error;
    return data || {};
}

async function findLocalPayment(userId: string, idOrProviderId?: string | null) {
    if (!idOrProviderId) return null;

    const byId = await supabaseAdmin
        .from('nb_payments')
        .select('*')
        .eq('id', idOrProviderId)
        .eq('user_id', userId)
        .maybeSingle();
    if (byId.error) throw byId.error;
    if (byId.data) return byId.data;

    const byProvider = await supabaseAdmin
        .from('nb_payments')
        .select('*')
        .eq('provider', 'asaas')
        .eq('provider_payment_id', idOrProviderId)
        .eq('user_id', userId)
        .maybeSingle();
    if (byProvider.error) throw byProvider.error;
    return byProvider.data;
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return corsResponse();

    try {
        const user = await getAuthenticatedUser(req);
        const body = await req.json().catch(() => ({}));
        const action = body.action || 'list';
        const account = await getFinancialAccount(user.id);
        const apiKey = getFinancialAccountAsaasApiKey(account);

        if (!account || !apiKey) return errorResponse('Conta financeira nao configurada.', 403);

        if (action === 'list') {
            const result = await asaasRequest('/invoices?limit=100&offset=0', 'GET', undefined, apiKey);
            return jsonResponse({ success: true, ...(result as Record<string, unknown>) });
        }

        if (action === 'fiscal_info') {
            const result = await asaasRequest('/fiscalInfo/', 'GET', undefined, apiKey);
            await supabaseAdmin
                .from('user_fiscal_settings')
                .update({
                    asaas_fiscal_info: result,
                    asaas_last_sync_at: new Date().toISOString(),
                    asaas_last_sync_error: null,
                })
                .eq('user_id', user.id);
            return jsonResponse({ success: true, fiscalInfo: result });
        }

        if (action === 'municipal_options') {
            const result = await asaasRequest('/fiscalInfo/municipalOptions', 'GET', undefined, apiKey);
            await supabaseAdmin
                .from('user_fiscal_settings')
                .update({
                    asaas_municipal_options: result,
                    asaas_last_sync_at: new Date().toISOString(),
                    asaas_last_sync_error: null,
                })
                .eq('user_id', user.id);
            return jsonResponse({ success: true, municipalOptions: result });
        }

        if (action === 'municipal_services') {
            const params = new URLSearchParams({
                limit: String(Math.min(Number(body.limit || 100), 100)),
                offset: String(Math.max(Number(body.offset || 0), 0)),
            });
            if (body.description) params.set('description', String(body.description));
            const result = await asaasRequest(`/fiscalInfo/services?${params.toString()}`, 'GET', undefined, apiKey);
            return jsonResponse({ success: true, ...(result as Record<string, unknown>) });
        }

        if (action === 'save_fiscal_info') {
            const fiscalInfo = body.fiscalInfo || body;
            const form = fiscalInfoToFormData(fiscalInfo);
            const result = await asaasRequest('/fiscalInfo/', 'POST', form, apiKey);
            await supabaseAdmin
                .from('user_fiscal_settings')
                .upsert({
                    user_id: user.id,
                    fiscal_email: fiscalInfo.email || fiscalInfo.fiscal_email || null,
                    municipal_inscription: fiscalInfo.municipalInscription || fiscalInfo.municipal_inscription || null,
                    simples_nacional: fiscalInfo.simplesNacional ?? fiscalInfo.simples_nacional ?? true,
                    cultural_projects_promoter: fiscalInfo.culturalProjectsPromoter ?? fiscalInfo.cultural_projects_promoter ?? false,
                    cnae: fiscalInfo.cnae || null,
                    special_tax_regime: fiscalInfo.specialTaxRegime || fiscalInfo.special_tax_regime || null,
                    service_list_item: fiscalInfo.serviceListItem || fiscalInfo.service_list_item || null,
                    nbs_code: fiscalInfo.nbsCode || fiscalInfo.nbs_code || null,
                    rps_serie: fiscalInfo.rpsSerie || fiscalInfo.rps_serie || null,
                    rps_number: fiscalInfo.rpsNumber || fiscalInfo.rps_number || null,
                    fiscal_provider: 'asaas',
                    asaas_fiscal_info: result,
                    asaas_last_sync_at: new Date().toISOString(),
                    asaas_last_sync_error: null,
                }, { onConflict: 'user_id' });
            return jsonResponse({ success: true, fiscalInfo: result });
        }

        if (action === 'create') {
            const localPayment = await findLocalPayment(user.id, body.localPaymentId || body.paymentRecordId || body.payment);
            const settings = await getFiscalSettings(user.id);
            const providerPaymentId = body.payment || localPayment?.provider_payment_id || localPayment?.metadata?.asaas_payment_id;

            if (!providerPaymentId && !body.customer && !body.installment) {
                return errorResponse('Pagamento, cliente ou parcelamento Asaas e obrigatorio para emitir NFS-e.', 400);
            }

            const payload = buildAsaasInvoicePayload({
                ...body,
                payment: providerPaymentId || undefined,
                value: body.value ?? (localPayment?.gross_amount != null ? Number(localPayment.gross_amount) / 100 : undefined),
                serviceDescription: body.serviceDescription || localPayment?.description,
                externalReference: body.externalReference || localPayment?.id || providerPaymentId,
            }, settings);

            const result = await createAndAuthorizeAsaasInvoice({
                apiKey,
                payload,
                authorize: body.authorize !== false,
                userId: user.id,
                financialAccountId: account.id,
                nbPaymentId: localPayment?.id || null,
                providerPaymentId: providerPaymentId || null,
                legacyInvoiceId: localPayment?.metadata?.invoice_id || body.legacyInvoiceId || null,
            });

            await recordBaasOperation(user.id, account.id, 'nfse_create', result.invoice, {
                amount: Number(payload.value) || undefined,
                description: String(payload.serviceDescription || ''),
                payload,
            });

            return jsonResponse({ success: true, scheduledInvoice: result.scheduled, invoice: result.invoice });
        }

        if (action === 'authorize') {
            if (!body.id) return errorResponse('ID da NFS-e e obrigatorio.', 400);
            const result = await authorizeAsaasInvoice(apiKey, String(body.id));
            const localPayment = await findLocalPayment(user.id, body.localPaymentId || body.paymentRecordId || result.payment);
            await persistAsaasInvoiceState({
                userId: user.id,
                financialAccountId: account.id,
                nbPaymentId: localPayment?.id || null,
                providerPaymentId: result.payment || localPayment?.provider_payment_id || null,
                legacyInvoiceId: localPayment?.metadata?.invoice_id || body.legacyInvoiceId || null,
                invoice: result,
            });
            await recordBaasOperation(user.id, account.id, 'nfse_authorize', result, { payload: { id: body.id } });
            return jsonResponse({ success: true, invoice: result });
        }

        if (action === 'sync') {
            if (!body.id) return errorResponse('ID da NFS-e e obrigatorio.', 400);
            const result = await fetchAsaasInvoice(apiKey, String(body.id));
            const localPayment = await findLocalPayment(user.id, body.localPaymentId || body.paymentRecordId || result.payment);
            await persistAsaasInvoiceState({
                userId: user.id,
                financialAccountId: account.id,
                nbPaymentId: localPayment?.id || null,
                providerPaymentId: result.payment || localPayment?.provider_payment_id || null,
                legacyInvoiceId: localPayment?.metadata?.invoice_id || body.legacyInvoiceId || null,
                invoice: result,
            });
            return jsonResponse({ success: true, invoice: result });
        }

        return errorResponse('Acao fiscal nao suportada.', 400);
    } catch (error: any) {
        console.error('asaas-invoices error:', error);
        return errorResponse(error?.message || 'Erro ao processar NFS-e.', error?.status || 500);
    }
});
