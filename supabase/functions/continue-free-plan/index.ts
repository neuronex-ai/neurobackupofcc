import {
  corsResponse,
  errorResponse,
  getAuthenticatedUser,
  jsonResponse,
  supabaseAdmin,
} from "../_shared/asaas-client.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return corsResponse();

  if (req.method !== "POST") {
    return errorResponse("Método não permitido.", 405);
  }

  try {
    const user = await getAuthenticatedUser(req);
    const now = new Date().toISOString();

    const { data: subscription, error } = await supabaseAdmin
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw error;

    const metadata = {
      ...((subscription?.metadata || {}) as Record<string, unknown>),
      continued_free_at: now,
      previous_plan: subscription?.plan || "Professional",
      previous_status: subscription?.status || "trialing",
    };

    if (subscription?.id) {
      const { error: updateError } = await supabaseAdmin
        .from("user_subscriptions")
        .update({
          plan: "Essential",
          status: "active",
          current_period_start: now,
          current_period_end: null,
          canceled_at: null,
          metadata,
          updated_at: now,
        })
        .eq("id", subscription.id);
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabaseAdmin
        .from("user_subscriptions")
        .insert({
          user_id: user.id,
          plan: "Essential",
          status: "active",
          current_period_start: now,
          metadata,
          updated_at: now,
        });
      if (insertError) throw insertError;
    }

    return jsonResponse({ ok: true, plan: "Essential", status: "active" });
  } catch (error) {
    console.error("continue-free-plan:error", error);
    return errorResponse("Não foi possível continuar no plano gratuito.", 500);
  }
});
