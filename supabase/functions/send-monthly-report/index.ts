import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReportSettings {
  enabled: boolean;
  send_day: number;
  include_sessions: boolean;
  include_payments: boolean;
  include_notes_summary: boolean;
  email_subject: string;
  email_intro: string;
}

interface RequestBody {
  patientId?: string;
  monthDate?: string;
  testMode?: boolean;
  settingsOverride?: Partial<ReportSettings>;
}

const DEFAULT_SETTINGS: ReportSettings = {
  enabled: false,
  send_day: 1,
  include_sessions: true,
  include_payments: true,
  include_notes_summary: false,
  email_subject: "Relatório mensal — {{month}}",
  email_intro: "Olá {{patientName}}, segue o resumo do seu acompanhamento no período de {{month}}.",
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const toBase64 = (value: string) => {
  const bytes = new TextEncoder().encode(value);
  const binary = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join("");
  return btoa(binary);
};

const toUrlSafeBase64 = (value: string) =>
  toBase64(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const sanitizeHeader = (value: unknown, fallback: string) => {
  const clean = String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
  return clean || fallback;
};

const normalizeSettings = (value?: Partial<ReportSettings> | null): ReportSettings => ({
  ...DEFAULT_SETTINGS,
  ...(value || {}),
  enabled: Boolean(value?.enabled ?? DEFAULT_SETTINGS.enabled),
  send_day: Math.max(1, Math.min(28, Number(value?.send_day ?? DEFAULT_SETTINGS.send_day))),
  include_sessions: Boolean(value?.include_sessions ?? DEFAULT_SETTINGS.include_sessions),
  include_payments: Boolean(value?.include_payments ?? DEFAULT_SETTINGS.include_payments),
  // Clinical AI summaries are deliberately never sent until a dedicated
  // professional approval workflow exists.
  include_notes_summary: false,
  email_subject: String(value?.email_subject ?? DEFAULT_SETTINGS.email_subject).slice(0, 180),
  email_intro: String(value?.email_intro ?? DEFAULT_SETTINGS.email_intro).slice(0, 2000),
});

const applyVariables = (template: string, patientName: string, displayMonth: string) =>
  template
    .replace(/\{\{patientName\}\}/g, patientName)
    .replace(/\{\{month\}\}/g, displayMonth);

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

const getReportPeriod = (monthDate?: string) => {
  let reference: Date;

  if (monthDate) {
    reference = new Date(monthDate);
    if (Number.isNaN(reference.getTime())) {
      throw new Error("Mês de referência inválido.");
    }
  } else {
    const now = new Date();
    reference = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  }

  const start = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), 1));
  const endExclusive = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth() + 1, 1));
  const displayMonth = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(start);

  return {
    start,
    endExclusive,
    startISO: start.toISOString(),
    endExclusiveISO: endExclusive.toISOString(),
    startDate: start.toISOString().slice(0, 10),
    endExclusiveDate: endExclusive.toISOString().slice(0, 10),
    displayMonth: displayMonth.charAt(0).toUpperCase() + displayMonth.slice(1),
  };
};

