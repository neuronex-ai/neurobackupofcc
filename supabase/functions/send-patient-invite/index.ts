import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

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

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error("GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set in environment.");
  }

  const tokenResponse = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }).toString(),
  });

  if (!tokenResponse.ok) throw new Error("Failed to refresh Google access token.");
  const tokens = await tokenResponse.json();
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  await supabaseService
    .from('user_google_tokens')
    .update({
      access_token: tokens.access_token,
      expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString()
    })
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
    if (!authHeader) throw new Error('Authorization header missing');

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseService.auth.getUser(jwt);
    if (userError || !user) throw new Error('Invalid or expired user session');
    const userId = user.id;

    const body = await req.json();
    const { appointmentId, patientEmail, patientName, authCode, token, channel, frontendUrl } = body;
    let { psychologistName } = body;

    console.log(`[send-patient-invite] Processing invite for ${patientEmail} via ${channel || 'email'}`);

    if (channel === 'whatsapp') {
      return new Response(JSON.stringify({ success: true, message: "WhatsApp handled by frontend" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (!patientEmail) throw new Error("Patient email is required.");

    // 1. Fetch psychologist name if missing
    if (!psychologistName || psychologistName === 'Seu Psicólogo') {
      const { data: profile } = await supabaseService.from('profiles').select('full_name').eq('id', userId).single();
      if (profile?.full_name) psychologistName = profile.full_name;
    }

    const { data: profileData } = await supabaseService.from('profiles').select('clinic_name').eq('id', userId).single();
    const clinicName = profileData?.clinic_name || "NeuroNex";

    // 2. Try Google/Gmail integration first
    const { data: tokenData } = await supabaseService.from('user_google_tokens').select('*').eq('user_id', userId).single();

    const inviteLink = `${frontendUrl || Deno.env.get('FRONTEND_URL') || 'https://neuronex.app'}/confirmar-agendamento/${token}`;

    const firstName = patientName.split(' ')[0];

    // Template HTML Premium (Dark Mode style)
    const fullHtml = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="utf-8">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
            body { font-family: 'Inter', Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #020204; color: #ffffff; }
        </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #020204;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #020204;">
            <tr>
                <td align="center" style="padding: 40px 10px;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; background-color: #0A0A0B; border-radius: 24px; border: 1px solid #1f1f23; overflow: hidden;">
                        <tr><td height="4" style="background: linear-gradient(90deg, #3b82f6 0%, #10b981 100%); line-height: 4px; font-size: 0;">&nbsp;</td></tr>
                        <tr>
                            <td style="padding: 40px; text-align: center;">
                                <div style="display: inline-block; padding: 12px; background: #161618; border-radius: 16px; margin-bottom: 24px; border: 1px solid #27272a;">
                                    <span style="color: #ffffff; font-weight: 800; font-size: 20px; letter-spacing: -1px;">Nx</span>
                                </div>
                                <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Olá, ${firstName}!</h1>
                                <p style="margin: 12px 0 0 0; color: #a1a1aa; font-size: 14px;">Você foi convidado para iniciar seu agendamento.</p>
                                
                                <div style="margin: 32px 0; background: #161618; border: 1px dashed #27272a; border-radius: 16px; padding: 24px;">
                                    <p style="margin: 0 0 8px 0; font-size: 10px; font-weight: 700; color: #71717a; text-transform: uppercase; letter-spacing: 1px;">Seu Código de Acesso</p>
                                    <div style="font-family: monospace; font-size: 32px; font-weight: 700; color: #ffffff; letter-spacing: 8px;">${authCode}</div>
                                </div>

                                <a href="${inviteLink}" style="display: block; background: #ffffff; color: #000000; padding: 18px; border-radius: 12px; font-weight: 700; text-decoration: none; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Acessar Portal do Paciente</a>
                                
                                <p style="margin-top: 24px; font-size: 12px; color: #52525b;">O profissional <strong>${psychologistName}</strong> aguarda seu retorno.</p>
                            </td>
                        </tr>
                    </table>
                    <p style="text-align: center; margin-top: 24px; font-size: 10px; color: #3f3f46; letter-spacing: 1px; text-transform: uppercase;">Ambiente Seguro • NeuroNex Health</p>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;

    if (tokenData) {
      console.log(`[send-patient-invite] Using Google/Gmail for ${patientEmail}`);
      let accessToken = tokenData.access_token;
      if (new Date(tokenData.expires_at) < new Date(Date.now() + 60000)) {
        accessToken = await refreshAccessToken(supabaseService, userId, tokenData.refresh_token);
      }

      const rawEmail = [
        `To: ${patientEmail}`,
        `From: ${psychologistName} <${user.email}>`,
        `Subject: =?utf-8?B?${toBase64(`Convite de Agendamento: ${clinicName}`)}?=`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=utf-8',
        'Content-Transfer-Encoding: base64',
        '',
        toBase64(fullHtml)
      ].join('\r\n');

      const gmailRes = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw: toUrlSafeBase64(rawEmail) }),
      });

      if (!gmailRes.ok) {
        const errText = await gmailRes.text();
        throw new Error(`Gmail API Error: ${errText}`);
      }

      return new Response(JSON.stringify({ success: true, method: 'gmail' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // 3. Fallback to Resend if Google not connected
    console.log(`[send-patient-invite] Google not connected for ${userId}. Trying Resend...`);
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) throw new Error("E-mail não pôde ser enviado: Conta Google não conectada e Resend não configurado.");

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'NeuroNex <nao-responda@neuronex.app>',
        to: [patientEmail],
        subject: `Convite de Agendamento: ${clinicName}`,
        html: fullHtml,
      }),
    });

    const resData = await res.json();
    if (!res.ok) throw new Error(`Resend Error: ${resData.message || JSON.stringify(resData)}`);

    return new Response(JSON.stringify({ success: true, method: 'resend', id: resData.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error(`[send-patient-invite] Fatal Error:`, error);
    return new Response(JSON.stringify({
      error: error.message,
      details: error.stack
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});