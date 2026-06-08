import { GlassCard } from "@/components/ui/GlassCard";
import { Skeleton } from "@/components/ui/skeleton";
import { usePatientMoodLogs } from "@/hooks/use-patient-mood-logs";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { Angry, Frown, History, Laugh, Meh, MessageSquare, Smile, TrendingUp } from "lucide-react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface PatientMoodTabProps {
  patientId: string;
}

const moodConfig: Record<number, { label: string, icon: any, color: string, bg: string, border: string }> = {
  1: { label: "Péssimo", icon: Angry, color: "#f43f5e", bg: "bg-rose-500/10", border: "border-rose-500/20" }, // Rose 500
  2: { label: "Ruim", icon: Frown, color: "#f97316", bg: "bg-orange-500/10", border: "border-orange-500/20" }, // Orange 500
  3: { label: "Neutro", icon: Meh, color: "#eab308", bg: "bg-yellow-500/10", border: "border-yellow-500/20" }, // Yellow 500
  4: { label: "Bem", icon: Smile, color: "#10b981", bg: "bg-emerald-500/10", border: "border-emerald-500/20" }, // Emerald 500
  5: { label: "Ótimo", icon: Laugh, color: "#3b82f6", bg: "bg-blue-500/10", border: "border-blue-500/20" }, // Blue 500
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const score = payload[0].value;
    const config = moodConfig[score];
    const Icon = config.icon;

    return (
      <div className="bg-white/90 dark:bg-[#0b0b0d] backdrop-blur-2xl border border-zinc-200 dark:border-white/[0.085] p-4 rounded-2xl shadow-2xl ring-1 ring-black/5 dark:ring-white/5">
        <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3 border-b border-zinc-100 dark:border-white/[0.065] pb-2">
          {label}
        </p>
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", config.bg)}>
            <Icon className="h-4 w-4" style={{ color: config.color }} />
          </div>
          <span className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-tight">{config.label}</span>
        </div>
      </div>
    );
  }
  return null;
};

