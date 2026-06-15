export type EmailAttachment = {
  filename: string;
  content: string;
  contentType?: string;
};

export type DeliveryResult = {
  provider: 'gmail' | 'resend';
  providerMessageId: string;
  gmailError: string | null;
};

const encodeBase64 = (value: string) => {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
};

const encodeBase64Url = (value: string) => encodeBase64(value)
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=+$/g, '');

export const escapeHtml = (value: unknown) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

export const renderTemplate = (html: string, variables: Record<string, unknown>) => Object.entries(variables)
  .reduce((result, [key, raw]) => result
    .replaceAll(`{{{${key}}}}`, escapeHtml(raw))
    .replaceAll(`{{${key}}}`, escapeHtml(raw)), html);

const refreshGoogleToken = async (db: any, userId: string, refreshToken: string) => {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: Deno.env.get('GOOGLE_CLIENT_ID') || '',
      client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') || '',
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const payload = await response.json();
  if (!response.ok || !payload.access_token) {
    throw new Error('Não foi possível renovar a conexão Google.');
  }
  await db.from('user_google_tokens').update({
    access_token: payload.access_token,
    expires_at: new Date(Date.now() + Number(payload.expires_in || 3600) * 1000).toISOString(),
  }).eq('user_id', userId);
  return String(payload.access_token);
};

const buildRawEmail = (
  senderName: string,
  senderEmail: string,
  to: string,
  subject: string,
  html: string,
  attachments: EmailAttachment[],
) => {
  if (!attachments.length) {
    return [
      `To: ${to}`,
      `From: ${senderName} <${senderEmail}>`,
      `Reply-To: ${senderEmail}`,
      `Subject: =?utf-8?B?${encodeBase64(subject)}?=`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      encodeBase64(html),
    ].join('\r\n');
  }

  const boundary = `neuronex_${crypto.randomUUID()}`;
  const parts = [
    `To: ${to}`,
    `From: ${senderName} <${senderEmail}>`,
    `Reply-To: ${senderEmail}`,
    `Subject: =?utf-8?B?${encodeBase64(subject)}?=`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    encodeBase64(html),
    '',
  ];

  for (const attachment of attachments) {
    const safeName = attachment.filename.replace(/[\r\n"]/g, '_');
    parts.push(
      `--${boundary}`,
      `Content-Type: ${attachment.contentType || 'application/octet-stream'}; name="${safeName}"`,
      `Content-Disposition: attachment; filename="${safeName}"`,
      'Content-Transfer-Encoding: base64',
      '',
      attachment.content,
      '',
    );
  }
  parts.push(`--${boundary}--`);
  return parts.join('\r\n');
};

const sendWithGmail = async (
  db: any,
  userId: string,
  senderName: string,
  senderEmail: string,
  to: string,
  subject: string,
  html: string,
  attachments: EmailAttachment[],
) => {
  const tokens = await db.from('user_google_tokens').select('*').eq('user_id', userId).maybeSingle();
  if (!tokens.data) return null;
  let accessToken = tokens.data.access_token;
  if (new Date(tokens.data.expires_at).getTime() <= Date.now() + 60_000) {
    accessToken = await refreshGoogleToken(db, userId, tokens.data.refresh_token);
  }
  const raw = buildRawEmail(senderName, senderEmail, to, subject, html, attachments);
  const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw: encodeBase64Url(raw) }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error?.message || `Gmail recusou o envio: ${response.status}`);
  return String(payload.id || 'gmail');
};

const sendWithResend = async (
  to: string,
  replyTo: string,
  subject: string,
  html: string,
  attachments: EmailAttachment[],
  senderProfile: 'operational' | 'finance' | 'security' | 'contact',
) => {
  const key = Deno.env.get('RESEND_API_KEY');
  if (!key) throw new Error('RESEND_API_KEY não configurada.');
  const from = senderProfile === 'finance'
    ? 'NeuroFinance <financeiro@email.neuronex.site>'
    : senderProfile === 'security'
      ? 'NeuroNex Segurança <seguranca@email.neuronex.site>'
      : senderProfile === 'contact'
        ? 'Equipe NeuroNex <contato@email.neuronex.site>'
        : 'NeuroNex <notificacoes@email.neuronex.site>';
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: replyTo,
      subject,
      html,
      attachments: attachments.map(({ filename, content }) => ({ filename, content })),
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || `Resend recusou o envio: ${response.status}`);
  return String(payload.id || 'resend');
};

export const deliverPatientEmail = async (params: {
  db: any;
  userId: string;
  senderName: string;
  senderEmail: string;
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
  senderProfile?: 'operational' | 'finance' | 'security' | 'contact';
}): Promise<DeliveryResult> => {
  const attachments = params.attachments || [];
  let gmailError: string | null = null;
  try {
    const gmailId = await sendWithGmail(
      params.db,
      params.userId,
      params.senderName,
      params.senderEmail,
      params.to,
      params.subject,
      params.html,
      attachments,
    );
    if (gmailId) return { provider: 'gmail', providerMessageId: gmailId, gmailError: null };
  } catch (error) {
    gmailError = error instanceof Error ? error.message : 'Falha no Gmail';
  }

  const resendId = await sendWithResend(
    params.to,
    params.senderEmail,
    params.subject,
    params.html,
    attachments,
    params.senderProfile || 'operational',
  );
  return { provider: 'resend', providerMessageId: resendId, gmailError };
};
