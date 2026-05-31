import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-notion-secret",
};

serve(async (req) => {
    // Handle CORS
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // Only allow POST
        if (req.method !== "POST") {
            throw new Error("Method not allowed. Use POST.");
        }

        // Optional: Validate Secret Header for Security
        // You should set NOTION_WEBHOOK_SECRET in your Supabase secrets.
        const secret = Deno.env.get("NOTION_WEBHOOK_SECRET");
        const receivedSecret = req.headers.get("x-notion-secret");

        if (secret && receivedSecret !== secret) {
            console.warn("Unauthorized request attempt (Invalid Secret)");
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Parse JSON Body
        const payload = await req.json();
        console.log("🔔 Notion Webhook Received:", JSON.stringify(payload, null, 2));

        // Here you would add logic to process the data
        // Example: Create a task, update a patient record, etc.
        // based on payload content.

        return new Response(JSON.stringify({ message: "Webhook processed successfully", data: payload }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        console.error("❌ Error processing webhook:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
