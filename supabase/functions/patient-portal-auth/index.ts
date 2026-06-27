import {
  corsResponse,
  errorResponse,
  jsonResponse,
  supabaseAdmin,
} from "../_shared/asaas-client.ts";
import { deliverPatientEmail, escapeHtml } from "../_shared/email-delivery.ts";
import { hmacHex } from "../_shared/patient-portal.ts";

const normalizeEmail = (value: unknown) => String(value || "").trim().toLowerCase();
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const appBaseUrl = () =>
  (Deno.env.get("PUBLIC_APP_URL") || Deno.env.get("SITE_URL") || "https://neuronexai.com.br")
    .trim()
    .replace(/\/+$/, "");

const findAuthUserByEmail = async (email: string) => {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const found = (data?.users || []).find((user) => normalizeEmail(user.email) === email);
    if (found) return found;
    if ((data?.users || []).length < 1000) break;
  }
  return null;
};

const getInviteByToken = async (token: string) => {
  if (!token) return null;
  const tokenHash = await hmacHex(token);
  const { data, error } = await supabaseAdmin
    .from("patient_portal_invites")
    .select("id,patient_id,patient_email,psychologist_user_id,status,expires_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();
  if (error) throw error;
  return data;
};

const activationRedirect = (inviteToken?: string | null) => {
  const suffix = inviteToken
    ? `/portal/ativar?token=${encodeURIComponent(inviteToken)}`
    : "/portal/ativar";
  return `${appBaseUrl()}${suffix}`;
};

const getActionLink = async (params: {
  type: "magiclink" | "recovery";
  email: string;
  redirectTo: string;
}) => {
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: params.type,
    email: params.email,
    options: {
      redirectTo: params.redirectTo,
    },
  } as any);

  if (error) throw error;
  const actionLink = (data as any)?.properties?.action_link;
  if (!actionLink) throw new Error("Não foi possível gerar link de autenticação.");
  return String(actionLink);
};

const sendPortalEmail = async (params: {
  to: string;
  subject: string;
  title: string;
  body: string;
  ctaLabel: string;
  actionUrl: string;
  psychologistUserId?: string | null;
}) => {
  const html = `
    <div style="margin:0;padding:32px;background:#050506;font-family:Inter,Arial,sans-serif;color:#f7f7f8">
      <div style="max-width:620px;margin:0 auto;border:1px solid rgba(255,255,255,.12);border-radius:28px;background:#101014;padding:32px">
        <p style="margin:0 0 12px;font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#9ca3af">Portal do Paciente</p>
        <h1 style="margin:0;font-size:30px;line-height:1.08;color:#ffffff">${escapeHtml(params.title)}</h1>
        <p style="margin:20px 0 0;color:#d4d4d8;font-size:15px;line-height:1.65">${escapeHtml(params.body)}</p>
        <a href="${escapeHtml(params.actionUrl)}" style="display:inline-block;margin-top:28px;padding:15px 22px;border-radius:16px;background:#ffffff;color:#050506;text-decoration:none;font-weight:900;font-size:13px;letter-spacing:.12em;text-transform:uppercase">${escapeHtml(params.ctaLabel)}</a>
        <p style="margin:28px 0 0;color:#71717a;font-size:12px;line-height:1.6">Se você não solicitou este acesso, ignore este e-mail.</p>
      </div>
    </div>
  `;

  return deliverPatientEmail({
    db: supabaseAdmin,
    userId: params.psychologistUserId || "00000000-0000-0000-0000-000000000000",
    senderName: "NeuroNex Segurança",
    senderEmail: "seguranca@email.neuronex.site",
    to: params.to,
    subject: params.subject,
    html,
    senderProfile: "security",
  });
};

