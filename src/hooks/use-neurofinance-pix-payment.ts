import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { invokeEdgeFunction } from "@/lib/invoke-edge-function";

export interface PixPaymentConsultation {
  id: string;
  kind: "pix_qr_payment";
  status: string;
  amount: number;
  fee: number;
  availableBalance: number | null;
  destinationSummary: string;
  destination: Record<string, unknown>;
  expiresAt: string;
  receiverName?: string | null;
  receiverDocument?: string | null;
  institutionName?: string | null;
  institutionIspb?: string | null;
  description?: string | null;
  qrType?: string | null;
  pixKey?: string | null;
  expirationDate?: string | null;
  canChangeValue: boolean;
  canPayNow: boolean;
  providerOperationId?: string | null;
  providerStatus?: string | null;
  receiptUrl?: string | null;
}

export interface PixPaymentExecution {
  success: boolean;
  request: PixPaymentConsultation;
  payment: Record<string, unknown>;
  status?: string;
  receiptUrl?: string | null;
  idempotent?: boolean;
}

export function useNeurofinancePixPayment() {
  const queryClient = useQueryClient();

  const consult = useMutation({
    mutationFn: ({ payload }: { payload: string }) =>
      invokeEdgeFunction<{ success: boolean; consultation: PixPaymentConsultation }>("asaas-pix-payment", {
        action: "consult",
        payload,
      }),
    onError: (error: Error) => toast.error(error.message),
  });

  const authorize = useMutation({
    mutationFn: ({ requestId, pin, value }: { requestId: string; pin: string; value: number }) =>
      invokeEdgeFunction<{ success: boolean; consultation: PixPaymentConsultation }>("asaas-pix-payment", {
        action: "authorize",
        requestId,
        pin,
        value,
      }),
  });

  const execute = useMutation({
    mutationFn: (requestId: string) =>
      invokeEdgeFunction<PixPaymentExecution>("asaas-pix-payment", { action: "execute", requestId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["NeuroFinance-payouts"] });
      queryClient.invalidateQueries({ queryKey: ["neurofinance-overview"] });
      queryClient.invalidateQueries({ queryKey: ["neurofinance-statement"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const receipt = useMutation({
    mutationFn: (requestId: string) =>
      invokeEdgeFunction<{ success: boolean; receiptUrl: string; status: string }>("asaas-pix-payment", {
        action: "receipt",
        requestId,
      }),
  });

  return { consult, authorize, execute, receipt };
}
