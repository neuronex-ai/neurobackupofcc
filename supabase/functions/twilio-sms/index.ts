import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_VERIFY_SID = Deno.env.get("TWILIO_VERIFY_SID");

serve(async (req: Request) => {
    // 1. CORS Preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    // 2. Validation of Environment Variables
    const ACCOUNT_SID = TWILIO_ACCOUNT_SID?.trim();
    const AUTH_TOKEN = TWILIO_AUTH_TOKEN?.trim();
    const VERIFY_SID = TWILIO_VERIFY_SID?.trim();

    if (!ACCOUNT_SID || !AUTH_TOKEN || !VERIFY_SID) {
        console.error("Missing Twilio Environment Variables", {
            hasAccountSid: !!ACCOUNT_SID,
            hasAuthToken: !!AUTH_TOKEN,
            hasVerifySid: !!VERIFY_SID
        });
        return new Response(JSON.stringify({
            error: "Server configuration error: Missing environment variables",
            details: {
                ACCOUNT_SID: !!ACCOUNT_SID,
                AUTH_TOKEN: !!AUTH_TOKEN,
                VERIFY_SID: !!VERIFY_SID
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    try {
        const authHeader = "Basic " + btoa(`${ACCOUNT_SID}:${AUTH_TOKEN}`);
        const verifyBaseUrl = `https://verify.twilio.com/v2/Services/${VERIFY_SID}`;

        const { action, phone, code } = await req.json();

        if (!phone) {
            console.error("Missing phone number");
            return new Response(JSON.stringify({ error: "Phone number is required" }), { status: 400, headers: corsHeaders });
        }

        // Improved Phone Formatting
        let cleanPhone = phone.replace(/\D/g, "");
        // Heuristic: If 10 or 11 digits (DDD + Number), assume BR and prepend 55.
        // If 12 or 13 digits (55 + DDD + Number), keep as is.
        if (cleanPhone.length >= 10 && cleanPhone.length <= 11) {
            cleanPhone = "55" + cleanPhone;
        }
        const formattedPhone = "+" + cleanPhone;

        console.log(`Action: ${action}, Raw Phone: ${phone}, Formatted: ${formattedPhone}`);

        if (action === "send-verification") {
            const params = new URLSearchParams();
            params.append("To", formattedPhone);
            params.append("Channel", "sms");

            const response = await fetch(`${verifyBaseUrl}/Verifications`, {
                method: "POST",
                headers: {
                    "Authorization": authHeader,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: params,
            });

            const result = await response.json();

            if (!response.ok) {
                console.error("Twilio Verification Start Failed:", JSON.stringify(result));
                // Return the specific message from Twilio if available
                return new Response(JSON.stringify({
                    error: result.message || "Failed to send code via Twilio",
                    details: result
                }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }

            return new Response(JSON.stringify({ success: true, status: result.status }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        if (action === "verify-code") {
            if (!code) {
                return new Response(JSON.stringify({ error: "Code is required" }), { status: 400, headers: corsHeaders });
            }

            const params = new URLSearchParams();
            params.append("To", formattedPhone);
            params.append("Code", code);

            const response = await fetch(`${verifyBaseUrl}/VerificationCheck`, {
                method: "POST",
                headers: {
                    "Authorization": authHeader,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: params,
            });

            const result = await response.json();

            if (!response.ok) {
                console.error("Twilio Check Failed:", JSON.stringify(result));
                return new Response(JSON.stringify({
                    error: result.message || "Failed to verify code via Twilio",
                    details: result
                }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }

            if (result.status === "approved") {
                return new Response(JSON.stringify({ success: true, valid: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
            } else {
                return new Response(JSON.stringify({ success: false, valid: false, message: "Invalid code" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }
        }

        return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers: corsHeaders });

    } catch (err: any) {
        console.error("Global Error:", err);
        return new Response(JSON.stringify({ error: err.message || "Internal Server Error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
});
