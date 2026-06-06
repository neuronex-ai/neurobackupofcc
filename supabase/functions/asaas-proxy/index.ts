/**
 * Legacy Asaas proxy.
 *
 * This function used to contain sandbox-only configuration. It is intentionally
 * disabled in production; use the dedicated Asaas Edge Functions instead.
 */

import {
    corsResponse,
    errorResponse,
    getAuthenticatedUser,
} from "../_shared/asaas-client.ts";

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") return corsResponse();

    try {
        await getAuthenticatedUser(req);
        return errorResponse(
            "asaas-proxy foi desativada. Use asaas-account-sync ou asaas-create-payment.",
            410
        );
    } catch (error: any) {
        return errorResponse(error.message || "Unauthorized", 401);
    }
});
