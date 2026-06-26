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

async function readFunctionError(error: unknown) {
  const response = (error as { context?: Response })?.context;
  if (!response) return null;

  try {
    return await response.clone().json();
  } catch {
    return null;
  }
}

export async function startSubscriptionCheckout(payload: CheckoutPayload): Promise<CheckoutResult> {
  const { data, error } = await supabase.functions.invoke("create-checkout-session", {
    body: payload,
  });

  if (!error) {
    return { url: data?.url };
  }

  const details = await readFunctionError(error);
  return {
    error:
      details?.error ||
      (error as { message?: string })?.message ||
      "Nao foi possivel iniciar o checkout.",
    code: details?.code,
    requiresDocument: Boolean(details?.requires_document || details?.requiresDocument),
    trialEndsAt: details?.trial_ends_at,
  };
}