const handleSignup = async (body: Record<string, unknown>) => {
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");
  const inviteToken = String(body.inviteToken || "").trim();

  if (!isValidEmail(email)) return errorResponse("Informe um e-mail válido.", 400);
  if (password.length < 6) return errorResponse("A senha precisa ter pelo menos 6 caracteres.", 400);

  const invite = await getInviteByToken(inviteToken);
  if (inviteToken && !invite) return errorResponse("Convite inválido ou expirado.", 400);
  if (invite && !["pending", "sent"].includes(String(invite.status))) {
    return errorResponse("Este convite não está mais disponível.", 409);
  }
  if (invite && new Date(invite.expires_at).getTime() <= Date.now()) {
    await supabaseAdmin
      .from("patient_portal_invites")
      .update({ status: "expired" })
      .eq("id", invite.id);
    return errorResponse("Este convite expirou. Solicite um novo envio.", 410);
  }
  if (invite && normalizeEmail(invite.patient_email) !== email) {
    return errorResponse("Use o mesmo e-mail que recebeu o convite.", 403);
  }

  let user = await findAuthUserByEmail(email);
  let created = false;

  if (!user) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: "patient",
        account_role: "patient",
      },
      app_metadata: {
        account_role: "patient",
        portal_source: "patient_portal_auth",
      },
    });
    if (error || !data?.user) {
      console.error("[patient-portal-auth:create-user]", error);
      return errorResponse(error?.message || "Não foi possível criar a conta do paciente.", 400);
    }
    user = data.user;
    created = true;
  } else {
    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      app_metadata: {
        ...(user.app_metadata || {}),
        account_role: (user.app_metadata as any)?.account_role || "patient",
      },
      user_metadata: {
        ...(user.user_metadata || {}),
        role: (user.user_metadata as any)?.role || "patient",
        account_role: (user.user_metadata as any)?.account_role || "patient",
      },
    } as any);
  }

  const redirectTo = activationRedirect(inviteToken);
  const actionLink = await getActionLink({ type: "magiclink", email, redirectTo });

  await sendPortalEmail({
    to: email,
    subject: created ? "Ative sua conta do Portal NeuroNex" : "Acesse seu Portal NeuroNex",
    title: created ? "Sua conta do Portal está pronta" : "Seu acesso ao Portal está pronto",
    body: "Clique no botão abaixo para entrar com segurança e concluir a ativação do Portal do Paciente.",
    ctaLabel: "Ativar conta",
    actionUrl: actionLink,
    psychologistUserId: invite?.psychologist_user_id,
  });

  return jsonResponse({
    status: created ? "created" : "existing_user",
    email,
    redirectTo,
    message: "Enviamos um e-mail de ativação para o paciente.",
  });
};

const handleResetPassword = async (body: Record<string, unknown>) => {
  const email = normalizeEmail(body.email);
  if (!isValidEmail(email)) return errorResponse("Informe um e-mail válido.", 400);

  const user = await findAuthUserByEmail(email);
  if (user) {
    const redirectTo = `${appBaseUrl()}/reset-password?next=portal`;
    const actionLink = await getActionLink({ type: "recovery", email, redirectTo });
    await sendPortalEmail({
      to: email,
      subject: "Redefinir senha do Portal NeuroNex",
      title: "Redefina sua senha",
      body: "Recebemos uma solicitação para redefinir sua senha do Portal do Paciente. Clique abaixo para criar uma nova senha.",
      ctaLabel: "Redefinir senha",
      actionUrl: actionLink,
    });
  }

  return jsonResponse({
    status: "sent_if_exists",
    message: "Se houver uma conta de paciente com este e-mail, enviaremos o link de redefinição.",
  });
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return corsResponse();
  if (req.method !== "POST") return errorResponse("Método não permitido.", 405);

  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "signup");

    if (action === "signup") return await handleSignup(body);
    if (action === "reset_password") return await handleResetPassword(body);

    return errorResponse("Ação inválida.", 400);
  } catch (error) {
    console.error("[patient-portal-auth]", error);
    return errorResponse(error instanceof Error ? error.message : "Não foi possível concluir a ação.", 500);
  }
});
