"use client";

import { useSmartInsights, SmartInsight } from "@/hooks/use-smart-insights";
import { useChurnAlerts, ChurnAlert } from "@/hooks/use-churn-alerts";
import { AnimatePresence, motion } from "framer-motion";
import {
  TrendingDown, TrendingUp, AlertTriangle, Sparkles,
  DollarSign, Calendar, Users, ArrowRight, Brain,
  ChevronLeft, ChevronRight, UserX, Loader2, X
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const INSIGHT_ICONS: Record<string, any> = {
  'trend-down': TrendingDown,
  'trend-up': TrendingUp,
  'alert': AlertTriangle,
  'sparkle': Sparkles,
  'dollar': DollarSign,
  'calendar': Calendar,
  'users': Users,
};

const RISK_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  critical: {
    bg: 'bg-red-500/10 dark:bg-red-500/10',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-500/20 dark:border-red-500/20',
  },
  high: {
    bg: 'bg-orange-500/10 dark:bg-orange-500/10',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-500/20 dark:border-orange-500/20',
  },
  medium: {
    bg: 'bg-amber-500/10 dark:bg-amber-500/10',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/20 dark:border-amber-500/20',
  },
};

const InsightCard = ({ insight }: { insight: SmartInsight }) => {
  const navigate = useNavigate();
  const Icon = INSIGHT_ICONS[insight.icon] || Sparkles;
  const typeColors: Record<string, string> = {
    pattern: 'text-blue-500',
    action: 'text-emerald-500',
    risk: 'text-red-500',
    opportunity: 'text-amber-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col gap-5 h-full justify-between"
    >
      <div className="flex items-start gap-5">
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center border border-zinc-200 dark:border-white/5 bg-white dark:bg-white/[0.03] shadow-sm shrink-0",
        )}>
          <Icon className={cn("h-5 w-5", typeColors[insight.type] || 'text-zinc-400')} />
        </div>
        <div className="space-y-1.5 min-w-0">
          <h4 className="text-[14px] font-bold text-black dark:text-white tracking-tight leading-tight">{insight.title}</h4>
          <p className="text-[12px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">{insight.message}</p>
        </div>
      </div>

      {insight.actionLink && (
        <Button
          onClick={() => navigate(insight.actionLink!)}
          variant="outline"
          size="sm"
          className="self-start h-9 px-5 text-[9px] font-black uppercase tracking-[0.15em] rounded-full border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/5 transition-all"
        >
          {insight.actionLabel || 'Ver Detalhes'} <ArrowRight className="h-3 w-3 ml-2" />
        </Button>
      )}
    </motion.div>
  );
};

const ChurnAlertCard = ({ alert }: { alert: ChurnAlert }) => {
  const navigate = useNavigate();
  const colors = RISK_COLORS[alert.riskLevel] || RISK_COLORS.medium;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col gap-5 h-full justify-between"
    >
      <div className="flex items-start gap-5">
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0",
          colors.bg, colors.border
        )}>
          <UserX className={cn("h-5 w-5", colors.text)} />
        </div>
        <div className="space-y-2 min-w-0">
          <div className="flex items-center gap-3">
            <h4 className="text-[14px] font-bold text-black dark:text-white tracking-tight leading-tight">{alert.patientName}</h4>
            <span className={cn(
              "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border",
              colors.bg, colors.text, colors.border
            )}>
              {alert.riskScore}% risco
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {alert.factors.map((f, i) => (
              <span key={i} className="text-[10px] font-medium text-zinc-500 bg-zinc-100 dark:bg-white/5 px-2.5 py-1 rounded-full border border-zinc-200 dark:border-white/5">
                {f}
              </span>
            ))}
          </div>
          <p className="text-[11px] text-zinc-400 italic font-medium">💡 {alert.suggestedAction}</p>
        </div>
      </div>

      <Button
        onClick={() => navigate(`/pacientes?id=${alert.patientId}`)}
        variant="outline"
        size="sm"
        className="self-start h-9 px-5 text-[9px] font-black uppercase tracking-[0.15em] rounded-full border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/5 transition-all"
      >
        Ver Paciente <ArrowRight className="h-3 w-3 ml-2" />
      </Button>
    </motion.div>
  );
};

export const SmartInsightsCard = () => {
  const { data: insights, isLoading: loadingInsights } = useSmartInsights();
  const { data: churnAlerts, isLoading: loadingChurn } = useChurnAlerts();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const isLoading = loadingInsights || loadingChurn;

  // Merge churn alerts and insights into a single carousel
  const allCards: { type: 'insight' | 'churn'; data: SmartInsight | ChurnAlert }[] = [];

  churnAlerts?.forEach(a => allCards.push({ type: 'churn', data: a }));
  insights?.forEach(i => allCards.push({ type: 'insight', data: i }));

  const totalCards = allCards.length;

  const goNext = () => setCurrentIndex(prev => (prev + 1) % totalCards);
  const goPrev = () => setCurrentIndex(prev => (prev - 1 + totalCards) % totalCards);

  if (isLoading) {
    return (
      <div className="flex justify-start">
        <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white dark:bg-white/[0.02] border border-zinc-100 dark:border-white/[0.04] shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Analisando</span>
        </div>
      </div>
    );
  }

  if (totalCards === 0) return null;

  const currentCard = allCards[currentIndex];

  return (
    <>
      <div className="flex justify-start">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] shadow-sm hover:shadow-md transition-all group"
        >
          <div className="w-6 h-6 rounded-full bg-zinc-950 dark:bg-white flex items-center justify-center">
            <Brain className="h-3 w-3 text-white dark:text-zinc-900" />
          </div>
          <span className="text-xs font-bold text-black dark:text-white tracking-tight">
            {totalCards} Novos Insights
          </span>
          <ChevronRight className="h-3 w-3 text-zinc-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
        </motion.button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg p-10 mx-4 rounded-[40px] bg-white dark:bg-[#0A0A0B] border border-zinc-200 dark:border-white/10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] min-h-[300px] flex flex-col"
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-6 right-6 w-8 h-8 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-950 dark:bg-white flex items-center justify-center shadow-lg">
                    <Brain className="h-4.5 w-4.5 text-white dark:text-zinc-900" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.35em]">IA Clínica</p>
                    <h4 className="text-sm font-bold text-black dark:text-zinc-200 tracking-tight">NeuroInsights</h4>
                  </div>
                </div>

                {totalCards > 1 && (
                  <div className="flex items-center gap-2 mr-8">
                    <span className="text-[9px] font-bold text-zinc-400 tabular-nums tracking-wider mr-2">
                      {currentIndex + 1}/{totalCards}
                    </span>
                    <button
                      onClick={goPrev}
                      className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/5 flex items-center justify-center text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/10 transition-all"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={goNext}
                      className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/5 flex items-center justify-center text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/10 transition-all"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Card Content */}
              <div className="flex-1 mt-4">
                <AnimatePresence mode="wait">
                  <motion.div key={currentIndex}>
                    {currentCard.type === 'churn' ? (
                      <ChurnAlertCard alert={currentCard.data as ChurnAlert} />
                    ) : (
                      <InsightCard insight={currentCard.data as SmartInsight} />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Progress dots */}
              {totalCards > 1 && (
                <div className="flex justify-center gap-1.5 mt-8">
                  {allCards.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentIndex(i)}
                      className={cn(
                        "h-1 rounded-full transition-all duration-500",
                        i === currentIndex
                          ? "w-8 bg-zinc-900 dark:bg-white"
                          : "w-3 bg-zinc-200 dark:bg-white/10 hover:bg-zinc-300 dark:hover:bg-white/20"
                      )}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
