import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error("Missing Supabase environment variables");
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Get user from auth header
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(
                JSON.stringify({ connected: false, error: "No auth header" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return new Response(
                JSON.stringify({ connected: false, error: "Auth failed" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Check for tokens using service role (bypasses RLS)
        const { data: tokenData, error: tokenError } = await supabase
            .from("user_google_tokens")
            .select("id, access_token, expires_at")
            .eq("user_id", user.id)
            .maybeSingle();

        if (tokenError) {
            console.error("Token fetch error:", tokenError);
            return new Response(
                JSON.stringify({ connected: false, error: tokenError.message }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        if (!tokenData || !tokenData.access_token) {
            return new Response(
                JSON.stringify({ connected: false }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Try to get email from Google to verify token is still valid
        let email = null;
        try {
            const userInfoRes = await fetch(
                "https://www.googleapis.com/oauth2/v1/userinfo?alt=json",
                { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
            );
            if (userInfoRes.ok) {
                const userInfo = await userInfoRes.json();
                email = userInfo.email;
            }
        } catch (e) {
            console.log("Could not fetch Google user info, but token exists");
        }

        return new Response(
            JSON.stringify({
                connected: true,
                email,
                expiresAt: tokenData.expires_at
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error: any) {
        console.error("Error:", error);
        return new Response(
            JSON.stringify({ connected: false, error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
