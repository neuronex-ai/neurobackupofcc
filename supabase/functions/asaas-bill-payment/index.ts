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
} from "../_shared/asaas-client.ts";
import { verifyFinancialPin } from "../_shared/financial-pin.ts";

const CONSULTATION_TTL_MS = 10 * 60 * 1000;

function cents(value: unknown) {
    return Math.round(Number(value || 0) * 100);
}

function digits(value: unknown) {
    return String(value || "").replace(/\D/g, "");
}

function billInput(body: Record<string, any>) {
    return {
        identificationField: digits(body.identificationField),
        barCode: digits(body.barCode || body.barcode),
    };
}

function normalizeBillStatus(status?: string) {
    const value = String(status || "PENDING").toUpperCase();
    if (value === "PAID") return "paid";
    if (value === "FAILED") return "failed";
    if (value === "CANCELLED" || value === "CANCELED") return "cancelled";
    if (value === "REFUNDED") return "refunded";
    if (value === "BANK_PROCESSING" || value === "AWAITING_CHECKOUT_RISK_ANALYSIS_REQUEST") return "processing";
    return "processing";
}

function providerReceiptUrl(payload: any) {
    return payload?.transactionReceiptUrl ||
        payload?.receiptUrl ||
        payload?.paymentReceiptUrl ||
        null;
}

function providerBeneficiary(payload: any) {
    return {
        name: payload?.beneficiaryName || payload?.beneficiary?.name || null,
        document: payload?.beneficiaryDocument || payload?.beneficiary?.cpfCnpj || null,
        bankCode: typeof payload?.bank === "string" ? payload.bank : payload?.bankCode || payload?.bank?.code || null,
        bankName: payload?.bankName || payload?.bank?.name || null,
    };
}

function consultationPayload(record: any) {
    return {
        id: record.id,
        status: record.status,
        value: Number(record.amount || 0) / 100,
        fee: Number(record.fee_amount || 0) / 100,
        dueDate: record.due_date,
        scheduleDate: record.scheduled_date,
        beneficiaryName: record.beneficiary_name,
        beneficiaryDocument: record.beneficiary_document,
        bankCode: record.bank_code,
        bankName: record.bank_name,
        expiresAt: record.consultation_expires_at,
    };
}

async function findConsultation(userId: string, consultationId: string) {
    const { data, error } = await supabaseAdmin
        .from("neurofinance_bill_payments")
        .select("*")
        .eq("id", consultationId)
        .eq("user_id", userId)
        .maybeSingle();

    if (error) throw error;
    return data;
}

function isExpired(record: any) {
    return !record?.consultation_expires_at ||
        new Date(record.consultation_expires_at).getTime() <= Date.now();
}

