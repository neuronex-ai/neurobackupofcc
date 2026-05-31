"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownLeft, Clock } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { useFinancialMetrics } from "@/hooks/use-financial-metrics";

interface WidgetProps {
  title: string;
  value: number;
  subtitle: string;
  type: "positive" | "negative" | "neutral";
  icon: any;
}

const SimpleWidget = ({ title, value, subtitle, type, icon: Icon }: WidgetProps) => {
  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "group relative overflow-hidden rounded-[24px] p-6",
        "bg-white dark:bg-zinc-900",
        "border border-zinc-200/50 dark:border-zinc-800/50",
        "shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_24px_-8px_rgba(0,0,0,0.08)]",
        "transition-shadow duration-500"
      )}
    >
      <div className="flex flex-col h-full justify-between gap-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500">
              {title}
            </p>
            <h3 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {formatCurrency(value)}
            </h3>
          </div>
          <div className={cn(
            "p-2.5 rounded-xl transition-colors duration-300",
            "bg-zinc-50 dark:bg-zinc-800 group-hover:bg-zinc-100 dark:group-hover:bg-zinc-700"
          )}>
            <Icon className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={cn(
            "h-1.5 w-1.5 rounded-full",
            type === "positive" && "bg-zinc-900 dark:bg-zinc-100",
            type === "negative" && "bg-zinc-400 dark:bg-zinc-600",
            type === "neutral" && "bg-zinc-300 dark:bg-zinc-700"
          )} />
          <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            {subtitle}
          </span>
        </div>
      </div>

      {/* Detalhe de luz suave ao fundo */}
      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-zinc-100/50 dark:bg-zinc-800/20 blur-3xl rounded-full pointer-events-none" />
    </motion.div>
  );
};

export const FinancialWidgets = () => {
  const { data: metrics, isLoading } = useFinancialMetrics();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[140px] rounded-[24px] bg-zinc-100/50 dark:bg-zinc-900/50 animate-pulse border border-zinc-200/50 dark:border-zinc-800/50" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
      <SimpleWidget
        title="O que entrou"
        value={metrics?.currentMonthRevenue || 0}
        subtitle="Receita confirmada"
        type="positive"
        icon={ArrowUpRight}
      />

      <SimpleWidget
        title="O que saiu"
        value={metrics?.currentMonthExpenses || 0}
        subtitle="Custos operacionais"
        type="negative"
        icon={ArrowDownLeft}
      />

      <SimpleWidget
        title="A receber"
        value={metrics?.pendingInvoices || 0}
        subtitle="Cobranças pendentes"
        type="neutral"
        icon={Clock}
      />
    </div>
  );
};

export default FinancialWidgets;