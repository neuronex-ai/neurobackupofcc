/**
 * ─── PixLimites — Limites de Transações Pix ─────────────────────
 * Displays and manages PIX transaction limits.
 * Shows current limits based on NeuroFinance account tier.
 * ─────────────────────────────────────────────────────────────────
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
    Gauge,
    Shield,
    Moon,
    Sun,
    Clock,
    AlertTriangle,
    ChevronRight,
    ArrowUpRight,
    ArrowDownRight,
    Info,
} from "lucide-react";
import { useFinancialAccount } from "@/hooks/use-financial-account";
import { useNeuroFinanceBalance } from "@/hooks/use-neurofinance-balance";

interface LimitItem {
    label: string;
    current: number;
    max: number;
    period: string;
    icon: React.ElementType;
    color: string;
}

export function PixLimites() {
    const { account } = useFinancialAccount();
    const { data: balanceData } = useNeuroFinanceBalance();
    const [showDetails, setShowDetails] = useState(false);

    // Default limits based on sandbox/account tier
    const limits: LimitItem[] = [
        {
            label: "Envio Diurno (6h-20h)",
            current: balanceData?.balance || 0,
            max: 20000,
            period: "por transação",
            icon: Sun,
            color: "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900",
        },
        {
            label: "Envio Noturno (20h-6h)",
            current: 0,
            max: 1000,
            period: "por transação",
            icon: Moon,
            color: "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900",
        },
        {
            label: "Limite Diário de Envio",
            current: balanceData?.balance || 0,
            max: 50000,
            period: "acumulado/dia",
            icon: ArrowUpRight,
            color: "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900",
        },
        {
            label: "Limite Diário de Recebimento",
            current: 0,
            max: 100000,
            period: "acumulado/dia",
            icon: ArrowDownRight,
            color: "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900",
        },
    ];

    const getUsagePercentage = (current: number, max: number) => {
        return Math.min((current / max) * 100, 100);
    };

    const getUsageColor = (pct: number) => {
        if (pct >= 90) return "bg-red-500";
        if (pct >= 70) return "bg-amber-500";
        return "bg-emerald-500";
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="p-6 rounded-[28px] bg-zinc-900 dark:bg-white border border-zinc-800 dark:border-zinc-200">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 dark:bg-black/5 text-white dark:text-zinc-900 flex items-center justify-center shadow-lg">
                        <Gauge className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-tight text-white dark:text-zinc-900">
                            Limites de Transações Pix
                        </h3>
                        <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-0.5">
                            Gerencie seus limites de envio e recebimento • NeuroFinance
                        </p>
                    </div>
                    <div className="ml-auto px-3 py-1 rounded-full bg-white/10 dark:bg-black/5 text-[8px] font-black uppercase tracking-widest text-white dark:text-zinc-900">
                        Sandbox
                    </div>
                </div>
            </div>

            {/* Account Status */}
            <div className="p-5 rounded-[24px] bg-white/60 dark:bg-white/[0.02] border border-zinc-200/50 dark:border-white/[0.06] flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-zinc-900 dark:text-white" />
                </div>
                <div className="flex-1">
                    <p className="text-xs font-bold text-zinc-900 dark:text-white">
                        Conta {account?.status === 'active' ? 'Ativa' : 'Sandbox'}
                    </p>
                    <p className="text-[9px] text-zinc-400 mt-0.5">
                        Limites padrão NeuroFinance • Ambiente de teste
                    </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-white/10 text-[8px] font-black uppercase tracking-widest text-zinc-900 dark:text-white">
                    Operacional
                </span>
            </div>

            {/* Limits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {limits.map((limit, index) => {
                    const pct = getUsagePercentage(limit.current, limit.max);
                    const Icon = limit.icon;

                    return (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-5 rounded-[24px] bg-white/60 dark:bg-white/[0.02] border border-zinc-200/50 dark:border-white/[0.06]"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shadow-md", limit.color)}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[9px] font-black uppercase tracking-wider text-zinc-500">{limit.label}</p>
                                    <p className="text-[8px] text-zinc-400">{limit.period}</p>
                                </div>
                            </div>

                            {/* Progress */}
                            <div className="mb-2">
                                <div className="h-2 rounded-full bg-zinc-100 dark:bg-white/5 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${pct}%` }}
                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                        className={cn("h-full rounded-full", getUsageColor(pct))}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-zinc-900 dark:text-white">
                                    R$ {limit.current.toFixed(2)}
                                </span>
                                <span className="text-[9px] text-zinc-400">
                                    máx R$ {limit.max.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Horário Info */}
            <div className="p-5 rounded-[24px] bg-zinc-50/80 dark:bg-white/[0.01] border border-zinc-200/50 dark:border-white/[0.06] space-y-4">
                <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-zinc-400" />
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">
                        Informações sobre limites Pix
                    </p>
                </div>

                <div className="space-y-3 text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    <div className="flex items-start gap-2">
                        <Clock className="w-3 h-3 shrink-0 mt-0.5 text-zinc-400" />
                        <p>
                            <strong>Horário diurno (6h às 20h):</strong> Limite padrão de R$ 20.000,00 por transação.
                            Ajustável via painel NeuroFinance.
                        </p>
                    </div>
                    <div className="flex items-start gap-2">
                        <Moon className="w-3 h-3 shrink-0 mt-0.5 text-zinc-400" />
                        <p>
                            <strong>Horário noturno (20h às 6h):</strong> Limite reduzido de R$ 1.000,00 por medida de segurança do Banco Central.
                        </p>
                    </div>
                    <div className="flex items-start gap-2">
                        <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5 text-amber-500" />
                        <p>
                            <strong>Sandbox:</strong> No ambiente de teste, os limites são simulados e não refletem transações reais.
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="flex items-center gap-2 text-[9px] font-black uppercase tracking-wider text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                    Solicitar Alteração de Limite
                    <ChevronRight className={cn("w-3 h-3 transition-transform", showDetails && "rotate-90")} />
                </button>

                {showDetails && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="p-4 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-[10px] text-zinc-600 dark:text-zinc-400"
                    >
                        Alterações de limite devem ser solicitadas via painel NeuroFinance ou contato com o suporte (não disponível no sandbox).
                    </motion.div>
                )}
            </div>
        </div>
    );
}
