import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const url = new URL(req.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");

        if (!code || !state) throw new Error("Missing code or state");

        const userId = JSON.parse(atob(state)).userId;

        const CLIENT_ID = Deno.env.get("TODOIST_CLIENT_ID");
        const CLIENT_SECRET = Deno.env.get("TODOIST_CLIENT_SECRET");
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const REDIRECT_URI = `${supabaseUrl}/functions/v1/todoist-auth-callback`;

        const tokenRes = await fetch("https://todoist.com/oauth/access_token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: CLIENT_ID!,
                client_secret: CLIENT_SECRET!,
                code,
                redirect_uri: REDIRECT_URI,
            }),
        });

        if (!tokenRes.ok) throw new Error("Failed to exchange code for token");
        const tokenData = await tokenRes.json();

        // Store token in user_todoist_tokens table
        const { error: dbError } = await supabase
            .from("user_todoist_tokens")
            .upsert({
                user_id: userId,
                access_token: tokenData.access_token,
                updated_at: new Date().toISOString()
            }, { onConflict: "user_id" });

        if (dbError) throw dbError;

        return Response.redirect(`${Deno.env.get("FRONTEND_URL") || "https://neuronex.site"}/ajustes?status=success&service=todoist`);

    } catch (e: any) {
        return Response.redirect(`${Deno.env.get("FRONTEND_URL") || "https://neuronex.site"}/ajustes?status=error&service=todoist&message=${encodeURIComponent(e.message)}`);
    }
});
