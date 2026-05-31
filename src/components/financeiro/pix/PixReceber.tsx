/**
 * ─── PixReceber — Receber via Pix ───────────────────────────────
 * Lists PIX received and allows creating charges with due dates.
 * Connected to NeuroFinance API.
 * ─────────────────────────────────────────────────────────────────
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowDownLeft,
    Loader2,
    RefreshCw,
    Search,
    CheckCircle2,
    Clock,
    XCircle,
    FileText,
    Undo2,
} from "lucide-react";
import { usePixRecebidos, usePixCobList } from "@/hooks/use-neurofinance-pix";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useRefundPayment } from "@/hooks/use-neurofinance-payments";

type ViewTab = "recebidos" | "cobrancas";

export function PixReceber() {
    const [activeTab, setActiveTab] = useState<ViewTab>("recebidos");
    const [searchTerm, setSearchTerm] = useState("");

    // Hooks - fetches from NeuroFinance API
    const { data: pixRecebidos, isLoading: isLoadingPix, refetch: refetchPix } = usePixRecebidos();
    const { data: cobList, isLoading: isLoadingCob, refetch: refetchCob } = usePixCobList();
    const { mutate: refundPayment, isPending: isRefunding } = useRefundPayment();

    const handleRefund = (id: string) => {
        if (confirm("Tem certeza que deseja reembolsar este Pix? A ação não pode ser desfeita.")) {
            refundPayment({ paymentId: id });
        }
    };

    const pixItems = pixRecebidos?.payments || [];
    const cobItems = cobList?.charges || [];

    const statusIcon = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'PAID':
            case 'CONCLUIDA':
            case 'RECEBIDO':
                return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
            case 'PENDING':
            case 'ATIVA':
            case 'PENDENTE':
                return <Clock className="w-3.5 h-3.5 text-amber-500" />;
            case 'FAILED':
            case 'EXPIRED':
            case 'REMOVIDA_PELO_USUARIO_RECEBEDOR':
            case 'CANCELADA':
                return <XCircle className="w-3.5 h-3.5 text-red-500" />;
            default:
                return <Clock className="w-3.5 h-3.5 text-zinc-400" />;
        }
    };

    const statusLabel = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'PAID': return 'Pago';
            case 'CONCLUIDA': return 'Concluída';
            case 'PENDING': return 'Pendente';
            case 'ATIVA': return 'Ativa';
            case 'FAILED': return 'Falhou';
            case 'EXPIRED': return 'Expirada';
            case 'REMOVIDA_PELO_USUARIO_RECEBEDOR': return 'Removida';
            default: return status || '—';
        }
    };

    const handleRefresh = () => {
        refetchPix();
        refetchCob();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="p-6 rounded-[28px] bg-zinc-900 dark:bg-white border border-zinc-800 dark:border-zinc-200">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 dark:bg-black/5 text-white dark:text-zinc-900 flex items-center justify-center shadow-lg">
                        <ArrowDownLeft className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-tight text-white dark:text-zinc-900">
                            Receber via Pix
                        </h3>
                        <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-0.5">
                            Pix recebidos e cobranças pendentes • NeuroFinance API
                        </p>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <button
                            onClick={handleRefresh}
                            className="w-10 h-10 rounded-xl bg-white/10 dark:bg-black/5 flex items-center justify-center hover:bg-white/20 dark:hover:bg-black/10 transition-all"
                        >
                            <RefreshCw className="w-4 h-4 text-white dark:text-zinc-900" />
                        </button>
                        <div className="px-3 py-1 rounded-full bg-white/10 dark:bg-black/5 text-[8px] font-black uppercase tracking-widest text-white dark:text-zinc-900">
                            Sandbox
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1 rounded-2xl bg-zinc-100 dark:bg-white/5">
                {[
                    { id: "recebidos" as ViewTab, label: "Pix Recebidos", count: pixItems.length },
                    { id: "cobrancas" as ViewTab, label: "Cobranças Ativas", count: cobItems.length },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex-1 py-3 px-4 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2",
                            activeTab === tab.id
                                ? "bg-white dark:bg-white/10 text-zinc-900 dark:text-white shadow-sm"
                                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                        )}
                    >
                        {tab.label}
                        <span className="px-1.5 py-0.5 rounded-md bg-zinc-200/80 dark:bg-white/10 text-[7px] font-black">
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por txid, pagador ou valor..."
                    className="w-full h-10 pl-10 pr-4 rounded-xl bg-white/60 dark:bg-white/[0.02] border border-zinc-200/50 dark:border-white/[0.06] text-xs text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/30 dark:focus:ring-white/30 transition-all"
                />
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
                {(isLoadingPix || isLoadingCob) ? (
                    <motion.div
                        key="loading"
                        className="flex flex-col items-center justify-center py-16"
                    >
                        <Loader2 className="w-8 h-8 animate-spin text-zinc-300 dark:text-zinc-600" />
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-4">
                            Consultando NeuroFinance...
                        </p>
                    </motion.div>
                ) : (
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2"
                    >
                        {activeTab === "recebidos" && (
                            pixItems.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <ArrowDownLeft className="w-12 h-12 text-zinc-200 dark:text-zinc-700 mb-4" />
                                    <p className="text-sm font-bold text-zinc-400">Nenhum Pix recebido</p>
                                    <p className="text-[10px] text-zinc-400 mt-1">
                                        Os valores recebidos via Pix aparecerão aqui (Sandbox)
                                    </p>
                                </div>
                            ) : (
                                pixItems.map((pix: any, i: number) => (
                                    <div key={pix.endToEndId || i} className="p-4 rounded-2xl bg-white/60 dark:bg-white/[0.02] border border-zinc-200/50 dark:border-white/[0.06] flex items-center gap-4 hover:bg-white dark:hover:bg-white/[0.04] transition-colors">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                                            <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                                                {pix.pagador?.nome || "Pagador não identificado"}
                                            </p>
                                            <p className="text-[9px] text-zinc-400 font-mono truncate mt-0.5">
                                                id: {pix.id}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                                                + R$ {((pix.gross_amount || pix.net_amount || 0) / 100).toFixed(2)}
                                            </p>
                                            <p className="text-[8px] text-zinc-400 mt-0.5">
                                                {pix.paid_at ? format(new Date(pix.paid_at), "dd/MM HH:mm", { locale: ptBR }) : "—"}
                                            </p>
                                        </div>
                                        <div className="pl-2 border-l border-zinc-200/50 dark:border-white/[0.06] flex items-center h-full">
                                            <button
                                                onClick={() => handleRefund(pix.id)}
                                                disabled={isRefunding}
                                                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
                                                title="Reembolsar Pix"
                                            >
                                                {isRefunding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Undo2 className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )
                        )}

                        {activeTab === "cobrancas" && (
                            cobItems.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <FileText className="w-12 h-12 text-zinc-200 dark:text-zinc-700 mb-4" />
                                    <p className="text-sm font-bold text-zinc-400">Nenhuma cobrança encontrada</p>
                                    <p className="text-[10px] text-zinc-400 mt-1">
                                        Crie um QR Code ou uma cobrança para visualizar aqui (Sandbox)
                                    </p>
                                </div>
                            ) : (
                                cobItems.map((cob: any, i: number) => (
                                    <div key={cob.txid || i} className="p-4 rounded-2xl bg-white/60 dark:bg-white/[0.02] border border-zinc-200/50 dark:border-white/[0.06] flex items-center gap-4 hover:bg-white dark:hover:bg-white/[0.04] transition-colors">
                                        {statusIcon(cob.status)}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                                                {cob.description || "Cobrança Pix"}
                                            </p>
                                            <p className="text-[9px] text-zinc-400 font-mono truncate mt-0.5">
                                                id: {cob.id}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-zinc-900 dark:text-white">
                                                R$ {((cob.gross_amount || 0) / 100).toFixed(2)}
                                            </p>
                                            <span className={cn(
                                                "text-[7px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full",
                                                cob.status === 'ATIVA' ? "bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" :
                                                    cob.status === 'CONCLUIDA' ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" :
                                                        "bg-zinc-100 text-zinc-500 dark:bg-white/10 dark:text-zinc-400"
                                            )}>
                                                {statusLabel(cob.status)}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
