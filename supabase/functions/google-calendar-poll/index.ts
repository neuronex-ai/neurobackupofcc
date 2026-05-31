import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function refreshAccessToken(supabaseService: any, userId: string, refreshToken: string) {
  const tokenUrl = 'https://oauth2.googleapis.com/token';
  const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')?.trim();
  const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')?.trim();

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

  if (!tokenResponse.ok) return null;
  const tokens = await tokenResponse.json();
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  await supabaseService
    .from('user_google_tokens')
    .update({ access_token: tokens.access_token, expires_at: expiresAt.toISOString() })
    .eq('user_id', userId);

  return tokens.access_token;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')?.trim();
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim();

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ error: "Server configuration error: Missing environment variables" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing auth header');
    const { data: { user }, error: userError } = await supabaseService.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) throw new Error('Invalid token');

    const { data: tokenData } = await supabaseService.from('user_google_tokens').select('*').eq('user_id', user.id).single();
    if (!tokenData) throw new Error("Google not connected");

    let accessToken = tokenData.access_token;
    if (new Date(tokenData.expires_at) < new Date(Date.now() + 60000)) {
      accessToken = await refreshAccessToken(supabaseService, user.id, tokenData.refresh_token);
    }

    // Busca eventos dos próximos 30 dias (aumentado para garantir cobertura)
    const timeMin = new Date().toISOString();
    const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // showDeleted=true é importante para detectar cancelamentos, mas vamos focar em sync por estado por enquanto
    // singleEvents=true expande recorrências
    const calendarUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&showDeleted=true`;

    const calRes = await fetch(calendarUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!calRes.ok) throw new Error("Failed to fetch Google Calendar");
    const calData = await calRes.json();
    const googleEvents = calData.items || [];

    let processedCount = 0;

    for (const event of googleEvents) {
      if (!event.id) continue;

      // Verifica se já existe no banco pelo ID do evento do Google
      const { data: existing } = await supabaseService
        .from('appointments')
        .select('id, start_time, end_time, status, type')
        .eq('google_event_id', event.id)
        .maybeSingle();

      const isCancelledGoogle = event.status === 'cancelled';

      // --- CENÁRIO 1: Evento existe no NeuroNex ---
      if (existing) {
        let needsUpdate = false;
        const updatePayload: any = {};

        // A) Evento foi cancelado no Google, mas está ativo no NeuroNex
        if (isCancelledGoogle && existing.status !== 'cancelled') {
          updatePayload.status = 'cancelled';
          needsUpdate = true;
        }
        // B) Evento ativo, verificar mudanças de horário
        else if (!isCancelledGoogle && event.start?.dateTime && event.end?.dateTime) {
          const dbStart = new Date(existing.start_time).getTime();
          const dbEnd = new Date(existing.end_time).getTime();
          const googleStart = new Date(event.start.dateTime).getTime();
          const googleEnd = new Date(event.end.dateTime).getTime();

          // Margem de erro de 1 segundo para evitar loops infinitos de micro-diferenças
          if (Math.abs(dbStart - googleStart) > 1000 || Math.abs(dbEnd - googleEnd) > 1000) {
            updatePayload.start_time = event.start.dateTime;
            updatePayload.end_time = event.end.dateTime;
            // Se estava cancelado no NeuroNex mas voltou a ser ativo no Google
            if (existing.status === 'cancelled') updatePayload.status = 'confirmed';
            needsUpdate = true;
          }

          // C) Atualizar título/notas se for um bloco de bloqueio (não paciente)
          if (existing.type === 'block') {
            const newNote = `Google Calendar: ${event.summary || 'Ocupado'}`;
            // Não temos o campo 'notes' no select acima para comparar, então assumimos update se houver mudança de tempo
            // Para otimizar, poderíamos comparar, mas vamos simplificar
            // Opcional: atualizar titulo/notas
          }
        }

        if (needsUpdate) {
          await supabaseService
            .from('appointments')
            .update(updatePayload)
            .eq('id', existing.id);
          processedCount++;
        }
      }
      // --- CENÁRIO 2: Evento NOVO no Google (Importar como Bloqueio) ---
      else if (!isCancelledGoogle && event.start?.dateTime && event.end?.dateTime) {
        // Só importa se não for cancelado
        await supabaseService.from('appointments').insert({
          user_id: user.id,
          start_time: event.start.dateTime,
          end_time: event.end.dateTime,
          type: 'block', // Importa como bloqueio visual
          notes: `Google Calendar: ${event.summary || 'Ocupado'}`,
          status: 'confirmed',
          google_event_id: event.id,
          patient_id: null
        });
        processedCount++;
      }
    }

    return new Response(JSON.stringify({ success: true, processed: processedCount }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});