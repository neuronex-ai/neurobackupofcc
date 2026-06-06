import { AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/SessionContextProvider";
import { formatCurrency } from "@/lib/utils";

export function ChargebacksPanel() {
  const { user } = useAuth();
  const { data = [] } = useQuery({
    queryKey: ["neurofinance-chargebacks", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("neurofinance_chargebacks_v")
        .select("*")
        .eq("user_id", user!.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  if (!data.length) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[28px] border border-zinc-200/70 bg-white/70 p-10 text-center dark:border-white/10 dark:bg-white/[0.025]">
        <AlertTriangle className="mb-5 h-12 w-12 text-zinc-300 dark:text-zinc-700" />
        <h3 className="text-lg font-black text-zinc-950 dark:text-white">Nenhuma cobrança sofreu chargeback</h3>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Chargeback é uma contestação feita pelo titular do cartão. Se acontecer, o acompanhamento aparece aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((item: any) => (
        <div key={item.id} className="rounded-[22px] border border-red-200/70 bg-red-50/70 p-5 dark:border-red-500/20 dark:bg-red-500/8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-black text-zinc-950 dark:text-white">{item.description || "Cobrança contestada"}</p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{item.dispute_reason || item.dispute_status || "Acompanhamento em aberto"}</p>
            </div>
            <strong>{formatCurrency((item.dispute_amount || item.gross_amount || 0) / 100)}</strong>
          </div>
        </div>
      ))}
    </div>
  );
}
