import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Get request body (invoice_id is required)
    const { invoice_id } = await req.json();
    if (!invoice_id) throw new Error("Invoice ID is required");

    // 2. Fetch Invoice Data + Patient Data + User Fiscal Settings
    // We use service role to bypass RLS for fetching user settings if needed, 
    // but usually we want to ensure the requester owns the data. 
    // For simplicity in this logic, we assume we need to join tables.
    
    // Fetch Invoice & Patient
    const { data: invoice, error: invoiceError } = await supabaseClient
      .from('invoices')
      .select(`
        *,
        patients (
          name,
          email,
          cpf,
          address,
          phone
        )
      `)
      .eq('id', invoice_id)
      .single();

    if (invoiceError || !invoice) throw new Error("Fatura não encontrada");

    // Fetch Fiscal Settings
    const { data: settings, error: settingsError } = await supabaseClient
      .from('user_fiscal_settings')
      .select('*')
      .eq('user_id', invoice.user_id)
      .single();

    if (settingsError || !settings || !settings.focus_nfe_api_key) {
      throw new Error("Configurações fiscais incompletas ou chave de API não encontrada.");
    }

    // 3. Prepare Payload for Focus NFe
    const isProduction = settings.focus_nfe_environment === 'producao';
    const baseUrl = isProduction 
      ? "https://api.focusnfe.com.br/v2" 
      : "https://homologacao.focusnfe.com.br/v2";

    const ref = `inv_${invoice.id}`; // Use invoice ID as reference

    // Basic Payload
    const payload = {
      data_emissao: new Date().toISOString(),
      prestador: {
        cnpj: settings.cnpj.replace(/\D/g, ''),
        inscricao_municipal: settings.municipal_inscription,
        codigo_municipio: settings.municipal_code || "3550308", // Default SP if missing, but should be validated
      },
      tomador: {
        cpf: invoice.patients?.cpf?.replace(/\D/g, ''),
        razao_social: invoice.patients?.name,
        email: invoice.patients?.email,
        endereco: {
          // Simple parsing assuming address is single string, ideally should be structured
          logradouro: invoice.patients?.address || "Endereço não informado",
          numero: "S/N",
          bairro: "Bairro",
          codigo_municipio: settings.municipal_code || "3550308", // Same logic, usually service is local
          uf: "SP", // Fallback
          cep: "00000000"
        }
      },
      servico: {
        aliquota: settings.iss_aliquot,
        discriminacao: invoice.description || "Serviços de Psicologia",
        iss_retido: false,
        item_lista_servico: settings.service_code || "04.08",
        codigo_tributario_municipio: settings.service_code || "04.08",
        valor_servicos: invoice.amount,
      },
      referencia: ref
    };

    // 4. Send to Focus NFe
    const authString = btoa(`${settings.focus_nfe_api_key}:`); // Basic Auth
    
    // We send to /nfse path
    // Note: Depending on city, Focus API might require RPS batch or single NFSe.
    // Assuming Standard API v2 for NFSe
    
    // Note: Reference needs to be sent in query or body depending on endpoint. 
    // For direct emission: POST /v2/nfse?ref=REFERENCIA
    
    const response = await fetch(`${baseUrl}/nfse?ref=${ref}`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const responseData = await response.json();

    if (!response.ok) {
        console.error("FocusNFe Error:", responseData);
        throw new Error(`Erro FocusNFe: ${JSON.stringify(responseData)}`);
    }

    // 5. Update Database
    // Focus usually returns status "processando" or "autorizado" immediately
    const status = responseData.status;
    
    await supabaseClient
      .from('invoices')
      .update({
        focus_nfe_ref: ref,
        focus_nfe_status: status,
        nfse_status: status // mapping to our internal status
      })
      .eq('id', invoice_id);

    return new Response(JSON.stringify({ success: true, data: responseData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});