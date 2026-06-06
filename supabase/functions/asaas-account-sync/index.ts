/**
 * asaas-account-sync
 *
 * Synchronizes a psychologist's Asaas sub-account status with the DB.
 * Retrieves account status + balance from Asaas API, updates financial_accounts.
 *
 * If no local record exists, it tries to discover an existing subconta
 * on Asaas by the user's email and auto-link it.
 *
 * POST /asaas-account-sync
 */

import {
    supabaseAdmin,
    corsResponse,
    jsonResponse,
    errorResponse,
    getAuthenticatedUser,
    getFinancialAccount,
    getAsaasAccountStatus,
    deriveUiStatusFromAsaasAccount,
    buildAsaasRequirementSnapshot,
    syncFinancialAccountFromAsaas,
    getBalanceFromAsaas,
    upsertFinancialAccountRecord,
    findAsaasSubAccountByEmail,
    findAsaasSubAccountByCpfCnpj,
    getFinancialAccountAsaasApiKey,
    ASAAS_ENV,
    type AsaasAccountStatus,
} from '../_shared/asaas-client.ts';

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return corsResponse();

    try {
        const user = await getAuthenticatedUser(req);

        // 1. Get financial account from DB
        let financialAccount = await getFinancialAccount(user.id);

        // 2. If no local record, try to discover an existing subconta on Asaas
        if (!financialAccount) {
            console.log(`[asaas-account-sync] No local record for user ${user.id}, searching Asaas...`);
            
            // Try to find by email first
            let existingSubAccount = await findAsaasSubAccountByEmail(user.email || '');
            
            // If not found by email, try by CPF from profile
            if (!existingSubAccount) {
                const { data: profile } = await supabaseAdmin
                    .from('profiles')
                    .select('cpf')
                    .eq('id', user.id)
                    .maybeSingle();
                
                if (profile?.cpf) {
                    existingSubAccount = await findAsaasSubAccountByCpfCnpj(profile.cpf);
                }
            }

            if (existingSubAccount) {
                console.log(`[asaas-account-sync] Found existing Asaas subconta: ${existingSubAccount.id}`);
                
                // Auto-create the local record
                financialAccount = await upsertFinancialAccountRecord(user.id, {
                    asaas_account_id: existingSubAccount.id,
                    asaas_wallet_id: existingSubAccount.walletId,
                    asaas_api_key: existingSubAccount.apiKey,
                    provider: 'asaas',
                    asaas_environment: ASAAS_ENV,
                    status: 'pending_review',
                    metadata: {
                        asaas_api_key: existingSubAccount.apiKey,
                        auto_linked: true,
                        linked_at: new Date().toISOString(),
                    },
                });
            } else {
                // No subconta found anywhere
                return jsonResponse({
                    status: 'not_started',
                    message: 'Nenhuma conta financeira encontrada. Inicie o onboarding.',
                    charges_enabled: false,
                    payouts_enabled: false,
                });
            }
        }

        const asaasApiKey = getFinancialAccountAsaasApiKey(financialAccount);
        if (!asaasApiKey) {
            return jsonResponse({
                status: financialAccount.status || 'not_started',
                financial_account_id: financialAccount.id,
                asaas_account_id: financialAccount.asaas_account_id,
                message: 'Conta sem API key Asaas configurada.',
                charges_enabled: false,
                payouts_enabled: false,
            });
        }

        // 3. Fetch account status from Asaas
        let accountStatus: AsaasAccountStatus;
        try {
            accountStatus = await getAsaasAccountStatus(asaasApiKey);
        } catch (err: any) {
            console.error('[asaas-account-sync] Failed to fetch account status:', err);

            // If 404-like, account may have been deleted 
            if (err?.status === 404 || err?.status === 401) {
                await supabaseAdmin
                    .from('financial_accounts')
                    .update({
                        status: 'disabled',
                        charges_enabled: false,
                        payouts_enabled: false,
                        last_sync_error: err?.message || 'N?o foi poss?vel acessar a conta Asaas.',
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', financialAccount.id);

                return jsonResponse({
                    status: 'disabled',
                    financial_account_id: financialAccount.id,
                    error: 'N?o foi poss?vel acessar a conta Asaas. Contate o suporte.',
                    charges_enabled: false,
                    payouts_enabled: false,
                });
            }
            throw err;
        }

        // 4. Sync status to DB
        const uiStatus = deriveUiStatusFromAsaasAccount(accountStatus);
        const requirementsSnapshot = buildAsaasRequirementSnapshot(accountStatus, 'sync');
        await syncFinancialAccountFromAsaas(financialAccount.id, accountStatus, 'sync');

        // 5. Fetch balance from Asaas API if account is active
        let balance = { available: 0, pending: 0 };
        if (uiStatus === 'active') {
            try {
                balance = await getBalanceFromAsaas(asaasApiKey);
            } catch (balErr) {
                console.error('[asaas-account-sync] Balance fetch error (non-fatal):', balErr);
            }
        }

        // 6. Return unified response
        return jsonResponse({
            status: uiStatus,
            financial_account_id: financialAccount.id,
            asaas_account_id: financialAccount.asaas_account_id,
            charges_enabled: uiStatus === 'active',
            payouts_enabled: uiStatus === 'active',
            details_submitted: accountStatus.commercialInfoStatus !== 'NOT_SENT',
            // Keep `balances` (plural) for frontend compatibility.
            // Also include `balance` for backward compatibility if any caller expects it.
            balances: {
                available: balance.available,
                pending: balance.pending,
                currency: 'brl',
            },
            balance: {
                available: balance.available,
                pending: balance.pending,
                currency: 'brl',
            },
            account_status: accountStatus,
            requirements: requirementsSnapshot,
            metadata: {
                provider: 'asaas',
                wallet_id: financialAccount.asaas_wallet_id,
            },
        });

    } catch (error: any) {
        console.error('asaas-account-sync error:', error);
        return errorResponse(error.message || 'Internal error', 500);
    }
});
