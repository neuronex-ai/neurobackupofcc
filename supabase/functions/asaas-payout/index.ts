import {
    corsResponse,
    createAsaasTransfer,
    errorResponse,
    getAsaasBalance,
    getAuthenticatedUser,
    getFinancialAccount,
    getFinancialAccountAsaasApiKey,
    jsonResponse,
    normalizeAccountNumber,
    sanitizeDigits,
    supabaseAdmin,
} from "../_shared/asaas-client.ts";

type Destination = {
    type?: "saved_bank" | "manual_bank" | "pix_key";
    pix_key?: string;
    bank_code?: string;
    bank_name?: string;
    agency?: string;
    account?: string;
    account_digit?: string;
    account_type?: "CONTA_CORRENTE" | "CONTA_POUPANCA";
    holder_name?: string;
    holder_document?: string;
    summary?: string;
};

function normalizeStatus(status?: string) {
    const value = String(status || "PENDING").toUpperCase();
    if (value === "DONE") return "paid";
    if (value === "FAILED") return "failed";
    if (value === "CANCELLED" || value === "CANCELED") return "canceled";
    if (value === "BANK_PROCESSING") return "in_transit";
    return "pending";
}

function getSavedBankDestination(account: any): Destination | null {
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
    };
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") return corsResponse();

    try {
        const user = await getAuthenticatedUser(req);
        const body = await req.json().catch(() => ({}));

        const financialAccount = await getFinancialAccount(user.id);
        const subApiKey = getFinancialAccountAsaasApiKey(financialAccount);

        if (!financialAccount || !subApiKey) {
            return errorResponse("Sua conta financeira ainda não está pronta para saques.", 403, { code: "ACCOUNT_NOT_READY" });
        }

        const asaasBalance = await getAsaasBalance(subApiKey);
        const availableBalance = Math.round((asaasBalance.balance || 0) * 100);
        const requestedAmount = Number(body.amount || availableBalance);

        if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
            return errorResponse("Digite um valor válido para sacar.", 400, { code: "INVALID_AMOUNT" });
        }

        if (requestedAmount > availableBalance) {
            return errorResponse(
                `Saldo insuficiente. Seu saldo disponível é R$ ${(availableBalance / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}.`,
                400,
                { code: "INSUFFICIENT_BALANCE" }
            );
        }

        const incomingDestination = (body.destination || {}) as Destination;
        const destination = incomingDestination.type === "saved_bank"
            ? getSavedBankDestination(financialAccount)
            : incomingDestination;

        if (!destination?.type) {
            return errorResponse("Escolha um destino para o saque.", 400, { code: "DESTINATION_REQUIRED" });
        }

        const transferParams: any = {
            value: requestedAmount / 100,
            operationType: destination.type === "pix_key" ? "PIX" : "TED",
            description: body.description || "Saque NeuroFinance",
        };

        if (destination.type === "pix_key") {
            const pixKey = String(destination.pix_key || "").trim();
            if (!pixKey) return errorResponse("Informe a chave Pix de destino.", 400, { code: "PIX_KEY_REQUIRED" });
            transferParams.pixAddressKey = pixKey;
        } else {
            const accountNumber = normalizeAccountNumber(destination.account, destination.account_digit);
            const bankCode = sanitizeDigits(destination.bank_code);
            const agency = sanitizeDigits(destination.agency);
            const holderDocument = sanitizeDigits(destination.holder_document);

            if (!bankCode || !agency || !accountNumber.account || !accountNumber.accountDigit || !destination.holder_name || !holderDocument) {
                return errorResponse("Os dados bancários de destino estão incompletos.", 400, { code: "BANK_DESTINATION_INCOMPLETE" });
            }

            transferParams.bankAccount = {
                bank: { code: bankCode },
                accountName: destination.holder_name,
                ownerName: destination.holder_name,
                cpfCnpj: holderDocument,
                agency,
                account: accountNumber.account,
                accountDigit: accountNumber.accountDigit,
                bankAccountType: destination.account_type || "CONTA_CORRENTE",
            };
        }

        const transfer = await createAsaasTransfer(subApiKey, transferParams);
        const transferFee = Math.round(Number(transfer.transferFee || 0) * 100);
        const normalizedStatus = normalizeStatus(transfer.status);
        const destinationSummary = destination.summary ||
            (destination.type === "pix_key"
                ? `Pix para ${destination.pix_key}`
                : `${destination.bank_name || "Banco"} · Ag ${destination.agency} Conta ${destination.account}${destination.account_digit || ""}`);

        const { data: payoutRecord, error: insertError } = await supabaseAdmin
            .from("nb_payouts")
            .insert({
                user_id: user.id,
                financial_account_id: financialAccount.id,
                provider: "asaas",
                provider_payout_id: transfer.id,
                provider_status: String(transfer.status || "PENDING").toUpperCase(),
                amount: requestedAmount,
                fee_amount: transferFee,
                operation_type: destination.type === "pix_key" ? "pix" : "ted",
                status: normalizedStatus,
                destination_type: destination.type,
                destination_summary: destinationSummary,
                destination_payload: destination,
                pix_key: destination.type === "pix_key" ? destination.pix_key : null,
                receipt_url: transfer.transactionReceiptUrl || null,
                requested_at: new Date().toISOString(),
                completed_at: normalizedStatus === "paid" ? new Date().toISOString() : null,
                processed_at: normalizedStatus === "paid" ? new Date().toISOString() : null,
                reconciliation_status: "estimated",
                provider_payload: transfer,
                metadata: {
                    asaas_transfer_id: transfer.id,
                    operation_type: transferParams.operationType,
                    transfer_fee: transfer.transferFee || 0,
                    transaction_receipt_url: transfer.transactionReceiptUrl || null,
                    source: "neurofinance",
                },
            })
            .select()
            .single();

        if (insertError) throw insertError;

        return jsonResponse({
            success: true,
            payout_id: payoutRecord.id,
            provider_payout_id: transfer.id,
            amount: requestedAmount,
            status: normalizedStatus,
            receipt_url: transfer.transactionReceiptUrl || null,
            schedule_date: transfer.scheduleDate || null,
        });
    } catch (error: any) {
        console.error("asaas-payout error:", error);
        return errorResponse(
            "Não foi possível concluir o saque agora. Nenhum valor foi movimentado.",
            error?.status || 500,
            { code: "PAYOUT_UNAVAILABLE" }
        );
    }
});
