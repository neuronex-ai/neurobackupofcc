import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type JsonRecord = Record<string, unknown>;
type AppointmentEvent = "rescheduled" | "confirmed" | "cancelled";

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function requireEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function supabaseAdmin() {
  return createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeUuid(value: unknown, field: string) {
  const uuid = normalizeString(value);
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(uuid)) throw new Error(`${field} invalido.`);
  return uuid;
}

function normalizeEvent(value: unknown): AppointmentEvent {
  const event = normalizeString(value) as AppointmentEvent;
  if (!["rescheduled", "confirmed", "cancelled"].includes(event)) {
    throw new Error("Evento de agendamento invalido.");
  }
  return event;
}

function getPatientName(patient: unknown) {
  if (Array.isArray(patient)) return normalizeString((patient[0] as JsonRecord | undefined)?.name);
  return normalizeString((patient as JsonRecord | null)?.name);
}

function formatAppointmentDate(value: unknown) {
  if (!value) return "";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";

  const formatted = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);

  return formatted.replace(",", " as");
}

function eventMinuteKey(value: unknown) {
  if (!value) return "unscheduled";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "unscheduled";

  const parts = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}${get("month")}${get("day")}${get("hour")}${get("minute")}` || "unscheduled";
}

async function loadAppointment(appointmentId: string, token: string) {
  const admin = supabaseAdmin();

  const direct = await admin
    .from("appointments")
    .select("id,user_id,patient_id,start_time,token,patients(name)")
    .eq("id", appointmentId)
    .eq("token", token)
    .maybeSingle();

  if (direct.error) {
    console.error("[public-appointment-notification] direct lookup failed", direct.error);
    throw new Error("Nao foi possivel validar o agendamento.");
  }

  if (direct.data) return direct.data as JsonRecord & { patients?: unknown };

  const confirmationToken = await admin
    .from("appointment_confirmation_tokens")
    .select("appointment_id,expires_at")
    .eq("appointment_id", appointmentId)
    .eq("token", token)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (confirmationToken.error) {
    console.error("[public-appointment-notification] token lookup failed", confirmationToken.error);
    throw new Error("Nao foi possivel validar o token.");
  }

  if (!confirmationToken.data) throw new Error("Token invalido ou expirado.");

  const byToken = await admin
    .from("appointments")
    .select("id,user_id,patient_id,start_time,token,patients(name)")
    .eq("id", appointmentId)
    .maybeSingle();

  if (byToken.error) {
    console.error("[public-appointment-notification] appointment lookup failed", byToken.error);
    throw new Error("Nao foi possivel carregar o agendamento.");
  }

  if (!byToken.data) throw new Error("Agendamento nao encontrado.");
  return byToken.data as JsonRecord & { patients?: unknown };
}

async function emitAppointmentNotification(appointment: JsonRecord & { patients?: unknown }, event: AppointmentEvent) {
  const appointmentId = normalizeString(appointment.id);
  const patientId = normalizeString(appointment.patient_id);
  const userId = normalizeString(appointment.user_id);
  const patientName = getPatientName(appointment.patients) || "um paciente";
  const formattedDate = formatAppointmentDate(appointment.start_time) || "o horario agendado";

  let eventId = `appointment:${appointmentId}:${event}`;
  let title = "Agendamento confirmado";
  let message = `A presenca de ${patientName} foi confirmada para ${formattedDate}.`;
  let severity = "success";
  let priority = "normal";
  let nativePushEligible = false;

  if (event === "rescheduled") {
    eventId = `appointment:${appointmentId}:rescheduled:${eventMinuteKey(appointment.start_time)}`;
    title = "Sessao reagendada pelo paciente";
    message = `A consulta de ${patientName} foi movida para ${formattedDate}.`;
    severity = "warning";
    priority = "high";
    nativePushEligible = true;
  }

  if (event === "cancelled") {
    title = "Agendamento cancelado pelo paciente";
    message = `A consulta de ${patientName} foi cancelada.`;
    severity = "warning";
    priority = "high";
    nativePushEligible = true;
  }

  const { data, error } = await supabaseAdmin().rpc("emit_user_notification", {
    p_user_id: userId,
    p_event_id: eventId,
    p_type: `appointment_${event}`,
    p_category: "agenda",
    p_severity: severity,
    p_title: title,
    p_message: message,
    p_action_url: `/agenda?appointmentId=${appointmentId}`,
    p_priority: priority,
    p_data: {
      sourceModule: "agenda",
      eventSource: "public_appointment",
      appointmentId,
      patientId,
      event,
      requiresAction: event === "rescheduled" || event === "cancelled",
      nativePushEligible,
      deadlineAt: appointment.start_time ?? null,
    },
    p_payload: {},
    p_organization_id: null,
  });

  if (error) {
    console.error("[public-appointment-notification] emit failed", error);
    throw new Error("Nao foi possivel notificar o profissional.");
  }

  return data;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "method_not_allowed" }, 405);

  try {
    const body = (await req.json().catch(() => ({}))) as JsonRecord;
    const appointmentId = normalizeUuid(body.appointmentId, "Agendamento");
    const token = normalizeString(body.token);
    if (!token) throw new Error("Token obrigatorio.");

    const event = normalizeEvent(body.event);
    const appointment = await loadAppointment(appointmentId, token);
    const notificationId = await emitAppointmentNotification(appointment, event);

    return jsonResponse({ notificationId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno.";
    return jsonResponse({ error: message }, 400);
  }
});
