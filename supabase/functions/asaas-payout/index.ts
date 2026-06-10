import {
    asaasRequest,
    corsResponse,
    createAsaasTransfer,
    errorResponse,
    getAsaasBalance,
    getAuthenticatedUser,
    getFinancialAccount,
    getFinancialAccountAsaasApiKey,
    jsonResponse,
    normalizeAccountNumber,
    saveProviderPayout,
    sanitizeDigits,
    supabaseAdmin,
} from "../_shared/asaas-client.ts";
import {
    cents,
    detectPixKeyType,
    isExpired,
    normalizePixKeyForProvider,
    normalizeTransferStatus,
    outgoingResponse,
    OUTGOING_CONSULTATION_TTL_MS,
    providerReceiptUrl,
} from "../_shared/asaas-outgoing.ts";
import { verifyFinancialPin } from "../_shared/financial-pin.ts";

type Destination = {
    type?: "saved_bank" | "pix_key";
    pix_key?: string;
    pix_key_type?: "CPF" | "CNPJ" | "EMAIL" | "PHONE" | "EVP";
    bank_code?: string;
    bank_name?: string;
    agency?: string;
    account?: string;
    account_digit?: string;
    account_type?: "CONTA_CORRENTE" | "CONTA_POUPANCA";
    holder_name?: string;
    holder_document?: string;
    summary?: string;
    validation_source?: string;
    provider_lookup?: Record<string, unknown>;
};

function savedBankDestination(account: any): Destination | null {
    if (!account?.bank_code || !account?.bank_agency || !account?.bank_account) return null;
    const holderName = account.bank_holder_name || account.holder_name || account.name || "Titular da conta";
    const holderDocument = account.bank_holder_cpf_cnpj || account.cpf_cnpj || account.document || "";
    return {
        type: "saved_bank",
        bank_code: account.bank_code,
        bank_name: account.bank_name || "Banco cadastrado",
        agency: account.bank_agency,
        account: account.bank_account,
        account_digit: account.bank_account_digit || "",
        account_type: String(account.bank_account_type || "").toUpperCase().includes("POUP")
            ? "CONTA_POUPANCA"
            : "CONTA_CORRENTE",
        holder_name: holderName,
        holder_document: holderDocument,
        summary: `${holderName} · Ag ${account.bank_agency} Conta ${account.bank_account}${account.bank_account_digit || ""}`,
        validation_source: "registered_bank_account",
    };
}

function payoutResponse(record: any) {
    return {
        ...outgoingResponse(record),
        destinationType: record.kind === "payout_pix" ? "pix_key" : "saved_bank",
    };
}

async function findRequest(userId: string, id: string) {
    const { data, error } = await supabaseAdmin
        .from("neurofinance_outgoing_requests")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
        .in("kind", ["payout_pix", "payout_bank"])
        .maybeSingle();
    if (error) throw error;
    return data;
}

async function liveBalance(apiKey: string) {
    const balance = await getAsaasBalance(apiKey);
    return cents(balance.balance);
}

