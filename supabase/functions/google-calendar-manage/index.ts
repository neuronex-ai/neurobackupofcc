import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

  if (!tokenResponse.ok) return null;
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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing auth header');
    const { data: { user }, error: userError } = await supabaseService.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) throw new Error('Invalid token');

    const { action, googleEventId, appointmentData } = await req.json();

    if (!googleEventId) {
        return new Response(JSON.stringify({ message: "No Google Event ID provided, skipping sync." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Auth Google
    const { data: tokenData } = await supabaseService.from('user_google_tokens').select('*').eq('user_id', user.id).single();
    if (!tokenData) throw new Error("Google not connected");

    let accessToken = tokenData.access_token;
    if (new Date(tokenData.expires_at) < new Date(Date.now() + 60000)) {
      accessToken = await refreshAccessToken(supabaseService, user.id, tokenData.refresh_token);
    }

    const calendarId = 'primary';
    const baseUrl = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${googleEventId}`;

    let response;

    if (action === 'delete') {
        // Deletar evento no Google
        response = await fetch(baseUrl, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
    } else if (action === 'update' && appointmentData) {
        // Atualizar evento no Google (PATCH para atualizar apenas campos enviados)
        // Precisamos formatar o body para o padrão Google
        const eventPatch: any = {
            start: { dateTime: appointmentData.start_time },
            end: { dateTime: appointmentData.end_time }
        };

        // Se tiver notas/descrição, atualiza também
        if (appointmentData.notes) {
            // Mantemos a descrição original e adicionamos/atualizamos a nota se possível, 
            // mas aqui vamos simplificar atualizando a descrição
            eventPatch.description = appointmentData.notes;
        }

        response = await fetch(baseUrl, {
            method: 'PATCH',
            headers: { 
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventPatch)
        });
    }

    if (response && !response.ok) {
        const errText = await response.text();
        console.error("Google Calendar API Error:", errText);
        // Não lançamos erro fatal para não quebrar a UI, mas logamos
        return new Response(JSON.stringify({ error: "Failed to sync with Google", details: errText }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: true }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});