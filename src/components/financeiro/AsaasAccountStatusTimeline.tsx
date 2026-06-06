"use client";

import type { ElementType } from "react";
import { AlertTriangle, Check, Clock3, HelpCircle, RefreshCw, X } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { useFinancialAccount } from "@/hooks/use-financial-account";
import { cn } from "@/lib/utils";
import {
  buildAsaasApprovalStages,
  getAsaasAccountSituation,
  type AsaasApprovalStage,
  type AsaasApprovalTone,
} from "@/lib/asaas-account-status";

const toneStyles: Record<AsaasApprovalTone, { pill: string; dot: string; line: string; icon: ElementType }> = {
  approved: {
    pill: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-300",
    dot: "bg-emerald-500 text-white shadow-[0_0_0_6px_rgba(16,185,129,0.10)]",
    line: "bg-emerald-500/30",
    icon: Check,
  },
  pending: {
    pill: "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-300",
    dot: "bg-amber-500 text-white shadow-[0_0_0_6px_rgba(245,158,11,0.10)]",
    line: "bg-amber-500/30",
    icon: Clock3,
  },
  review: {
    pill: "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-300",
    dot: "bg-blue-500 text-white shadow-[0_0_0_6px_rgba(59,130,246,0.10)]",
    line: "bg-blue-500/30",
    icon: Clock3,
  },
  rejected: {
    pill: "bg-red-500/10 text-red-700 border-red-500/20 dark:text-red-300",
    dot: "bg-red-500 text-white shadow-[0_0_0_6px_rgba(239,68,68,0.10)]",
    line: "bg-red-500/30",
    icon: X,
  },
  missing: {
    pill: "bg-zinc-500/10 text-zinc-600 border-zinc-500/20 dark:text-zinc-300",
    dot: "bg-zinc-500 text-white shadow-[0_0_0_6px_rgba(113,113,122,0.10)]",
    line: "bg-zinc-500/30",
    icon: AlertTriangle,
  },
  neutral: {
    pill: "bg-zinc-500/10 text-zinc-600 border-zinc-500/20 dark:text-zinc-300",
    dot: "bg-zinc-400 text-white shadow-[0_0_0_6px_rgba(113,113,122,0.08)]",
    line: "bg-zinc-300/40 dark:bg-white/10",
    icon: HelpCircle,
  },
};

export function AsaasAccountStatusTimeline({
  compact = false,
  onOpenDetails,
}: {
  compact?: boolean;
  onOpenDetails?: () => void;
}) {
  const { account, syncAccount, lastSyncError } = useFinancialAccount();
  const stages = buildAsaasApprovalStages(account);
  const situation = getAsaasAccountSituation(account);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[28px] border border-black/[0.06] bg-white/[0.72] shadow-[0_24px_90px_-58px_rgba(0,0,0,0.55)] backdrop-blur-3xl backdrop-saturate-150 dark:border-white/[0.08] dark:bg-white/[0.035]",
        compact ? "p-5" : "p-7"
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(255,255,255,.75),transparent_38%),radial-gradient(circle_at_100%_100%,rgba(0,0,0,.045),transparent_42%)] dark:bg-[radial-gradient(circle_at_0%_0%,rgba(255,255,255,.08),transparent_42%)]" />
      <div className="premium-noise pointer-events-none absolute inset-0 opacity-[0.018] dark:opacity-[0.045]" />

      <div className="relative z-10 flex flex-col gap-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.28em] text-zinc-400">
              Análise cadastral Asaas
            </p>
            <h3 className={cn("mt-2 font-black tracking-tight text-zinc-950 dark:text-white", compact ? "text-lg" : "text-2xl")}>
              {situation}
            </h3>
            <p className="mt-1 text-xs font-medium leading-relaxed text-zinc-500 dark:text-zinc-400">
              Status sincronizado pela API da Asaas. Use atualizar para consultar a situação mais recente.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onOpenDetails ? (
              <Button
                variant="outline"
                onClick={onOpenDetails}
                className="h-10 rounded-xl border-black/10 bg-white/60 px-4 text-[9px] font-black uppercase tracking-[0.18em] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]"
              >
                Ver detalhes
              </Button>
            ) : null}
            <Button
              variant="outline"
              onClick={() => syncAccount.mutate()}
              disabled={syncAccount.isPending}
              className="h-10 rounded-xl border-black/10 bg-white/60 px-4 text-[9px] font-black uppercase tracking-[0.18em] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]"
            >
              <RefreshCw className={cn("mr-2 h-3.5 w-3.5", syncAccount.isPending && "animate-spin")} />
              Atualizar
            </Button>
          </div>
        </div>

        {lastSyncError ? (
          <div className="rounded-2xl border border-red-500/15 bg-red-500/[0.06] px-4 py-3 text-xs font-semibold text-red-700 dark:text-red-300">
            {lastSyncError}
          </div>
        ) : null}

        <div className="relative space-y-3">
          {stages.map((stage, index) => (
            <TimelineRow key={stage.id} stage={stage} isLast={index === stages.length - 1} compact={compact} />
          ))}
        </div>
      </div>
    </div>
  );
}

const TimelineRow = ({
  stage,
  isLast,
  compact,
}: {
  stage: AsaasApprovalStage;
  isLast: boolean;
  compact: boolean;
}) => {
  const styles = toneStyles[stage.tone];
  const Icon = styles.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative grid items-center gap-4 rounded-2xl border border-black/[0.055] bg-white/55 px-4 backdrop-blur-2xl dark:border-white/[0.07] dark:bg-white/[0.025]",
        compact ? "grid-cols-[1fr_auto] py-3" : "grid-cols-[1fr_auto] py-4 pl-8"
      )}
    >
      {!compact ? (
        <>
          <span className={cn("absolute left-4 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full", styles.line)} />
          {!isLast ? <span className={cn("absolute left-[20px] top-[calc(50%+12px)] h-[calc(50%+24px)] w-px", styles.line)} /> : null}
        </>
      ) : null}

      <div className="min-w-0">
        <p className="truncate text-sm font-black text-zinc-950 dark:text-white">{stage.label}</p>
        {!compact ? (
          <p className="mt-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">{stage.description}</p>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <div className={cn("rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em]", styles.pill)}>
          {stage.statusLabel}
        </div>
        {!compact ? (
          <span className="hidden min-w-[92px] text-right font-mono text-[9px] font-black uppercase tracking-[0.12em] text-zinc-300 dark:text-zinc-700 sm:block">
            {stage.rawStatus}
          </span>
        ) : null}
        <span className={cn("flex h-8 w-8 items-center justify-center rounded-full", styles.dot)}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </motion.div>
  );
};
