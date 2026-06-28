"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth } from "date-fns";

export function useDashboardManagerialMetrics() {
  return useQuery({
    queryKey: ["dashboard-managerial-metrics"],
    queryFn: async () => {
      const now = new Date();
      const start = startOfMonth(now).toISOString();
      const end = endOfMonth(now).toISOString();

      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("amount, type, status, date")
        .gte("date", start)
        .lte("date", end);

      if (error) throw error;

      const metrics = (transactions || []).reduce(
        (acc, tx) => {
          const amount = Number(tx.amount || 0);
          const isPending = tx.status === "pending" || tx.status === "scheduled";
          
          if (tx.type === "income") {
            if (isPending) acc.receivable += amount;
            else acc.income += amount;
          } else if (tx.type === "expense") {
            acc.expense += amount;
            if (isPending) acc.payable += amount;
          }
          return acc;
        },
        { income: 0, expense: 0, receivable: 0, payable: 0 }
      );

      return {
        ...metrics,
        result: metrics.income - metrics.expense,
      };
    },
  });
}
