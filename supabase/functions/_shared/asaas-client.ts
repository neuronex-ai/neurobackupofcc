/**
 * Shared Asaas Client for NeuroBank Edge Functions
 *
 * Centraliza:
 * - Asaas REST API v3 (BaaS) client
 * - Supabase admin client
 * - CORS
 * - Auth
 * - Helpers de onboarding/status
 * - Helpers de webhook
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// ─────────────────────────────────────────────────────────────
// Asaas config
// ─────────────────────────────────────────────────────────────

export const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY")?.trim() || "";
export const ASAAS_WEBHOOK_TOKEN =
    Deno.env.get("ASAAS_WEBHOOK_TOKEN")?.trim() || "";

const ASAAS_ENV = Deno.env.get("ASAAS_ENVIRONMENT")?.trim() || "sandbox";

export const ASAAS_BASE_URL =
    ASAAS_ENV === "production"
        ? "https://api.asaas.com/v3"
        : "https://sandbox.asaas.com/api/v3";

if (!ASAAS_API_KEY) {
    console.error("[_shared/asaas-client] Missing ASAAS_API_KEY");
}

// ─────────────────────────────────────────────────────────────
// Supabase admin
// ─────────────────────────────────────────────────────────────

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")?.trim() || "";
const SUPABASE_SERVICE_ROLE_KEY =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim() || "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    const missing = [];
    if (!SUPABASE_URL) missing.push("SUPABASE_URL");
    if (!SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
    console.error(
        `[_shared/asaas-client] Missing env vars: ${missing.join(", ")}`
    );
}

export const supabaseAdmin = createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);

// ─────────────────────────────────────────────────────────────
// CORS + responses
// ─────────────────────────────────────────────────────────────

export const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type, asaas-access-token",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

export function corsResponse() {
    return new Response("ok", { headers: corsHeaders });
}

export function jsonResponse(data: unknown, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
}

export function errorResponse(
    message: string,
    status = 400,
    extra?: Record<string, unknown>
) {
    return jsonResponse({ error: message, ...(extra || {}) }, status);
}

// ─────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────

export async function getAuthenticatedUser(req: Request) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const token = authHeader.replace("Bearer ", "");
    const {
        data: { user },
        error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) throw new Error("Invalid or expired token");
    return user;
}

// ─────────────────────────────────────────────────────────────
// Generic helpers
// ─────────────────────────────────────────────────────────────

export function sanitizeDigits(value?: string | null) {
    return (value || "").replace(/\D/g, "");
}

export function toNullableString(value?: string | null) {
    const v = value?.trim();
    return v ? v : undefined;
}

// ─────────────────────────────────────────────────────────────
// Asaas REST API v3 HTTP Client
// ─────────────────────────────────────────────────────────────

/**
 * Generic HTTP request to Asaas API v3.
 * Uses the MAIN account API key by default.
 * Pass `apiKey` to use a subconta's key.
 */
