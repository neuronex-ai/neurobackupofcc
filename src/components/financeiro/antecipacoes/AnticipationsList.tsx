import { Clock, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useNeurofinanceAnticipations } from "@/hooks/use-neurofinance-anticipations";

const statusLabel: Record<string, string> = {
  pending: "Em análise",
  scheduled: "Agendada",
  credited: "Creditada",
  denied: "Negada",
  cancelled: "Cancelada",
  debited: "Debitada",
  overdue: "Vencida",
};

export function AnticipationsList() {
  const { list } = useNeurofinanceAnticipations();
  const items = list.data || [];

  if (!items.length) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[26px] border border-zinc-200/70 bg-white/60 p-10 text-center dark:border-white/10 dark:bg-white/[0.025]">
        <TrendingUp className="mb-5 h-12 w-12 text-zinc-300 dark:text-zinc-700" />
        <h3 className="text-lg font-black text-zinc-950 dark:text-white">Nenhuma cobrança foi antecipada</h3>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Quando você antecipar recebíveis, o acompanhamento aparece aqui com status, valor líquido e data prevista.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="flex items-center justify-between rounded-[22px] border border-zinc-200/70 bg-white/72 p-5 dark:border-white/10 dark:bg-white/[0.035]">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="font-black text-zinc-950 dark:text-white">{statusLabel[item.normalized_status] || item.normalized_status}</p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Solicitada em {new Date(item.created_at).toLocaleDateString("pt-BR")}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-black text-zinc-950 dark:text-white">{formatCurrency((item.net_amount || 0) / 100)}</p>
            <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-zinc-400">Líquido previsto</p>
          </div>
        </div>
      ))}
    </div>
  );
}
