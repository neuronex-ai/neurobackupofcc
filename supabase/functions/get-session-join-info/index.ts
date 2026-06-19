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

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { appointmentId } = await req.json();
    if (!isUuid(appointmentId)) {
      return json({ error: "Agendamento inválido." }, 400);
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
    if (!appointment) return json({ error: "Sessão não encontrada." }, 404);

    const metadata = appointment.metadata && typeof appointment.metadata === "object"
      ? appointment.metadata as Record<string, any>
      : {};
    const decision = metadata.teleconsultationTranscription && typeof metadata.teleconsultationTranscription === "object"
      ? metadata.teleconsultationTranscription as Record<string, any>
      : {};
    const room = metadata.teleconsultationRoom && typeof metadata.teleconsultationRoom === "object"
      ? metadata.teleconsultationRoom as Record<string, any>
      : {};

    const isOnline = appointment.type === "online";
    const hasDecision = isOnline && typeof decision.enabled === "boolean";
    const rawRoomStatus = room.status === "open" || room.status === "closed" ? room.status : "waiting";
    const lastHeartbeatAt = typeof room.lastHeartbeatAt === "string" ? new Date(room.lastHeartbeatAt) : null;
    const heartbeatExpired = rawRoomStatus === "open" &&
      (!lastHeartbeatAt || Number.isNaN(lastHeartbeatAt.getTime()) || Date.now() - lastHeartbeatAt.getTime() > 45000);
    const roomStatus = heartbeatExpired ? "closed" : rawRoomStatus;
    const transcriptionEnabled = hasDecision && decision.enabled === true;
    const canJoin = hasDecision && roomStatus === "open";
    const waitMessage = !hasDecision
      ? "Aguarde o psicólogo definir se a teleconsulta será transcrita."
      : roomStatus === "waiting"
        ? "Aguarde o psicólogo abrir a sala."
        : roomStatus === "closed"
          ? "Esta sala foi encerrada pelo psicólogo."
          : null;

    return json({
      transcriptionEnabled,
      noticeText: transcriptionEnabled ? TRANSCRIPTION_NOTICE : null,
      noticeVersion: transcriptionEnabled ? decision.noticeVersion || "2026-06-teleconsultation-transcription-v1" : null,
      decisionStatus: hasDecision ? "decided" : "pending",
      roomStatus,
      canJoin,
      waitMessage,
    });
  } catch (error) {
    console.error("get-session-join-info error", error);
    return json({ error: "Não foi possível carregar os dados de entrada." }, 500);
  }
});