export async function asaasRequest<T = unknown>(
    path: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
    body?: Record<string, unknown> | FormData,
    apiKey?: string
): Promise<T> {
    const key = apiKey || ASAAS_API_KEY;
    const headers: Record<string, string> = {
        access_token: key,
    };

    let fetchBody: string | FormData | undefined;

    if (body instanceof FormData) {
        fetchBody = body;
        // Let fetch set Content-Type with boundary for FormData
    } else if (body) {
        headers["Content-Type"] = "application/json";
        fetchBody = JSON.stringify(body);
    }

    const url = `${ASAAS_BASE_URL}${path}`;
    console.log(`[asaas-client] ${method} ${url}`);

    const res = await fetch(url, {
        method,
        headers,
        body: fetchBody,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        const errors = data?.errors;
        const msg =
            errors?.[0]?.description ||
            data?.message ||
            `Asaas API error (${res.status})`;
        console.error(`[asaas-client] Error: ${msg}`, data);
        const err: any = new Error(msg);
        err.raw = data;
        err.status = res.status;
        throw err;
    }

    return data as T;
}

// ─────────────────────────────────────────────────────────────
// Asaas Subconta (White-Label accounts)
// ─────────────────────────────────────────────────────────────

export interface AsaasSubAccount {
    id: string;
    name: string;
    email: string;
    cpfCnpj: string;
    phone?: string;
    mobilePhone?: string;
    address?: string;
    addressNumber?: string;
    complement?: string;
    province?: string;
    postalCode?: string;
    city?: number;
    state?: string;
    country?: string;
    apiKey: string;
    walletId: string;
    accountNumber?: {
        agency: string;
        account: string;
        accountDigit: string;
    };
    onboardingUrl?: string;
}

export interface AsaasAccountStatus {
    id: string;
    commercialInfoStatus: string;   // APPROVED, PENDING, DENIED, etc.
    bankAccountInfoStatus: string;
    documentStatus: string;
    generalStatus: string;          // APPROVED, PENDING, DENIED, etc.
}

/**
 * Create a new subconta (white-label) for a psychologist.
 */
export async function createAsaasSubAccount(params: {
    name: string;
    email: string;
    cpfCnpj: string;
    phone?: string;
    mobilePhone?: string;
    address?: string;
    addressNumber?: string;
    complement?: string;
    province?: string;
    postalCode?: string;
    city?: number;
    state?: string;
    birthDate?: string; // YYYY-MM-DD
    companyType?: string;
    incomeValue?: number;
}): Promise<AsaasSubAccount> {
    return asaasRequest<AsaasSubAccount>("/accounts", "POST", params as any);
}

/**
 * Search for an existing subconta by email using the MAIN account API key.
 * This allows discovering subaccounts created outside the app.
 */
export async function findAsaasSubAccountByEmail(
    email: string
): Promise<AsaasSubAccount | null> {
    try {
        const result = await asaasRequest<{ data: AsaasSubAccount[] }>(
            `/accounts?email=${encodeURIComponent(email)}`,
            "GET"
        );
        if (result.data && result.data.length > 0) {
            return result.data[0];
        }
        return null;
    } catch (err) {
        console.warn("[asaas-client] findAsaasSubAccountByEmail error:", err);
        return null;
    }
}

/**
 * Search for an existing subconta by CPF/CNPJ using the MAIN account API key.
 */
export async function findAsaasSubAccountByCpfCnpj(
    cpfCnpj: string
): Promise<AsaasSubAccount | null> {
    try {
        const digits = sanitizeDigits(cpfCnpj);
        if (!digits) return null;
        const result = await asaasRequest<{ data: AsaasSubAccount[] }>(
            `/accounts?cpfCnpj=${digits}`,
            "GET"
        );
        if (result.data && result.data.length > 0) {
            return result.data[0];
        }
        return null;
    } catch (err) {
        console.warn("[asaas-client] findAsaasSubAccountByCpfCnpj error:", err);
        return null;
    }
}

/**
 * Retrieve subconta status for onboarding/KYC.
 * Uses the subconta's own API key.
 */
export async function getAsaasAccountStatus(
    subAccountApiKey: string
): Promise<AsaasAccountStatus> {
    return asaasRequest<AsaasAccountStatus>(
        "/myAccount/status",
        "GET",
        undefined,
        subAccountApiKey
    );
}

/**
 * Get pending documents for subconta onboarding.
 */
export async function getAsaasPendingDocuments(
    subAccountApiKey: string
): Promise<any> {
    return asaasRequest(
        "/myAccount/documents?status=NOT_SENT&status=PENDING",
        "GET",
        undefined,
        subAccountApiKey
    );
}

/**
 * Get subconta balance.
 */
export interface AsaasBalance {
    balance: number;  // in R$ (not centavos!)
}

export async function getAsaasBalance(
    subAccountApiKey: string
): Promise<AsaasBalance> {
    return asaasRequest<AsaasBalance>(
        "/finance/balance",
        "GET",
        undefined,
        subAccountApiKey
    );
}

/**
 * Get financial transactions (statement).
 */
export async function getAsaasFinancialTransactions(
    subAccountApiKey: string,
    params?: {
        startDate?: string;
        finishDate?: string;
        offset?: number;
        limit?: number;
    }
): Promise<any> {
    const query = new URLSearchParams();
    if (params?.startDate) query.set("startDate", params.startDate);
    if (params?.finishDate) query.set("finishDate", params.finishDate);
    if (params?.offset !== undefined) query.set("offset", String(params.offset));
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    const qs = query.toString();

    return asaasRequest(
        `/financialTransactions${qs ? `?${qs}` : ""}`,
        "GET",
        undefined,
        subAccountApiKey
    );
}

// ─────────────────────────────────────────────────────────────
// Asaas Payments (Cobranças)
// ─────────────────────────────────────────────────────────────

export type AsaasBillingType =
    | "BOLETO"
    | "CREDIT_CARD"
    | "PIX"
    | "UNDEFINED"; // customer chooses

export interface AsaasPaymentCreate {
    customer: string; // Asaas customer ID
    billingType: AsaasBillingType;
    value: number; // in R$ (e.g. 150.00)
    dueDate: string; // YYYY-MM-DD
    description?: string;
    externalReference?: string;
    installmentCount?: number;
    installmentValue?: number;
    discount?: {
        value: number;
        dueDateLimitDays: number;
        type: "FIXED" | "PERCENTAGE";
    };
    interest?: { value: number };
    fine?: { value: number; type: "FIXED" | "PERCENTAGE" };
    postalService?: boolean;
    split?: Array<{
        walletId: string;
        fixedValue?: number;
        percentualValue?: number;
    }>;
}

export interface AsaasPaymentResponse {
    id: string;
    customer: string;
    billingType: string;
    value: number;
    netValue: number;
    status: string; // PENDING, RECEIVED, CONFIRMED, OVERDUE, REFUNDED, etc.
    description?: string;
    externalReference?: string;
    invoiceUrl: string;
    bankSlipUrl?: string;
    transactionReceiptUrl?: string;
    dueDate: string;
    paymentDate?: string;
    confirmedDate?: string;
    originalDueDate?: string;
    pixTransaction?: {
        qrCode?: {
            encodedImage: string;
            payload: string;
            expirationDate: string;
        };
    };
    nossoNumero?: string;
    deleted: boolean;
    dateCreated: string;
}

/**
 * Create a payment (cobrança) on a subconta.
 * First ensures the customer exists in Asaas (creates if needed).
 */
export async function createAsaasPayment(
    subAccountApiKey: string,
    params: AsaasPaymentCreate
): Promise<AsaasPaymentResponse> {
    return asaasRequest<AsaasPaymentResponse>(
        "/payments",
        "POST",
        params as any,
        subAccountApiKey
    );
}

/**
 * Get QR Code for a Pix payment.
 */
export async function getAsaasPixQrCode(
    subAccountApiKey: string,
    paymentId: string
): Promise<{ encodedImage: string; payload: string; expirationDate: string }> {
    return asaasRequest(
        `/payments/${paymentId}/pixQrCode`,
        "GET",
        undefined,
        subAccountApiKey
    );
}

/**
 * Refund a payment.
 */
export async function refundAsaasPayment(
    subAccountApiKey: string,
    paymentId: string,
    value?: number
): Promise<any> {
    const body: Record<string, unknown> = {};
    if (value !== undefined) body.value = value;
    return asaasRequest(
        `/payments/${paymentId}/refund`,
        "POST",
        Object.keys(body).length > 0 ? body : undefined,
        subAccountApiKey
    );
}

// ─────────────────────────────────────────────────────────────
// Asaas Customers (Clientes da subconta)
// ─────────────────────────────────────────────────────────────

export interface AsaasCustomer {
    id: string;
    name: string;
    email?: string;
    cpfCnpj: string;
    phone?: string;
    mobilePhone?: string;
    externalReference?: string;
}

export async function findOrCreateAsaasCustomer(
    subAccountApiKey: string,
    params: {
        name: string;
        cpfCnpj: string;
        email?: string;
        phone?: string;
        externalReference?: string;
    }
): Promise<AsaasCustomer> {
    // Try to find by cpfCnpj first
    const cpf = sanitizeDigits(params.cpfCnpj);
    if (cpf) {
        const existing = await asaasRequest<{ data: AsaasCustomer[] }>(
            `/customers?cpfCnpj=${cpf}`,
            "GET",
            undefined,
            subAccountApiKey
        );
        if (existing.data && existing.data.length > 0) {
            return existing.data[0];
        }
    }

    // Try by external reference
    if (params.externalReference) {
        const existing = await asaasRequest<{ data: AsaasCustomer[] }>(
            `/customers?externalReference=${params.externalReference}`,
            "GET",
            undefined,
            subAccountApiKey
        );
        if (existing.data && existing.data.length > 0) {
            return existing.data[0];
        }
    }

    // Create new customer
    return asaasRequest<AsaasCustomer>(
        "/customers",
        "POST",
        {
            name: params.name,
            cpfCnpj: cpf || "00000000000", // Fallback for sandbox
            email: params.email,
            phone: params.phone,
            externalReference: params.externalReference,
        },
        subAccountApiKey
    );
}

// ─────────────────────────────────────────────────────────────
// Asaas Transfers (Saques / Payouts)
// ─────────────────────────────────────────────────────────────

export interface AsaasTransferResponse {
    id: string;
    value: number;
    status: string; // PENDING, BANK_PROCESSING, DONE, FAILED, CANCELLED
    transferFee: number;
    dateCreated: string;
    scheduleDate?: string;
    transactionReceiptUrl?: string;
}

/**
 * Transfer to bank account (payout).
 */
export async function createAsaasTransfer(
    subAccountApiKey: string,
    params: {
        value: number; // R$
        bankAccount?: {
            bank: { code: string };
            accountName: string;
            ownerName: string;
            cpfCnpj: string;
            agency: string;
            account: string;
            accountDigit: string;
            bankAccountType: "CONTA_CORRENTE" | "CONTA_POUPANCA";
        };
        operationType: "PIX" | "TED" | "INTERNAL";
        pixAddressKey?: string;
        description?: string;
    }
): Promise<AsaasTransferResponse> {
    return asaasRequest<AsaasTransferResponse>(
        "/transfers",
        "POST",
        params as any,
        subAccountApiKey
    );
}

// ─────────────────────────────────────────────────────────────
// Asaas Payment Links
// ─────────────────────────────────────────────────────────────

export async function createAsaasPaymentLink(
    subAccountApiKey: string,
    params: {
        name: string;
        description?: string;
        value: number;
        billingType: AsaasBillingType;
        chargeType: "DETACHED" | "RECURRENT" | "INSTALLMENT";
        dueDateLimitDays?: number;
        maxInstallmentCount?: number;
    }
): Promise<any> {
    return asaasRequest(
        "/paymentLinks",
        "POST",
        params as any,
        subAccountApiKey
    );
}

// ─────────────────────────────────────────────────────────────
// Financial account state (DB helpers)
// ─────────────────────────────────────────────────────────────

export type FinancialUiStatus =
    | "not_started"
    | "onboarding"
    | "pending_review"
    | "restricted"
    | "active"
    | "account_missing";

/**
 * Derive UI status from Asaas account status response.
 */
export function deriveUiStatusFromAsaasAccount(
    accountStatus: AsaasAccountStatus
): FinancialUiStatus {
    const general = accountStatus.generalStatus;

    if (general === "APPROVED") return "active";
    if (general === "PENDING" || general === "AWAITING_ACTION_AUTHORIZATION")
        return "pending_review";
    if (general === "DENIED" || general === "REJECTED") return "restricted";

    // Check individual statuses
    if (
        accountStatus.documentStatus === "NOT_SENT" ||
        accountStatus.commercialInfoStatus === "NOT_SENT"
    ) {
        return "onboarding";
    }

    return "pending_review";
}

export async function getFinancialAccount(userId: string) {
    const { data, error } = await supabaseAdmin
        .from("financial_accounts")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

    if (error) throw error;
    return data;
}

export async function getFinancialAccountByAsaasId(asaasAccountId: string) {
    const { data, error } = await supabaseAdmin
        .from("financial_accounts")
        .select("*")
        .eq("asaas_account_id", asaasAccountId)
        .maybeSingle();

    if (error) throw error;
    return data;
}

export async function upsertFinancialAccountRecord(
    userId: string,
    patch: Record<string, unknown>
) {
    const existing = await getFinancialAccount(userId);

    if (existing) {
        const { data, error } = await supabaseAdmin
            .from("financial_accounts")
            .update({
                ...patch,
                updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    const { data, error } = await supabaseAdmin
        .from("financial_accounts")
        .insert({
            user_id: userId,
            provider: "asaas",
            ...patch,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function markFinancialAccountMissing(financialAccountId: string) {
    const { error } = await supabaseAdmin
        .from("financial_accounts")
        .update({
            status: "account_missing",
            charges_enabled: false,
            payouts_enabled: false,
            details_submitted: false,
            updated_at: new Date().toISOString(),
        })
        .eq("id", financialAccountId);

    if (error) throw error;
}

export async function syncFinancialAccountFromAsaas(
    financialAccountId: string,
    accountStatus: AsaasAccountStatus
) {
    const uiStatus = deriveUiStatusFromAsaasAccount(accountStatus);
    const isActive = uiStatus === "active";

    const payload: Record<string, unknown> = {
        status: uiStatus,
        charges_enabled: isActive,
        payouts_enabled: isActive,
        details_submitted:
            accountStatus.commercialInfoStatus !== "NOT_SENT",
        requirements: accountStatus,
        updated_at: new Date().toISOString(),
    };

    if (isActive) {
        payload.onboarding_completed_at = new Date().toISOString();
    }

    const { error } = await supabaseAdmin
        .from("financial_accounts")
        .update(payload)
        .eq("id", financialAccountId);

    if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// Balance (from Asaas API — no local ledger)
// ─────────────────────────────────────────────────────────────

export async function getBalanceFromAsaas(
    subAccountApiKey: string
) {
    const balanceData = await getAsaasBalance(subAccountApiKey);

    // Asaas returns balance in R$ (reais), convert to centavos
    const availableCentavos = Math.round((balanceData.balance || 0) * 100);

    return { available: availableCentavos, pending: 0 };
}

// ─────────────────────────────────────────────────────────────
// Fees
// ─────────────────────────────────────────────────────────────

export function calculateFees(
    grossAmountCentavos: number,
    feePercent = 4.9,
    feeFixedCentavos = 50
) {
    const percentFee = Math.round((grossAmountCentavos * feePercent) / 100);
    const totalFee = percentFee + feeFixedCentavos;
    const netAmount = grossAmountCentavos - totalFee;

    return { totalFee, netAmount, percentFee, feeFixedCentavos };
}

// ─────────────────────────────────────────────────────────────
// Webhook auth validation
// ─────────────────────────────────────────────────────────────

export function validateAsaasWebhookToken(req: Request): boolean {
    if (!ASAAS_WEBHOOK_TOKEN) {
        console.warn("[asaas-client] No ASAAS_WEBHOOK_TOKEN configured, skipping validation");
        return true;
    }
    const token = req.headers.get("asaas-access-token");
    return token === ASAAS_WEBHOOK_TOKEN;
}

// ─────────────────────────────────────────────────────────────
// Webhook idempotency (asaas_webhook_events)
// ─────────────────────────────────────────────────────────────

export async function isAsaasEventProcessed(eventId: string): Promise<boolean> {
    const { data, error } = await supabaseAdmin
        .from("asaas_webhook_events")
        .select("id,status")
        .eq("event_id", eventId)
        .maybeSingle();

    if (error) throw error;
    return data?.status === "processed";
}

export async function persistAsaasEvent(
    eventType: string,
    eventId: string,
    payload: unknown
) {
    const { error } = await supabaseAdmin.from("asaas_webhook_events").insert({
        event_type: eventType,
        event_id: eventId,
        payload: payload as any,
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    });

    // Ignore unique violation (duplicate insert) — dedup handled by caller
    if (error && (error as any).code !== "23505") {
        throw error;
    }
}

export async function markAsaasEventProcessed(eventId: string) {
    const { error } = await supabaseAdmin
        .from("asaas_webhook_events")
        .update({
            status: "processed",
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq("event_id", eventId);
    if (error) throw error;
}

export async function markAsaasEventFailed(eventId: string, errorMessage?: string) {
    const { error } = await supabaseAdmin
        .from("asaas_webhook_events")
        .update({
            status: "failed",
            error_message: errorMessage || null,
            updated_at: new Date().toISOString(),
        })
        .eq("event_id", eventId);
    if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// Ledger helpers (internal accounting)
// ─────────────────────────────────────────────────────────────

type LedgerAccountType = "main" | "pending" | "available" | "reserved" | "fees";

export async function ensureLedgerAccounts(
    userId: string,
    financialAccountId: string
) {
    const accountTypes: LedgerAccountType[] = [
        "main",
        "pending",
        "available",
        "reserved",
        "fees",
    ];

    // Create missing ledger accounts (unique on user_id + account_type)
    for (const accountType of accountTypes) {
        const { error } = await supabaseAdmin.from("ledger_accounts").upsert(
            {
                user_id: userId,
                financial_account_id: financialAccountId,
                account_type: accountType,
                currency: "brl",
                is_active: true,
                updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,account_type" }
        );
        if (error) throw error;
    }
}

export async function createLedgerEntries(
    userId: string,
    entries: Array<{
        accountType: LedgerAccountType;
        direction: "credit" | "debit";
        entryType:
            | "payment_received"
            | "fee"
            | "payout"
            | "refund"
            | "adjustment"
            | "invoice_issued"
            | "reserve"
            | "release";
        amount: number; // centavos
        status: "pending" | "posted" | "cancelled";
        referenceType?: "payment" | "payout" | "invoice" | "patient" | "appointment" | "adjustment";
        referenceId?: string;
        providerObjectId?: string;
        description?: string;
        metadata?: Record<string, unknown>;
    }>
) {
    // Fetch all ledger accounts for this user once
    const { data: accounts, error: accErr } = await supabaseAdmin
        .from("ledger_accounts")
        .select("id,account_type")
        .eq("user_id", userId);
    if (accErr) throw accErr;

    const idByType = new Map<string, string>();
    for (const a of accounts || []) {
        idByType.set(a.account_type, a.id);
    }

    const rows = entries.map((e) => {
        const ledgerAccountId = idByType.get(e.accountType);
        if (!ledgerAccountId) {
            throw new Error(`Ledger account missing for type: ${e.accountType}`);
        }
        return {
            ledger_account_id: ledgerAccountId,
            user_id: userId,
            direction: e.direction,
            entry_type: e.entryType,
            amount: e.amount,
            currency: "brl",
            status: e.status,
            reference_type: e.referenceType || null,
            reference_id: e.referenceId || null,
            provider_object_id: e.providerObjectId || null,
            description: e.description || null,
            metadata: e.metadata || {},
            occurred_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
        };
    });

    const { error } = await supabaseAdmin.from("ledger_entries").insert(rows);
    if (error) throw error;
}
