import {
  ASAAS_ENV,
  asaasRequest,
  errorResponse,
  getAuthenticatedUser,
  sanitizeDigits,
  supabaseAdmin,
} from "./asaas-client.ts";

export const TRIAL_DAYS = 7;
export const PROFESSIONAL_PLAN_CODE = "professional";
export const PROFESSIONAL_PLAN_NAME = "Professional";
export const PROFESSIONAL_AMOUNT_CENTS = 14000;
export const CHECKOUT_EXPIRATION_MINUTES = 120;

export const PLAN_BY_CODE: Record<string, "Essential" | "Professional" | "Enterprise"> = {
  essential: "Essential",
  professional: "Professional",
  enterprise: "Enterprise",
};

export const PLAN_CODE_BY_NAME: Record<string, "essential" | "professional" | "enterprise"> = {
  essential: "essential",
  professional: "professional",
  profissional: "professional",
  enterprise: "enterprise",
};

const PAID_ACCESS_STATUSES = new Set(["active", "trialing", "admin_override"]);
const USABLE_ACCESS_STATES = new Set(["paid_access", "trial_access", "limited_access", "admin_override"]);
const UPSELL_STATUSES = new Set([
  "trial_expired",
  "checkout_pending",
  "payment_pending",
  "past_due",
  "grace_period",
  "blocked",
  "canceled",
  "refunded",
  "chargeback",
  "internal_error",
]);

type SupabaseUser = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
};

export function normalizePlanCode(planId?: string | null) {
  const normalized = String(planId || PROFESSIONAL_PLAN_NAME)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return PLAN_CODE_BY_NAME[normalized] || null;
}

export function publicPlanName(planCode?: string | null) {
  return PLAN_BY_CODE[String(planCode || "essential").toLowerCase()] || "Essential";
}

export function isoNow() {
  return new Date().toISOString();
}

