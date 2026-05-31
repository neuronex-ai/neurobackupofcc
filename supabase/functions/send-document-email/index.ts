import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const toBase64 = (str: string) => {
  const bytes = new TextEncoder().encode(str);
  const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join("");
  return btoa(binString);
};

const toUrlSafeBase64 = (str: string) => {
  return toBase64(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

async function refreshAccessToken(supabaseService: any, userId: string, refreshToken: string) {
  const tokenUrl = 'https://oauth2.googleapis.com/token';
  const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
  const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');

  const tokenResponse = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID!,
      client_secret: GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }).toString(),
  });

  if (!tokenResponse.ok) throw new Error("Failed to refresh Google access token.");
  const tokens = await tokenResponse.json();
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  await supabaseService
    .from('user_google_tokens')
    .update({ access_token: tokens.access_token, expires_at: expiresAt.toISOString() })
    .eq('user_id', userId);

  return tokens.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseService = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing auth header');

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseService.auth.getUser(jwt);
    if (userError || !user) throw new Error('Invalid token');
    const userId = user.id;

    const {
      to,
      subject,
      htmlBody, // The simple HTML content from the editor
      documentType,
      pdfAttachment // { filename, content (base64), contentType }
    } = await req.json();

    // Fetch user profile for name
    const { data: profile } = await supabaseService.from('profiles').select('first_name, last_name, clinic_name').eq('id', userId).single();
    const therapistName = profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}` : "Seu Psicólogo";
    const clinicName = profile?.clinic_name || "Consultório";

    // Build the email wrapper (nice looking HTML)
    const wrappedHtmlBody = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
             @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
             body { font-family: 'Inter', sans-serif; background-color: #050505; color: #ffffff; padding: 40px; }
             .container { max-width: 600px; margin: 0 auto; background-color: #0A0A0B; border: 1px solid #27272a; border-radius: 24px; overflow: hidden; }
             .header { padding: 32px 40px; text-align: center; border-bottom: 1px solid #27272a; }
             .content { padding: 40px; color: #d4d4d8; line-height: 1.6; }
             .footer { padding: 24px; text-align: center; font-size: 11px; color: #52525b; border-top: 1px solid #27272a; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                 <p style="margin:0; font-size:10px; text-transform:uppercase; letter-spacing:2px; color:#71717A; font-weight:700;">${clinicName}</p>
                 <h1 style="margin:12px 0 0 0; font-size:20px; font-weight:700; color:#fff;">${documentType} gerado(a)</h1>
            </div>
            <div class="content">
                <p style="margin-bottom: 24px;">Olá,</p>
                <p>Segue em anexo o documento <strong>"${documentType}"</strong> conforme solicitado.</p>
                <div style="background-color: #18181B; border: 1px solid #27272a; border-radius: 12px; padding: 20px; margin: 24px 0; font-style: italic; color: #a1a1aa;">
                   ${htmlBody}
                </div>
                <p>O arquivo original assinada digitalmente encontra-se em anexo (PDF).</p>
                <p style="margin-top: 32px;">Atenciosamente,<br/><strong style="color: #fff;">${therapistName}</strong></p>
            </div>
            <div class="footer">
                Enviado via NeuroNex • Documento Protegido
            </div>
        </div>
    </body>
    </html>
    `;


    // Fetch Google Tokens
    const { data: tokenData } = await supabaseService.from('user_google_tokens').select('*').eq('user_id', userId).single();
    if (!tokenData) throw new Error('Google account not connected');

    let accessToken = tokenData.access_token;
    if (new Date(tokenData.expires_at) < new Date(Date.now() + 60000)) {
      accessToken = await refreshAccessToken(supabaseService, userId, tokenData.refresh_token);
    }

    // Construct Multipart Email
    const boundary = "boundary_" + Date.now().toString(16);

    // Header for the email
    const messageParts = [
      `To: ${to}`,
      `From: ${therapistName} <${user.email}>`,
      `Subject: =?utf-8?B?${toBase64(subject)}?=`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      'Content-Transfer-Encoding: base64',
      '',
      toBase64(wrappedHtmlBody),
      ''
    ];

    if (pdfAttachment) {
      messageParts.push(`--${boundary}`);
      messageParts.push(`Content-Type: application/pdf; name="${pdfAttachment.filename}"`);
      messageParts.push(`Content-Disposition: attachment; filename="${pdfAttachment.filename}"`);
      messageParts.push('Content-Transfer-Encoding: base64');
      messageParts.push('');
      messageParts.push(pdfAttachment.content); // Already base64
      messageParts.push('');
    }

    messageParts.push(`--${boundary}--`);

    const rawEmail = messageParts.join('\r\n');

    const gmailRes = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: toUrlSafeBase64(rawEmail) }),
    });

    if (!gmailRes.ok) {
      const errText = await gmailRes.text();
      console.error("Gmail Error:", errText);
      throw new Error(`Gmail API Error: ${errText}`);
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (e: any) {
    console.error("Email API Error:", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});