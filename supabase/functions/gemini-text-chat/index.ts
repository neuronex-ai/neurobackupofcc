const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método não permitido." }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
    });
  }

  try {
    const authorization = request.headers.get("Authorization") || "";
    if (!authorization.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Sessão ausente." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")?.replace(/\/+$/, "");
    if (!supabaseUrl) throw new Error("SUPABASE_URL não configurada.");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const body = await request.text();
    const response = await fetch(`${supabaseUrl}/functions/v1/synapse-text-fallback`, {
      method: "POST",
      headers: {
        Authorization: authorization,
        ...(anonKey ? { apikey: anonKey } : {}),
        "Content-Type": "application/json",
      },
      body,
    });
    const payload = await response.text();
    return new Response(payload, {
      status: response.status,
      headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
    });
  } catch (error) {
    console.error("[gemini-text-chat compatibility proxy]", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Falha ao acionar o Synapse.",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
    });
  }
});
