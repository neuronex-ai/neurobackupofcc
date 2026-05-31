import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    console.log("Evento Jitsi Recebido:", body);

    // O Jitsi envia o nome da sala no campo 'fqn' (AppID/RoomName) ou 'room_name'
    // Exemplo FQN: "vpaas-magic-cookie-.../UUID-DO-AGENDAMENTO"
    const fqn = body.fqn || body.room_name || "";
    
    // Extrai o ID do agendamento (pega a última parte após a barra)
    const parts = fqn.split('/');
    const appointmentId = parts.length > 1 ? parts[parts.length - 1] : fqn;

    if (!appointmentId) {
       return new Response(JSON.stringify({ recebido: true, mensagem: "ID da sala não identificado." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200, // Retorna 200 para o Jitsi não ficar tentando reenviar
      });
    }

    // Tenta encontrar o agendamento
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .single();

    if (fetchError || !appointment) {
      console.error("Agendamento não encontrado para ID:", appointmentId);
      // Retorna 200 com mensagem de erro lógica para o Jitsi saber que processamos
      return new Response(JSON.stringify({ recebido: true, mensagem: "Nenhum ID de agendamento encontrado." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200, 
      });
    }

    // Lógica de processamento do evento (ex: gravação, entrada de participante)
    // Aqui você pode adicionar lógica para atualizar status, salvar link da gravação, etc.
    if (body.eventType === 'RECORDER_FILE_UPLOADED') {
        // Exemplo: Salvar link da gravação
    }

    return new Response(JSON.stringify({ recebido: true, mensagem: "Evento processado com sucesso." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Erro no webhook:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});