export const PatientMoodTab = ({ patientId }: PatientMoodTabProps) => {
  const { data: logs, isLoading } = usePatientMoodLogs(patientId);

  if (isLoading) {
    return (
      <div className="space-y-8 py-4">
        <Skeleton className="h-72 w-full bg-zinc-100 dark:bg-zinc-800/40 rounded-[32px]" />
        <div className="space-y-4">
          <Skeleton className="h-24 w-full bg-zinc-100 dark:bg-zinc-800/40 rounded-[24px]" />
          <Skeleton className="h-24 w-full bg-zinc-100 dark:bg-zinc-800/40 rounded-[24px]" />
        </div>
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <GlassCard 
        className="flex flex-col items-center justify-center min-h-[400px] text-center border-dashed dark:!border-white/[0.085] dark:!bg-[#0b0b0d]"
        innerClassName="flex flex-col items-center justify-center h-full w-full p-8"
      >
        <div className="w-20 h-20 bg-zinc-100 dark:bg-[#141415] rounded-full flex items-center justify-center mb-6 shadow-inner ring-1 ring-zinc-200/50 dark:ring-white/[0.075]">
          <Smile className="h-10 w-10 text-zinc-300 dark:text-zinc-600" />
        </div>
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 max-w-[280px] leading-relaxed">
          O paciente ainda não registrou estados emocionais no diário.
        </p>
      </GlassCard>
    );
  }

  const chartData = logs.map(log => ({
    date: format(new Date(log.created_at), "dd/MM"),
    fullDate: format(new Date(log.created_at), "dd 'de' MMMM", { locale: ptBR }),
    score: log.mood_score,
  }));

  const avgMood = logs.reduce((acc, log) => acc + log.mood_score, 0) / logs.length;

  return (
    <div className="space-y-12 animate-fade-in pb-32">

      {/* Analytics Card */}
      <GlassCard className="relative overflow-hidden !bg-white dark:!border-white/[0.085] dark:!bg-[#0b0b0d] dark:!shadow-[0_24px_62px_-46px_rgba(0,0,0,0.96),inset_0_1px_0_rgba(255,255,255,0.026)]" innerClassName="p-8 md:p-12">
        <div className="absolute top-0 right-0 p-40 bg-primary/5 dark:bg-white/[0.015] rounded-full blur-[100px] pointer-events-none" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-[#141415] flex items-center justify-center text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/[0.075] shadow-lg">
              <TrendingUp className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight leading-none mb-1.5">Tendência Emocional</h3>
              <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-[0.2em] leading-none">Análise de Variação de Humor</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-zinc-100/50 dark:bg-[#080809] p-1 rounded-2xl border border-zinc-200/50 dark:border-white/[0.065] backdrop-blur-md">
            <div className="px-5 py-3 rounded-xl bg-white dark:bg-[#141415] border border-zinc-200 dark:border-white/[0.075] shadow-lg">
              <p className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1 leading-none">Média Geral</p>
              <p className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none">{avgMood.toFixed(1)}</p>
            </div>
            <div className="pr-6 pl-2 hidden sm:block">
              <p className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1 leading-none">Registros</p>
              <p className="text-sm font-bold text-zinc-900 dark:text-white leading-none">{logs.length}</p>
            </div>
          </div>
        </div>

        <div className="h-[300px] w-full relative z-10 bg-zinc-100/30 dark:bg-[#080809] rounded-[32px] p-6 border border-zinc-200/50 dark:border-white/[0.065] shadow-inner">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.03)" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="transparent"
                tick={{ fill: "rgba(100,100,100,0.5)", fontSize: 10, fontWeight: 700 }}
                dy={15}
              />
              <YAxis
                domain={[1, 5]}
                ticks={[1, 2, 3, 4, 5]}
                stroke="transparent"
                tick={{ fill: "rgba(100,100,100,0.5)", fontSize: 10, fontWeight: 700 }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(0,0,0,0.1)', strokeWidth: 2 }} />
              <ReferenceLine y={3} stroke="rgba(0,0,0,0.05)" strokeDasharray="6 6" />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#6366f1"
                strokeWidth={5}
                dot={{ r: 6, fill: "#6366f1", strokeWidth: 4, stroke: "#fff" }}
                activeDot={{ r: 8, strokeWidth: 0, fill: "#4f46e5" }}
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <div className="space-y-8">
        <div className="flex items-center gap-4 px-4 text-zinc-400 dark:text-zinc-600">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-zinc-200 dark:to-white/10" />
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.3em]">
            <History className="h-4 w-4" />
            Histórico Detalhado
          </div>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-zinc-200 dark:to-white/10" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...logs].reverse().map((log, idx) => {
            const config = moodConfig[log.mood_score] || moodConfig[3];
            const Icon = config.icon;

            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group relative flex flex-col p-6 rounded-[32px] bg-white dark:bg-[#0b0b0d] border border-zinc-200/50 dark:border-white/[0.085] hover:border-zinc-300 dark:hover:border-white/[0.12] hover:bg-zinc-50 dark:hover:bg-[#111113] transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 overflow-hidden"
              >
                <div className={cn("absolute top-0 right-0 p-12 opacity-10 blur-2xl rounded-full transition-all group-hover:opacity-30", config.bg)} />

                <div className="flex items-center justify-between mb-6 relative z-10">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg transition-transform duration-500 group-hover:scale-110",
                    "bg-white dark:bg-[#141415]",
                    config.border
                  )}>
                    <Icon className="h-6 w-6" style={{ color: config.color }} />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mb-0.5 leading-none">Data do Registro</p>
                    <p className="text-xs font-bold text-zinc-900 dark:text-white leading-none">
                      {format(new Date(log.created_at), "dd/MM • HH:mm")}
                    </p>
                  </div>
                </div>

                <div className="relative z-10 space-y-3">
                  <h4 className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">{config.label}</h4>

                  <div className="bg-zinc-100/50 dark:bg-[#141415] p-4 rounded-2xl border border-zinc-200/50 dark:border-white/[0.075] min-h-[4rem] group-hover:border-zinc-300 dark:group-hover:border-white/[0.11] transition-all">
                    {log.notes ? (
                      <div className="flex gap-3">
                        <MessageSquare className="h-3.5 w-3.5 text-zinc-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium italic">"{log.notes}"</p>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center opacity-30 italic text-[10px] font-bold uppercase tracking-wider">
                        Nenhum Comentário
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
