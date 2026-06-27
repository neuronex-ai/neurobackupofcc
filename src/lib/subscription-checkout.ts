import { supabase } from "@/integrations/supabase/client";

type CheckoutPayload = {
  planId: string;
  name?: string;
  email?: string;
  cpfCnpj?: string;
};

export type CheckoutResult = {
  url?: string;
  error?: string;
  code?: string;
  requiresDocument?: boolean;
  trialEndsAt?: string;
};

export const normalizeCpfCnpj = (value: string) => value.replace(/\D/g, "");

export const isValidCpfCnpjLength = (value: string) => {
  const digits = normalizeCpfCnpj(value);
  return digits.length === 11 || digits.length === 14;
};

async function readFunctionError(error: unknown): Promise<Record<string, any> | null> {
  const maybeError = error as {
    context?: Response | { json?: () => Promise<unknown>; body?: unknown };
    details?: unknown;
  };

  const response = maybeError?.context;
  if (!response) {
    if (maybeError?.details && typeof maybeError.details === "object") {
      return maybeError.details as Record<string, any>;
    }
    return null;
  }

  try {
    if (response instanceof Response) return await response.clone().json();
    if (typeof response.json === "function") return (await response.json()) as Record<string, any>;
    if (response.body && typeof response.body === "object") return response.body as Record<string, any>;
  } catch {
    return null;
  }

  return null;
}

export async function startSubscriptionCheckout(payload: CheckoutPayload): Promise<CheckoutResult> {
  const { data, error } = await supabase.functions.invoke("create-checkout-session", {
    body: payload,
  });

  if (!error) {
    return { url: data?.url };
  }

  const details = await readFunctionError(error);
  const fallbackMessage = (error as { message?: string })?.message || "Nao foi possivel iniciar o checkout.";

  return {
    error:
      details?.error ||
      details?.message ||
      (fallbackMessage.includes("FunctionsHttpError") ? "Nao foi possivel iniciar o checkout." : fallbackMessage),
    code: details?.code,
    requiresDocument: Boolean(details?.requires_document || details?.requiresDocument),
    trialEndsAt: details?.trial_ends_at,
  };
}
