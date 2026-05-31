"use client";

import { motion } from "framer-motion";
import { Brain, ArrowRight, Sparkles, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePatientContextSummary } from "@/hooks/use-patient-context-summary";
import { useSynapse } from "@/context/SynapseProvider";
import { cn } from "@/lib/utils";

interface SessionPrepCardProps {
  patientId: string;
  patientName: string;
  minutesUntilSession?: number;
  className?: string;
}

export const SessionPrepCard = ({ patientId, patientName, minutesUntilSession = 60, className }: SessionPrepCardProps) => {
  const { data: contextInsights, isLoading } = usePatientContextSummary(patientId);
  const { setShellState } = useSynapse();

  if (isLoading || !contextInsights || contextInsights.length === 0) return null;

  const handleStartWithContext = () => {
    setShellState('compact');
    window.dispatchEvent(new CustomEvent('synapse:prefill', {
      detail: {
        message: `Estou prestes a atender ${patientName}. Insights do histórico: ${contextInsights.join('. ')}. Me prepare para a sessão.`,
      }
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "p-8 rounded-[32px] bg-gradient-to-br from-amber-50/60 to-orange-50/30 dark:from-amber-500/[0.03] dark:to-orange-500/[0.02] border border-amber-200/50 dark:border-amber-500/10 shadow-sm",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Brain className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-[10px] font-black text-amber-600/60 dark:text-amber-400/40 uppercase tracking-[0.3em]">Preparação de Sessão</p>
            <h4 className="text-sm font-bold text-black dark:text-white tracking-tight">{patientName}</h4>
          </div>
        </div>
        {minutesUntilSession <= 60 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
            <Clock className="h-3 w-3 text-amber-500" />
            <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Em {minutesUntilSession}min
            </span>
          </div>
        )}
      </div>

      {/* Key Insights */}
      <div className="space-y-2.5 mb-6">
        {contextInsights.map((insight: string, i: number) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-5 h-5 mt-0.5 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
              <Sparkles className="h-2.5 w-2.5 text-amber-500" />
            </div>
            <p className="text-[12px] text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">{insight}</p>
          </div>
        ))}
      </div>

      {/* Action */}
      <Button
        onClick={handleStartWithContext}
        className="w-full h-11 rounded-xl bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-black font-bold text-[10px] uppercase tracking-[0.2em] shadow-lg transition-all"
      >
        <Brain className="h-4 w-4 mr-2" />
        Iniciar Sessão com Contexto <ArrowRight className="h-3 w-3 ml-2" />
      </Button>
    </motion.div>
  );
};
