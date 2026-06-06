/**
 * Compatibility endpoint for older clients.
 * Reads the local NeuroFinance snapshot and detail views only; it never waits
 * for the provider API. Fresh data is maintained by webhooks and reconciliation.
 */

import {
    corsResponse,
    errorResponse,
    getAuthenticatedUser,
    jsonResponse,
    supabaseAdmin,
} from "../_shared/asaas-client.ts";

function toTransaction(item: any) {
    return {
        id: item.id,
        description: item.patient_name
            ? `${item.patient_name} · ${item.description}`
            : item.description,
        amount: Number(item.amount || 0) / 100,
        type: item.overview_group === "outflow" ? "expense" : "income",
        category: item.item_type || item.overview_group,
        date: item.occurred_at,
        created_at: item.occurred_at,
        appointment_id: null,
        external_reference: item.reference_id,
        origin: "gateway_auto",
        status: item.status,
        payment_method: item.payment_method,
        metadata: item.metadata || {},
    };
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") return corsResponse();

    try {
        const user = await getAuthenticatedUser(req);
        const body = await req.json().catch(() => ({}));

        const { data: snapshot, error: snapshotError } = await supabaseAdmin
            .from("neurofinance_overview_snapshot_v")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();
        if (snapshotError) throw snapshotError;

        const requestedView = String(body.view || "all");
        const overviewGroup = requestedView === "total"
            ? "income"
            : requestedView === "andamento"
                ? "outflow"
                : requestedView === "futuro"
                    ? "receivable"
                    : null;

        let detailQuery = supabaseAdmin
            .from("neurofinance_overview_items_v")
            .select("*")
            .eq("user_id", user.id)
            .order("occurred_at", { ascending: false });

        if (overviewGroup) detailQuery = detailQuery.eq("overview_group", overviewGroup);
        if (body.start_date) detailQuery = detailQuery.gte("occurred_at", `${body.start_date}T00:00:00Z`);
        if (body.finish_date) detailQuery = detailQuery.lte("occurred_at", `${body.finish_date}T23:59:59Z`);

        const { data: items, error: itemError } = await detailQuery.limit(500);
        if (itemError) throw itemError;

        return jsonResponse({
            balance: {
                current: snapshot?.available_balance || 0,
                available: snapshot?.available_balance || 0,
                pending: snapshot?.pending_receivables || 0,
            },
            summary: {
                available_balance: snapshot?.available_balance || 0,
                pending_balance: snapshot?.pending_receivables || 0,
                gross_volume: snapshot?.gross_received || 0,
                fees_total: snapshot?.fees_total || 0,
                net_volume: snapshot?.calculated_available_balance || 0,
                paid_out_balance: snapshot?.total_outflow || 0,
            },
            transactions: (items || []).map(toTransaction),
            total_transactions: items?.length || 0,
            provider: "asaas",
            snapshot: snapshot || null,
        });
    } catch (error) {
        console.error("[asaas-balance-details] Read failed:", error);
        return errorResponse(
            "Não conseguimos abrir os detalhes agora. Tente novamente em instantes.",
            500,
            { code: "FINANCIAL_DETAILS_UNAVAILABLE" }
        );
    }
});
