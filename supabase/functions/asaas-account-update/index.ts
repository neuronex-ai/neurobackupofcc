/**
 * asaas-account-update
 *
 * Updates account information on the Asaas sub-account.
 *
 * POST /asaas-account-update
 * Body: {
 *   name?: string,
 *   email?: string,
 *   phone?: string,
 *   mobilePhone?: string,
 *   address?: string,
 *   addressNumber?: string,
 *   complement?: string,
 *   province?: string,
 *   postalCode?: string,
 *   // Bank account fields:
 *   bank_code?: string,
 *   agency?: string,
 *   account?: string,
 *   account_digit?: string,
 *   account_type?: 'CONTA_CORRENTE' | 'CONTA_POUPANCA',
 *   owner_name?: string,
 *   cpfCnpj?: string,
 * }
 */

import {
    supabaseAdmin,
    corsResponse,
    jsonResponse,
    errorResponse,
    getAuthenticatedUser,
    getFinancialAccount,
    asaasRequest,
    sanitizeDigits,
} from '../_shared/asaas-client.ts';

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return corsResponse();

    try {
        const user = await getAuthenticatedUser(req);
        const body = await req.json();

        // 1. Get financial account
        const financialAccount = await getFinancialAccount(user.id);
        if (!financialAccount?.metadata?.asaas_api_key) {
            return errorResponse('Conta financeira não configurada.', 403);
        }

        const subApiKey = financialAccount.metadata.asaas_api_key;

        // 2. Build update payload (only include non-null fields)
        const updatePayload: Record<string, unknown> = {};

        const simpleFields = ['name', 'email', 'phone', 'mobilePhone', 'address', 'addressNumber', 'complement', 'province'];
        for (const field of simpleFields) {
            if (body[field] !== undefined && body[field] !== null) {
                updatePayload[field] = body[field];
            }
        }

        if (body.postalCode) {
            updatePayload.postalCode = sanitizeDigits(body.postalCode);
        }

        // 3. Update commercial info in Asaas
        let commercialResult = null;
        if (Object.keys(updatePayload).length > 0) {
            commercialResult = await asaasRequest(
                '/myAccount/commercialInfo',
                'POST',
                updatePayload,
                subApiKey
            );
        }

        // 4. Update bank account if provided
        let bankResult = null;
        if (body.bank_code && body.agency && body.account) {
            bankResult = await asaasRequest(
                '/bankAccountInfo',
                'POST',
                {
                    bank: { code: body.bank_code },
                    accountName: body.owner_name || body.name || '',
                    ownerName: body.owner_name || body.name || '',
                    cpfCnpj: sanitizeDigits(body.cpfCnpj),
                    agency: body.agency,
                    account: body.account,
                    accountDigit: body.account_digit || '',
                    bankAccountType: body.account_type || 'CONTA_CORRENTE',
                },
                subApiKey
            );

            // Update bank info in our DB
            await supabaseAdmin
                .from('financial_accounts')
                .update({
                    bank_name: body.bank_code,
                    bank_account_last4: (body.account || '').slice(-4),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', financialAccount.id);
        }

        return jsonResponse({
            success: true,
            commercial_info: commercialResult,
            bank_info: bankResult,
        });

    } catch (error: any) {
        console.error('asaas-account-update error:', error);
        return errorResponse(error.message || 'Internal error', 500);
    }
});
