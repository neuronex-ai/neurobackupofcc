/**
 * asaas-connect-onboarding
 *
 * Creates a white-label sub-account (subconta) for a psychologist via Asaas API.
 * Stores the sub-account's `apiKey` and `walletId` in `financial_accounts`.
 * Returns onboarding URL if additional documents are needed.
 *
 * POST /asaas-connect-onboarding
 * Body: {
 *   name: string,
 *   email: string,
 *   cpfCnpj: string,
 *   phone?: string,
 *   mobilePhone?: string,
 *   birthDate?: string,      // YYYY-MM-DD
 *   address?: string,
 *   addressNumber?: string,
 *   complement?: string,
 *   province?: string,
 *   postalCode?: string,
 *   incomeValue?: number,
 *   companyType?: string,
 * }
 */

import {
    supabaseAdmin,
    corsResponse,
    jsonResponse,
    errorResponse,
    getAuthenticatedUser,
    createAsaasSubAccount,
    getAsaasAccountStatus,
    deriveUiStatusFromAsaasAccount,
    upsertFinancialAccountRecord,
    ensureLedgerAccounts,
    sanitizeDigits,
} from '../_shared/asaas-client.ts';

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return corsResponse();

    try {
        const user = await getAuthenticatedUser(req);
        const body = await req.json();

        const {
            name,
            email,
            cpfCnpj,
            phone,
            mobilePhone,
            birthDate,
            address,
            addressNumber,
            complement,
            province,
            postalCode,
            incomeValue,
            companyType,
        } = body;

        if (!name || !email || !cpfCnpj) {
            return errorResponse('name, email e cpfCnpj são obrigatórios', 400);
        }

        // 1. Check if user already has a financial account with Asaas
        const { data: existingAccount } = await supabaseAdmin
            .from('financial_accounts')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

        if (existingAccount?.asaas_account_id) {
            // Already has an Asaas subconta — try to sync status
            try {
                const status = await getAsaasAccountStatus(
                    existingAccount.metadata?.asaas_api_key
                );
                const uiStatus = deriveUiStatusFromAsaasAccount(status);

                return jsonResponse({
                    success: true,
                    already_exists: true,
                    financial_account_id: existingAccount.id,
                    asaas_account_id: existingAccount.asaas_account_id,
                    status: uiStatus,
                    onboarding_url: existingAccount.asaas_onboarding_url,
                    account_status: status,
                });
            } catch (err) {
                console.error('Error syncing existing account:', err);
            }
        }

        // 2. Create sub-account in Asaas
        console.log(`[asaas-connect-onboarding] Creating subconta for user ${user.id}`);

        const subAccount = await createAsaasSubAccount({
            name,
            email,
            cpfCnpj: sanitizeDigits(cpfCnpj),
            phone: sanitizeDigits(phone),
            mobilePhone: sanitizeDigits(mobilePhone),
            birthDate,
            address,
            addressNumber,
            complement,
            province,
            postalCode: sanitizeDigits(postalCode),
            incomeValue,
            companyType,
        });

        console.log(`[asaas-connect-onboarding] Subconta created: ${subAccount.id}, walletId: ${subAccount.walletId}`);

        // 3. Persist in financial_accounts
        const financialAccount = await upsertFinancialAccountRecord(user.id, {
            provider: 'asaas',
            asaas_account_id: subAccount.id,
            asaas_wallet_id: subAccount.walletId,
            asaas_api_key: null, // Don't store in plain column — use metadata
            asaas_onboarding_url: subAccount.onboardingUrl || null,
            status: 'onboarding',
            onboarding_started_at: new Date().toISOString(),
            charges_enabled: false,
            payouts_enabled: false,
            details_submitted: false,
            metadata: {
                asaas_api_key: subAccount.apiKey,
                asaas_wallet_id: subAccount.walletId,
                asaas_account_id: subAccount.id,
                asaas_account_number: subAccount.accountNumber || null,
            },
        });

        // 4. Initialize ledger accounts
        await ensureLedgerAccounts(user.id, financialAccount.id);

        // 5. Create onboarding session record
        await supabaseAdmin
            .from('financial_onboarding_sessions')
            .insert({
                user_id: user.id,
                financial_account_id: financialAccount.id,
                provider: 'asaas',
                provider_account_id: subAccount.id,
                status: 'in_progress',
                onboarding_url: subAccount.onboardingUrl || null,
                started_at: new Date().toISOString(),
            });

        return jsonResponse({
            success: true,
            financial_account_id: financialAccount.id,
            asaas_account_id: subAccount.id,
            wallet_id: subAccount.walletId,
            onboarding_url: subAccount.onboardingUrl,
            status: 'onboarding',
            account_number: subAccount.accountNumber || null,
        });

    } catch (error: any) {
        console.error('asaas-connect-onboarding error:', error);
        return errorResponse(error.message || 'Internal error', 500);
    }
});
