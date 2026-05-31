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
    ? `${format(period.from, "dd/MM/yyyy")} até ${format(period.to, "dd/MM/yyyy")}`
    : "Período Completo";

  return (
    <div className="w-full max-w-[800px] bg-white mx-auto min-h-[1000px] relative font-sans text-slate-900 print:w-full">

      {/* Header Area */}
      <div className="bg-slate-900 text-white p-12">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Extrato Financeiro</h1>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Relatório Executivo</p>
          </div>
          <div className="text-right">
            <p className="font-medium text-lg">{professionalName}</p>
            <p className="text-sm text-slate-400 mt-1">{periodStr}</p>
          </div>
        </div>

        {/* Summary Grid */}
        <div className="grid grid-cols-3 gap-0 border border-slate-700 rounded-xl overflow-hidden bg-slate-800/50">
          <div className="p-5 border-r border-slate-700">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-2">Entradas</p>
            <p className="text-xl font-bold text-emerald-400">{formatMoney(summary.income)}</p>
          </div>
          <div className="p-5 border-r border-slate-700">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-2">Saídas</p>
            <p className="text-xl font-bold text-rose-400">{formatMoney(summary.expense)}</p>
          </div>
          <div className="p-5 bg-slate-800">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-2">Resultado</p>
            <p className="text-xl font-bold text-white">{formatMoney(summary.balance)}</p>
          </div>
        </div>
      </div>

      {/* Table Area */}
      <div className="p-12 pt-8">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-100 text-slate-500 text-[10px] uppercase tracking-wider">
              <th className="pb-3 font-bold pl-2 w-24">Data</th>
              <th className="pb-3 font-bold">Descrição</th>
              <th className="pb-3 font-bold text-center w-32">Categoria</th>
              <th className="pb-3 font-bold text-right pr-2 w-32">Valor</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {transactions.map((t, i) => (
              <tr key={t.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                <td className="py-3 pl-2 font-mono text-xs text-slate-500 border-b border-slate-100">
                  {t.date && !isNaN(new Date(t.date).getTime())
                    ? format(new Date(t.date), 'dd/MM/yy')
                    : '--/--/--'}
                </td>
                <td className="py-3 border-b border-slate-100 font-medium text-slate-700">
                  {t.description}
                </td>
                <td className="py-3 border-b border-slate-100 text-center">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-500 font-bold uppercase tracking-wide">
                    {t.category || "Geral"}
                  </span>
                </td>
                <td className={`py-3 pr-2 text-right font-bold border-b border-slate-100 font-mono ${t.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {t.type === 'expense' ? '-' : '+'}{formatMoney(t.amount).replace('R$', '').trim()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-16 text-center">
          <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold">Gerado por NeuroNex System</p>
        </div>
      </div>
    </div>
  );
};