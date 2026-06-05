import React, { useState } from 'react';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { X, Calendar, ChevronLeft, ChevronRight, TrendingUp, Users, AppWindow, MoreHorizontal, HelpCircle, Settings } from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from 'recharts';
import { format, addMonths, subMonths, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMonthlySessionMetrics } from '@/hooks/use-monthly-session-metrics';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SessionsMetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SessionsMetricsModal = ({ isOpen, onClose }: SessionsMetricsModalProps) => {
  const [selectedDate, setSelectedDate] = useState(startOfMonth(new Date()));
  const { data, isLoading } = useMonthlySessionMetrics(selectedDate);

  const prevMonth = () => setSelectedDate(subMonths(selectedDate, 1));
  const nextMonth = () => setSelectedDate(addMonths(selectedDate, 1));

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[1280px] w-[95vw] h-[90vh] p-0 bg-[#F8F9FA] dark:bg-[#080809] border-none overflow-hidden flex flex-col rounded-[32px]">
        {/* Header Customizado */}
        <div className="flex items-center justify-between px-8 py-6 bg-white dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-white/5 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-zinc-950 dark:bg-white flex items-center justify-center text-white dark:text-zinc-900">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Agendamento e sessões</h2>
              <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Visão Expandida • {format(selectedDate, 'MMMM yyyy', { locale: ptBR })}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-zinc-100 dark:bg-white/5 p-1 rounded-xl">
              <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8 hover:bg-white dark:hover:bg-white/10 rounded-lg">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="px-3 min-w-[140px] text-center text-sm font-bold text-zinc-600 dark:text-zinc-300">
                {format(selectedDate, "dd/MM/yyyy")} - {format(addMonths(selectedDate, 1), "dd/MM/yyyy")}
              </div>
              <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8 hover:bg-white dark:hover:bg-white/10 rounded-lg">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            
            <Button variant="outline" size="sm" className="h-10 px-4 gap-2 bg-white dark:bg-zinc-800 border-zinc-200 dark:border-white/10 rounded-xl font-bold">
              <Settings className="w-4 h-4" />
              Opções
            </Button>

            <DialogClose className="h-10 w-10 rounded-xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all">
              <X className="w-5 h-5" />
            </DialogClose>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 dark:border-white" />
            </div>
          ) : data ? (
            <>
              {/* Top KPI Cards (7) */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <KPICard title="Sessões agendadas" value={data.kpis.totalScheduled} icon={<Calendar className="w-4 h-4" />} color="blue" />
                <KPICard title="Sessões presentes" value={data.kpis.present} icon={<TrendingUp className="w-4 h-4" />} color="green" />
                <KPICard title="Sessões ausentes" value={data.kpis.absent} icon={<Users className="w-4 h-4 text-amber-500" />} color="amber" />
                <KPICard title="Cliente Cancelou" value={data.kpis.clientCancelled} icon={<X className="w-4 h-4 text-red-500" />} color="red" />
                <KPICard title="Profissional cancelou" value={data.kpis.proCancelled} icon={<X className="w-4 h-4 text-red-600" />} color="red-dark" />
                <KPICard title="Reagendamentos" value={data.patients.reschedules} icon={<ChevronRight className="w-4 h-4" />} color="blue-light" />
                <KPICard title="Frequência não pontuada" value={data.kpis.unscored} icon={<HelpCircle className="w-4 h-4" />} color="zinc" />
              </div>

              {/* Middle Section: Patient Metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Active Clients Card */}
                <div className="bg-white dark:bg-zinc-900/40 rounded-[32px] p-8 border border-zinc-100 dark:border-white/5 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white max-w-[160px] leading-tight">Clientes ativos com agendamentos futuros</h3>
                    <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-white/5 flex items-center justify-center">
                       <MoreHorizontal className="w-4 h-4 text-zinc-400" />
                    </div>
                  </div>
                  
                  <div className="relative h-16 w-full bg-zinc-100 dark:bg-white/5 rounded-xl overflow-hidden flex">
                    <div 
                        className="h-full bg-zinc-900 dark:bg-zinc-600 flex items-center justify-center text-xs font-bold text-white" 
                        style={{ width: `${(data.patients.withFuture / data.patients.totalActive) * 100 || 0}%` }}
                    >
                      {data.patients.withFuture}
                    </div>
                    <div className="flex-1 flex items-center justify-center text-xs font-bold text-zinc-400">
                      {data.patients.withoutFuture}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-1 bg-zinc-900 dark:bg-zinc-600 rounded-full" />
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">Clientes ativos com agendamentos futuros</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-1 bg-zinc-200 dark:bg-white/10 rounded-full" />
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">Clientes ativos sem agendamentos futuros</span>
                    </div>
                  </div>

                   <div className="pt-4 border-t border-zinc-100 dark:border-white/5 flex justify-between items-center">
                      <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400">Total de clientes ativos: <span className="text-zinc-900 dark:text-white">{data.patients.totalActive}</span></span>
                      <Button variant="outline" size="sm" className="rounded-full px-6 h-10 border-zinc-200 dark:border-white/10 font-bold">Saiba mais</Button>
                   </div>
                </div>

                {/* Top Patient Card */}
                <div className="bg-white dark:bg-zinc-900/40 rounded-[32px] p-8 border border-zinc-100 dark:border-white/5 flex flex-col items-center justify-center text-center space-y-4">
                  <span className="text-sm font-bold text-zinc-900 dark:text-white max-w-[200px] leading-tight">
                    {data.patients.topPatientName} possui
                  </span>
                  <div className="text-6xl font-black text-zinc-900 dark:text-white tracking-tighter tabular-nums">
                    {data.patients.topPatientCount}
                  </div>
                  <span className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-widest">agendamentos</span>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">no período selecionado</span>
                </div>

                {/* Online/Presencial Card */}
                <div className="space-y-4">
                  <div className="bg-white dark:bg-zinc-900/40 rounded-[32px] p-8 border border-zinc-100 dark:border-white/5 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">De {data.kpis.totalScheduled} agendamentos...</span>
                    <div className="space-y-4 w-full">
                      <div className="flex items-center justify-center gap-3">
                        <span className="text-2xl font-black text-zinc-900 dark:text-white tabular-nums">{data.patients.onlinePerc.toFixed(1).replace('.', ',')}%</span>
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Online</span>
                      </div>
                      <div className="flex items-center justify-center gap-3">
                        <span className="text-2xl font-black text-zinc-900 dark:text-white tabular-nums">{data.patients.presencialPerc.toFixed(1).replace('.', ',')}%</span>
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Presenciais</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-6">no período selecionado</span>
                  </div>

                  <div className="bg-white dark:bg-zinc-900/40 rounded-[32px] p-8 border border-zinc-100 dark:border-white/5 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center mb-4">
                        <AppWindow className="w-6 h-6 text-purple-600 focus:text-purple-400" />
                    </div>
                    <div className="flex items-end gap-2 mb-2">
                      <span className="text-4xl font-black text-zinc-900 dark:text-white tabular-nums">{data.patients.reschedules}</span>
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest pb-1.5">reagendamentos</span>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest px-4">foram solicitados no App do Paciente no período selecionado</span>
                  </div>
                </div>
              </div>

              {/* Presence Status Chart */}
              <div className="bg-white dark:bg-zinc-900/40 rounded-[32px] p-10 border border-zinc-100 dark:border-white/5 space-y-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Status de presença</h3>
                  <div className="flex items-center gap-4">
                    <div className="bg-zinc-100 dark:bg-white/5 px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-300">
                      Período: {format(selectedDate, 'yyyy')}
                    </div>
                    <Button variant="ghost" size="icon" className="h-10 w-10 bg-zinc-50 dark:bg-white/5 rounded-xl">
                      <MoreHorizontal className="w-5 h-5 text-zinc-400" />
                    </Button>
                  </div>
                </div>

                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontWeight: 600, fill: '#94A3B8' }} 
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontWeight: 600, fill: '#94A3B8' }} 
                        dx={-10}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          borderRadius: '16px', 
                          border: 'none', 
                          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }} 
                      />
                      <Legend 
                        iconType="circle" 
                        wrapperStyle={{ paddingTop: '40px' }}
                        formatter={(value) => <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{value}</span>}
                      />
                      <Line type="monotone" dataKey="Não pontuado" stroke="#71717A" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="Presença" stroke="#10B981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="Ausência" stroke="#EAB308" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="Cancelamento pelo paciente" stroke="#EF4444" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="Cancelamento pelo Profissional" stroke="#991B1B" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          ) : (
            <div className="py-20 text-center opacity-40">Erro ao carregar dados.</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface KPICardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'amber' | 'red' | 'red-dark' | 'blue-light' | 'zinc';
}

const KPICard = ({ title, value, icon, color }: KPICardProps) => {
  const colors = {
    blue: "text-blue-600 bg-blue-50 dark:bg-blue-500/10",
    green: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10",
    amber: "text-amber-500 bg-amber-50 dark:bg-amber-500/10",
    red: "text-red-500 bg-red-50 dark:bg-red-500/10",
    "red-dark": "text-red-800 bg-red-100 dark:bg-red-800/20",
    "blue-light": "text-sky-500 bg-sky-50 dark:bg-sky-500/10",
    zinc: "text-zinc-500 bg-zinc-50 dark:bg-zinc-500/10",
  };

  return (
    <div className="bg-white dark:bg-zinc-900/40 rounded-2xl p-4 border border-zinc-100 dark:border-white/5 flex flex-col items-center justify-center text-center gap-3 group hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight h-8 flex items-center leading-tight">
        {title}
      </span>
      <div className={cn("flex flex-col items-center gap-2")}>
        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", colors[color])}>
          {icon}
        </div>
        <span className="text-3xl font-black text-zinc-950 dark:text-white tabular-nums tracking-tighter">
          {value}
        </span>
      </div>
    </div>
  );
};
