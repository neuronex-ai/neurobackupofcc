"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { Skeleton } from "@/components/ui/skeleton";
import { usePatientTransactions } from "@/hooks/use-patient-transactions";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Transaction } from "@/types";
import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Calendar, Receipt, Wallet } from "lucide-react";
import { EditTransactionModal } from "../financeiro/EditTransactionModal";

interface PatientFinanceTabProps {
  patientId: string;
}

const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

const itemAnim = {
  hidden: { opacity: 0, y: 40, scale: 0.95, filter: "blur(10px)" },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { type: "spring" as const, stiffness: 50, damping: 15 }
  }
};

const TransactionItem = ({ transaction, isMobile }: { transaction: Transaction, isMobile: boolean }) => {
  return (
    <motion.div variants={itemAnim} layout>
      <EditTransactionModal transaction={transaction}>
        <div className="group relative p-[1px] rounded-[24px] transition-all duration-300 hover:scale-[1.01] cursor-pointer active:scale-[0.98] hover:z-10 bg-transparent">
          <div className={cn(
            "relative flex items-center justify-between rounded-[23px] bg-white/60 dark:bg-[#0b0b0d] border border-zinc-200/50 dark:border-white/[0.085] hover:bg-white/80 dark:hover:bg-[#111113] hover:border-zinc-300 dark:hover:border-white/[0.12] transition-all shadow-sm group-hover:shadow-lg overflow-hidden backdrop-blur-md",
            isMobile ? "p-4" : "p-5"
          )}>

            <div className="flex items-center gap-4 z-10 min-w-0 flex-1">
              <div className={cn(
                "rounded-2xl flex items-center justify-center border shadow-inner transition-transform group-hover:scale-110 shrink-0",
                isMobile ? "w-10 h-10" : "w-12 h-12",
                transaction.type === "income"
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-500 border-rose-500/20"
              )}>
                {transaction.type === "income" ? <ArrowDownRight className={isMobile ? "h-4 w-4" : "h-5 w-5"} /> : <ArrowUpRight className={isMobile ? "h-4 w-4" : "h-5 w-5"} />}
              </div>

              <div className="min-w-0 space-y-0.5">
                <p className={cn(
                  "font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-primary transition-colors tracking-tight",
                  isMobile ? "text-xs" : "text-sm"
                )}>
                  {transaction.description}
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 dark:text-zinc-400 font-black uppercase tracking-wider bg-zinc-100/50 dark:bg-[#141415] px-1.5 py-0.5 rounded-md border border-zinc-200/50 dark:border-white/[0.075]">
                    <Calendar className="h-2.5 w-2.5 opacity-70" />
                    <span>{new Date(transaction.date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-widest truncate max-w-[80px]">
                    <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700 shrink-0" />
                    <span className="truncate">{transaction.category || "Geral"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-right z-10 pl-4 shrink-0">
              <p className={cn(
                "font-black tracking-tighter font-mono",
                isMobile ? "text-sm" : "text-lg",
                transaction.type === "income" ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"
              )}>
                {transaction.type === "income" ? "+" : "-"} {formatCurrency(transaction.amount).replace('R$', '')}
              </p>
              <span className="text-[8px] text-zinc-400 dark:text-zinc-600 font-black uppercase tracking-[0.2em] leading-none">BRL</span>
            </div>
          </div>
        </div>
      </EditTransactionModal>
    </motion.div>
  );
};

export const PatientFinanceTab = ({ patientId }: PatientFinanceTabProps) => {
  const { data: transactions, isLoading, error } = usePatientTransactions(patientId);
  const isMobile = useIsMobile();

  const totalRevenue = transactions?.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) || 0;
  const totalExpenses = transactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) || 0;
  const balance = totalRevenue - totalExpenses;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full bg-zinc-100/50 dark:bg-zinc-800/50 rounded-[32px]" />
        <Skeleton className="h-96 w-full bg-zinc-100/50 dark:bg-zinc-800/50 rounded-[32px]" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-12 text-rose-500 bg-rose-50 dark:bg-rose-500/10 rounded-3xl border border-rose-100 dark:border-rose-500/10">Erro ao carregar dados financeiros.</div>;
  }

  return (
    <div className={cn("animate-fade-in pb-10", isMobile ? "space-y-8" : "space-y-10")}>
      {/* Summary Card - Premium Style */}
      <GlassCard 
        className="!bg-white dark:!border-white/[0.085] dark:!bg-[#0b0b0d] dark:!shadow-[0_24px_62px_-46px_rgba(0,0,0,0.96),inset_0_1px_0_rgba(255,255,255,0.026)] relative overflow-hidden"`r`n        innerClassName={isMobile ? "p-6" : "p-10"}
      >
        <div className="absolute top-0 right-0 p-32 bg-emerald-500/5 dark:bg-white/[0.015] rounded-full blur-[80px] pointer-events-none" />

        <div className={cn(
          "relative z-10 flex items-center justify-between gap-6",
          isMobile ? "flex-col" : "flex-row"
        )}>

          <div className={cn("flex items-center gap-5 w-full", isMobile ? "justify-center text-center flex-col" : "lg:w-auto")}>
            <div className={cn(
              "bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-[24px] text-emerald-500 dark:text-emerald-400 border border-emerald-500/10 flex items-center justify-center shadow-lg shadow-emerald-500/10 shrink-0",
              isMobile ? "w-16 h-16" : "w-20 h-20"
            )}>
              <Wallet className={isMobile ? "h-7 w-7" : "h-9 w-9"} />
            </div>
            <div className={isMobile ? "space-y-1" : ""}>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-black uppercase tracking-[0.25em] mb-1 flex items-center justify-center lg:justify-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Balanço
              </p>
              <p className={cn("font-black text-zinc-900 dark:text-white tracking-tighter", isMobile ? "text-3xl" : "text-5xl")}>
                {formatCurrency(balance)}
              </p>
            </div>
          </div>

          <div className={cn(
            "bg-gradient-to-r lg:bg-gradient-to-b from-transparent via-zinc-200 dark:via-white/10 to-transparent shrink-0",
            isMobile ? "w-full h-px" : "w-px h-20"
          )} />

          <div className={cn(
            "flex w-full lg:w-auto",
            isMobile ? "justify-around gap-4" : "gap-12 justify-end"
          )}>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-md w-fit">
                <ArrowDownRight className="h-2.5 w-2.5" strokeWidth={3} /> Receita
              </div>
              <p className={cn("font-black text-zinc-900 dark:text-zinc-100 tracking-tight", isMobile ? "text-xl" : "text-2xl")}>
                {formatCurrency(totalRevenue)}
              </p>
            </div>
            <div className={isMobile ? "space-y-1 text-right" : "space-y-1"}>
              <div className={cn(
                "flex items-center gap-2 text-[9px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest bg-rose-500/10 px-2 py-1 rounded-md w-fit",
                isMobile ? "ml-auto" : ""
              )}>
                Despesa <ArrowUpRight className="h-2.5 w-2.5" strokeWidth={3} />
              </div>
              <p className={cn("font-black text-zinc-900 dark:text-zinc-100 tracking-tight", isMobile ? "text-xl" : "text-2xl")}>
                {formatCurrency(totalExpenses)}
              </p>
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="space-y-6 relative">
        <div className="flex items-center gap-3 px-2 text-zinc-400 dark:text-zinc-600">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-zinc-200 dark:to-white/10" />
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em]">
            <Receipt className="h-3.5 w-3.5" />
            Histórico
          </div>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-zinc-200 dark:to-white/10" />
        </div>

        {/* Floating Vertical Block Background */}
        <div className={cn(
          "relative min-h-[400px] border border-white/50 dark:border-white/[0.085] bg-zinc-50/50 dark:bg-[#080809] overflow-hidden shadow-inner ring-1 ring-zinc-900/5 dark:ring-white/[0.035]",
          isMobile ? "p-4 rounded-[32px]" : "p-6 rounded-[40px]"
        )}>
          {/* Cylindrical fade effect */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-zinc-50 dark:from-[#080809] to-transparent pointer-events-none z-20" />

          {/* Scrollable List */}
          <div className="max-h-[600px] overflow-y-auto custom-scrollbar pr-1 -mr-1 pb-32 relative z-10 pt-1">
            {transactions && transactions.length > 0 ? (
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-3"
              >
                {transactions.map(t => (
                  <TransactionItem key={t.id} transaction={t} isMobile={isMobile} />
                ))}
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-zinc-400 dark:text-zinc-600">
                <div className="w-16 h-16 bg-zinc-100 dark:bg-[#141415] rounded-full flex items-center justify-center mb-4 border border-zinc-200/50 dark:border-white/[0.075]">
                  <Wallet className="h-7 w-7 opacity-30" />
                </div>
                <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Nenhuma transação</p>
                <p className="text-[10px] mt-1 opacity-60 font-bold uppercase tracking-wider">Adicione transações para acompanhar.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
