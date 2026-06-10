import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/components/auth/SessionContextProvider";
import { supabase } from "@/integrations/supabase/client";
import { normalizeBoletoInput } from "@/lib/boleto";

export interface BillConsultation {
  id: string;
  status: string;
  value: number;
  fee: number;
  dueDate?: string | null;
  scheduleDate?: string | null;
  beneficiaryName?: string | null;
  beneficiaryDocument?: string | null;
  bankCode?: string | null;
  bankName?: string | null;
  expiresAt: string;
}

export interface BillPaymentRecord {
  id: string;
  identification_field?: string | null;
  barcode?: string | null;
  provider_bill_id?: string | null;
  external_reference: string;
  status: string;
  amount: number;
  fee_amount?: number;
  due_date?: string | null;
  scheduled_date?: string | null;
  beneficiary_name?: string | null;
  beneficiary_document?: string | null;
  bank_name?: string | null;
  bank_code?: string | null;
  receipt_url?: string | null;
  error_message?: string | null;
  created_at: string;
}

export interface BillExecutionResponse {
  success: boolean;
  bill: Record<string, unknown>;
  record: BillPaymentRecord;
  status: string;
  receiptUrl?: string | null;
  idempotent?: boolean;
}

function boletoPayload(input: string) {
  const normalized = normalizeBoletoInput(input);
  if (!normalized.isValid) {
    throw new Error("Informe uma linha digitável ou código de barras válido.");
  }
  return normalized.kind === "barcode"
    ? { barCode: normalized.digits }
    : { identificationField: normalized.digits };
}

async function extractEdgeMessage(error: unknown) {
  const fallback = error instanceof Error ? error.message : undefined;
  const context = typeof error === "object" && error !== null && "context" in error
    ? (error as { context?: unknown }).context
    : undefined;
  if (
    typeof context !== "object" ||
    context === null ||
    !("json" in context) ||
    typeof (context as { json?: unknown }).json !== "function"
  ) {
    return fallback;
  }

  try {
    const body = await (context as { json: () => Promise<unknown> }).json();
    if (typeof body === "object" && body !== null) {
      const payload = body as Record<string, unknown>;
      if (typeof payload.error === "string") return payload.error;
      if (typeof payload.message === "string") return payload.message;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

async function invokeBillPaymentAction<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("asaas-bill-payment", { body });

  if (error) {
    throw new Error((await extractEdgeMessage(error)) || "Não foi possível processar este boleto.");
  }
  if (data?.error) {
    throw new Error(data.error);
  }
  return data as T;
}

export async function fetchBillConsultation(params: { input: string; scheduleDate?: string }) {
  return invokeBillPaymentAction<{ success: boolean; consultation: BillConsultation }>({
    action: "consult",
    ...boletoPayload(params.input),
    scheduleDate: params.scheduleDate,
  });
}

export async function authorizeBillPayment(params: { consultationId: string; pin: string }) {
  return invokeBillPaymentAction<{ success: boolean; consultation: BillConsultation }>({
    action: "authorize",
    consultationId: params.consultationId,
    pin: params.pin,
  });
}

export async function executeBillPayment(consultationId: string) {
  return invokeBillPaymentAction<BillExecutionResponse>({
    action: "execute",
    consultationId,
  });
}

export function useNeurofinanceBillPayments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: ["neurofinance-bill-payments", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("neurofinance_bill_payments")
        .select("*")
        .eq("user_id", user!.id)
        .in("status", [
          "submitting",
          "submission_unknown",
          "processing",
          "paid",
          "failed",
          "cancelled",
          "refunded",
        ])
        .order("created_at", { ascending: false })
        .limit(25);
      if (error) throw error;
      return (data || []) as BillPaymentRecord[];
    },
  });

  const consult = useMutation({
    mutationFn: fetchBillConsultation,
    onError: (error: Error) => toast.error(error.message),
  });

  const authorize = useMutation({
    mutationFn: authorizeBillPayment,
  });

  const execute = useMutation({
    mutationFn: executeBillPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["neurofinance-bill-payments"] });
      queryClient.invalidateQueries({ queryKey: ["neurofinance-overview"] });
      queryClient.invalidateQueries({ queryKey: ["neurofinance-overview-items"] });
      queryClient.invalidateQueries({ queryKey: ["neurofinance-statement"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return { list, consult, authorize, execute };
}
