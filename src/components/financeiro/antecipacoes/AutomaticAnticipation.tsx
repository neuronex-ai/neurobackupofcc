import { Repeat } from "lucide-react";

export function AutomaticAnticipation() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <section className="rounded-[28px] border border-zinc-200/70 bg-white/70 p-8 dark:border-white/10 dark:bg-white/[0.025]">
        <h3 className="text-lg font-black text-zinc-950 dark:text-white">Antecipação automática</h3>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Automatize a solicitação de antecipação para cobranças elegíveis. Você pode ativar e desativar a qualquer momento.
        </p>
        <div className="mt-8 rounded-[24px] border border-dashed border-zinc-300 p-8 dark:border-white/12">
          <Repeat className="mb-4 h-10 w-10 text-zinc-300 dark:text-zinc-700" />
          <p className="font-black text-zinc-950 dark:text-white">Configuração em validação</p>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">A ativação fica disponível quando a análise de crédito da conta permitir antecipação automática.</p>
        </div>
      </section>
      <aside className="rounded-[28px] border border-zinc-200/70 bg-white/70 p-6 dark:border-white/10 dark:bg-white/[0.025]">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Informações</p>
        <div className="mt-5 space-y-3 text-sm text-zinc-500 dark:text-zinc-400">
          <p>Receba antes sem precisar selecionar cobrança por cobrança.</p>
          <p>As taxas e prazos aparecem no extrato e seguem as condições vigentes da conta.</p>
        </div>
      </aside>
    </div>
  );
}
