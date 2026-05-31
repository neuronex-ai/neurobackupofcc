import { useEffect, useState } from "react";
import { BrainCircuit, History, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SessionNote } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

interface PatientRecapSidebarProps {
  patientId?: string | null;
  patientName?: string;
  className?: string;
}

export const PatientRecapSidebar = ({ patientId, patientName, className }: PatientRecapSidebarProps) => {
  const [lastNote, setLastNote] = useState<SessionNote | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!patientId) {
      setLastNote(null);
      return;
    }

    const fetchLastSessionContext = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('session_notes')
        .select('*')
        .eq('patient_id', patientId)
        .not('ai_summary', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setLastNote(data as any);
      } else {
        setLastNote(null);
      }
      setLoading(false);
    };

    fetchLastSessionContext();
  }, [patientId]);

  if (!patientId) return null;

  const topics = lastNote?.ai_summary?.topics?.slice(0, 3) || [];
  const sentiment = lastNote?.ai_summary?.sentiment || "Neutro";

  return (
    <AnimatePresence mode="wait">
      {patientId ? (
        <motion.aside
          key={patientId}
          initial={{ opacity: 0, x: 20, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 20, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={cn("relative flex flex-col h-full overflow-hidden rounded-[40px] transition-all duration-500", className)}
        >
          {/* --- Premium Glassmorphism Layers --- */}
          {/* 1. Base Blur & Tint */}
          {/* 1. Base Blur & Tint */}
          <div className="absolute inset-0 bg-white/60 dark:bg-[#050505]/60 backdrop-blur-[60px] z-0 transition-colors duration-500" />

          {/* 2. Noise Texture */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay z-0 pointer-events-none" />

          {/* 3. Subtle Gradient Flow */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-black/[0.03] dark:bg-white/[0.03] rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-black/[0.02] dark:bg-white/[0.02] rounded-full blur-[100px] pointer-events-none" />

          {/* 4. Glass Borders/Reflections */}
          {/* 4. Glass Borders/Reflections */}
          <div className="absolute inset-0 rounded-[40px] border border-white/20 dark:border-white/10 pointer-events-none z-20 shadow-[inset_0_1px_1px_rgba(31,38,135,0.07)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] transition-colors duration-500" />

          {/* Scrollable Container */}
          <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
            <div className="p-8 space-y-10">
              {/* Header Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center w-4 h-4">
                    <div className="absolute w-2 h-2 bg-zinc-900 dark:bg-white rounded-full shadow-[0_0_12px_rgba(0,0,0,0.2)] dark:shadow-[0_0_12px_rgba(255,255,255,0.8)]" />
                    <div className="absolute w-4 h-4 bg-zinc-900/20 dark:bg-white/20 rounded-full blur-[4px] animate-pulse" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-900 dark:text-white leading-none">Synapse AI</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tighter leading-[1.1]">
                    Última sessão com <br />
                    <span className="text-zinc-500 dark:text-white/40 font-medium">{patientName?.split(' ')[0]}</span>
                  </h3>

                  {lastNote && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/[0.05] border border-black/5 dark:border-white/[0.08] shadow-sm">
                        <History className="w-3 h-3 text-zinc-500 dark:text-white/50" />
                        <span className="text-[10px] font-mono text-zinc-600 dark:text-white/70 uppercase tracking-wider">
                          {format(new Date(lastNote.created_at), "dd 'de' MMMM", { locale: ptBR })}
                        </span>
                      </div>
                      <div className="px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/[0.05] border border-black/5 dark:border-white/[0.08] shadow-sm">
                        <span className="text-[10px] font-mono text-zinc-500 dark:text-white/50 uppercase tracking-widest">{sentiment}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Main Insight Body */}
              <div className="space-y-12 pb-10">
                {loading ? (
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <Skeleton className="h-[2px] w-12 bg-black/10 dark:bg-white/10" />
                      <Skeleton className="h-48 w-full rounded-[32px] bg-black/[0.02] dark:bg-white/[0.02]" />
                    </div>
                    <div className="space-y-4">
                      <Skeleton className="h-[2px] w-12 bg-black/10 dark:bg-white/10" />
                      <Skeleton className="h-12 w-full rounded-[24px] bg-black/[0.02] dark:bg-white/[0.02]" />
                      <Skeleton className="h-12 w-full rounded-[24px] bg-black/[0.02] dark:bg-white/[0.02]" />
                    </div>
                  </div>
                ) : !lastNote ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-24 text-center space-y-5 border border-dashed border-white/5 rounded-[40px] bg-white/[0.01]"
                  >
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white/10" />
                    </div>
                    <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em]">Contexto não encontrado</p>
                  </motion.div>
                ) : (
                  <div className="space-y-12">
                    {/* Summary Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 px-1">
                        <div className="h-[1px] w-4 bg-zinc-300 dark:bg-white/20" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 dark:text-white/30">Síntese Profissional</span>
                      </div>
                      <div className="p-8 rounded-[40px] bg-white dark:bg-white/[0.03] border border-black/5 dark:border-white/[0.08] shadow-2xl relative group overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-black/[0.02] dark:from-white/[0.02] to-transparent pointer-events-none" />
                        <p className="text-[15px] text-zinc-700 dark:text-white/80 leading-[1.8] font-normal relative z-10">
                          {lastNote?.ai_summary?.summary || "Faltando dados para geração de resumo."}
                        </p>
                        <div className="absolute top-0 right-0 p-6 opacity-10">
                          <Sparkles size={16} className="text-zinc-900 dark:text-white" />
                        </div>
                      </div>
                    </div>

                    {/* Topics Section */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 px-1">
                        <div className="h-[1px] w-4 bg-zinc-300 dark:bg-white/20" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 dark:text-white/30">Vértices de Atenção</span>
                      </div>

                      <div className="flex flex-col gap-3">
                        {topics.length > 0 ? topics.map((topic, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + (i * 0.1) }}
                            className="group p-6 rounded-[28px] bg-white dark:bg-white/[0.04] border border-black/5 dark:border-white/[0.08] hover:bg-zinc-50 dark:hover:bg-white/[0.06] hover:border-black/10 dark:hover:border-white/20 transition-all duration-500 flex items-start gap-5 shadow-sm"
                          >
                            <span className="text-[10px] font-mono text-zinc-400 dark:text-white/20 pt-1.5">0{i + 1}</span>
                            <span className="text-[14px] font-medium text-zinc-700 dark:text-white/80 leading-relaxed group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">{topic}</span>
                          </motion.div>
                        )) : (
                          <p className="text-xs text-zinc-400 dark:text-white/20 italic font-mono uppercase tracking-widest pl-2">Nada detectado.</p>
                        )}
                      </div>
                    </div>

                    {/* Action Advice */}
                    <div className="mt-8 p-6 rounded-[24px] bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.04] border-dashed flex items-center gap-5">
                      <div className="w-2 h-2 rounded-full bg-zinc-400 dark:bg-white/10 animate-pulse" />
                      <p className="text-[11px] text-zinc-500 dark:text-white/30 font-medium leading-relaxed italic">
                        Sugestão: Valide se as tensões mencionadas na sessão de {format(new Date(lastNote.created_at), "dd/MM")} ainda persistem.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.aside>
      ) : (
        <motion.aside
          key="empty"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className={cn(
            "flex flex-col h-full bg-white/40 dark:bg-[#050505]/40 backdrop-blur-[60px] border-l border-white/10 dark:border-white/5 items-center justify-center p-8 transition-colors duration-500",
            className
          )}
        >
          <div className="flex flex-col items-center gap-4 opacity-20">
            <BrainCircuit size={40} className="text-zinc-900 dark:text-white" strokeWidth={1} />
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-900 dark:text-white">NeuroNex Recapitulação</p>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};