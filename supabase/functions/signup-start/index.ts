import {
  corsHeaders,
  createAdminClient,
  createSignupCode,
  findAuthUserByEmail,
  hashSignupValue,
  isValidEmail,
  jsonResponse,
  normalizeEmail,
  normalizePhone,
  sendSignupCodeEmail,
} from "../_shared/signup.ts";

const PROFESSIONAL_CONTEXTS = new Set([
  "individual_professional",
  "clinic_admin",
  "psychology_student",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Método não permitido." }, 405);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const fullName = String(body.fullName || "").trim().replace(/\s+/g, " ");
    const email = normalizeEmail(body.email);
    const recoveryEmail = normalizeEmail(body.recoveryEmail);
    const phone = normalizePhone(body.phone);
    const professionalContext = String(body.professionalContext || "").trim();

    if (fullName.split(" ").length < 2) {
      return jsonResponse({ error: "Informe seu nome completo." }, 400);
    }

    if (!isValidEmail(email)) {
      return jsonResponse({ error: "Informe um e-mail válido." }, 400);
    }

    if (recoveryEmail && !isValidEmail(recoveryEmail)) {
      return jsonResponse({ error: "Informe um e-mail de recuperação válido ou deixe em branco." }, 400);
    }

    if (!PROFESSIONAL_CONTEXTS.has(professionalContext)) {
      return jsonResponse({ error: "Selecione como você pretende usar a NeuroNex." }, 400);
    }

    const admin = createAdminClient();
    const existingUser = await findAuthUserByEmail(admin, email);
    if (existingUser) {
      return jsonResponse(
        {
          code: "email_exists",
          error: "Já existe uma conta com este e-mail. Faça login para continuar.",
        },
        409,
      );
    }

    const previousWindow = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { count } = await admin
      .from("signup_email_verifications")
      .select("id", { count: "exact", head: true })
      .eq("email", email)
      .gte("created_at", previousWindow);

    if ((count || 0) >= 5) {
      return jsonResponse(
        {
          code: "rate_limited",
          error: "Muitas tentativas em pouco tempo. Tente novamente em alguns minutos.",
        },
        429,
      );
    }

    await admin
      .from("signup_email_verifications")
      .update({
        consumed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: { superseded: true },
      })
      .eq("email", email)
      .is("consumed_at", null);

    const verificationId = crypto.randomUUID();
    const code = createSignupCode();
    const codeHash = await hashSignupValue(`${verificationId}:${email}:${code}`);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const { error: insertError } = await admin.from("signup_email_verifications").insert({
      id: verificationId,
      email,
      recovery_email: recoveryEmail || null,
      full_name: fullName,
      phone,
      professional_context: professionalContext,
      code_hash: codeHash,
      expires_at: expiresAt,
      metadata: {
        userAgent: req.headers.get("user-agent") || null,
      },
    });

    if (insertError) {
      throw insertError;
    }

    await sendSignupCodeEmail({
      email,
      code,
      fullName,
    });

    return jsonResponse({
      verificationId,
      expiresIn: 15 * 60,
      resendCooldown: 45,
    });
  } catch (error) {
    console.error("signup-start:error", error);
    return jsonResponse(
      {
        error: "Não conseguimos enviar o código agora. Tente novamente em instantes.",
      },
      500,
    );
  }
});
