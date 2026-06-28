import { Transaction } from "@/types";
import { format } from "date-fns";

interface FinancialStatementTemplateProps {
  transactions: Transaction[];
  period: { from: Date | undefined; to: Date | undefined };
  summary: { income: number; expense: number; balance: number };
  professionalName: string;
}

export const FinancialStatementTemplate = ({
  transactions,
  period,
  summary,
  professionalName
}: FinancialStatementTemplateProps) => {

  const formatMoney = (val: number) => (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const periodStr = period.from && period.to
    ? `${format(period.from, "dd/MM/yyyy")} ate ${format(period.to, "dd/MM/yyyy")}`
    : "Periodo completo";

  return (
    <div className="w-full max-w-[800px] bg-white mx-auto min-h-[1000px] relative font-sans text-zinc-900 print:w-full">

      {/* Header Area */}
      <div className="bg-zinc-950 text-white p-12">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Extrato NeuroFinance</h1>
            <p className="text-xs text-zinc-400 uppercase tracking-widest font-bold">Relatorio financeiro</p>
          </div>
          <div className="text-right">
            <p className="font-medium text-lg">{professionalName}</p>
            <p className="text-sm text-zinc-400 mt-1">{periodStr}</p>
          </div>
        </div>

        {/* Summary Grid */}
        <div className="grid grid-cols-3 gap-0 border border-white/10 rounded-xl overflow-hidden bg-white/[0.055]">
          <div className="p-5 border-r border-white/10">
            <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider mb-2">Entradas</p>
            <p className="text-xl font-bold text-emerald-400">{formatMoney(summary.income)}</p>
          </div>
          <div className="p-5 border-r border-white/10">
            <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider mb-2">Saidas</p>
            <p className="text-xl font-bold text-rose-400">{formatMoney(summary.expense)}</p>
          </div>
          <div className="p-5 bg-white/[0.035]">
            <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider mb-2">Resultado</p>
            <p className="text-xl font-bold text-white">{formatMoney(summary.balance)}</p>
          </div>
        </div>
      </div>

      {/* Table Area */}
      <div className="p-12 pt-8">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-zinc-100 text-zinc-500 text-[10px] uppercase tracking-wider">
              <th className="pb-3 font-bold pl-2 w-24">Data</th>
              <th className="pb-3 font-bold">Descricao</th>
              <th className="pb-3 font-bold text-center w-32">Categoria</th>
              <th className="pb-3 font-bold text-right pr-2 w-32">Valor</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {transactions.map((t, i) => (
              <tr key={t.id} className={i % 2 === 0 ? "bg-white" : "bg-zinc-50"}>
                <td className="py-3 pl-2 font-mono text-xs text-zinc-500 border-b border-zinc-100">
                  {t.date && !isNaN(new Date(t.date).getTime())
                    ? format(new Date(t.date), 'dd/MM/yy')
                    : '--/--/--'}
                </td>
                <td className="py-3 border-b border-zinc-100 font-medium text-zinc-700">
                  {t.description}
                </td>
                <td className="py-3 border-b border-zinc-100 text-center">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-zinc-200 text-zinc-500 font-bold uppercase tracking-wide">
                    {t.category || "Geral"}
                  </span>
                </td>
                <td className={`py-3 pr-2 text-right font-bold border-b border-zinc-100 font-mono ${t.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {t.type === 'expense' ? '-' : '+'}{formatMoney(t.amount).replace('R$', '').trim()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-16 text-center">
          <p className="text-[10px] text-zinc-400 uppercase tracking-[0.2em] font-bold">Gerado pelo NeuroFinance</p>
        </div>
      </div>
    </div>
  );
};
