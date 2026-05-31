import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Validar Sessão do Usuário
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Cabeçalho de autorização ausente')
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    if (userError || !user) {
        console.error("[invite-patient] Usuário não autenticado", userError)
        throw new Error('Sessão expirada ou inválida')
    }

    const { patientId, options } = await req.json()
    console.log(`[invite-patient] Processando convite para: ${patientId}`, options)

    // 2. Buscar informações necessárias
    const [patientRes, profileRes] = await Promise.all([
      supabaseClient.from('patients').select('name, email, phone').eq('id', patientId).single(),
      supabaseClient.from('profiles').select('first_name, clinic_name').eq('id', user.id).single()
    ])

    if (patientRes.error) throw new Error('Paciente não encontrado no banco de dados')
    const patient = patientRes.data
    const profile = profileRes.data

    // 3. Gerar Dados do Convite
    const inviteToken = crypto.randomUUID()
    const authCode = Math.floor(100000 + Math.random() * 900000).toString()

    // 4. Salvar Agendamento Pendente (Passo Crítico)
    const { data: appointment, error: aptError } = await supabaseClient
      .from('appointments')
      .insert({
        user_id: user.id,
        patient_id: patientId,
        status: 'pending',
        type: 'Sessão de Terapia',
        token: inviteToken,
        auth_code: authCode,
        price: options.price ? parseFloat(options.price) : null,
        payment_config: {
          type: options.paymentType || 'manual',
          price: options.price
        }
      })
      .select()
      .single()

    if (aptError) {
        console.error("[invite-patient] Erro ao inserir no banco:", aptError)
        throw new Error(`Erro no banco de dados: ${aptError.message}`)
    }

    // 5. Tentativa de Envio de E-mail (Opcional/Não bloqueante)
    let emailSent = false;
    let emailError = null;

    if (options.channel === 'email' && patient.email) {
      const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
      
      if (!RESEND_API_KEY) {
        emailError = 'Configuração RESEND_API_KEY não encontrada nas variáveis de ambiente.';
      } else {
        const origin = req.headers.get('origin') || 'https://neuronex.ai'
        const link = `${origin}/confirmar-agendamento/${inviteToken}`
        const drName = profile?.first_name || 'Seu Psicólogo'

        try {
          const emailRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${RESEND_API_KEY}`
            },
            body: JSON.stringify({
              from: 'NeuroNex <onboarding@resend.dev>', // Usando remetente padrão do Resend para evitar bloqueios de domínio não validado
              to: [patient.email],
              subject: 'Convite para sua próxima sessão',
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #18181b;">
                  <h2 style="font-size: 24px;">Olá, ${patient.name.split(' ')[0]}!</h2>
                  <p style="font-size: 16px; line-height: 1.5;">O(A) <strong>Dr(a). ${drName}</strong> está lhe convidando para agendar sua próxima sessão de terapia através do portal NeuroNex.</p>
                  
                  <div style="background: #f4f4f5; padding: 24px; border-radius: 16px; margin: 24px 0; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #71717a; text-transform: uppercase; font-weight: bold; letter-spacing: 0.1em;">Código de Segurança</p>
                    <h1 style="margin: 10px 0; font-size: 32px; letter-spacing: 8px; color: #000;">${authCode}</h1>
                  </div>

                  <div style="text-align: center; margin: 32px 0;">
                    <a href="${link}" style="display: inline-block; background: #000; color: #fff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px;">
                      Escolher Horário e Confirmar
                    </a>
                  </div>

                  <hr style="border: 0; border-top: 1px solid #e4e4e7; margin: 32px 0;" />
                  <p style="font-size: 12px; color: #a1a1aa; text-align: center;">
                    Este é um convite seguro e exclusivo. Se você não esperava este e-mail, por favor ignore-o.
                  </p>
                </div>
              `
            })
          })

          if (emailRes.ok) {
            emailSent = true;
            console.log(`[invite-patient] E-mail enviado com sucesso para ${patient.email}`)
          } else {
            const errorBody = await emailRes.json()
            console.error("[invite-patient] Erro na API do Resend:", errorBody)
            emailError = errorBody.message || 'Erro desconhecido no Resend'
          }
        } catch (e) {
          console.error("[invite-patient] Erro ao processar fetch do e-mail:", e)
          emailError = e.message
        }
      }
    }

    // Se o usuário escolheu e-mail e falhou, retornamos o erro para o Toast, 
    // mas o agendamento JÁ FOI criado no banco, então ele pode tentar via WhatsApp se quiser.
    if (options.channel === 'email' && !emailSent) {
        throw new Error(`Falha no e-mail: ${emailError}. Tente enviar via WhatsApp.`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        token: inviteToken, 
        authCode,
        appointmentId: appointment.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error("[invite-patient] Erro fatal:", error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})