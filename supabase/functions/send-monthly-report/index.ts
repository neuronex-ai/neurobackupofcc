import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import { deliverPatientEmail, escapeHtml } from '../_shared/email-delivery.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

type ReportSettings = {
  enabled: boolean;
  send_day: number;
  include_sessions: boolean;
  include_payments: boolean;
  include_notes_summary: boolean;
  email_subject: string;
  email_intro: string;
};

const defaults: ReportSettings = {
  enabled: false,
  send_day: 1,
  include_sessions: true,
  include_payments: true,
  include_notes_summary: false,
  email_subject: 'Relatório mensal — {{month}}',
  email_intro: 'Olá {{patientName}}, segue o resumo do seu acompanhamento no período de {{month}}.',
};

const normalizeSettings = (value?: Partial<ReportSettings> | null): ReportSettings => ({
  ...defaults,
  ...(value || {}),
  enabled: Boolean(value?.enabled ?? defaults.enabled),
  send_day: Math.max(1, Math.min(28, Number(value?.send_day ?? defaults.send_day))),
  include_sessions: Boolean(value?.include_sessions ?? defaults.include_sessions),
  include_payments: Boolean(value?.include_payments ?? defaults.include_payments),
  include_notes_summary: false,
  email_subject: String(value?.email_subject ?? defaults.email_subject).slice(0, 180),
  email_intro: String(value?.email_intro ?? defaults.email_intro).slice(0, 2000),
});

const applyVariables = (template: string, patientName: string, displayMonth: string) => template
  .replaceAll('{{patientName}}', patientName)
  .replaceAll('{{month}}', displayMonth);

const reportPeriod = (monthDate?: string) => {
  const reference = monthDate ? new Date(monthDate) : new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() - 1, 1));
  if (Number.isNaN(reference.getTime())) throw new Error('Mês de referência inválido.');
  const start = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), 1));
  const end = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth() + 1, 1));
  const label = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(start);
  return {
    startISO: start.toISOString(),
    endISO: end.toISOString(),
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
    label: label.charAt(0).toUpperCase() + label.slice(1),
  };
};

const currency = (value: number) => new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
}).format(value);

serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Método não permitido.' }, 405);

  const db = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
    { auth: { persistSession: false } },
  );

  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization) return json({ error: 'Autenticação necessária.' }, 401);
    const authResult = await db.auth.getUser(authorization.replace('Bearer ', ''));
    const user = authResult.data.user;
    if (authResult.error || !user?.email) return json({ error: 'Sessão inválida ou expirada.' }, 401);

    const body = await request.json();
    const testMode = body.testMode === true;
    const period = reportPeriod(body.monthDate);

    const storedResult = await db.from('monthly_report_settings')
      .select('enabled,send_day,include_sessions,include_payments,include_notes_summary,email_subject,email_intro')
      .eq('user_id', user.id)
      .maybeSingle();
    if (storedResult.error) throw new Error('Não foi possível carregar as configurações do relatório.');

    const settings = normalizeSettings({
      ...(storedResult.data || {}),
      ...(testMode ? body.settingsOverride || {} : {}),
    });

    if (!testMode && (!storedResult.data || !settings.enabled)) {
      return json({ success: true, sent: false, reason: 'monthly_reports_disabled' });
    }

    if (!testMode) {
      const notificationResult = await db.from('user_notification_settings')
        .select('email_enabled,email_monthly_reports')
        .eq('user_id', user.id)
        .maybeSingle();
      if (notificationResult.error) throw new Error('Não foi possível verificar as preferências de e-mail.');
      if (notificationResult.data && (notificationResult.data.email_enabled === false || notificationResult.data.email_monthly_reports === false)) {
        return json({ success: true, sent: false, reason: 'email_channel_disabled' });
      }
    }

    let recipient = user.email;
    let patientName = 'Paciente de exemplo';
    let patientId: string | null = null;

    if (!testMode) {
      if (!body.patientId) return json({ error: 'Paciente não informado.' }, 400);
      const patientResult = await db.from('patients')
        .select('id,name,email')
        .eq('id', body.patientId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (patientResult.error || !patientResult.data) return json({ error: 'Paciente não encontrado para esta conta.' }, 404);
      if (!patientResult.data.email) return json({ error: 'O paciente não possui e-mail cadastrado.' }, 400);
      patientId = patientResult.data.id;
      patientName = patientResult.data.name || 'Paciente';
      recipient = patientResult.data.email;
    }

    let attended = testMode ? 4 : 0;
    let absent = testMode ? 1 : 0;
    let received = testMode ? 720 : 0;
    let pending = testMode ? 180 : 0;

    if (!testMode && patientId && settings.include_sessions) {
      const appointmentsResult = await db.from('appointments')
        .select('status')
        .eq('user_id', user.id)
        .eq('patient_id', patientId)
        .gte('start_time', period.startISO)
        .lt('start_time', period.endISO);
      if (appointmentsResult.error) throw new Error('Não foi possível calcular o resumo de sessões.');
      attended = (appointmentsResult.data || []).filter((item) => item.status === 'attended' || item.status === 'completed').length;
      absent = (appointmentsResult.data || []).filter((item) => item.status === 'absent').length;
    }

    if (!testMode && patientId && settings.include_payments) {
      const transactionsResult = await db.from('transactions')
        .select('amount,status')
        .eq('user_id', user.id)
        .eq('patient_id', patientId)
        .eq('type', 'income')
        .gte('date', period.startDate)
        .lt('date', period.endDate);
      if (transactionsResult.error) throw new Error('Não foi possível calcular o resumo financeiro.');
      for (const transaction of transactionsResult.data || []) {
        const amount = Number(transaction.amount || 0);
        if (!Number.isFinite(amount)) continue;
        if (transaction.status === 'paid' || transaction.status === 'completed') received += amount;
        else if (transaction.status === 'pending') pending += amount;
      }
    }

    const profileResult = await db.from('profiles')
      .select('full_name,first_name,last_name,clinic_name')
      .eq('id', user.id)
      .maybeSingle();
    const profile = profileResult.data;
    const professionalName = profile?.clinic_name || profile?.full_name || [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'NeuroNex';
    const subject = applyVariables(settings.email_subject, patientName, period.label).replace(/[\r\n]+/g, ' ').slice(0, 180);
    const intro = escapeHtml(applyVariables(settings.email_intro, patientName, period.label)).replace(/\n/g, '<br/>');
    const attendanceBase = attended + absent;
    const attendanceRate = attendanceBase ? Math.round((attended / attendanceBase) * 100) : null;

    const sessionsHtml = settings.include_sessions ? `<div style="display:flex;gap:12px;margin:24px 0"><div style="flex:1;padding:18px;background:#f4f4f5;border-radius:14px;text-align:center"><strong style="font-size:28px">${attended}</strong><br><span style="font-size:11px;color:#71717a">REALIZADAS</span></div><div style="flex:1;padding:18px;background:#f4f4f5;border-radius:14px;text-align:center"><strong style="font-size:28px">${absent}</strong><br><span style="font-size:11px;color:#71717a">FALTAS</span></div><div style="flex:1;padding:18px;background:#18181b;color:white;border-radius:14px;text-align:center"><strong style="font-size:28px">${attendanceRate === null ? '—' : `${attendanceRate}%`}</strong><br><span style="font-size:11px;color:#a1a1aa">FREQUÊNCIA</span></div></div>` : '';
    const paymentsHtml = settings.include_payments ? `<div style="margin:24px 0;border:1px solid #e4e4e7;border-radius:14px;overflow:hidden"><div style="padding:16px 18px;background:#fafafa">Pagamentos identificados <strong style="float:right">${escapeHtml(currency(received))}</strong></div><div style="padding:16px 18px">Valores pendentes <strong style="float:right">${escapeHtml(currency(pending))}</strong></div></div>` : '';

    const html = `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f4f4f5;font-family:Arial,sans-serif;color:#18181b"><div style="max-width:620px;margin:32px auto;background:white;border:1px solid #e4e4e7;border-radius:24px;overflow:hidden"><div style="background:#09090b;color:white;padding:36px 40px"><div style="font-size:11px;color:#a1a1aa;text-transform:uppercase">Relatório mensal</div><h1 style="margin:10px 0 0">${escapeHtml(period.label)}</h1><p style="color:#d4d4d8">${escapeHtml(patientName)}</p></div><div style="padding:34px 40px"><p style="line-height:1.7;color:#3f3f46">${intro}</p>${sessionsHtml}${paymentsHtml}</div><div style="padding:22px 40px;background:#fafafa;text-align:center;font-size:11px;color:#71717a">${escapeHtml(professionalName)} · enviado pelo NeuroNex<br>NEURONEX AI · CNPJ 65.610.762/0001-55 · Pinheiros, São Paulo - SP${testMode ? '<br><em>Mensagem de teste — nenhum paciente recebeu este e-mail.</em>' : ''}</div></div></body></html>`;

    const delivery = await deliverPatientEmail({
      db,
      userId: user.id,
      senderName: professionalName,
      senderEmail: user.email,
      to: recipient,
      subject,
      html,
    });

    await db.from('email_delivery_logs').insert({
      user_id: user.id,
      template_key: 'monthly_report',
      recipient,
      provider: delivery.provider,
      sender: delivery.provider === 'gmail' ? user.email : 'notificacoes@email.neuronex.site',
      status: 'sent',
      provider_message_id: delivery.providerMessageId,
      metadata: {
        patientId,
        testMode,
        periodStart: period.startDate,
        periodEndExclusive: period.endDate,
        gmailError: delivery.gmailError,
      },
    });

    return json({
      success: true,
      sent: true,
      testMode,
      recipient,
      provider: delivery.provider,
      providerMessageId: delivery.providerMessageId,
      period: { start: period.startDate, endExclusive: period.endDate },
      warnings: settings.include_notes_summary ? ['clinical_summary_requires_professional_approval'] : [],
    });
  } catch (error) {
    console.error('[send-monthly-report]', error);
    return json({ error: error instanceof Error ? error.message : 'Erro inesperado ao enviar o relatório.' }, 500);
  }
});
