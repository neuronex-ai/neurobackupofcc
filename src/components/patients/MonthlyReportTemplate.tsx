import { Activity, Calendar, Target, TrendingUp } from 'lucide-react';

interface MonthlyReportTemplateProps {
  patientName: string;
  month: string;
  professionalName: string;
  stats: {
    attended: number;
    cancelled: number;
    next: string | null;
  };
  financialSummary?: {
    totalInvested: string;
    packagesActive: string;
  };
  clinicalSummary?: string;
}

export const MonthlyReportTemplate = ({
  patientName,
  month,
  professionalName,
  stats,
  financialSummary,
  clinicalSummary
}: MonthlyReportTemplateProps) => {
  return (
    <div className="w-full aspect-[210/297] mx-auto relative bg-white text-slate-800 shadow-2xl font-sans flex flex-col print:shadow-none print:m-0 overflow-hidden">
        
        {/* Topo Colorido */}
        <div className="h-3 bg-gradient-to-r from-purple-600 via-blue-500 to-emerald-400 w-full" />

        <div className="p-12 flex-1 flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-start mb-12">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Relatório de Acompanhamento</h1>
                    <p className="text-purple-600 font-medium mt-1 text-lg">Mês de Referência: {month}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Paciente</p>
                    <p className="text-lg font-bold text-slate-800">{patientName}</p>
                </div>
            </div>

            {/* Grid de Stats */}
            <div className="grid grid-cols-3 gap-4 mb-10">
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                    <div className="flex items-center gap-2 text-purple-700 mb-2">
                        <Activity size={18} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Presença</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800">{stats.attended} <span className="text-sm font-normal text-slate-500">sessões</span></p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-600 mb-2">
                        <Calendar size={18} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Próxima</span>
                    </div>
                    <p className="text-lg font-bold text-slate-800 truncate">{stats.next || "A agendar"}</p>
                </div>
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                    <div className="flex items-center gap-2 text-emerald-700 mb-2">
                        <Target size={18} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Foco</span>
                    </div>
                    <p className="text-sm font-medium text-emerald-900">Evolução Contínua</p>
                </div>
            </div>

            {/* Resumo Clínico (Genérico/Seguro) */}
            <div className="mb-10">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                    <TrendingUp size={16} /> Visão Geral
                </h3>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-slate-600 leading-relaxed text-sm">
                    {clinicalSummary || "Neste mês, trabalhamos na consolidação das metas terapêuticas estabelecidas. Observou-se engajamento satisfatório com o processo e consistência na frequência."}
                </div>
            </div>

            {/* Resumo Financeiro (Se existir) */}
            {financialSummary && (
                <div className="mb-10">
                     <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">
                        Status do Plano
                    </h3>
                    <div className="flex justify-between bg-slate-900 text-white p-6 rounded-2xl shadow-lg">
                        <div>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Pacote Ativo</p>
                            <p className="text-lg font-medium">{financialSummary.packagesActive}</p>
                        </div>
                         <div className="text-right">
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Investimento (Mês)</p>
                            <p className="text-2xl font-bold text-emerald-400">{financialSummary.totalInvested}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="mt-auto pt-8 border-t border-slate-100 flex items-center gap-4">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold text-sm">
                    {professionalName.substring(0,2).toUpperCase()}
                </div>
                <div>
                    <p className="text-sm font-bold text-slate-900">{professionalName}</p>
                    <p className="text-xs text-slate-500">Psicólogo Responsável</p>
                </div>
            </div>
        </div>
    </div>
  );
};