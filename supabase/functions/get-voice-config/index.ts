import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { GoogleGenAI } from "npm:@google/genai@1.34.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LIVE_MODEL = "gemini-3.1-flash-live-preview";
const DEFAULT_VOICE = "Kore";

const json = (payload: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const geminiKey = Deno.env.get("GEMINI_API_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      return json({ error: "Supabase environment is not configured" }, 500);
    }

    if (!geminiKey) {
      return json({ error: "Gemini API key not configured" }, 500);
    }

    const jwt = authHeader.replace("Bearer ", "");
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return json({ error: "Invalid token" }, 401);
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000).toISOString();
    const newSessionExpiresAt = new Date(now.getTime() + 2 * 60 * 1000).toISOString();

    const client = new GoogleGenAI({
      apiKey: geminiKey,
      httpOptions: { apiVersion: "v1alpha" },
    });

    const token = await client.authTokens.create({
      config: {
        uses: 1,
        expireTime: expiresAt,
        newSessionExpireTime: newSessionExpiresAt,
        httpOptions: { apiVersion: "v1alpha" },
      },
    });

    return json({
      token: token.name,
      expiresAt,
      newSessionExpiresAt,
      model: LIVE_MODEL,
      voiceName: DEFAULT_VOICE,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected voice configuration error";
    console.error("[get-voice-config] Error:", message);
    return json({ error: message }, 500);
  }
});