function transferParams(record: any) {
    const destination = (record.destination_payload || {}) as Destination;
    const params: any = {
        value: Number(record.amount) / 100,
        operationType: record.kind === "payout_pix" ? "PIX" : "TED",
        description: record.kind === "payout_pix" ? "Saque por Pix" : "Saque para conta cadastrada",
        externalReference: record.external_reference,
    };

    if (record.kind === "payout_pix") {
        params.pixAddressKey = destination.pix_key;
        params.pixAddressKeyType = destination.pix_key_type;
        return params;
    }

    const accountNumber = normalizeAccountNumber(destination.account, destination.account_digit);
    params.bankAccount = {
        bank: { code: sanitizeDigits(destination.bank_code) },
        accountName: destination.holder_name,
        ownerName: destination.holder_name,
        cpfCnpj: sanitizeDigits(destination.holder_document),
        agency: sanitizeDigits(destination.agency),
        account: accountNumber.account,
        accountDigit: accountNumber.accountDigit,
        bankAccountType: destination.account_type || "CONTA_CORRENTE",
    };
    return params;
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") return corsResponse();

    try {
        const user = await getAuthenticatedUser(req);
        const body = await req.json().catch(() => ({}));
        const action = String(body.action || "");
        const account = await getFinancialAccount(user.id);
        const apiKey = getFinancialAccountAsaasApiKey(account);
        if (!account || !apiKey) {
            return errorResponse("Sua conta financeira ainda não está pronta para saques.", 403, { code: "ACCOUNT_NOT_READY" });
        }

        if (action === "consult") {
            const amount = Math.round(Number(body.amount || 0));
            if (!Number.isFinite(amount) || amount <= 0) {
                return errorResponse("Digite um valor válido para sacar.", 400, { code: "INVALID_AMOUNT" });
            }
            const balance = await liveBalance(apiKey);
            if (amount > balance) {
                return errorResponse("Saldo insuficiente para este saque.", 422, {
                    code: "INSUFFICIENT_BALANCE",
                    availableBalance: balance / 100,
                });
            }

            const requestedDestination = (body.destination || {}) as Destination;
            let destination: Destination | null = null;
            let kind: "payout_pix" | "payout_bank";
            if (requestedDestination.type === "pix_key") {
                const keyType = detectPixKeyType(requestedDestination.pix_key);
                const pixKey = normalizePixKeyForProvider(requestedDestination.pix_key, keyType);
                if (!pixKey) return errorResponse("Informe a chave Pix de destino.", 400, { code: "PIX_KEY_REQUIRED" });
                const lookup = await asaasRequest<any>(
                    `/pix/addressKeys/external?type=${encodeURIComponent(keyType)}&key=${encodeURIComponent(pixKey)}`,
                    "GET",
                    undefined,
                    apiKey,
                );
                if (!lookup?.owner?.name || !lookup?.owner?.cpfCnpj || !(lookup?.financialInstitution?.name || lookup?.ispbName)) {
                    return errorResponse("A instituição não retornou dados suficientes para confirmar esta chave Pix.", 422, {
                        code: "INCOMPLETE_PIX_KEY_DATA",
                    });
                }
                destination = {
                    type: "pix_key",
                    pix_key: lookup.key || pixKey,
                    pix_key_type: lookup.type || keyType,
                    bank_code: lookup.financialInstitution?.code || lookup.financialInstitution?.bank?.code || null,
                    bank_name: lookup.financialInstitution?.name || lookup.ispbName,
                    holder_name: lookup.owner.name,
                    holder_document: lookup.owner.cpfCnpj,
                    summary: `${lookup.owner.name} · ${lookup.financialInstitution?.name || lookup.ispbName}`,
                    validation_source: "asaas_dict",
                    provider_lookup: lookup,
                };
                kind = "payout_pix";
            } else {
                destination = savedBankDestination(account);
                kind = "payout_bank";
                if (!destination || !sanitizeDigits(destination.holder_document)) {
                    return errorResponse("Os dados da conta bancária cadastrada estão incompletos.", 422, {
                        code: "BANK_DESTINATION_INCOMPLETE",
                    });
                }
            }

            const { data: record, error } = await supabaseAdmin.from("neurofinance_outgoing_requests").insert({
                user_id: user.id,
                financial_account_id: account.id,
                kind,
                status: "review_pending",
                external_reference: `neurofinance:payout:${crypto.randomUUID()}`,
                amount,
                available_balance_at_review: balance,
                destination_summary: destination.summary,
                destination_payload: destination,
                provider_payload: {
                    consultation: destination.provider_lookup || {},
                    review: { balance, checkedAt: new Date().toISOString() },
                },
                consultation_expires_at: new Date(Date.now() + OUTGOING_CONSULTATION_TTL_MS).toISOString(),
                updated_at: new Date().toISOString(),
            }).select().single();
            if (error) throw error;
            return jsonResponse({ success: true, consultation: payoutResponse(record) });
        }

        if (action === "authorize") {
            const record = await findRequest(user.id, String(body.requestId || ""));
            if (!record) return errorResponse("Esta revisão de saque não foi encontrada.", 404, { code: "CONSULTATION_NOT_FOUND" });
            if (isExpired(record)) {
                await supabaseAdmin.from("neurofinance_outgoing_requests").update({ status: "expired", updated_at: new Date().toISOString() }).eq("id", record.id);
                return errorResponse("A revisão expirou. Confira o saque novamente.", 410, { code: "CONSULTATION_EXPIRED" });
            }
            if (!["review_pending", "authorized"].includes(record.status)) {
                return errorResponse("Este saque não está disponível para autorização.", 409, { code: "CONSULTATION_NOT_AUTHORIZABLE" });
            }
            const pinResult = await verifyFinancialPin(user.id, String(body.pin || ""));
            if (!pinResult.isValid) return errorResponse(pinResult.message || "PIN incorreto.", 403, { code: pinResult.code || "INVALID_PIN" });
            const balance = await liveBalance(apiKey);
            if (balance < Number(record.amount || 0)) {
                return errorResponse("Seu saldo mudou e agora é insuficiente para este saque.", 422, { code: "INSUFFICIENT_BALANCE" });
            }
            const authorizedAt = new Date().toISOString();
            const { data: authorized, error } = await supabaseAdmin.from("neurofinance_outgoing_requests").update({
                status: "authorized",
                available_balance_at_review: balance,
                authorized_at: authorizedAt,
                updated_at: authorizedAt,
            }).eq("id", record.id).eq("user_id", user.id).in("status", ["review_pending", "authorized"]).select().single();
            if (error) throw error;
            return jsonResponse({ success: true, consultation: payoutResponse(authorized) });
        }

        if (action === "execute") {
            const record = await findRequest(user.id, String(body.requestId || ""));
            if (!record) return errorResponse("Esta revisão de saque não foi encontrada.", 404, { code: "CONSULTATION_NOT_FOUND" });
            if (record.provider_operation_id && ["pending", "in_transit", "paid"].includes(record.status)) {
                return jsonResponse({ success: true, request: payoutResponse(record), transfer: record.provider_payload?.execution || {}, idempotent: true });
            }
            if (["submitting", "submission_unknown"].includes(record.status)) {
                return errorResponse("Este saque já foi enviado e aguarda confirmação bancária.", 409, { code: "PAYOUT_ALREADY_SUBMITTED" });
            }
            if (record.status !== "authorized" || !record.authorized_at) {
                return errorResponse("Confirme este saque com seu PIN antes de continuar.", 403, { code: "PIN_AUTH_REQUIRED" });
            }
            if (isExpired(record)) return errorResponse("A autorização expirou. Confira o saque novamente.", 410, { code: "CONSULTATION_EXPIRED" });
            if (await liveBalance(apiKey) < Number(record.amount || 0)) {
                return errorResponse("Seu saldo mudou e agora é insuficiente para este saque.", 422, { code: "INSUFFICIENT_BALANCE" });
            }

            const submittedAt = new Date().toISOString();
            const { data: claimed, error: claimError } = await supabaseAdmin.from("neurofinance_outgoing_requests").update({
                status: "submitting",
                submitted_at: submittedAt,
                updated_at: submittedAt,
            }).eq("id", record.id).eq("user_id", user.id).eq("status", "authorized").select().maybeSingle();
            if (claimError) throw claimError;
            if (!claimed) return errorResponse("Este saque já está sendo processado.", 409, { code: "PAYOUT_ALREADY_SUBMITTED" });

            try {
                const transfer = await createAsaasTransfer(apiKey, transferParams(claimed));
                const status = normalizeTransferStatus(transfer.status);
                const receiptUrl = providerReceiptUrl(transfer);
                const transferFee = cents(transfer.transferFee);
                const payout = await saveProviderPayout({
                    user_id: user.id,
                    financial_account_id: account.id,
                    provider: "asaas",
                    provider_payout_id: transfer.id,
                    provider_status: String(transfer.status || "PENDING").toUpperCase(),
                    amount: Number(claimed.amount),
                    fee_amount: transferFee,
                    operation_type: claimed.kind === "payout_pix" ? "pix" : "ted",
                    currency: "brl",
                    status,
                    destination_type: claimed.kind === "payout_pix" ? "pix_key" : "saved_bank",
                    destination_summary: claimed.destination_summary,
                    destination_payload: claimed.destination_payload || {},
                    pix_key: claimed.kind === "payout_pix" ? claimed.destination_payload?.pix_key : null,
                    receipt_url: receiptUrl,
                    requested_at: new Date().toISOString(),
                    processed_at: status === "paid" ? new Date().toISOString() : null,
                    completed_at: status === "paid" ? new Date().toISOString() : null,
                    reconciliation_status: status === "paid" ? "reconciled" : "estimated",
                    provider_payload: transfer,
                    metadata: {
                        asaas_transfer_id: transfer.id,
                        transaction_receipt_url: receiptUrl,
                        external_reference: claimed.external_reference,
                        source: "neurofinance_secure_payout",
                    },
                });

                const { data: updated, error } = await supabaseAdmin.from("neurofinance_outgoing_requests").update({
                    payout_id: payout.id,
                    status,
                    fee_amount: transferFee,
                    provider_operation_id: transfer.id,
                    provider_status: String(transfer.status || "PENDING").toUpperCase(),
                    receipt_url: receiptUrl,
                    completed_at: status === "paid" ? new Date().toISOString() : null,
                    provider_payload: {
                        consultation: claimed.provider_payload?.consultation || {},
                        review: claimed.provider_payload?.review || {},
                        execution: transfer,
                    },
                    updated_at: new Date().toISOString(),
                }).eq("id", claimed.id).select().single();
                if (error) throw error;
                return jsonResponse({ success: true, request: payoutResponse(updated), transfer, status, receiptUrl });
            } catch (error: any) {
                const statusCode = Number(error?.status || 500);
                await supabaseAdmin.from("neurofinance_outgoing_requests").update({
                    status: statusCode >= 500 ? "submission_unknown" : "failed",
                    error_code: String(error?.code || "PAYOUT_SUBMISSION_FAILED"),
                    error_message: String(error?.message || "Falha ao enviar saque."),
                    updated_at: new Date().toISOString(),
                }).eq("id", claimed.id);
                return errorResponse(
                    statusCode >= 500
                        ? "O saque foi enviado, mas ainda não recebemos a confirmação bancária. Não tente novamente agora."
                        : error?.message || "Não foi possível concluir este saque.",
                    statusCode,
                    { code: statusCode >= 500 ? "PAYOUT_SUBMISSION_UNKNOWN" : "PAYOUT_SUBMISSION_FAILED" },
                );
            }
        }

        if (action === "receipt") {
            const record = await findRequest(user.id, String(body.requestId || ""));
            if (!record?.provider_operation_id) return errorResponse("O comprovante deste saque ainda não está disponível.", 404, { code: "PAYOUT_RECEIPT_NOT_AVAILABLE" });
            const transfer = await asaasRequest<any>(`/transfers/${encodeURIComponent(record.provider_operation_id)}`, "GET", undefined, apiKey);
            const receiptUrl = providerReceiptUrl(transfer) || record.receipt_url;
            const status = normalizeTransferStatus(transfer?.status);
            await supabaseAdmin.from("neurofinance_outgoing_requests").update({
                status,
                provider_status: String(transfer?.status || record.provider_status || "").toUpperCase(),
                receipt_url: receiptUrl,
                provider_payload: {
                    consultation: record.provider_payload?.consultation || {},
                    review: record.provider_payload?.review || {},
                    execution: transfer,
                },
                updated_at: new Date().toISOString(),
            }).eq("id", record.id);
            if (record.payout_id) {
                await supabaseAdmin.from("nb_payouts").update({
                    status,
                    provider_status: String(transfer?.status || record.provider_status || "").toUpperCase(),
                    receipt_url: receiptUrl,
                    provider_payload: transfer,
                    updated_at: new Date().toISOString(),
                }).eq("id", record.payout_id);
            }
            if (!receiptUrl) return errorResponse("A confirmação bancária ainda não liberou o comprovante.", 404, { code: "PAYOUT_RECEIPT_NOT_AVAILABLE" });
            return jsonResponse({ success: true, receiptUrl, status });
        }

        return errorResponse("Consulte e confirme os dados do saque com seu PIN antes de enviar.", 400, {
            code: "PAYOUT_CONSULTATION_REQUIRED",
        });
    } catch (error: any) {
        console.error("asaas-payout error:", error);
        return errorResponse(error?.message || "Não foi possível processar este saque agora.", error?.status || 500, {
            code: error?.code || "PAYOUT_FAILED",
        });
    }
});
