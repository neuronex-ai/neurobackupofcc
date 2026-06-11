import { serve } from "http/server";
import { createClient } from "supabase";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();
    console.log("Base By Asaas Webhook received event:", body.event || body.type);

    // Identify the event
    const eventType = body.event || body.type || "unknown";
    const eventId = body.id || (eventType + "_" + Date.now());

    // Save the event for audit/processing
    const { error: insertError } = await supabaseClient
      .from("base_asaas_events")
      .insert({
        event_type: eventType,
        event_id: String(eventId),
        payload: body,
        status: "pending"
      });

    if (insertError) {
      console.error("Error saving webhook event:", insertError);
      if (insertError.code === "23505") {
         return new Response(JSON.stringify({ message: "Event already received" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    return new Response(JSON.stringify({ received: true, eventId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
