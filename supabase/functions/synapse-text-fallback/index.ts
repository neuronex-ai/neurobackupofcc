import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

async function callGroq(apiKey: string, model: string, messages: Array<Record<string, string>>) {
  return fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,
      max_completion_tokens: 1100,
    }),
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Método não permitido." }, 405);

  try {
    const authorization = request.headers.get("Authorization") || "";
    if (!authorization.startsWith("Bearer ")) return json({ error: "Sessão ausente." }, 401);

    const body = await request.json();
    const message = String(body.message || "").trim();
    const sessionId = String(body.sessionId || body.session_id || "").trim();
    const context = body.context || {};
    if (!message || !sessionId) return json({ error: "Mensagem ou conversa ausente." }, 400);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false },
    });
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const { data: authData, error: authError } = await userClient.auth.getUser();
    const user = authData.user;
    if (authError || !user) return json({ error: "Sessão inválida." }, 401);

    const { data: history } = await admin
      .from("messages")
      .select("role,content")
      .eq("user_id", user.id)
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(10);

    const systemPrompt = [
      "Você é o Synapse, assistente central da plataforma NeuroNex para profissionais de saúde mental.",
      "Responda em português brasileiro, de forma clara, simples e confiável.",
      "Este é um modo de contingência: não invente dados, não afirme que executou ferramentas e não realize ações de escrita.",
      "Nunca mostre URLs, rotas, UUIDs, IDs, JSON ou detalhes técnicos internos.",
      `Contexto atual: ${String(context.currentContext || context.route || "Synapse")}.`,
    ].join("\n");

    const messages = [
      { role: "system", content: systemPrompt },
      ...(history || []).reverse().map((item: any) => ({
        role: item.role === "assistant" ? "assistant" : "user",
        content: String(item.content || "").slice(0, 3500),
      })),
      { role: "user", content: message },
    ];

    const apiKey = Deno.env.get("GROQ_API_KEY");
    if (!apiKey) return json({ error: "Provedor alternativo indisponível." }, 503);

    const primaryModel = Deno.env.get("GROQ_CHAT_MODEL") || "llama-3.1-8b-instant";
    const secondaryModel = Deno.env.get("GROQ_FALLBACK_MODEL") || "llama-3.3-70b-versatile";
    let selectedModel = primaryModel;
    let response = await callGroq(apiKey, primaryModel, messages);

    if (!response.ok && secondaryModel !== primaryModel) {
      selectedModel = secondaryModel;
      response = await callGroq(apiKey, secondaryModel, messages);
    }

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      return json({ error: payload?.error?.message || "Provedor alternativo indisponível." }, 503);
    }

    const responseText = String(payload?.choices?.[0]?.message?.content || "").trim();
    if (!responseText) return json({ error: "Resposta vazia do provedor alternativo." }, 502);

    const { data: latestUserMessage } = await admin
      .from("messages")
      .select("content,created_at")
      .eq("user_id", user.id)
      .eq("session_id", sessionId)
      .eq("role", "user")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const latestAge = latestUserMessage?.created_at
      ? Date.now() - new Date(latestUserMessage.created_at).getTime()
      : Number.POSITIVE_INFINITY;

    if (latestUserMessage?.content !== message || latestAge > 60_000) {
      await admin.from("messages").insert({
        user_id: user.id,
        session_id: sessionId,
        role: "user",
        content: message,
      });
    }

    await admin.from("messages").insert({
      user_id: user.id,
      session_id: sessionId,
      role: "assistant",
      content: responseText,
    });

    await admin
      .from("chat_sessions")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", sessionId)
      .eq("user_id", user.id);

    return json({
      response: responseText,
      clientAction: null,
      session_id: sessionId,
      provider: "groq",
      model: selectedModel,
      fallback: true,
    });
  } catch (error) {
    console.error("[synapse-text-fallback]", error);
    return json({
      error: error instanceof Error ? error.message : "Falha no modo de contingência.",
    }, 500);
  }
});
