import {
    asaasRequest,
    corsResponse,
    errorResponse,
    getAuthenticatedUser,
    getFinancialAccount,
    getFinancialAccountAsaasApiKey,
    jsonResponse,
    recordBaasOperation,
    supabaseAdmin,
} from "../_shared/asaas-client.ts";

function normalizePixKey(raw: any) {
    const id = String(raw?.id || raw?.key || raw?.pixAddressKey || raw?.addressKey || "");
    return {
        ...raw,
        id,
        provider_id: id,
        key: raw?.key || raw?.pixAddressKey || raw?.addressKey || id,
        type: raw?.type || raw?.keyType || "EVP",
        status: raw?.status || (raw?.active === false ? "INACTIVE" : "ACTIVE"),
    };
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") return corsResponse();

    try {
        const user = await getAuthenticatedUser(req);
        const body = await req.json().catch(() => ({}));
        const action = body.action || "list_keys";
        const account = await getFinancialAccount(user.id);
        const apiKey = getFinancialAccountAsaasApiKey(account);

        if (!account || !apiKey) {
            return errorResponse("Sua conta financeira ainda não está pronta para Pix.", 403, { code: "ACCOUNT_NOT_READY" });
        }

        if (action === "list_keys") {
            const result = await asaasRequest<any>("/pix/addressKeys?limit=100&offset=0", "GET", undefined, apiKey);
            const keys = Array.isArray(result?.data) ? result.data.map(normalizePixKey) : [];
            return jsonResponse({ success: true, data: keys, keys, totalCount: result?.totalCount || keys.length });
        }

        if (action === "create_key") {
            if (!body.consent) {
                return errorResponse("Confirme a criação da chave Pix antes de continuar.", 400, { code: "CONSENT_REQUIRED" });
            }

            const result = await asaasRequest("/pix/addressKeys", "POST", { type: "EVP" }, apiKey);
            await supabaseAdmin.from("financial_accounts").update({
                pix_key_consent_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }).eq("id", account.id);
            await recordBaasOperation(user.id, account.id, "pix_key_create", result as Record<string, unknown>);
            return jsonResponse({ success: true, key: normalizePixKey(result) });
        }

        if (action === "delete_key") {
            const id = String(body.id || body.provider_id || body.key || "").trim();
            if (!id) return errorResponse("Não encontramos a chave Pix para remover.", 400, { code: "PIX_KEY_REQUIRED" });

            const result = await asaasRequest(`/pix/addressKeys/${encodeURIComponent(id)}`, "DELETE", undefined, apiKey);
            await recordBaasOperation(user.id, account.id, "pix_key_delete", result as Record<string, unknown>, { payload: { id } });
            return jsonResponse({ success: true, result });
        }

        if (action === "pay_qr_code") {
            return errorResponse("Consulte e confirme os dados do Pix com seu PIN antes de pagar.", 400, {
                code: "PIX_CONSULTATION_REQUIRED",
            });
        }

        return errorResponse("Esta ação Pix ainda não está disponível.", 400, { code: "UNSUPPORTED_PIX_ACTION" });
    } catch (error: any) {
        console.error("asaas-pix error:", error);
        return errorResponse(
            "Não conseguimos concluir a operação Pix agora. Tente novamente em instantes.",
            error?.status || 500,
            { code: "PIX_OPERATION_FAILED" }
        );
    }
});
