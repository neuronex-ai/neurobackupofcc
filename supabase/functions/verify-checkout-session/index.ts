import {
  corsResponse,
  errorResponse,
  jsonResponse,
  supabaseAdmin,
} from "../_shared/asaas-client.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return corsResponse();

  if (req.method !== "POST") {
    return errorResponse("Método não permitido.", 405);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const sessionId = String(body.session_id || body.external_reference || "").trim();

    if (!sessionId) {
      return errorResponse("Sessão de checkout não informada.", 400);
    }

    const { data: checkout, error } = await supabaseAdmin
      .from("subscription_checkout_sessions")
      .select("*")
      .eq("external_reference", sessionId)
      .maybeSingle();

    if (error) throw error;
    if (!checkout) {
      return errorResponse("Sessão de checkout não encontrada.", 404);
    }

    const { data: user } = await supabaseAdmin.auth.admin.getUserById(checkout.user_id);

    return jsonResponse({
      customer_email: user?.user?.email || "",
      customer_name: user?.user?.user_metadata?.full_name || user?.user?.email || "",
      plan_name: checkout.plan === "Professional" ? "NeuroNex Professional" : checkout.plan,
      amount_total: checkout.amount_cents,
      subscription_id: checkout.provider_subscription_id || checkout.provider_checkout_id || checkout.external_reference,
      status: checkout.status,
    });
  } catch (error) {
    console.error("verify-checkout-session:error", error);
    return errorResponse("Não foi possível verificar o checkout.", 500);
  }
});
