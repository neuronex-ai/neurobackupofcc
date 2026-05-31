import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { invoice_id, patient_id, service_description, amount } = await req.json()

    // 1. Buscar Dados do Usuário (Prestador) e Configurações Fiscais
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    const { data: fiscalSettings, error: fiscalError } = await supabaseClient
      .from('user_fiscal_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (fiscalError || !fiscalSettings) throw new Error('Configurações fiscais não encontradas. Configure seu perfil.')

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // 2. Buscar Dados do Paciente (Tomador)
    const { data: patient, error: patientError } = await supabaseClient
      .from('patients')
      .select('*')
      .eq('id', patient_id)
      .single()

    if (patientError || !patient) throw new Error('Paciente não encontrado')
    if (!patient.cpf) throw new Error('CPF do paciente é obrigatório para emissão de nota.')

    // 3. Preparar Payload para Focus NFe
    // A chave da API pode vir do ambiente (White Label) ou das configs do usuário.
    // Priorizando a do usuário se existir, senão usa a da NeuroNex (Ambiente)
    const focusApiKey = fiscalSettings.focus_nfe_api_key || Deno.env.get('FOCUS_NFE_API_KEY')
    const isProduction = fiscalSettings.focus_nfe_environment === 'producao'
    
    // IMPORTANTE: O parâmetro 'ref' que estava faltando
    const reference = invoice_id 

    const payload = {
      data_emissao: new Date().toISOString(),
      prestador: {
        cnpj: fiscalSettings.cnpj?.replace(/\D/g, ''),
        inscricao_municipal: fiscalSettings.municipal_inscription,
        codigo_municipio: fiscalSettings.municipal_code,
      },
      tomador: {
        cpf: patient.cpf.replace(/\D/g, ''),
        razao_social: patient.name,
        email: patient.email,
        endereco: {
           logradouro: patient.address || "Endereço não informado",
           numero: "S/N", // Idealmente ter isso no cadastro do paciente
           bairro: "Centro", 
           codigo_municipio: "3550308", // Exemplo SP, idealmente pegar do cadastro
           uf: "SP",
           cep: "01001000"
        }
      },
      servico: {
        aliquota: fiscalSettings.iss_aliquot || 2.0,
        discriminacao: service_description,
        iss_retido: false,
        item_lista_servico: fiscalSettings.service_code || "04.03", // Psicologia
        codigo_tributario_municipio: fiscalSettings.service_code,
        valor_servicos: amount
      },
      ref: reference // Identificador único da nota no nosso sistema
    }

    // 4. Enviar para Focus NFe
    const url = isProduction 
        ? 'https://api.focusnfe.com.br/v2/nfse' 
        : 'https://homologacao.focusnfe.com.br/v2/nfse'

    console.log("Enviando para Focus:", JSON.stringify(payload));

    const response = await fetch(`${url}?ref=${reference}`, { // ref também na URL por segurança em algumas versões
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(focusApiKey + ':')}`
      },
      body: JSON.stringify(payload)
    })

    const responseData = await response.json()

    if (!response.ok) {
        console.error("Erro Focus NFe:", responseData);
        throw new Error(responseData.mensagem || JSON.stringify(responseData))
    }

    // 5. Atualizar Fatura no Banco com status 'em processamento'
    await supabaseClient
      .from('invoices')
      .update({
        focus_nfe_ref: reference,
        focus_nfe_status: responseData.status || 'processando',
        nfse_status: 'processing'
      })
      .eq('id', invoice_id)

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})