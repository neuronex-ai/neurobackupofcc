import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const allowedAudioTypes = new Set([
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/flac",
]);

const jsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Token ausente" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) return jsonResponse({ error: "Token inválido" }, 401);

    const groqKey = Deno.env.get("GROQ_API_KEY");
    if (!groqKey) return jsonResponse({ error: "GROQ_API_KEY não configurada" }, 503);

    const incoming = await req.formData();
    const audio = incoming.get("audio");
    if (!(audio instanceof File)) return jsonResponse({ error: "Arquivo de áudio ausente" }, 400);
    if (audio.size === 0) return jsonResponse({ error: "Arquivo de áudio vazio" }, 400);
    if (audio.size > 20 * 1024 * 1024) return jsonResponse({ error: "Áudio excede o limite de 20 MB" }, 413);

    const normalizedType = audio.type.split(";")[0].toLowerCase();
    if (normalizedType && !allowedAudioTypes.has(normalizedType)) {
      return jsonResponse({ error: `Formato de áudio não suportado: ${normalizedType}` }, 415);
    }

    const groqForm = new FormData();
    groqForm.append("file", audio, audio.name || "voice.webm");
    groqForm.append("model", Deno.env.get("GROQ_STT_MODEL") || "whisper-large-v3-turbo");
    groqForm.append("language", "pt");
    groqForm.append("response_format", "verbose_json");
    groqForm.append("temperature", "0");

    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${groqKey}` },
      body: groqForm,
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const providerMessage = payload?.error?.message || "Falha na transcrição de voz";
      console.error("[synapse-voice-transcribe] Groq error", response.status, providerMessage);
      return jsonResponse({ error: providerMessage }, response.status >= 500 ? 502 : response.status);
    }

    const text = typeof payload?.text === "string" ? payload.text.trim() : "";
    return jsonResponse({
      text,
      language: payload?.language || "pt",
      duration: typeof payload?.duration === "number" ? payload.duration : null,
      provider: "groq",
      model: Deno.env.get("GROQ_STT_MODEL") || "whisper-large-v3-turbo",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno";
    console.error("[synapse-voice-transcribe]", message);
    return jsonResponse({ error: message }, 500);
  }
});
