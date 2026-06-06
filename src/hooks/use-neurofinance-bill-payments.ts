import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { invokeNeurofinanceFunction } from "@/lib/neurofinance-edge";
import { normalizeBoletoInput } from "@/lib/boleto";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/SessionContextProvider";

export interface BillSimulation {
  value?: number;
  fee?: number;
  dueDate?: string;
  bank?: string;
  bankName?: string;
  beneficiaryName?: string;
  beneficiaryDocument?: string;
  [key: string]: unknown;
}

export interface BillPaymentRecord {
  id: string;
  identification_field?: string | null;
  barcode?: string | null;
  status: string;
  amount: number;
  due_date?: string | null;
  scheduled_date?: string | null;
  beneficiary_name?: string | null;
  bank_name?: string | null;
  created_at: string;
}

function boletoPayload(input: string) {
  const normalized = normalizeBoletoInput(input);
  if (!normalized.isValid) throw new Error("Informe uma linha digitável ou código de barras válido.");
  return normalized.kind === "barcode"
    ? { barCode: normalized.digits }
    : { identificationField: normalized.digits };
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
        .order("created_at", { ascending: false })
        .limit(25);
      if (error) throw error;
      return (data || []) as BillPaymentRecord[];
    },
  });

  const simulate = useMutation({
    mutationFn: async (input: string) =>
      invokeNeurofinanceFunction<{ success: boolean; bill: BillSimulation; record?: BillPaymentRecord }>(
        "asaas-bill-payment",
        { action: "simulate", ...boletoPayload(input) },
        "payment",
      ),
    onError: (error: Error) => toast.error(error.message),
  });

  const create = useMutation({
    mutationFn: async (params: { input: string; scheduleDate?: string; description?: string; value?: number; dueDate?: string }) =>
      invokeNeurofinanceFunction<{ success: boolean; bill: any; record?: BillPaymentRecord }>(
        "asaas-bill-payment",
        {
          action: "create",
          ...boletoPayload(params.input),
          scheduleDate: params.scheduleDate,
          description: params.description,
          value: params.value,
          dueDate: params.dueDate,
        },
        "payment",
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["neurofinance-bill-payments"] });
      queryClient.invalidateQueries({ queryKey: ["neurofinance-overview"] });
      toast.success("Pagamento enviado para processamento.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return { list, simulate, create };
}
