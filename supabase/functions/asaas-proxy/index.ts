import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ASAAS_API_URL = "https://sandbox.asaas.com/api/v3";
// Chave de sandbox fornecida
const ASAAS_API_KEY = "$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjQ5ZTYxMTZiLWM4MDctNDhlNy1hYTYwLTg0YTI2OTc0YTI4ZTo6JGFhY2hfYjY4ODUzMWQtMDE3ZC00ZjE1LThjNmMtMjVjNzUzZmE2NGQy";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, payload, asaas_account_id } = await req.json();

    // Headers padrão para Asaas V3 Sandbox
    const asaasHeaders = {
      'Content-Type': 'application/json',
      'access_token': ASAAS_API_KEY
    };

    console.log(`[asaas-proxy] Executando ação: ${action}`);

    if (action === 'get-account-status') {
      const response = await fetch(`${ASAAS_API_URL}/accounts`, {
        method: 'GET',
        headers: asaasHeaders
      });
      const data = await response.json();
      return new Response(JSON.stringify(data), { headers: corsHeaders });
    }

    if (action === 'create-payment') {
      const response = await fetch(`${ASAAS_API_URL}/payments`, {
        method: 'POST',
        headers: asaasHeaders,
        body: JSON.stringify({
          ...payload,
          postalService: false // Desabilita envio via correios
        })
      });
      const data = await response.json();
      return new Response(JSON.stringify(data), { 
        status: response.ok ? 200 : 400,
        headers: corsHeaders 
      });
    }

    // Outras ações conforme necessário...

    return new Response(JSON.stringify({ error: 'Ação não suportada' }), { status: 400, headers: corsHeaders });

  } catch (error) {
    console.error(`[asaas-proxy] Erro crítico:`, error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
})