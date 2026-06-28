import { supabase } from "@/integrations/supabase/client";

type CheckoutPayload = {
  planId: string;
  name?: string;
  email?: string;
  cpfCnpj?: string;
  phone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  postalCode?: string;
  city?: string;
  state?: string;
};

export type BillingAddressPayload = Pick<
  CheckoutPayload,
  "address" | "addressNumber" | "complement" | "province" | "postalCode" | "city" | "state"
>;

export type CheckoutResult = {
  url?: string;
  error?: string;
  code?: string;
  requiresDocument?: boolean;
  requiresPhone?: boolean;
  requiresAddress?: boolean;
  trialEndsAt?: string;
};

export const normalizeCpfCnpj = (value: string) => value.replace(/\D/g, "");

export const normalizePhone = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) {
    return digits.slice(2);
  }
  return digits;
};

export const normalizePostalCode = (value: string) => value.replace(/\D/g, "").slice(0, 8);

export const isValidCpfCnpjLength = (value: string) => {
  const digits = normalizeCpfCnpj(value);
  return digits.length === 11 || digits.length === 14;
};

export const isValidBrazilianPhoneLength = (value: string) => {
  const digits = normalizePhone(value);
  return (digits.length === 10 || digits.length === 11) && !/^0+$/.test(digits);
};

export const isValidBillingAddress = (value: BillingAddressPayload) => (
  normalizePostalCode(value.postalCode || "").length === 8 &&
  String(value.address || "").trim().length >= 3 &&
  String(value.addressNumber || "").trim().length >= 1 &&
  String(value.province || "").trim().length >= 2
);

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
  const fallbackMessage = (error as { message?: string })?.message || "Não foi possível iniciar o checkout.";

  return {
    error:
      details?.error ||
      details?.message ||
      (fallbackMessage.includes("FunctionsHttpError") ? "Não foi possível iniciar o checkout." : fallbackMessage),
    code: details?.code,
    requiresDocument: Boolean(details?.requires_document || details?.requiresDocument),
    requiresPhone: Boolean(details?.requires_phone || details?.requiresPhone),
    requiresAddress: Boolean(details?.requires_address || details?.requiresAddress),
    trialEndsAt: details?.trial_ends_at,
  };
}
