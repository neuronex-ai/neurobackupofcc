import { supabaseAdmin } from "./asaas-client.ts";

type ManagerialPaymentMethod =
    | "manual"
    | "pix"
    | "boleto"
    | "card"
    | "cash"
    | "external_transfer"
    | "convenio"
    | "other";

type ManagerialStatus = "planned" | "pending" | "paid" | "overdue" | "cancelled";

export function normalizeManagerialPaymentMethod(method?: string | null): ManagerialPaymentMethod {
    const normalized = String(method || "").toLowerCase();

    if (normalized === "pix") return "pix";
    if (normalized === "boleto") return "boleto";
    if (["card", "credit_card", "debit", "debit_card", "credit"].includes(normalized)) return "card";
    if (["cash", "money"].includes(normalized)) return "cash";
    if (["external_transfer", "transfer", "bank_transfer", "ted", "doc"].includes(normalized)) return "external_transfer";
    if (["convenio", "insurance", "health_plan"].includes(normalized)) return "convenio";
    if (normalized === "manual") return "manual";

    return "other";
}

export function managerialStatusFromPayment(payment: any): ManagerialStatus {
    const normalizedStatus = String(payment?.normalized_status || payment?.status || payment?.provider_status || "").toLowerCase();
    const fundsStatus = String(payment?.funds_status || "").toLowerCase();

    if (["paid", "confirmed", "received"].includes(normalizedStatus)) return "paid";
    if (["available", "confirmed"].includes(fundsStatus)) return "paid";
    if (["overdue", "expired"].includes(normalizedStatus)) return "overdue";
    if (["canceled", "cancelled", "deleted", "failed", "refused", "refunded", "chargeback"].includes(normalizedStatus)) {
        return "cancelled";
    }

    return "pending";
}

function paymentPaidAt(payment: any, status: ManagerialStatus) {
    if (status !== "paid") return null;
    return payment?.paid_at || payment?.paymentDate || payment?.confirmed_at || payment?.confirmedDate || new Date().toISOString();
}

function dateOnly(value?: string | null) {
    if (!value) return null;
    return String(value).slice(0, 10);
}

function centsToReais(value?: number | string | null) {
    return Number(value || 0) / 100;
}

async function findPaymentMovementId(payment: any) {
    const referenceIds = [payment?.provider_payment_id, payment?.id].filter(Boolean);
    if (!payment?.financial_account_id || referenceIds.length === 0) return null;

    const { data, error } = await supabaseAdmin
        .from("neurofinance_account_movements")
        .select("id")
        .eq("financial_account_id", payment.financial_account_id)
        .eq("reference_type", "payment")
        .in("reference_id", referenceIds)
        .order("occurred_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        console.warn("[financial-management] Could not resolve payment movement:", error);
        return null;
    }

    return data?.id || null;
}

export async function ensureFinancialEntryForCharge(input: {
    userId: string;
    financialEntryId?: string | null;
    patientId?: string | null;
    appointmentId?: string | null;
    amount: number;
    description?: string | null;
    dueDate?: string | null;
    paymentMethod?: string | null;
    neurofinanceChargeId?: string | null;
}) {
    const paymentMethod = normalizeManagerialPaymentMethod(input.paymentMethod);

    if (input.financialEntryId) {
        const existingPatch: Record<string, unknown> = {
            patient_id: input.patientId || null,
            appointment_id: input.appointmentId || null,
            amount: centsToReais(input.amount),
            due_date: input.dueDate || null,
            competence_date: input.dueDate || null,
            payment_method: paymentMethod,
            origin: "neurofinance",
            updated_at: new Date().toISOString(),
        };

        if (input.neurofinanceChargeId) {
            existingPatch.neurofinance_charge_id = input.neurofinanceChargeId;
        }

        const { data: entry, error } = await supabaseAdmin
            .from("financial_entries")
            .update(existingPatch)
            .eq("id", input.financialEntryId)
            .eq("professional_id", input.userId)
            .select()
            .maybeSingle();

        if (error) throw error;
        if (!entry) throw new Error("Lancamento financeiro nao encontrado para vincular a cobranca.");
        return entry;
    }

    const { data: entry, error } = await supabaseAdmin
        .from("financial_entries")
        .insert({
            professional_id: input.userId,
            patient_id: input.patientId || null,
            appointment_id: input.appointmentId || null,
            type: "income",
            title: input.description || "Cobranca NeuroFinance",
            description: input.description || "Cobranca NeuroFinance",
            amount: centsToReais(input.amount),
            due_date: input.dueDate || null,
            competence_date: input.dueDate || null,
            status: "pending",
            payment_method: paymentMethod,
            origin: "neurofinance",
            neurofinance_charge_id: input.neurofinanceChargeId || null,
            metadata: {
                source: "asaas-create-payment",
            },
        })
        .select()
        .single();

    if (error) throw error;
    return entry;
}

