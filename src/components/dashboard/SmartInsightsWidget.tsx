"use client";

import { useSmartInsights, SmartInsight } from "@/hooks/use-smart-insights";
import { useChurnAlerts, ChurnAlert } from "@/hooks/use-churn-alerts";
import { AnimatePresence, motion } from "framer-motion";
import {
  TrendingDown, TrendingUp, AlertTriangle, Sparkles,
  DollarSign, Calendar, Users, ArrowRight, Brain,
  ChevronLeft, ChevronRight, UserX, Loader2
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
    bg: 'bg-red-500/5 dark:bg-red-500/10',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-500/10 dark:border-red-500/20',
  },
  high: {
    bg: 'bg-orange-500/5 dark:bg-orange-500/10',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-500/10 dark:border-orange-500/20',
  },
  medium: {
    bg: 'bg-amber-500/5 dark:bg-amber-500/10',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/10 dark:border-amber-500/20',
  },
};

/* ── Compact cards for the dashboard-card variant ── */

const CompactInsightItem = ({ insight }: { insight: SmartInsight }) => {
  const navigate = useNavigate();
  const Icon = INSIGHT_ICONS[insight.icon] || Sparkles;
  const typeColors: Record<string, string> = {
    pattern: 'text-blue-500/80',
    action: 'text-emerald-500/80',
    risk: 'text-red-500/80',
    opportunity: 'text-amber-500/80',
  };

  return (
    <div
      className="flex items-start gap-3.5 p-4 rounded-2xl bg-white dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] hover:bg-zinc-100/80 dark:hover:bg-white/[0.06] hover:border-zinc-300 dark:hover:border-white/[0.12] transition-all duration-300 cursor-pointer group"
      onClick={() => insight.actionLink && navigate(insight.actionLink)}
    >
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-zinc-100 dark:bg-white/[0.06] border border-zinc-200 dark:border-white/[0.06]")}>
        <Icon className={cn("h-3.5 w-3.5", typeColors[insight.type] || 'text-zinc-400')} />
      </div>
      <div className="min-w-0 flex-1 space-y-0.5">
        <h5 className="text-[12px] font-bold text-zinc-800 dark:text-zinc-200 tracking-tight leading-tight truncate">
          {insight.title}
        </h5>
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-relaxed line-clamp-2">
          {insight.message}
        </p>
      </div>
      {insight.actionLink && (
        <ArrowRight className="h-3 w-3 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 dark:group-hover:text-zinc-400 transition-colors shrink-0 mt-1" />
      )}
    </div>
  );
};

const CompactChurnItem = ({ alert }: { alert: ChurnAlert }) => {
  const navigate = useNavigate();
  const colors = RISK_COLORS[alert.riskLevel] || RISK_COLORS.medium;

  return (
    <div
      className="flex items-start gap-3.5 p-4 rounded-2xl bg-white dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] hover:bg-zinc-100/80 dark:hover:bg-white/[0.06] hover:border-zinc-300 dark:hover:border-white/[0.12] transition-all duration-300 cursor-pointer group"
      onClick={() => navigate(`/pacientes?id=${alert.patientId}`)}
    >
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border", colors.bg, colors.border)}>
        <UserX className={cn("h-3.5 w-3.5", colors.text)} />
      </div>
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-center gap-2">
          <h5 className="text-[12px] font-bold text-zinc-800 dark:text-zinc-200 tracking-tight leading-tight truncate">
            {alert.patientName}
          </h5>
          <span className={cn("px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border shrink-0", colors.bg, colors.text, colors.border)}>
            {alert.riskScore}%
          </span>
        </div>
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-relaxed line-clamp-2">
          {alert.suggestedAction}
        </p>
      </div>
      <ArrowRight className="h-3 w-3 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 dark:group-hover:text-zinc-400 transition-colors shrink-0 mt-1" />
    </div>
  );
};

/* ── Full-size cards (original default variant) ── */

