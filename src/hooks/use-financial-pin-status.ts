"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useFinancialPinStatus(enabled = true) {
  return useQuery({
    queryKey: ["financial-pin-status"],
    enabled,
    staleTime: 60_000,
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return { isConfigured: false, pinUpdatedAt: null as string | null };

      const { data, error } = await supabase
        .from("user_financial_settings")
        .select("id, pin_updated_at")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;

      return {
        isConfigured: Boolean(data?.id || data?.pin_updated_at),
        pinUpdatedAt: data?.pin_updated_at || null,
      };
    },
  });
}
