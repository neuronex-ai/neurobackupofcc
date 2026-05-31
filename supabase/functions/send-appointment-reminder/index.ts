// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { appointmentId, patientEmail, patientName } = await req.json()
    if (!appointmentId) throw new Error('ID do agendamento é obrigatório')

    // Create Supabase Client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify User Auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Não autorizado')

    // We use the admin client but strictly check the token validty
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''))
    if (userError || !user) throw new Error('Usuário não autenticado')

    // 1. Fetch Appointment Data
    const { data: appointment, error: appError } = await supabaseClient
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .single()

    if (appError || !appointment) {
      throw new Error(`Erro ao buscar agendamento: ${appError?.message || 'Agendamento não encontrado'}`)
    }

    // 2. Fetch Profile Data (for location/clinic info)
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('clinic_name, address_line1, address_city, address_state')
      .eq('id', appointment.user_id)
      .single()

    const professionalProfile = profile || {}

    // 3. Resolve Patient Info (Use passed data or fetch)
    let pName = patientName;
    let pEmail = patientEmail;

    if (!pName || !pEmail) {
      const { data: patient, error: patientError } = await supabaseClient
        .from('patients')
        .select('name, email')
        .eq('id', appointment.patient_id)
        .single()

      if (patientError || !patient) throw new Error('Paciente não encontrado')
      pName = patient.name;
      pEmail = patient.email;
    }

    if (!pEmail) throw new Error('Email do paciente é obrigatório')

    // 4. Generate/Retrieve Confirmation Token and PIN
    let token = appointment.token;
    let authCode = appointment.auth_code;
    
    if (!token || !authCode) {
      if (!token) token = crypto.randomUUID();
      if (!authCode) authCode = Math.floor(10000 + Math.random() * 90000).toString(); // 5 digit PIN
      
      const { error: updateError } = await supabaseClient
        .from('appointments')
        .update({ token: token, auth_code: authCode })
        .eq('id', appointmentId);

      if (updateError) console.error('Aviso: Erro ao salvar token/PIN', updateError);
    }

    // 5. Fetch Google Tokens
    const { data: tokens, error: tokensError } = await supabaseClient
      .from('user_google_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (tokensError || !tokens) {
      // Return 200 with error to handle gracefully in frontend
      return new Response(
        JSON.stringify({ success: false, error: 'Google Calendar não conectado. Vá em Integrações.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // 6. Construct Email
    let baseUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:8080'
    baseUrl = baseUrl.replace(/\/$/, "")
    const confirmationLink = `${baseUrl}/confirmar-agendamento/${token || appointmentId}` // Fallback ID if token fails

    // Format for Brazil Time (America/Sao_Paulo) using Intl
    const dateDate = new Date(appointment.start_time);
    const rawDateFormatted = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }).format(dateDate);

    // capitalize first letter: Domingo, 27 de outubro
    const dateFormatted = rawDateFormatted.charAt(0).toUpperCase() + rawDateFormatted.slice(1);

    const timeFormatted = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateDate);

    let locationText = '';
    let locationLabel = '';

    if (appointment.type === 'online') {
      locationLabel = 'Link da Sala';
      locationText = appointment.google_meet_link
        ? `<a href="${appointment.google_meet_link}" style="color: #A855F7; text-decoration: none;">Acessar Sala Virtual</a>`
        : 'Link será gerado em breve';
    } else {
      locationLabel = 'Endereço';
      const address = appointment.location || professionalProfile.address_line1 || 'Endereço não cadastrado';
      const city = professionalProfile.address_city ? ` - ${professionalProfile.address_city}` : '';
      locationText = `${address}${city}`;
    }

    const emailHtml = `
    <!DOCTYPE html>
    <html>
    <body style="margin: 0; padding: 0; background-color: #000000; font-family: sans-serif; color: #ffffff;">
      <div style="background-color: #000000; padding: 40px 20px;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #09090b; border: 1px solid #27272a; border-radius: 24px; padding: 40px; text-align: center;">
          <h2 style="margin: 0; color: #fff;">Olá, ${pName.split(' ')[0]}</h2>
          <p style="color: #a1a1aa; margin-top: 10px;">Lembrete do seu agendamento.</p>
          
          <div style="background-color: #18181b; padding: 20px; border-radius: 16px; margin: 30px 0;">
             <div style="font-size: 32px; font-weight: bold; color: #fff;">${timeFormatted}</div>
             <div style="color: #A855F7; text-transform: uppercase; font-size: 14px; margin-top: 5px;">${dateFormatted}</div>
             <br/>
             <div style="font-size: 12px; color: #52525b; text-transform: uppercase;">${locationLabel}</div>
             <div style="color: #e4e4e7; font-size: 14px; margin-top: 5px;">${locationText}</div>
          </div>

          <div style="background-color: #18181b; padding: 16px; border-radius: 12px; margin-bottom: 30px; border: 1px solid #27272a;">
             <div style="font-size: 10px; color: #a1a1aa; text-transform: uppercase; letter-spacing: 1px;">Código de Acesso (PIN)</div>
             <div style="font-size: 28px; font-weight: bold; color: #fff; letter-spacing: 4px; margin-top: 5px;">${authCode}</div>
             <div style="font-size: 11px; color: #52525b; margin-top: 8px;">Necessário para acessar a consulta e confirmar ou reagendar presença.</div>
          </div>

          <a href="${confirmationLink}" style="display: inline-block; background-color: #fff; color: #000; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold;">Confirmar Presença</a>
          
          <p style="margin-top: 30px; font-size: 12px; color: #52525b;">Enviado via NeuroNex</p>
        </div>
      </div>
    </body>
    </html>
    `

    const subject = `Lembrete de Consulta: ${pName.split(' ')[0]}`

    // Encode Message for Gmail API
    const message = [
      `To: ${pEmail}`,
      `Subject: ${subject}`,
      `Content-Type: text/html; charset=utf-8`,
      ``,
      emailHtml
    ].join('\n')

    const encodedMessage = btoa(unescape(encodeURIComponent(message)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

    // 7. Send Email Function
    const sendGmail = async (accessToken) => {
      return await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw: encodedMessage })
      })
    }

    let response = await sendGmail(tokens.access_token)

    // 8. Refresh Token Logic if 401
    if (response.status === 401 && tokens.refresh_token) {
      console.log('Token expirado. Tentando refresh...')
      const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
      const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')

      if (clientId && clientSecret) {
        const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: tokens.refresh_token,
            grant_type: 'refresh_token',
          }),
        })

        if (refreshRes.ok) {
          const newTokens = await refreshRes.json()
          await supabaseClient.from('user_google_tokens').update({
            access_token: newTokens.access_token,
            expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString()
          }).eq('user_id', user.id)

          // Retry send
          response = await sendGmail(newTokens.access_token)
        }
      }
    }

    if (!response.ok) {
      const errText = await response.text()
      try {
        const errJson = JSON.parse(errText)
        throw new Error(errJson.error?.message || 'Erro desconhecido no Gmail')
      } catch (e) {
        throw new Error(`Erro Gmail: ${errText}`)
      }
    }

    // Success
    return new Response(
      JSON.stringify({ success: true, message: 'Email enviado com sucesso!' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Erro na função send-appointment-reminder:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 } // Keep 200 to avoid non-2xx client error
    )
  }
})