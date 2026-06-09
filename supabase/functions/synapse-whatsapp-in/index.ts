import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-synapse-channel-secret",
};

const jsonResponse = (payload: Record<string, unknown>, status = 200) =>
    new Response(JSON.stringify(payload), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

const normalizeInstanceKey = (value: unknown) => String(value || "").trim().toLowerCase();

const stripSynapseWidgets = (text: string) =>
    text
        .replace(/```json\s+synapse_widget[\s\S]*?```/gi, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

const splitForWhatsApp = (text: string, maxLength = 1000) => {
    const clean = stripSynapseWidgets(text);
    if (!clean) return [];

    const chunks: string[] = [];
    let remaining = clean;

    while (remaining.length > maxLength) {
        const slice = remaining.slice(0, maxLength);
        const breakAt = Math.max(slice.lastIndexOf("\n"), slice.lastIndexOf(" "));
        const end = breakAt > 240 ? breakAt : maxLength;
        chunks.push(remaining.slice(0, end).trim());
        remaining = remaining.slice(end).trim();
    }

    if (remaining) chunks.push(remaining);
    return chunks;
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const channelSecret = req.headers.get("x-synapse-channel-secret");
        const envChannelSecret = Deno.env.get("SYNAPSE_CHANNEL_SECRET");

        if (!envChannelSecret || !channelSecret || channelSecret !== envChannelSecret) {
            return jsonResponse({ error: "Unauthorized Gateway" }, 401);
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        const internalSecret = Deno.env.get("SYNAPSE_INTERNAL_SECRET");

        if (!supabaseUrl || !supabaseKey || !internalSecret) {
            throw new Error("Configuracao interna Synapse/Supabase ausente.");
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
            auth: { persistSession: false },
        });

        const body = await req.json();
        const {
            remote_jid,
            message,
            push_name,
            source_message_id,
            source_timestamp,
            channel = "whatsapp",
            message_type = "text",
            attachments = [],
        } = body;
        const instanceName = body.instance_name || body.instance;
        const instanceKey = normalizeInstanceKey(instanceName);

        if (!instanceKey || !remote_jid || !message) {
            return jsonResponse({ error: "Missing required fields: instance_name, remote_jid and message" }, 400);
        }

        const { data: instance, error: instanceError } = await supabaseAdmin
            .from("synapse_whatsapp_instances")
            .select("professional_id, instance_name, enabled")
            .eq("instance_key", instanceKey)
            .maybeSingle();

        if (instanceError) throw instanceError;
        if (!instance || instance.enabled === false) {
            return jsonResponse({ error: "WhatsApp instance is not mapped or is disabled" }, 404);
        }

        const professionalId = instance.professional_id;
        const sessionIdFormat = `whatsapp:${professionalId}:${remote_jid}`;

        const corePayload = {
            professional_id: professionalId,
            session_id: sessionIdFormat,
            remote_jid,
            channel,
            message,
            attachments,
            context: {
                currentContext: "synapse",
                route: "whatsapp",
                source: "whatsapp",
                channel,
                instanceName: instance.instance_name,
                remoteJid: remote_jid,
                pushName: push_name || null,
            },
            source: {
                remote_jid,
                instance_name: instance.instance_name,
                push_name,
                source_message_id,
                source_timestamp,
                message_type,
            },
        };

        const coreResponse = await fetch(`${supabaseUrl}/functions/v1/gemini-text-chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-internal-synapse-secret": internalSecret,
            },
            body: JSON.stringify(corePayload),
        });

        const coreText = await coreResponse.text();
        let coreData: Record<string, any> = {};
        try {
            coreData = coreText ? JSON.parse(coreText) : {};
        } catch {
            coreData = { error: coreText };
        }

        if (!coreResponse.ok) {
            return jsonResponse({
                error: "Core Synapse Error",
                details: coreData.error || coreText,
            }, coreResponse.status);
        }

        const replyText = stripSynapseWidgets(String(coreData.response || ""));
        const replyChunks = splitForWhatsApp(replyText);

        return jsonResponse({
            ok: true,
            session_id: coreData.session_id || sessionIdFormat,
            professional_id: professionalId,
            remote_jid,
            reply_text: replyText,
            reply_chunks: replyChunks,
            client_action: coreData.clientAction || null,
            core_result: coreData,
        });
    } catch (error: any) {
        console.error("[synapse-whatsapp-in] Gateway Error:", error);
        return jsonResponse({ error: error?.message || "Internal gateway error" }, 500);
    }
});
