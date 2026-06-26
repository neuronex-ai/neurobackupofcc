import {
  corsResponse,
  errorResponse,
  getAuthenticatedUser,
  jsonResponse,
} from "../_shared/asaas-client.ts";
import { readCurrentEntitlement } from "../_shared/subscription-access.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return corsResponse();

  if (req.method !== "POST" && req.method !== "GET") {
    return errorResponse("Metodo nao permitido.", 405);
  }

  try {
    const user = await getAuthenticatedUser(req);
    const entitlement = await readCurrentEntitlement({
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata,
    });

    return jsonResponse(entitlement);
  } catch (error) {
    console.error("get-current-entitlement:error", error);
    return errorResponse("Nao foi possivel carregar sua assinatura.", 500);
  }
});
