import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Invoice } from "@/types";
import { useAuth } from "@/components/auth/SessionContextProvider";

export interface InvoiceListParams {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string[];
}

export interface InvoiceListResult {
    invoices: Invoice[];
    total: number;
    page: number;
    pageSize: number;
}

const mapStatus = (status?: string): Invoice["status"] => {
    const value = String(status || "").toLowerCase();
    if (["received", "paid", "confirmed"].includes(value)) return "paid";
    if (["overdue", "expired"].includes(value)) return "overdue";
    if (["deleted", "cancelled", "canceled", "refunded"].includes(value)) return "cancelled";
    return "pending";
};

const mapNbPayment = (payment: any): Invoice => ({
    id: payment.id,
    user_id: payment.user_id,
    patient_id: payment.patient_id,
    invoice_number: (payment.provider_payment_id?.split("_") || []).pop() || payment.id.slice(0, 8),
    amount: Number(payment.gross_amount || 0) / 100,
    status: mapStatus(payment.normalized_status || payment.status || payment.provider_status),
    due_date: payment.expires_at,
    created_at: payment.created_at,
    description: payment.description,
    payment_url: payment.checkout_url || payment.invoice_url || payment.metadata?.asaas_invoice_url,
    pdf_url: payment.bank_slip_url || payment.metadata?.asaas_bank_slip_url,
    gateway_payment_id: payment.provider_payment_id,
    ...(payment as any),
});

const mapLegacyInvoice = (invoice: any): Invoice => ({
    ...invoice,
    amount: Number(invoice.amount || 0),
    status: mapStatus(invoice.status),
});

const selectLegacy = `
    id,
    user_id,
    patient_id,
    payment_url,
    pdf_url,
    focus_nfe_ref,
    focus_nfe_status,
    nfse_status,
    invoice_number,
    amount,
    status,
    due_date,
    created_at,
    description
`;

const selectNb = `
    id,
    user_id,
    patient_id,
    checkout_url,
    receipt_url,
    invoice_url,
    bank_slip_url,
    gross_amount,
    net_amount,
    platform_fee_amount,
    estimated_fee_amount,
    actual_fee_amount,
    status,
    provider_status,
    normalized_status,
    funds_status,
    payment_method_type,
    expires_at,
    paid_at,
    confirmed_at,
    available_at,
    created_at,
    description,
    provider_payment_id,
    cancelable,
    metadata
`;

export const fetchInvoicesPage = async (userId: string, params: InvoiceListParams = {}): Promise<InvoiceListResult> => {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(50, Math.max(5, params.pageSize || 25));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const search = params.search?.trim();

    let legacyQuery = supabase
        .from("invoices")
        .select(selectLegacy, { count: "exact" })
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(from, to);

    if (search) {
        legacyQuery = legacyQuery.or(`description.ilike.%${search}%,invoice_number.ilike.%${search}%`);
    }

    let nbQuery = supabase
        .from("nb_payments")
        .select(selectNb, { count: "exact" })
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(from, to);

    if (search) {
        nbQuery = nbQuery.ilike("description", `%${search}%`);
    }

    const [legacyResult, nbResult] = await Promise.all([legacyQuery, nbQuery]);

    if (legacyResult.error) console.error("Erro ao buscar faturas legadas:", legacyResult.error);
    if (nbResult.error) console.error("Erro ao buscar cobranças NeuroFinance:", nbResult.error);

    const statusFilter = new Set((params.status || []).map((status) => status.toLowerCase()));
    const allInvoices = [
        ...((legacyResult.data || []) as any[]).map(mapLegacyInvoice),
        ...((nbResult.data || []) as any[]).map(mapNbPayment),
    ]
        .filter((invoice) => statusFilter.size === 0 || statusFilter.has(invoice.status))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, pageSize);

    return {
        invoices: allInvoices,
        total: (legacyResult.count || 0) + (nbResult.count || 0),
        page,
        pageSize,
    };
};

const fetchInvoices = async (userId: string): Promise<Invoice[]> => {
    const result = await fetchInvoicesPage(userId, { page: 1, pageSize: 50 });
    return result.invoices;
};

export const useInvoices = () => {
    const { user } = useAuth();
    const userId = user?.id;

    return useQuery<Invoice[], Error>({
        queryKey: ["invoices", userId],
        queryFn: () => fetchInvoices(userId!),
        enabled: Boolean(userId),
    });
};

export const useInvoicesPage = (params: InvoiceListParams = {}) => {
    const { user } = useAuth();
    const userId = user?.id;

    return useQuery<InvoiceListResult, Error>({
        queryKey: ["invoices-page", userId, params],
        queryFn: () => fetchInvoicesPage(userId!, params),
        enabled: Boolean(userId),
        placeholderData: (previous) => previous,
    });
};

export const useInvoiceActions = () => {
    const queryClient = useQueryClient();

    const runAction = useMutation({
        mutationFn: async ({ id, action }: { id: string; action: "sync" | "cancel" }) => {
            const { data, error } = await supabase.functions.invoke("asaas-payment-actions", {
                body: { payment_id: id, action },
            });
            if (error) throw error;
            if (data?.error) throw new Error(data.error);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["invoices"] });
            queryClient.invalidateQueries({ queryKey: ["invoices-page"] });
            queryClient.invalidateQueries({ queryKey: ["neurofinance-overview"] });
        },
    });

    return { runAction };
};
