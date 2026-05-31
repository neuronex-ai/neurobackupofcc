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
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: "Unauthorized" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { data: { user }, error } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
        if (error || !user) throw new Error("Invalid token");

        const CLIENT_ID = Deno.env.get("TODOIST_CLIENT_ID");
        if (!CLIENT_ID) throw new Error("Missing TODOIST_CLIENT_ID");

        const REDIRECT_URI = `${supabaseUrl}/functions/v1/todoist-auth-callback`;
        const SCOPE = "data:read_write,task:add,project:read"; // Adjust scopes as needed
        const STATE = btoa(JSON.stringify({ userId: user.id }));

        const authUrl = `https://todoist.com/oauth/authorize?client_id=${CLIENT_ID}&scope=${SCOPE}&state=${STATE}&redirect_uri=${REDIRECT_URI}`;

        return new Response(
            JSON.stringify({ authUrl }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (e: any) {
        return new Response(
            JSON.stringify({ error: e.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