export async function syncFinancialEntryForPayment(payment: any, options?: {
    matchedBy?: "automatic" | "manual";
    notes?: string | null;
}) {
    if (!payment?.id) return null;

    const status = managerialStatusFromPayment(payment);
    const paidAt = paymentPaidAt(payment, status);
    const paymentMethod = normalizeManagerialPaymentMethod(payment.payment_method_type || payment.metadata?.billing_type);
    const movementId = await findPaymentMovementId(payment);
    const now = new Date().toISOString();
    const amount = centsToReais(payment.gross_amount);
    const dueDate = dateOnly(payment.expires_at || payment.provider_due_date);
    const competenceDate = dateOnly(paidAt || payment.created_at || dueDate);
    const entryId = payment.financial_entry_id || payment.metadata?.financial_entry_id || null;

    const patch = {
        patient_id: payment.patient_id || null,
        appointment_id: payment.appointment_id || null,
        type: "income",
        title: payment.description || "Cobranca NeuroFinance",
        description: payment.description || "Cobranca NeuroFinance",
        amount,
        due_date: dueDate,
        competence_date: competenceDate,
        paid_at: paidAt,
        status,
        payment_method: paymentMethod,
        origin: "neurofinance",
        neurofinance_transaction_id: movementId,
        neurofinance_charge_id: payment.id,
        updated_at: now,
    };

    let entry: any = null;

    if (entryId) {
        const { data, error } = await supabaseAdmin
            .from("financial_entries")
            .update(patch)
            .eq("id", entryId)
            .eq("professional_id", payment.user_id)
            .select()
            .maybeSingle();

        if (error) throw error;
        entry = data;
    }

    if (!entry) {
        const { data, error } = await supabaseAdmin
            .from("financial_entries")
            .insert({
                ...patch,
                professional_id: payment.user_id,
                metadata: {
                    source: "neurofinance_payment_sync",
                    provider: payment.provider || "asaas",
                    provider_payment_id: payment.provider_payment_id || null,
                },
            })
            .select()
            .single();

        if (error) throw error;
        entry = data;
    }

    if (!payment.financial_entry_id || payment.financial_entry_id !== entry.id) {
        const { error } = await supabaseAdmin
            .from("nb_payments")
            .update({
                financial_entry_id: entry.id,
                metadata: {
                    ...(payment.metadata || {}),
                    financial_entry_id: entry.id,
                },
                updated_at: now,
            })
            .eq("id", payment.id);

        if (error) throw error;
    }

    const reconciliationPatch = {
        clinic_id: entry.clinic_id || null,
        professional_id: entry.professional_id,
        financial_entry_id: entry.id,
        neurofinance_transaction_id: movementId,
        neurofinance_charge_id: payment.id,
        matched_by: options?.matchedBy || "automatic",
        matched_at: now,
        confidence_score: 1,
        notes: options?.notes || null,
        metadata: {
            provider: payment.provider || "asaas",
            provider_payment_id: payment.provider_payment_id || null,
            normalized_status: payment.normalized_status || payment.status || null,
        },
    };

    const { data: existingReconciliation, error: existingReconciliationError } = await supabaseAdmin
        .from("financial_reconciliations")
        .select("id")
        .eq("financial_entry_id", entry.id)
        .eq("neurofinance_charge_id", payment.id)
        .maybeSingle();

    if (existingReconciliationError) throw existingReconciliationError;

    const reconciliationQuery = existingReconciliation
        ? supabaseAdmin
            .from("financial_reconciliations")
            .update(reconciliationPatch)
            .eq("id", existingReconciliation.id)
        : supabaseAdmin
            .from("financial_reconciliations")
            .insert(reconciliationPatch);

    const { error: reconciliationError } = await reconciliationQuery;
    if (reconciliationError) throw reconciliationError;

    return entry;
}
