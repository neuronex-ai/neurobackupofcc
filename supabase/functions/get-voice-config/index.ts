import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { GoogleGenAI } from "npm:@google/genai@1.34.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LIVE_MODEL = "gemini-3.1-flash-live-preview";
const DEFAULT_VOICE = "Kore";

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // Verify user is authenticated
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
        const jwt = authHeader.replace('Bearer ', '');

        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: `Bearer ${jwt}` } }
        });

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return new Response(
                JSON.stringify({ error: 'Invalid token' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const geminiKey = Deno.env.get('GEMINI_API_KEY');
        if (!geminiKey) {
            return new Response(
                JSON.stringify({ error: 'Gemini API key not configured' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const now = new Date();
        const expiresAt = new Date(now.getTime() + 30 * 60 * 1000).toISOString();
        const newSessionExpiresAt = new Date(now.getTime() + 5 * 60 * 1000).toISOString();

        const client = new GoogleGenAI({
            apiKey: geminiKey,
            httpOptions: { apiVersion: "v1alpha" },
        });

        const token = await client.authTokens.create({
            config: {
                uses: 1,
                expireTime: expiresAt,
                newSessionExpireTime: newSessionExpiresAt,
                liveConnectConstraints: {
                    model: LIVE_MODEL,
                    config: {
                        sessionResumption: {},
                        temperature: 0.5,
                        responseModalities: ["AUDIO"],
                    },
                },
                httpOptions: { apiVersion: "v1alpha" },
            },
        });

        return new Response(
            JSON.stringify({
                token: token.name,
                expiresAt,
                newSessionExpiresAt,
                model: LIVE_MODEL,
                voiceName: DEFAULT_VOICE,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unexpected voice configuration error';
        console.error('[get-voice-config] Error:', message);
        return new Response(
            JSON.stringify({ error: message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