const InsightCard = ({ insight }: { insight: SmartInsight }) => {
  const navigate = useNavigate();
  const Icon = INSIGHT_ICONS[insight.icon] || Sparkles;
  const typeColors: Record<string, string> = {
    pattern: 'text-blue-500/80',
    action: 'text-emerald-500/80',
    risk: 'text-red-500/80',
    opportunity: 'text-amber-500/80',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col gap-6 h-full justify-between"
    >
      <div className="flex flex-col md:flex-row items-start gap-6">
        <div className="space-y-3 min-w-0 flex-1">
          <h4 className="text-xl md:text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight">
            {insight.title}
          </h4>
          <p className="text-sm md:text-base text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-2xl font-normal">
            {insight.message}
          </p>
        </div>
      </div>

      {insight.actionLink && (
        <Button
          onClick={() => navigate(insight.actionLink!)}
          variant="ghost"
          size="sm"
          className="self-start group/btn px-0 hover:bg-transparent text-zinc-900 dark:text-zinc-100 font-medium"
        >
          {insight.actionLabel || 'Ver Análise Completa'} 
          <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
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
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col gap-6 h-full justify-between"
    >
      <div className="flex flex-col md:flex-row items-start gap-6">
        <div className="space-y-4 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h4 className="text-xl md:text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight">
              {alert.patientName}
            </h4>
            <span className={cn(
              "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
              colors.bg, colors.text, colors.border
            )}>
              {alert.riskScore}% risco
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {alert.factors.map((f, i) => (
              <span key={i} className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-white/[0.02] px-2.5 py-1 rounded-lg border border-zinc-100 dark:border-white/[0.05]">
                {f}
              </span>
            ))}
          </div>
          <div className="bg-zinc-50/80 dark:bg-white/[0.02] p-4 rounded-xl border border-zinc-100 dark:border-white/[0.05]">
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed italic">
              💡 {alert.suggestedAction}
            </p>
          </div>
        </div>
      </div>

      <Button
        onClick={() => navigate(`/pacientes?id=${alert.patientId}`)}
        variant="ghost"
        size="sm"
        className="self-start group/btn px-0 hover:bg-transparent text-zinc-900 dark:text-zinc-100 font-medium"
      >
        Acessar Prontuário 
        <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
      </Button>
    </motion.div>
  );
};

/* ── Main Widget ── */

interface SmartInsightsWidgetProps {
  variant?: 'default' | 'dashboard-card';
}

export const SmartInsightsWidget = ({ variant = 'default' }: SmartInsightsWidgetProps) => {
  const { data: insights, isLoading: loadingInsights } = useSmartInsights();
  const { data: churnAlerts, isLoading: loadingChurn } = useChurnAlerts();
  const [currentIndex, setCurrentIndex] = useState(0);

  const isLoading = loadingInsights || loadingChurn;

  const allCards: { type: 'insight' | 'churn'; data: SmartInsight | ChurnAlert }[] = [];
  churnAlerts?.forEach(a => allCards.push({ type: 'churn', data: a }));
  insights?.forEach(i => allCards.push({ type: 'insight', data: i }));

  const totalCards = allCards.length;

  const goNext = () => setCurrentIndex(prev => (prev + 1) % totalCards);
  const goPrev = () => setCurrentIndex(prev => (prev - 1 + totalCards) % totalCards);

  /* ── Dashboard Card Variant ── */
  if (variant === 'dashboard-card') {
    if (isLoading) {
      return (
        <div className="flex flex-col p-6 lg:p-8 rounded-[24px] bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200/60 dark:border-white/[0.06] min-h-[240px] items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-zinc-300 dark:text-zinc-600" />
        </div>
      );
    }

    return (
      <div className="flex flex-col p-6 lg:p-8 rounded-[24px] bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200/60 dark:border-white/[0.06] transition-all duration-500 hover:border-zinc-300 dark:hover:border-white/10">
        {/* Card Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="space-y-0.5">
            <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.25em]">IA Clínica</p>
            <h4 className="text-sm font-black text-black dark:text-white uppercase tracking-tight flex items-center gap-2">
              <Brain className="h-3.5 w-3.5 text-zinc-400" />
              NeuroInsights
            </h4>
          </div>
          {totalCards > 0 && (
            <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 tabular-nums">
              {totalCards} {totalCards === 1 ? 'insight' : 'insights'}
            </span>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto custom-scrollbar pr-1 -mr-1">
          {totalCards === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Sparkles className="h-5 w-5 text-zinc-300 dark:text-zinc-600 mb-2" />
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Nenhum insight no momento</p>
            </div>
          ) : (
            allCards.map((card, i) => (
              <motion.div
                key={`${card.type}-${i}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
              >
                {card.type === 'churn' ? (
                  <CompactChurnItem alert={card.data as ChurnAlert} />
                ) : (
                  <CompactInsightItem insight={card.data as SmartInsight} />
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>
    );
  }

  /* ── Default full-size variant ── */
  if (isLoading) {
    return (
      <div className="p-8 lg:p-10 h-[400px] rounded-[32px] bg-white/40 dark:bg-white/[0.01] border border-zinc-100 dark:border-white/[0.05] backdrop-blur-xl flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-300" />
      </div>
    );
  }

  if (totalCards === 0) return null;

  const currentCard = allCards[currentIndex];

  return (
    <div className="p-8 lg:p-12 h-full min-h-[400px] rounded-[40px] bg-white/50 dark:bg-[#09090b]/40 border border-zinc-100 dark:border-white/[0.05] backdrop-blur-2xl flex flex-col gap-10 relative overflow-hidden group transition-all duration-500 hover:border-zinc-200 dark:hover:border-white/10 shadow-sm hover:shadow-md">
        
      {/* Subtle background gradient */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-zinc-100/50 dark:from-white/[0.02] to-transparent pointer-events-none transition-opacity duration-1000" />

      {/* Header */}
      <div className="flex justify-between items-center relative z-10">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">IA Clínica</p>
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Brain className="h-4 w-4 text-zinc-400" /> NeuroInsights
          </h4>
        </div>
        
        {totalCards > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={goPrev}
              className="w-9 h-9 rounded-full bg-white dark:bg-white/[0.02] border border-zinc-100 dark:border-white/5 flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={goNext}
              className="w-9 h-9 rounded-full bg-white dark:bg-white/[0.02] border border-zinc-100 dark:border-white/5 flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="flex-1 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentIndex} 
            className="h-full"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {currentCard.type === 'churn' ? (
              <ChurnAlertCard alert={currentCard.data as ChurnAlert} />
            ) : (
              <InsightCard insight={currentCard.data as SmartInsight} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress Indicators */}
      {totalCards > 1 && (
        <div className="flex gap-1.5 mt-auto relative z-10">
          {allCards.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 rounded-full transition-all duration-500",
                i === currentIndex
                  ? "w-8 bg-zinc-900 dark:bg-white"
                  : "w-1.5 bg-zinc-200 dark:bg-white/10"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};