export function addDaysIso(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function isTrialExpired(subscription: any) {
  if (subscription?.status !== "trialing" || !subscription?.trial_ends_at) return false;
  const endsAt = new Date(subscription.trial_ends_at).getTime();
  return Number.isFinite(endsAt) && endsAt <= Date.now();
}

export function accessStateFor(status: string, planCode = PROFESSIONAL_PLAN_CODE) {
  if (status === "admin_override") return "admin_override";
  if (status === "trialing") return "trial_access";
  if (status === "active") return planCode === "essential" ? "limited_access" : "paid_access";
  return "blocked";
}

export function statusRequiresUpsell(status: string) {
  return UPSELL_STATUSES.has(status);
}

export function canUseCurrentAccess(status: string, accessState: string) {
  return PAID_ACCESS_STATUSES.has(status) && USABLE_ACCESS_STATES.has(accessState);
}

export function subscriptionMessage(status: string, plan: string) {
  switch (status) {
    case "trialing":
      return "Seu teste gratis esta ativo.";
    case "trial_expired":
      return "Seu teste gratis terminou. Assine para continuar usando os recursos pagos.";
    case "checkout_pending":
      return "Seu checkout esta em andamento. Conclua o pagamento para liberar o plano.";
    case "payment_pending":
      return "Estamos aguardando a confirmacao do pagamento.";
    case "past_due":
    case "grace_period":
      return "Existe uma cobranca pendente. Regularize para manter o acesso.";
    case "blocked":
      return "Seu acesso aos recursos pagos esta bloqueado.";
    case "canceled":
      return "Sua assinatura foi cancelada.";
    case "refunded":
      return "O pagamento da assinatura foi estornado.";
    case "chargeback":
      return "Ha uma contestacao de pagamento em aberto.";
    case "internal_error":
      return "Nao conseguimos sincronizar sua assinatura agora.";
    case "admin_override":
      return "Seu acesso foi liberado manualmente pela equipe NeuroNex.";
    case "active":
      return plan === "Essential" ? "Voce esta no plano Essential." : "Sua assinatura esta ativa.";
    default:
      return "Assinatura pendente de regularizacao.";
  }
}

export function reactFeatureShape(features: Record<string, unknown>, limits: Record<string, unknown>) {
  const patientLimit = limits?.patients;

  return {
    maxPatients:
      patientLimit === "unlimited" || patientLimit === null || typeof patientLimit === "undefined"
        ? "unlimited"
        : Number(patientLimit),
    hasAICopilot: Boolean(features?.ai_copilot),
    hasTelemedicine: Boolean(features?.telemedicine),
    hasAdvancedFinance: Boolean(features?.advanced_finance),
    hasPatientPortal: Boolean(features?.patient_portal),
    hasMultipleProfessionals: Boolean(features?.multiple_professionals),
    hasAdminDashboard: Boolean(features?.admin_dashboard),
    hasPerformanceReports: Boolean(features?.performance_reports),
    hasAPIAccess: Boolean(features?.api_access),
  };
}

export function buildEntitlementResponse(row: any, user?: SupabaseUser, checkout?: any) {
  const status = String(row?.effective_status || row?.status || "inactive");
  const accessState = String(row?.effective_access_state || row?.access_state || "blocked");
  const planCode = String(row?.plan_code || "essential");
  const plan = publicPlanName(planCode);
  const features = (row?.features || {}) as Record<string, unknown>;
  const limits = (row?.limits || {}) as Record<string, unknown>;
  const trialEndsAt = row?.trial_ends_at ? new Date(row.trial_ends_at) : undefined;
  const currentPeriodEnd = row?.current_period_end ? new Date(row.current_period_end) : undefined;
  const isTrial = status === "trialing";
  const daysUntilTrialEnds =
    isTrial && trialEndsAt
      ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : undefined;

  return {
    plan,
    planCode,
    status,
    accessState,
    features: reactFeatureShape(features, limits),
    rawFeatures: features,
    limits,
    internalFlags: row?.internal_flags || {},
    isDevAccount: user?.email === "jotahub@gmail.com" || status === "admin_override",
    subscriptionId: row?.asaas_subscription_id || row?.subscription_record_id || undefined,
    checkoutSessionId: checkout?.external_reference || undefined,
    checkoutUrl: checkout?.checkout_url || undefined,
    currentPeriodEnd: currentPeriodEnd?.toISOString(),
    trialEndsAt: trialEndsAt?.toISOString(),
    isTrial,
    isTrialExpired: status === "trial_expired",
    daysUntilTrialEnds,
    hasPaidAccess: Boolean(row?.has_paid_access),
    canUseCurrentAccess: canUseCurrentAccess(status, accessState),
    requiresUpsell: Boolean(row?.requires_upsell) || statusRequiresUpsell(status),
    message: subscriptionMessage(status, plan),
  };
}

async function auditSubscription(values: Record<string, unknown>) {
  const { error } = await supabaseAdmin.from("subscription_audit_logs").insert({
    actor_type: "edge_function",
    ...values,
  });
  if (error) console.warn("[subscription-access] audit insert failed:", error);
}

export async function getUserSubscription(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function startTrialIfMissing(user: SupabaseUser) {
  const existing = await getUserSubscription(user.id);
  if (existing) return existing;

  const now = new Date();
  const trialEndsAt = addDaysIso(now, TRIAL_DAYS);
  const payload = {
    user_id: user.id,
    plan: PROFESSIONAL_PLAN_NAME,
    plan_code: PROFESSIONAL_PLAN_CODE,
    status: "trialing",
    access_state: "trial_access",
    current_period_start: now.toISOString(),
    current_period_end: trialEndsAt,
    trial_started_at: now.toISOString(),
    trial_ends_at: trialEndsAt,
    metadata: {
      source: "get-current-entitlement",
      trial_days: TRIAL_DAYS,
    },
    updated_at: now.toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from("user_subscriptions")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;

  await auditSubscription({
    user_id: user.id,
    subscription_record_id: data.id,
    action: "trial_started",
    to_status: "trialing",
    to_access_state: "trial_access",
    reason: "missing_subscription_record",
    metadata: { trial_days: TRIAL_DAYS },
  });

  return data;
}

export async function expireTrialIfNeeded(subscription: any) {
  if (!subscription || !isTrialExpired(subscription)) return subscription;

  const now = isoNow();
  const nextMetadata = {
    ...((subscription.metadata || {}) as Record<string, unknown>),
    trial_expired_at: now,
    trial_expired_by: "subscription-access",
  };

  const { data, error } = await supabaseAdmin
    .from("user_subscriptions")
    .update({
      status: "trial_expired",
      access_state: "blocked",
      blocked_at: now,
      metadata: nextMetadata,
      status_version: Number(subscription.status_version || 0) + 1,
      updated_at: now,
    })
    .eq("user_id", subscription.user_id)
    .eq("status", "trialing")
    .select()
    .maybeSingle();

  if (error) throw error;

  await auditSubscription({
    user_id: subscription.user_id,
    subscription_record_id: subscription.id,
    action: "trial_expired",
    from_status: "trialing",
    to_status: "trial_expired",
    from_access_state: subscription.access_state || "trial_access",
    to_access_state: "blocked",
    reason: "trial_end_reached",
    metadata: { trial_ends_at: subscription.trial_ends_at },
  });

  return data || { ...subscription, status: "trial_expired", access_state: "blocked" };
}

export async function getOpenCheckoutSession(userId: string, planCode = PROFESSIONAL_PLAN_CODE) {
  const { data, error } = await supabaseAdmin
    .from("subscription_checkout_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("plan_code", planCode)
    .in("status", ["pending", "created", "checkout_pending", "payment_pending"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;

  if (data?.expires_at && new Date(data.expires_at).getTime() <= Date.now()) {
    await supabaseAdmin
      .from("subscription_checkout_sessions")
      .update({
        status: "expired",
        error_message: "Checkout expirado localmente.",
        updated_at: isoNow(),
      })
      .eq("id", data.id);
    return null;
  }

  return data;
}

export async function readCurrentEntitlement(user: SupabaseUser) {
  let subscription = await startTrialIfMissing(user);
  subscription = await expireTrialIfNeeded(subscription);

  const { data: row, error } = await supabaseAdmin
    .from("current_subscription_entitlements")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;

  const checkout =
    await getOpenCheckoutSession(user.id, String(row?.plan_code || PROFESSIONAL_PLAN_CODE)) ||
    await getOpenCheckoutSession(user.id, PROFESSIONAL_PLAN_CODE);
  return buildEntitlementResponse(row, user, checkout);
}

export async function markProfilePlan(userId: string, plan: string) {
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ subscription_plan: plan, updated_at: isoNow() })
    .eq("id", userId);
  if (error) console.warn("[subscription-access] profile plan update failed:", error);
}

export async function findOrCreateAsaasCustomer(input: {
  userId: string;
  existingCustomerId?: string | null;
  name: string;
  email: string;
  cpfCnpj?: string | null;
}) {
  const existingCustomerId = String(input.existingCustomerId || "").trim();
  if (existingCustomerId) return existingCustomerId;

  const cpfCnpj = sanitizeDigits(input.cpfCnpj);
  if (!cpfCnpj || /^0+$/.test(cpfCnpj) || ![11, 14].includes(cpfCnpj.length)) {
    return null;
  }

  const externalReference = `neuronex_user_${input.userId}`;
  const listResult = await asaasRequest<any>(
    `/customers?cpfCnpj=${encodeURIComponent(cpfCnpj)}&limit=1`,
    "GET",
  );
  const found = Array.isArray(listResult?.data) ? listResult.data[0] : null;
  const customerId = String(found?.id || "");

  if (customerId) {
    return customerId;
  }

  const created = await asaasRequest<any>("/customers", "POST", {
    name: input.name,
    cpfCnpj,
    email: input.email || undefined,
    externalReference,
    groupName: "NeuroNex SaaS",
    notificationDisabled: false,
  });

  return String(created?.id || "") || null;
}

export function asaasCheckoutUrl(checkoutId: string) {
  return `https://asaas.com/checkoutSession/show?id=${encodeURIComponent(checkoutId)}`;
}

export function asaasBillingTypesForCheckout() {
  // Asaas Checkout RECURRENT currently allows only CREDIT_CARD.
  // Pix/boleto recurring must use a separate subscription/payment flow, not Checkout RECURRENT.
  return ["CREDIT_CARD"];
}

export function subscriptionMetadata(extra?: Record<string, unknown>) {
  return {
    source: "neuronex-saas-billing",
    asaas_environment: ASAAS_ENV,
    ...(extra || {}),
  };
}

export class SubscriptionAccessError extends Error {
  status = 402;
  code: string;
  entitlement: Record<string, unknown> | null;

  constructor(message: string, code: string, entitlement: Record<string, unknown> | null = null) {
    super(message);
    this.name = "SubscriptionAccessError";
    this.code = code;
    this.entitlement = entitlement;
  }
}

const INTERNAL_FLAG_BY_FEATURE: Record<string, string> = {
  neurodrive: "can_use_neurodrive",
  synapse: "can_use_synapse",
  neurofinance: "can_use_neurofinance",
};

export function hasEntitlementFeature(entitlement: any, featureKey: string) {
  if (!entitlement?.canUseCurrentAccess && !entitlement?.isDevAccount) return false;
  if (entitlement?.isDevAccount) return true;
  if (featureKey === "basic_access" || featureKey === "patients") return true;
  if (featureKey === "neurofinance") {
    if (entitlement?.accessState !== "paid_access" && entitlement?.status !== "admin_override") {
      return false;
    }
  }
  if (featureKey === "unlimited_patients") {
    return entitlement?.features?.maxPatients === "unlimited";
  }

  const internalFlag = INTERNAL_FLAG_BY_FEATURE[featureKey];
  if (internalFlag && entitlement?.internalFlags?.[internalFlag] === true) return true;

  return Boolean(entitlement?.rawFeatures?.[featureKey]);
}

export async function requireEntitlementForUser(user: SupabaseUser, featureKey: string) {
  const entitlement = await readCurrentEntitlement(user);

  if (!entitlement.canUseCurrentAccess && !entitlement.isDevAccount) {
    throw new SubscriptionAccessError(
      entitlement.message || "Seu acesso esta bloqueado. Regularize sua assinatura para continuar.",
      "subscription_access_blocked",
      entitlement,
    );
  }

  if (!hasEntitlementFeature(entitlement, featureKey)) {
    throw new SubscriptionAccessError(
      "Seu plano atual nao inclui este recurso.",
      "feature_not_in_plan",
      entitlement,
    );
  }

  return entitlement;
}

export async function requireRequestEntitlement(req: Request, featureKey: string) {
  const user = await getAuthenticatedUser(req);
  const entitlement = await requireEntitlementForUser(
    {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata,
    },
    featureKey,
  );

  return { user, entitlement };
}

export function isSubscriptionAccessError(error: unknown): error is SubscriptionAccessError {
  return error instanceof SubscriptionAccessError || (error as { name?: string })?.name === "SubscriptionAccessError";
}

export function subscriptionAccessErrorResponse(error: unknown) {
  if (!isSubscriptionAccessError(error)) return null;

  return errorResponse(error.message, error.status, {
    code: error.code,
    requires_upsell: true,
    entitlement: error.entitlement,
  });
}