function validateScheduleDate(value: unknown) {
    if (!value) return null;
    const scheduleDate = String(value);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(scheduleDate)) {
        throw Object.assign(new Error("Informe uma data de pagamento válida."), { status: 400 });
    }
    return scheduleDate;
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") return corsResponse();

    try {
        const user = await getAuthenticatedUser(req);
        const body = await req.json().catch(() => ({}));
        const action = String(body.action || "list");
        const account = await getFinancialAccount(user.id);
        const apiKey = getFinancialAccountAsaasApiKey(account);

        if (!account || !apiKey) {
            return errorResponse("Sua conta ainda não está pronta para pagar contas.", 403, { code: "ACCOUNT_NOT_READY" });
        }

        if (action === "list") {
            const result = await asaasRequest("/bill?limit=100&offset=0", "GET", undefined, apiKey);
            return jsonResponse({ success: true, ...(result as Record<string, unknown>) });
        }

        if (action === "consult" || action === "simulate") {
            const input = billInput(body);
            if (!input.identificationField && !input.barCode) {
                return errorResponse("Informe a linha digitável ou o código de barras do boleto.", 400, {
                    code: "BILL_INPUT_REQUIRED",
                });
            }

            const result = await asaasRequest(
                "/bill/simulate",
                "POST",
                input.identificationField
                    ? { identificationField: input.identificationField }
                    : { barCode: input.barCode },
                apiKey,
            );

            const resolvedIdentificationField = input.identificationField ||
                digits((result as any)?.identificationField || (result as any)?.identification_field);
            if (!resolvedIdentificationField) {
                return errorResponse(
                    "O boleto foi localizado, mas a linha digitável não foi retornada. Digite a linha para continuar.",
                    400,
                    { code: "IDENTIFICATION_FIELD_REQUIRED" },
                );
            }

            const beneficiary = providerBeneficiary(result);
            const scheduleDate = validateScheduleDate(body.scheduleDate);
            const expiresAt = new Date(Date.now() + CONSULTATION_TTL_MS).toISOString();
            const externalReference = `neurofinance:bill:${crypto.randomUUID()}`;

            const { data: record, error } = await supabaseAdmin
                .from("neurofinance_bill_payments")
                .insert({
                    user_id: user.id,
                    financial_account_id: account.id,
                    identification_field: resolvedIdentificationField,
                    barcode: input.barCode || null,
                    external_reference: externalReference,
                    status: "review_pending",
                    amount: cents((result as any)?.value || (result as any)?.amount),
                    fee_amount: cents((result as any)?.fee),
                    due_date: (result as any)?.dueDate || (result as any)?.due_date || null,
                    scheduled_date: scheduleDate,
                    beneficiary_name: beneficiary.name,
                    beneficiary_document: beneficiary.document,
                    bank_code: beneficiary.bankCode,
                    bank_name: beneficiary.bankName,
                    description: "Pagamento de boleto pelo NeuroFinance",
                    consultation_expires_at: expiresAt,
                    provider_payload: result || {},
                    updated_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (error) throw error;

            return jsonResponse({
                success: true,
                consultation: consultationPayload(record),
            });
        }

        if (action === "authorize") {
            const consultationId = String(body.consultationId || "");
            const record = consultationId ? await findConsultation(user.id, consultationId) : null;
            if (!record) {
                return errorResponse("Esta consulta de boleto não foi encontrada.", 404, { code: "CONSULTATION_NOT_FOUND" });
            }
            if (isExpired(record)) {
                await supabaseAdmin
                    .from("neurofinance_bill_payments")
                    .update({ status: "expired", updated_at: new Date().toISOString() })
                    .eq("id", record.id)
                    .eq("user_id", user.id);
                return errorResponse("A consulta expirou. Consulte o boleto novamente.", 410, { code: "CONSULTATION_EXPIRED" });
            }
            if (!["review_pending", "authorized"].includes(record.status)) {
                return errorResponse("Este boleto não está disponível para autorização.", 409, {
                    code: "CONSULTATION_NOT_AUTHORIZABLE",
                });
            }

            const pinResult = await verifyFinancialPin(user.id, String(body.pin || ""));
            if (!pinResult.isValid) {
                return errorResponse(pinResult.message || "PIN incorreto.", 403, {
                    code: pinResult.code || "INVALID_PIN",
                });
            }

            const authorizedAt = new Date().toISOString();
            const { data: authorized, error } = await supabaseAdmin
                .from("neurofinance_bill_payments")
                .update({
                    status: "authorized",
                    authorized_at: authorizedAt,
                    updated_at: authorizedAt,
                })
                .eq("id", record.id)
                .eq("user_id", user.id)
                .in("status", ["review_pending", "authorized"])
                .select()
                .single();

            if (error) throw error;
            return jsonResponse({ success: true, consultation: consultationPayload(authorized) });
        }

        if (action === "execute") {
            const consultationId = String(body.consultationId || "");
            const record = consultationId ? await findConsultation(user.id, consultationId) : null;
            if (!record) {
                return errorResponse("Esta consulta de boleto não foi encontrada.", 404, { code: "CONSULTATION_NOT_FOUND" });
            }

            if (["processing", "paid"].includes(record.status) && record.provider_bill_id) {
                return jsonResponse({
                    success: true,
                    bill: record.provider_payload?.execution || record.provider_payload,
                    record,
                    status: record.status,
                    receiptUrl: record.receipt_url,
                    idempotent: true,
                });
            }
            if (["failed", "cancelled", "refunded"].includes(record.status) && record.provider_bill_id) {
                return errorResponse(
                    "Este pagamento não pode ser reenviado. Faça uma nova consulta para tentar novamente.",
                    409,
                    { code: "BILL_NOT_RETRYABLE", record },
                );
            }
            if (record.status === "submitting" || record.status === "submission_unknown") {
                return errorResponse(
                    "Este pagamento já foi enviado e aguarda confirmação bancária.",
                    409,
                    { code: "BILL_ALREADY_SUBMITTED" },
                );
            }
            if (record.status !== "authorized" || !record.authorized_at) {
                return errorResponse("Confirme este pagamento com seu PIN antes de continuar.", 403, {
                    code: "PIN_AUTH_REQUIRED",
                });
            }
            if (isExpired(record)) {
                return errorResponse("A autorização expirou. Consulte o boleto novamente.", 410, {
                    code: "CONSULTATION_EXPIRED",
                });
            }

            const submittedAt = new Date().toISOString();
            const { data: claimed, error: claimError } = await supabaseAdmin
                .from("neurofinance_bill_payments")
                .update({
                    status: "submitting",
                    submitted_at: submittedAt,
                    updated_at: submittedAt,
                })
                .eq("id", record.id)
                .eq("user_id", user.id)
                .eq("status", "authorized")
                .select()
                .maybeSingle();

            if (claimError) throw claimError;
            if (!claimed) {
                return errorResponse("Este pagamento já está sendo processado.", 409, {
                    code: "BILL_ALREADY_SUBMITTED",
                });
            }

            const payload: Record<string, unknown> = {
                identificationField: claimed.identification_field,
                description: claimed.description || "Pagamento de boleto pelo NeuroFinance",
                externalReference: claimed.external_reference,
            };
            if (claimed.scheduled_date) payload.scheduleDate = claimed.scheduled_date;
            if (Number(claimed.amount) > 0) payload.value = Number(claimed.amount) / 100;
            if (claimed.due_date) payload.dueDate = claimed.due_date;

            try {
                const result = await asaasRequest("/bill", "POST", payload, apiKey);
                const status = normalizeBillStatus((result as any)?.status);
                const receiptUrl = providerReceiptUrl(result);
                const providerPayload = {
                    consultation: claimed.provider_payload || {},
                    execution: result || {},
                };

                await recordBaasOperation(user.id, account.id, "bill_payment", result as Record<string, unknown>, {
                    amount: Number(claimed.amount || 0) / 100,
                    description: String(payload.description),
                    payload,
                });

                const { data: updated, error } = await supabaseAdmin
                    .from("neurofinance_bill_payments")
                    .update({
                        provider_bill_id: (result as any)?.id || null,
                        status,
                        amount: cents((result as any)?.value || Number(claimed.amount) / 100),
                        fee_amount: cents((result as any)?.fee || Number(claimed.fee_amount) / 100),
                        due_date: (result as any)?.dueDate || claimed.due_date,
                        scheduled_date: (result as any)?.scheduleDate || claimed.scheduled_date,
                        receipt_url: receiptUrl,
                        paid_at: status === "paid" ? new Date().toISOString() : null,
                        provider_payload: providerPayload,
                        error_code: null,
                        error_message: null,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", claimed.id)
                    .eq("user_id", user.id)
                    .select()
                    .single();

                if (error) throw error;
                if (["failed", "cancelled", "refunded"].includes(status)) {
                    return errorResponse(
                        "A instituição bancária não confirmou o pagamento. Nenhum débito foi confirmado.",
                        422,
                        { code: "BILL_REJECTED", record: updated },
                    );
                }

                return jsonResponse({
                    success: true,
                    bill: result,
                    record: updated,
                    status,
                    receiptUrl,
                });
            } catch (error: any) {
                const statusCode = Number(error?.status || 500);
                const failedStatus = statusCode >= 500 ? "submission_unknown" : "failed";
                await supabaseAdmin
                    .from("neurofinance_bill_payments")
                    .update({
                        status: failedStatus,
                        error_code: String(error?.code || "BILL_SUBMISSION_FAILED"),
                        error_message: String(error?.message || "Falha ao enviar pagamento."),
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", claimed.id)
                    .eq("user_id", user.id);

                return errorResponse(
                    statusCode >= 500
                        ? "O pagamento foi enviado, mas ainda não recebemos a confirmação bancária. Não tente novamente agora."
                        : error?.message || "Não conseguimos processar este boleto.",
                    statusCode,
                    { code: statusCode >= 500 ? "BILL_SUBMISSION_UNKNOWN" : "BILL_SUBMISSION_FAILED" },
                );
            }
        }

        if (action === "create") {
            return errorResponse("Consulte e autorize o boleto antes de efetuar o pagamento.", 400, {
                code: "CONSULTATION_REQUIRED",
            });
        }

        return errorResponse("Esta ação de pagamento não está disponível.", 400, { code: "UNSUPPORTED_ACTION" });
    } catch (error: any) {
        console.error("asaas-bill-payment error:", error);
        return errorResponse(error?.message || "Não conseguimos processar este boleto agora.", error?.status || 500, {
            code: error?.code || "BILL_PAYMENT_FAILED",
        });
    }
});
