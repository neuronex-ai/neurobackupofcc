import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { format, startOfMonth, endOfMonth } from 'https://esm.sh/date-fns@3.6.0';
import { ptBR } from 'https://esm.sh/date-fns@3.6.0/locale/pt-BR';

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

const escapeHtml = (value: string) => {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabaseService = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const { patientId, monthDate, patientEmail, patientName } = await req.json();
    
    const authHeader = req.headers.get('Authorization');
    const jwt = authHeader!.replace('Bearer ', '');
    const { data: { user } } = await supabaseService.auth.getUser(jwt);
    const userId = user!.id;

    // Check notification preferences
    const { data: settings } = await supabaseService
        .from('user_notification_settings')
        .select('email_enabled, email_monthly_reports')
        .eq('user_id', userId)
        .maybeSingle();

    if (settings && (!settings.email_enabled || !settings.email_monthly_reports)) {
        return new Response(JSON.stringify({ success: true, message: 'Report not sent due to user preferences.' }), { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
        });
    }

    const { data: reportSettings } = await supabaseService
      .from('monthly_report_settings')
      .select('enabled, include_sessions, include_payments, include_notes_summary, email_subject, email_intro')
      .eq('user_id', userId)
      .maybeSingle();

    if (reportSettings && !reportSettings.enabled) {
      return new Response(JSON.stringify({ success: true, message: 'Report not sent because monthly reports are disabled.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    const includeSessions = reportSettings?.include_sessions ?? true;
    const includePayments = reportSettings?.include_payments ?? true;
    const includeNotesSummary = reportSettings?.include_notes_summary ?? false;

    const { data: tokenData } = await supabaseService.from('user_google_tokens').select('*').eq('user_id', userId).single();
    let accessToken = tokenData.access_token;
    if (new Date(tokenData.expires_at) < new Date(Date.now() + 60000)) {
      accessToken = await refreshAccessToken(supabaseService, userId, tokenData.refresh_token);
    }
    
    const refDate = new Date(monthDate);
    const startISO = format(startOfMonth(refDate), 'yyyy-MM-dd');
    const endISO = format(endOfMonth(refDate), 'yyyy-MM-dd');
    const currentMonth = format(startOfMonth(refDate), 'MMMM', { locale: ptBR });
    const displayMonth = currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1);
    const safePatientName = escapeHtml(patientName || 'Paciente');
    const firstName = safePatientName.split(' ')[0] || safePatientName;

    const applyPlainVariables = (template: string) => template
      .replace(/\{\{patientName\}\}/g, patientName || 'Paciente')
      .replace(/\{\{month\}\}/g, displayMonth);
    const applyHtmlVariables = (template: string) => escapeHtml(template)
      .replace(/\{\{patientName\}\}/g, safePatientName)
      .replace(/\{\{month\}\}/g, escapeHtml(displayMonth));

    const emailSubject = applyPlainVariables(
      reportSettings?.email_subject || `Relatório de Acompanhamento - ${displayMonth}`
    );
    const introHtml = applyHtmlVariables(
      reportSettings?.email_intro || `Olá ${patientName || 'Paciente'}, aqui está o resumo do seu progresso terapêutico neste mês.`
    ).replace(/\n/g, '<br/>');

    const { data: completedAppointments } = await supabaseService
        .from('appointments')
        .select('start_time')
        .eq('patient_id', patientId)
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('start_time', startISO)
        .lte('start_time', endISO);
        
    const attendedCount = completedAppointments?.length || 0;
    
    const fullHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 0; background-color: #F3F4F6; font-family: 'Inter', sans-serif;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
                <td align="center" style="padding: 40px 0;">
                    <table role="presentation" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1); border: 1px solid #E5E7EB;">
                        <tr>
                            <td style="background-color: #111827; padding: 40px; text-align: left;">
                                <p style="color: #9CA3AF; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px 0;">Relatório Mensal</p>
                                <h1 style="margin: 0; color: #ffffff; font-size: 28px; letter-spacing: -0.5px;">${currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1)}</h1>
                                <div style="margin-top: 24px; padding: 8px 16px; background-color: rgba(255,255,255,0.1); border-radius: 8px; display: inline-block;">
                                    <span style="color: #9CA3AF; font-size: 12px;">Paciente:</span> 
                                    <span style="color: #ffffff; font-size: 14px; font-weight: 600; margin-left: 4px;">${patientName}</span>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 40px;">
                                <p style="font-size: 15px; color: #374151; line-height: 1.6; margin-bottom: 32px;">
                                    Olá <strong>${patientName.split(' ')[0]}</strong>, aqui está o resumo do seu progresso terapêutico neste mês.
                                </p>
                                <table role="presentation" style="width: 100%; border-collapse: separate; border-spacing: 12px 0; margin-left: -12px;">
                                    <tr>
                                        <td style="width: 50%; background-color: #F0FDF4; padding: 20px; border-radius: 16px; border: 1px solid #DCFCE7; text-align: center;">
                                            <div style="font-size: 36px; font-weight: 800; color: #166534; line-height: 1;">${attendedCount}</div>
                                            <div style="font-size: 11px; color: #166534; text-transform: uppercase; font-weight: 700; margin-top: 8px; letter-spacing: 1px;">Sessões</div>
                                        </td>
                                        <td style="width: 50%; background-color: #EFF6FF; padding: 20px; border-radius: 16px; border: 1px solid #DBEAFE; text-align: center;">
                                            <div style="font-size: 36px; font-weight: 800; color: #1E40AF; line-height: 1;">100%</div>
                                            <div style="font-size: 11px; color: #1E40AF; text-transform: uppercase; font-weight: 700; margin-top: 8px; letter-spacing: 1px;">Frequência</div>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td style="background-color: #F9FAFB; padding: 24px 40px; text-align: center; border-top: 1px solid #E5E7EB;">
                                <p style="margin: 0; font-size: 12px; color: #6B7280; font-weight: 600;">NeuroNex • Acompanhamento Inteligente</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;

    const emailLines = [
      `To: ${patientEmail}`,
      `From: NeuroNex <${user.email}>`,
      `Subject: =?utf-8?B?${toBase64(`Relatório de Acompanhamento - ${currentMonth}`)}?=`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      'Content-Transfer-Encoding: base64',
      '',
      toBase64(fullHtml)
    ];

    const rawEmail = emailLines.join('\r\n');

    const gmailRes = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: toUrlSafeBase64(rawEmail) }),
    });

    if (!gmailRes.ok) throw new Error(await gmailRes.text());

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
