import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TRANSCRIPTION_NOTICE =
  "Esta teleconsulta será transcrita pela plataforma NeuroNex AI para apoiar a elaboração do registro clínico. Você pode solicitar ao seu psicólogo acesso às informações pertinentes, correção e avaliação de eliminação quando aplicável, observadas as obrigações legais, éticas e de guarda do prontuário/registro documental. A plataforma preserva sigilo, finalidade clínica e tratamento de dados conforme a LGPD e normas profissionais aplicáveis.";

const isUuid = (value: unknown) =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { appointmentId } = await req.json();
    if (!isUuid(appointmentId)) {
      return new Response(JSON.stringify({ error: "Agendamento inválido." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: appointment, error } = await supabase
      .from("appointments")
      .select("id, type, status, metadata")
      .eq("id", appointmentId)
      .maybeSingle();

    if (error) throw error;
    if (!appointment) {
      return new Response(JSON.stringify({ error: "Sessão não encontrada." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const metadata = appointment.metadata && typeof appointment.metadata === "object"
      ? appointment.metadata as Record<string, any>
      : {};
    const decision = metadata.teleconsultationTranscription && typeof metadata.teleconsultationTranscription === "object"
      ? metadata.teleconsultationTranscription as Record<string, any>
      : {};
    const transcriptionEnabled = appointment.type === "online" && decision.enabled === true;

    return new Response(JSON.stringify({
      transcriptionEnabled,
      noticeText: transcriptionEnabled ? TRANSCRIPTION_NOTICE : null,
      noticeVersion: transcriptionEnabled ? decision.noticeVersion || "2026-06-teleconsultation-transcription-v1" : null,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("get-session-join-info error", error);
    return new Response(JSON.stringify({ error: "Não foi possível carregar os dados de entrada." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
