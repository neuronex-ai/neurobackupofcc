import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/SessionContextProvider";
import { toast } from "sonner";
import { toUserFacingError } from "@/lib/user-facing-error";

export interface NeuroFinancePayout {
    id: string;
    user_id: string;
    asaas_payout_id?: string | null;
    provider_payout_id?: string | null;
    amount: number;
    currency: string;
    status: "pending" | "in_transit" | "paid" | "failed" | "canceled";
    destination_type: string;
    destination_summary: string | null;
    destination_payload?: Record<string, unknown>;
    pix_key?: string | null;
    receipt_url?: string | null;
    requested_at: string;
    processed_at: string | null;
    completed_at?: string | null;
    created_at: string;
    updated_at: string;
    provider_payload?: Record<string, unknown>;
}

export interface RequestPayoutParams {
    amount?: number;
    description?: string;
    destination?: {
        type: "saved_bank" | "manual_bank" | "pix_key";
        pix_key?: string;
        bank_code?: string;
        bank_name?: string;
        agency?: string;
        account?: string;
        account_digit?: string;
        account_type?: "CONTA_CORRENTE" | "CONTA_POUPANCA";
        holder_name?: string;
        holder_document?: string;
        summary?: string;
    };
}

export const useNeuroFinancePayouts = (limit = 30) => {
    const { user } = useAuth();

    return useQuery<NeuroFinancePayout[], Error>({
        queryKey: ["NeuroFinance-payouts", user?.id, limit],
        queryFn: async () => {
            if (!user?.id) throw new Error("Você precisa entrar novamente para continuar.");

            const { data, error } = await supabase
                .from("nb_payouts")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(limit);

            if (error) throw error;
            return (data || []) as NeuroFinancePayout[];
        },
        enabled: Boolean(user?.id),
        staleTime: 1000 * 60,
    });
};

export const useRequestPayout = () => {
    const queryClient = useQueryClient();

    return useMutation<{ success: boolean; payout_id: string; amount: number }, Error, RequestPayoutParams>({
        mutationFn: async (params) => {
            const response = await supabase.functions.invoke("asaas-payout", {
                body: params,
            });

            if (response.error) throw new Error(response.error.message);
            if (response.data?.error) throw new Error(response.data.error);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["NeuroFinance-payouts"] });
            queryClient.invalidateQueries({ queryKey: ["neurofinance-overview"] });
            queryClient.invalidateQueries({ queryKey: ["neurofinance-statement"] });
            toast.success(`Saque de R$ ${(data.amount / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} solicitado.`);
        },
        onError: (error) => {
            const friendlyError = toUserFacingError(error, "transfer");
            toast.error(friendlyError.title, { description: friendlyError.message });
        },
    });
};
