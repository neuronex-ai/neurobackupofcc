import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-synapse-channel-secret",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const channelSecret = req.headers.get("x-synapse-channel-secret");
        const envChannelSecret = Deno.env.get("SYNAPSE_CHANNEL_SECRET");

        if (!channelSecret || channelSecret !== envChannelSecret) {
            return new Response(JSON.stringify({ error: "Unauthorized Gateway" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

        const body = await req.json();
        const {
            professional_id,
            remote_jid,
            message,
            instance_name,
            push_name,
            source_message_id,
            source_timestamp,
            channel = "whatsapp",
            message_type = "text",
            attachments = []
        } = body;

        if (!professional_id || !remote_jid || !message) {
            return new Response(JSON.stringify({ error: "Missing required fields" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        const sessionIdFormat = `whatsapp:${professional_id}:${remote_jid}`;

        // Enviar para o Core (gemini-text-chat) interno
        const internalSecret = Deno.env.get("SYNAPSE_INTERNAL_SECRET");
        if (!internalSecret) throw new Error("SYNAPSE_INTERNAL_SECRET não configurado no backend");

        const corePayload = {
            professional_id,
            session_id: sessionIdFormat,
            channel,
            message,
            attachments,
            source: {
                remote_jid,
                instance_name,
                push_name,
                source_message_id,
                source_timestamp,
                message_type
            }
        };

        const coreUrl = `${supabaseUrl}/functions/v1/gemini-text-chat`;

        const coreResponse = await fetch(coreUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-internal-synapse-secret": internalSecret
            },
            body: JSON.stringify(corePayload)
        });

        if (!coreResponse.ok) {
            const errorText = await coreResponse.text();
            throw new Error(`Core Error: ${errorText}`);
        }

        const coreData = await coreResponse.json();

        // Quebrar resposta para WhatsApp (cada chunk máx 1000 caracteres se for MT text, opcional)
        // Aqui deixamos flexível caso o webhook chame
        const responseText = coreData.response || "";
        const replyChunks = responseText ? responseText.match(/[\s\S]{1,1000}/g) : [];

        const responsePayload = {
            ok: true,
            session_id: sessionIdFormat,
            professional_id,
            remote_jid,
            reply_text: responseText,
            reply_chunks: replyChunks,
            core_result: coreData
        };

        return new Response(JSON.stringify(responsePayload), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (error: any) {
        console.error("Gateway Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});
