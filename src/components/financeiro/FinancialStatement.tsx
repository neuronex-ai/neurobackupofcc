"use client";

import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    ArrowUpRight,
    ArrowDownLeft,
    Clock,
    CheckCircle2,
    User,
    FileText,
    Activity,
    Landmark
} from "lucide-react";
import { Transaction } from "@/types";
import { motion } from "framer-motion";

interface FinancialStatementProps {
    transactions: Transaction[];
    isLoading?: boolean;
    onSelectTransaction?: (transaction: Transaction) => void;
}

export const FinancialStatement = ({
    transactions,
    isLoading,
    onSelectTransaction
}: FinancialStatementProps) => {

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-20 w-full animate-pulse bg-zinc-100 dark:bg-white/5 rounded-2xl" />
                ))}
            </div>
        );
    }

    if (!transactions || transactions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center mb-4">
                    <Activity className="w-6 h-6 text-zinc-300 dark:text-zinc-700" />
                </div>
                <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest">Nenhuma movimentação</h3>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-2">Os registros aparecerão aqui conforme ocorrerem.</p>
            </div>
        );
    }

    const sortedTransactions = [...transactions].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const getOriginTag = (t: Transaction) => {
        const isNeuro = !!(t.external_reference || (t as any).asaas_transaction_id || (t as any).asaas_payment_id);
        return (
            <div className={cn(
                "px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest flex items-center gap-1 border",
                isNeuro
                    ? "bg-zinc-900 dark:bg-white text-white dark:text-black border-zinc-900 dark:border-white"
                    : "bg-white dark:bg-transparent text-zinc-900 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800"
            )}>
                {isNeuro ? <Landmark className="w-2.5 h-2.5" /> : <FileText className="w-2.5 h-2.5" />}
                {isNeuro ? "NeuroFinance" : "Manual"}
            </div>
        );
    };

    const getMethodDetails = (t: Transaction) => {
        const method = t.payment_method || (t as any).method || 'outro';
        const installments = (t as any).installments;

        let label = method.toUpperCase();
        if (method === 'card' || method === 'credit_card') label = 'CARTÃO';
        if (method === 'pix') label = 'PIX';
        if (method === 'cash') label = 'DINHEIRO';
        if (method === 'boleto') label = 'BOLETO';

        return (
            <div className="flex items-center gap-2">
                <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider">{label}</span>
                {installments && installments > 1 && (
                    <span className="text-[7px] font-black text-zinc-900 dark:text-white uppercase px-1.5 py-0.5 bg-zinc-100 dark:bg-white/10 rounded">
                        {installments}X DE R$ {((t.amount || 0) / installments).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-2">
            {sortedTransactions.map((transaction, idx) => {
                const isIncome = transaction.type === 'income';
                const status = transaction.status || 'completed';
                const patientName = (transaction as any).patient_name || (transaction as any).patients?.name;

                return (
                    <motion.div
                        key={transaction.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => onSelectTransaction?.(transaction)}
                        className={cn(
                            "group relative flex items-center justify-between p-4 md:p-5 rounded-[24px] cursor-pointer transition-all duration-300",
                            "bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.05]",
                            "hover:bg-zinc-50 dark:hover:bg-white/[0.04] hover:border-zinc-300 dark:hover:border-white/[0.1] hover:shadow-lg"
                        )}
                    >
                        <div className="flex items-center gap-5">
                            <div className={cn(
                                "w-11 h-11 rounded-[16px] flex items-center justify-center transition-all border",
                                isIncome
                                    ? "bg-zinc-100 dark:bg-white/5 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white"
                                    : "bg-zinc-50 dark:bg-black/20 border-zinc-100 dark:border-white/5 text-zinc-400 dark:text-zinc-600"
                            )}>
                                {isIncome ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                            </div>

                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-3">
                                    <h4 className="text-[11px] font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-none group-hover:translate-x-1 transition-transform">
                                        {transaction.description}
                                    </h4>
                                    {getOriginTag(transaction)}
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="text-[9px] font-medium text-zinc-400 uppercase tracking-widest">
                                        {transaction.date && !isNaN(new Date(transaction.date).getTime())
                                            ? format(new Date(transaction.date), "dd 'de' MMM", { locale: ptBR })
                                            : "DATA INDISPONÍVEL"}
                                    </span>

                                    <div className="w-1 h-1 rounded-full bg-zinc-200 dark:bg-zinc-800" />

                                    {getMethodDetails(transaction)}

                                    {patientName && (
                                        <>
                                            <div className="w-1 h-1 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10">
                                                <User className="w-2.5 h-2.5 text-zinc-400" />
                                                <span className="text-[8px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-tight">{patientName}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                            <div className="flex items-baseline gap-1">
                                <span className={cn("text-[10px] font-light italic", isIncome ? "text-zinc-400" : "text-zinc-300")}>R$</span>
                                <span className={cn(
                                    "text-lg font-black tracking-tighter leading-none",
                                    isIncome ? "text-zinc-900 dark:text-white" : "text-zinc-500 dark:text-zinc-400"
                                )}>
                                    {Math.abs(transaction.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>

                            <div className={cn(
                                "flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest",
                                status === 'completed' ? "text-zinc-400" : "text-zinc-300"
                            )}>
                                {status === 'completed' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3 animate-pulse" />}
                                {status === 'completed' ? 'Confirmado' : 'Pendente'}
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};