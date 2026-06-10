/**
 * asaas-pix-static-qrcode
 *
 * Create and delete static PIX QR Codes using the psychologist sub-account.
 *
 * - POST: create static QR code
 * - DELETE: delete static QR code by id
 */
import {
  corsResponse,
  jsonResponse,
  errorResponse,
  getAuthenticatedUser,
  getFinancialAccount,
  asaasRequest,
} from "../_shared/asaas-client.ts";

type CreateStaticQrBody = {
  addressKey: string;
  description?: string;
  value?: number;
  format?: "ALL" | "IMAGE" | "PAYLOAD";
  expirationDate?: string; // date-time
  expirationSeconds?: number;
  allowsMultiplePayments?: boolean;
  externalReference?: string;
};

function getSubAccountApiKey(financialAccount: any) {
  const key = financialAccount?.metadata?.asaas_api_key;
  if (!key) throw new Error("Conta financeira não configurada.");
  return key as string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return corsResponse();

  try {
    const user = await getAuthenticatedUser(req);
    const financialAccount = await getFinancialAccount(user.id);
    const subApiKey = getSubAccountApiKey(financialAccount);
    const url = new URL(req.url);

    if (req.method === "POST") {
      const body = (await req.json().catch(() => ({}))) as Partial<CreateStaticQrBody>;
      if (!body?.addressKey) return errorResponse("Informe a chave Pix (addressKey).", 400);

      const payload: Record<string, unknown> = {
        addressKey: body.addressKey,
        description: body.description || undefined,
        value: body.value !== undefined ? body.value : undefined,
        format: body.format || "ALL",
        expirationDate: body.expirationDate || undefined,
        expirationSeconds: body.expirationSeconds || undefined,
        allowsMultiplePayments:
          body.allowsMultiplePayments !== undefined ? body.allowsMultiplePayments : true,
        externalReference: body.externalReference || undefined,
      };

      const created = await asaasRequest(
        `/pix/qrCodes/static`,
        "POST",
        payload,
        subApiKey
      );

      return jsonResponse(created);
    }

    if (req.method === "DELETE") {
      const id = url.searchParams.get("id");
      if (!id) return errorResponse("Informe o id do QR Code.", 400);

      const deleted = await asaasRequest(
        `/pix/qrCodes/static/${encodeURIComponent(id)}`,
        "DELETE",
        undefined,
        subApiKey
      );

      return jsonResponse(deleted);
    }

    return errorResponse("Método não suportado.", 405);
  } catch (error: any) {
    console.error("asaas-pix-static-qrcode error:", error);
    return errorResponse(error?.message || "Internal error", 500);
  }
});

