import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função auxiliar para renovar o token de acesso usando o refresh token
async function refreshAccessToken(supabaseService: any, userId: string, refreshToken: string) {
  const tokenUrl = 'https://oauth2.googleapis.com/token';
  
  const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
  const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      throw new Error("Server configuration error: Missing Google secrets.");
  }

  const tokenResponse = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }).toString(),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error("Google Token Refresh Error:", errorText);
    throw new Error("Failed to refresh Google access token.");
  }

  const tokens = await tokenResponse.json();
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  // Atualizar o token de acesso e a expiração no banco de dados
  const { error: updateError } = await supabaseService
    .from('user_google_tokens')
    .update({
      access_token: tokens.access_token,
      expires_at: expiresAt.toISOString(),
    })
    .eq('user_id', userId);

  if (updateError) {
    console.error("Database Update Error after refresh:", updateError);
    throw new Error("Failed to update tokens in database.");
  }

  return tokens.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseService = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const { appointment, patient } = await req.json();
    
    // 1. Autenticar o usuário (obter o JWT do header)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const jwt = authHeader.replace('Bearer ', '');
    
    const { data: { user }, error: userError } = await supabaseService.auth.getUser(jwt);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid user token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userId = user.id;

    // 2. Buscar tokens do Google
    const { data: tokenData, error: tokenError } = await supabaseService
      .from('user_google_tokens')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (tokenError || !tokenData) {
      return new Response(JSON.stringify({ error: 'Google tokens not found for user' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const expiresAt = new Date(tokenData.expires_at);

    // 3. Verificar e renovar o token se estiver expirado (ou prestes a expirar)
    if (expiresAt < new Date(Date.now() + 60000)) { // Expira em menos de 1 minuto
      console.log("Access token expired or near expiration. Refreshing...");
      accessToken = await refreshAccessToken(supabaseService, userId, refreshToken);
    }

    // 4. Buscar perfil do psicólogo para obter endereço
    const { data: profileData } = await supabaseService
      .from('profiles')
      .select('address')
      .eq('id', userId)
      .single();

    // 5. Criar o evento no Google Calendar
    const calendarId = 'primary'; // Usar o calendário principal do usuário
    const calendarApiUrl = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?conferenceDataVersion=1`;
    
    const eventBody: any = {
      summary: `Consulta: ${patient.name}`,
      description: `Tipo: ${appointment.type === 'online' ? 'Teleconsulta (Online)' : 'Presencial'}\nNotas: ${appointment.notes || 'Nenhuma'}\n\nPaciente: ${patient.name}\nEmail: ${patient.email || 'N/A'}\nTelefone: ${patient.phone || 'N/A'}\n\n---\nO link para a sessão online estará disponível no portal NeuroNex.`,
      start: {
        dateTime: appointment.start_time,
        timeZone: 'America/Sao_Paulo', // Assumindo fuso horário de São Paulo
      },
      end: {
        dateTime: appointment.end_time,
        timeZone: 'America/Sao_Paulo',
      },
      attendees: [
        { email: user.email }, // Psicólogo
        ...(patient.email ? [{ email: patient.email }] : []), // Paciente (se tiver email)
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 dia antes
          { method: 'popup', minutes: 30 }, // 30 minutos antes
        ],
      },
      sendUpdates: 'all', // Enviar notificações para todos os participantes
    };

    if (appointment.type === 'online') {
        eventBody.conferenceData = {
            createRequest: {
                requestId: `neuronex-${appointment.id || crypto.randomUUID()}`,
                conferenceSolutionKey: {
                    type: 'hangoutsMeet'
                }
            }
        };
    } else if (appointment.type === 'presencial') {
        // Usa o local do agendamento, ou o endereço do perfil como fallback
        const location = appointment.location || profileData?.address;
        if (location) {
            eventBody.location = location;
        }
    }

    const calendarResponse = await fetch(calendarApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Goog-Request-Reason': 'Creating appointment from NeuroNex',
      },
      body: JSON.stringify(eventBody),
    });

    if (!calendarResponse.ok) {
      const errorText = await calendarResponse.text();
      console.error("Google Calendar API Error:", errorText);
      return new Response(JSON.stringify({ error: 'Failed to create calendar event', details: errorText }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const eventData = await calendarResponse.json();
    
    // 6. Retornar sucesso e o ID do evento do Google (opcional, mas útil)
    return new Response(JSON.stringify({ 
      message: 'Event created successfully', 
      googleEventId: eventData.id,
      googleMeetLink: eventData.hangoutLink,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (e) {
    console.error("Unhandled error in google-calendar-sync:", e);
    return new Response(JSON.stringify({ error: 'Internal server error', details: e.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});