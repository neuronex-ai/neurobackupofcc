import {
  ASAAS_ENV,
  asaasRequest,
  corsResponse,
  errorResponse,
  getAuthenticatedUser,
  jsonResponse,
  supabaseAdmin,
} from "../_shared/asaas-client.ts";

const PROFESSIONAL_AMOUNT_CENTS = 14000;
const PROFESSIONAL_AMOUNT = PROFESSIONAL_AMOUNT_CENTS / 100;
const CHECKOUT_EXPIRATION_MINUTES = 120;

type CheckoutRequest = {
  planId?: string;
  name?: string;
  email?: string;
  cpfCnpj?: string;
};

type AsaasCheckoutResponse = {
  id?: string;
  object?: string;
  status?: string;
  [key: string]: unknown;
};

const checkoutUrlFor = (checkoutId: string) =>
  `https://asaas.com/checkoutSession/show?id=${encodeURIComponent(checkoutId)}`;

const digitsOnly = (value?: string | null) => String(value || "").replace(/\D/g, "");

const normalizePlan = (planId?: string) => {
  const normalized = String(planId || "Professional")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return normalized === "profissional" || normalized === "professional" ? "Professional" : null;
};

const resolveAppUrl = (req: Request) => {
  const configured =
    Deno.env.get("PUBLIC_APP_URL") ||
    Deno.env.get("APP_URL") ||
    Deno.env.get("SITE_URL") ||
    req.headers.get("origin") ||
    "https://neuronex.ai";
  return configured.replace(/\/+$/, "");
};

async function getProfileName(userId: string) {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("full_name,name,first_name,last_name")
    .eq("id", userId)
    .maybeSingle();

  const profile = data as any;
  const joinedName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim();
  return profile?.full_name || profile?.name || joinedName || "";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return corsResponse();

  if (req.method !== "POST") {
    return errorResponse("Método não permitido.", 405);
  }

  try {
    const user = await getAuthenticatedUser(req);
    const body = (await req.json().catch(() => ({}))) as CheckoutRequest;
    const plan = normalizePlan(body.planId);

    if (!plan) {
      return errorResponse("Plano inválido para checkout.", 400);
    }

    const now = new Date();
    const externalReference = `nnx_${user.id}_${now.getTime()}`;
    const appUrl = resolveAppUrl(req);
    const successUrl = `${appUrl}/payment/callback?status=success&session_id=${encodeURIComponent(externalReference)}`;
    const cancelUrl = `${appUrl}/payment/callback?status=cancelled&session_id=${encodeURIComponent(externalReference)}`;
    const expiredUrl = `${appUrl}/payment/callback?status=expired&session_id=${encodeURIComponent(externalReference)}`;
    const fallbackName = await getProfileName(user.id);
    const customerName = String(body.name || fallbackName || user.email || "Cliente NeuroNex").trim();
    const customerEmail = String(body.email || user.email || "").trim();
    const cpfCnpj = digitsOnly(body.cpfCnpj);
    const customerData: Record<string, unknown> = {
      name: customerName,
      email: customerEmail,
    };

    if (cpfCnpj && !/^0+$/.test(cpfCnpj) && (cpfCnpj.length === 11 || cpfCnpj.length === 14)) {
      customerData.cpfCnpj = cpfCnpj;
    }

    const pendingPayload = {
      user_id: user.id,
      plan,
      provider: "asaas",
      external_reference: externalReference,
      amount_cents: PROFESSIONAL_AMOUNT_CENTS,
      currency: "BRL",
      status: "pending",
      metadata: {
        source: "create-checkout-session",
        asaas_environment: ASAAS_ENV,
      },
      updated_at: now.toISOString(),
    };

    const { error: insertError } = await supabaseAdmin
      .from("subscription_checkout_sessions")
      .insert(pendingPayload);

    if (insertError) throw insertError;

    const checkout = await asaasRequest<AsaasCheckoutResponse>("/checkouts", "POST", {
      billingTypes: ["CREDIT_CARD", "PIX"],
      chargeTypes: ["RECURRENT"],
      minutesToExpire: CHECKOUT_EXPIRATION_MINUTES,
      externalReference,
      callback: {
        cancelUrl,
        expiredUrl,
        successUrl,
      },
      items: [
        {
          name: "NeuroNex Profissional",
          description: "Plano Profissional NeuroNex AI - assinatura mensal",
          quantity: 1,
          value: PROFESSIONAL_AMOUNT,
        },
      ],
      customerData,
      subscription: {
        cycle: "MONTHLY",
        nextDueDate: now.toISOString().slice(0, 10),
      },
    });

    const checkoutId = String(checkout.id || "");
    if (!checkoutId) {
      return errorResponse("Asaas não retornou o identificador do checkout.", 502, { provider: "asaas" });
    }

    const checkoutUrl = checkoutUrlFor(checkoutId);
    const { error: updateError } = await supabaseAdmin
      .from("subscription_checkout_sessions")
      .update({
        provider_checkout_id: checkoutId,
        checkout_url: checkoutUrl,
        status: "created",
        metadata: {
          source: "create-checkout-session",
          asaas_environment: ASAAS_ENV,
          asaas_checkout: checkout,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("external_reference", externalReference);

    if (updateError) throw updateError;

    return jsonResponse({
      url: checkoutUrl,
      session_id: externalReference,
      provider_checkout_id: checkoutId,
      provider: "asaas",
      plan,
      amount_total: PROFESSIONAL_AMOUNT_CENTS,
      currency: "BRL",
    });
  } catch (error) {
    console.error("create-checkout-session:error", error);
    return errorResponse("Não foi possível iniciar o checkout Asaas.", 500, {
      details: String((error as { message?: string })?.message || error),
    });
  }
});