async function refreshAccessToken(
  supabaseService: ReturnType<typeof createClient>,
  userId: string,
  refreshToken: string,
) {
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID")?.trim();
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")?.trim();

  if (!clientId || !clientSecret) {
    throw new Error("Credenciais Google não configuradas no servidor.");
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }).toString(),
  });

  if (!tokenResponse.ok) {
    const details = await tokenResponse.text();
    console.error("[send-monthly-report] Google token refresh failed:", details);
    throw new Error("Não foi possível renovar a conexão com o Google.");
  }

  const tokens = await tokenResponse.json();
  const expiresAt = new Date(Date.now() + Number(tokens.expires_in || 3600) * 1000);

  const { error } = await supabaseService
    .from("user_google_tokens")
    .update({
      access_token: tokens.access_token,
      expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    console.error("[send-monthly-report] Failed to persist refreshed token:", error);
  }

  return String(tokens.access_token);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Método não permitido." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Configuração do servidor incompleta." }, 500);
  }

  const supabaseService = createClient(supabaseUrl, serviceRoleKey);

  try {
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return jsonResponse({ error: "Autenticação necessária." }, 401);
    }

    const jwt = authHeader.slice("Bearer ".length).trim();
    const { data: authData, error: authError } = await supabaseService.auth.getUser(jwt);
    const user = authData.user;

    if (authError || !user) {
      return jsonResponse({ error: "Sessão inválida ou expirada." }, 401);
    }

    let body: RequestBody;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Corpo da requisição inválido." }, 400);
    }

    const testMode = body.testMode === true;
    const period = getReportPeriod(body.monthDate);

    const { data: storedSettings, error: settingsError } = await supabaseService
      .from("monthly_report_settings")
      .select("enabled, send_day, include_sessions, include_payments, include_notes_summary, email_subject, email_intro")
      .eq("user_id", user.id)
      .maybeSingle();

    if (settingsError) {
      throw new Error("Não foi possível carregar as configurações do relatório.");
    }

    const settings = normalizeSettings({
      ...(storedSettings || {}),
      ...(testMode ? body.settingsOverride || {} : {}),
    });

    if (!testMode && (!storedSettings || !settings.enabled)) {
      return jsonResponse({
        success: true,
        sent: false,
        reason: "monthly_reports_disabled",
        message: "O envio mensal está desativado.",
      });
    }

    if (!testMode) {
      const { data: notificationSettings, error: notificationError } = await supabaseService
        .from("user_notification_settings")
        .select("email_enabled, email_monthly_reports")
        .eq("user_id", user.id)
        .maybeSingle();

      if (notificationError) {
        throw new Error("Não foi possível verificar as preferências de e-mail.");
      }

      if (
        notificationSettings &&
        (notificationSettings.email_enabled === false || notificationSettings.email_monthly_reports === false)
      ) {
        return jsonResponse({
          success: true,
          sent: false,
          reason: "email_channel_disabled",
          message: "O canal de e-mail para relatórios está desativado.",
        });
      }
    }

    const warnings: string[] = [];
    if (storedSettings?.include_notes_summary || body.settingsOverride?.include_notes_summary) {
      warnings.push("clinical_summary_requires_professional_approval");
    }

    let recipientEmail: string;
    let patientName: string;
    let patientId: string | null = null;

    if (testMode) {
      if (!user.email) {
        return jsonResponse({ error: "Sua conta não possui e-mail para receber o teste." }, 400);
      }
      recipientEmail = user.email;
      patientName = "Paciente de exemplo";
    } else {
      if (!body.patientId) {
        return jsonResponse({ error: "Paciente não informado." }, 400);
      }

      const { data: patient, error: patientError } = await supabaseService
        .from("patients")
        .select("id, name, email")
        .eq("id", body.patientId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (patientError) {
        throw new Error("Não foi possível carregar os dados do paciente.");
      }
      if (!patient) {
        return jsonResponse({ error: "Paciente não encontrado para esta conta." }, 404);
      }
      if (!patient.email) {
        return jsonResponse({ error: "O paciente não possui e-mail cadastrado." }, 400);
      }

      patientId = patient.id;
      patientName = patient.name || "Paciente";
      recipientEmail = patient.email;
    }

    const safeRecipient = sanitizeHeader(recipientEmail, "");
    if (!safeRecipient || !safeRecipient.includes("@")) {
      return jsonResponse({ error: "E-mail de destino inválido." }, 400);
    }

    let attendedCount = 0;
    let absentCount = 0;
    let attendanceRate: number | null = null;
    let receivedAmount = 0;
    let pendingAmount = 0;

    if (testMode) {
      attendedCount = 4;
      absentCount = 1;
      attendanceRate = 80;
      receivedAmount = 720;
      pendingAmount = 180;
    } else if (patientId) {
      if (settings.include_sessions) {
        const { data: appointments, error: appointmentsError } = await supabaseService
          .from("appointments")
          .select("status")
          .eq("user_id", user.id)
          .eq("patient_id", patientId)
          .gte("start_time", period.startISO)
          .lt("start_time", period.endExclusiveISO);

        if (appointmentsError) {
          throw new Error("Não foi possível calcular o resumo de sessões.");
        }

        attendedCount = (appointments || []).filter((item) =>
          item.status === "attended" || item.status === "completed"
        ).length;
        absentCount = (appointments || []).filter((item) => item.status === "absent").length;
        const attendanceBase = attendedCount + absentCount;
        attendanceRate = attendanceBase > 0 ? Math.round((attendedCount / attendanceBase) * 100) : null;
      }

      if (settings.include_payments) {
        const { data: transactions, error: transactionsError } = await supabaseService
          .from("transactions")
          .select("amount, type, status")
          .eq("user_id", user.id)
          .eq("patient_id", patientId)
          .eq("type", "income")
          .gte("date", period.startDate)
          .lt("date", period.endExclusiveDate);

        if (transactionsError) {
          throw new Error("Não foi possível calcular o resumo financeiro.");
        }

        for (const transaction of transactions || []) {
          const amount = Number(transaction.amount || 0);
          if (!Number.isFinite(amount)) continue;
          if (transaction.status === "paid" || transaction.status === "completed") {
            receivedAmount += amount;
          } else if (transaction.status === "pending") {
            pendingAmount += amount;
          }
        }
      }
    }

    const { data: tokenData, error: tokenError } = await supabaseService
      .from("user_google_tokens")
      .select("access_token, refresh_token, expires_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (tokenError) {
      throw new Error("Não foi possível verificar a conexão com o Google.");
    }
    if (!tokenData) {
      return jsonResponse({ error: "Conecte uma conta Google antes de enviar relatórios." }, 409);
    }

    let accessToken = String(tokenData.access_token);
    if (new Date(tokenData.expires_at).getTime() < Date.now() + 60_000) {
      accessToken = await refreshAccessToken(
        supabaseService,
        user.id,
        String(tokenData.refresh_token),
      );
    }

    const { data: profile } = await supabaseService
      .from("profiles")
      .select("full_name, first_name, last_name, clinic_name")
      .eq("id", user.id)
      .maybeSingle();

    const professionalName =
      profile?.clinic_name ||
      profile?.full_name ||
      [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
      "NeuroNex";

    const renderedSubject = sanitizeHeader(
      applyVariables(settings.email_subject, patientName, period.displayMonth),
      `Relatório mensal — ${period.displayMonth}`,
    );
    const renderedIntro = escapeHtml(
      applyVariables(settings.email_intro, patientName, period.displayMonth),
    ).replace(/\n/g, "<br/>");

    const sessionSection = settings.include_sessions
      ? `
        <tr>
          <td style="padding: 0 40px 24px 40px;">
            <table role="presentation" style="width: 100%; border-collapse: separate; border-spacing: 12px 0; margin-left: -12px;">
              <tr>
                <td style="width: 33.33%; background-color: #F4F4F5; padding: 20px 12px; border-radius: 16px; border: 1px solid #E4E4E7; text-align: center;">
                  <div style="font-size: 30px; font-weight: 800; color: #18181B; line-height: 1;">${attendedCount}</div>
                  <div style="font-size: 10px; color: #71717A; text-transform: uppercase; font-weight: 700; margin-top: 8px; letter-spacing: 1px;">Realizadas</div>
                </td>
                <td style="width: 33.33%; background-color: #F4F4F5; padding: 20px 12px; border-radius: 16px; border: 1px solid #E4E4E7; text-align: center;">
                  <div style="font-size: 30px; font-weight: 800; color: #18181B; line-height: 1;">${absentCount}</div>
                  <div style="font-size: 10px; color: #71717A; text-transform: uppercase; font-weight: 700; margin-top: 8px; letter-spacing: 1px;">Faltas</div>
                </td>
                <td style="width: 33.33%; background-color: #18181B; padding: 20px 12px; border-radius: 16px; border: 1px solid #27272A; text-align: center;">
                  <div style="font-size: 30px; font-weight: 800; color: #FFFFFF; line-height: 1;">${attendanceRate === null ? "—" : `${attendanceRate}%`}</div>
                  <div style="font-size: 10px; color: #A1A1AA; text-transform: uppercase; font-weight: 700; margin-top: 8px; letter-spacing: 1px;">Frequência</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>`
      : "";

    const paymentSection = settings.include_payments
      ? `
        <tr>
          <td style="padding: 0 40px 32px 40px;">
            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #FAFAFA; border: 1px solid #E4E4E7; border-radius: 16px; overflow: hidden;">
              <tr>
                <td style="padding: 18px 20px; border-bottom: 1px solid #E4E4E7; color: #52525B; font-size: 13px;">Pagamentos identificados no período</td>
                <td style="padding: 18px 20px; border-bottom: 1px solid #E4E4E7; color: #18181B; font-size: 14px; font-weight: 700; text-align: right;">${escapeHtml(formatCurrency(receivedAmount))}</td>
              </tr>
              <tr>
                <td style="padding: 18px 20px; color: #52525B; font-size: 13px;">Valores pendentes</td>
                <td style="padding: 18px 20px; color: #18181B; font-size: 14px; font-weight: 700; text-align: right;">${escapeHtml(formatCurrency(pendingAmount))}</td>
              </tr>
            </table>
          </td>
        </tr>`
      : "";

    const emptySections = !settings.include_sessions && !settings.include_payments
      ? `
        <tr>
          <td style="padding: 0 40px 32px 40px;">
            <div style="padding: 20px; border-radius: 16px; background-color: #FAFAFA; border: 1px solid #E4E4E7; color: #71717A; font-size: 13px; line-height: 1.6;">
              Este relatório contém apenas a mensagem personalizada definida pelo profissional.
            </div>
          </td>
        </tr>`
      : "";

    const fullHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin: 0; padding: 0; background-color: #F4F4F5; font-family: Arial, Helvetica, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" style="width: 100%; max-width: 620px; background-color: #FFFFFF; border-radius: 24px; overflow: hidden; border: 1px solid #E4E4E7;">
          <tr>
            <td style="background-color: #09090B; padding: 38px 40px; text-align: left;">
              <p style="color: #A1A1AA; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 10px 0;">Relatório mensal</p>
              <h1 style="margin: 0; color: #FFFFFF; font-size: 27px; letter-spacing: -0.5px;">${escapeHtml(period.displayMonth)}</h1>
              <p style="margin: 18px 0 0 0; color: #D4D4D8; font-size: 13px;">${escapeHtml(patientName)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 36px 40px 28px 40px;">
              <p style="font-size: 15px; color: #3F3F46; line-height: 1.7; margin: 0;">${renderedIntro}</p>
            </td>
          </tr>
          ${sessionSection}
          ${paymentSection}
          ${emptySections}
          <tr>
            <td style="background-color: #FAFAFA; padding: 22px 40px; text-align: center; border-top: 1px solid #E4E4E7;">
              <p style="margin: 0; font-size: 11px; color: #71717A; font-weight: 600;">${escapeHtml(professionalName)} • enviado pelo NeuroNex</p>
              ${testMode ? '<p style="margin: 7px 0 0 0; font-size: 10px; color: #A1A1AA;">Mensagem de teste — nenhum paciente recebeu este e-mail.</p>' : ""}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const senderEmail = sanitizeHeader(user.email || "", "");
    if (!senderEmail) {
      return jsonResponse({ error: "Sua conta não possui e-mail de remetente válido." }, 400);
    }

    const rawEmail = [
      `To: ${safeRecipient}`,
      `From: ${sanitizeHeader(professionalName, "NeuroNex")} <${senderEmail}>`,
      `Subject: =?utf-8?B?${toBase64(renderedSubject)}?=`,
      "MIME-Version: 1.0",
      "Content-Type: text/html; charset=utf-8",
      "Content-Transfer-Encoding: base64",
      "",
      toBase64(fullHtml),
    ].join("\r\n");

    const gmailResponse = await fetch("https://www.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: toUrlSafeBase64(rawEmail) }),
    });

    if (!gmailResponse.ok) {
      const details = await gmailResponse.text();
      console.error("[send-monthly-report] Gmail send failed:", details);
      throw new Error("O Google recusou o envio. Reconecte sua conta e tente novamente.");
    }

    const gmailData = await gmailResponse.json();

    return jsonResponse({
      success: true,
      sent: true,
      testMode,
      recipient: safeRecipient,
      providerMessageId: gmailData?.id || null,
      period: {
        start: period.startDate,
        endExclusive: period.endExclusiveDate,
      },
      warnings,
    });
  } catch (error) {
    console.error("[send-monthly-report] Error:", error);
    const message = error instanceof Error ? error.message : "Erro inesperado ao enviar o relatório.";
    return jsonResponse({ error: message }, 500);
  }
});
