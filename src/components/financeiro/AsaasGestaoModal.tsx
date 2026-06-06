"use client";

import { ReactNode, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Activity, RefreshCcw, Building2, Wallet, Banknote, ShieldCheck, Copy, Check } from "lucide-react";
import { motion } from "framer-motion";

import { useFinancialAccount } from "@/hooks/use-financial-account";

export const AsaasGestaoModal = ({ children }: { children: ReactNode }) => {
    const { account, isApproved, isPending, isRestricted, isAwaitingDocuments, isAwaitingApproval } = useFinancialAccount();
    const [copiedWebhook, setCopiedWebhook] = useState(false);

    const webhookUrl = useMemo(() => {
        const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || "https://krewdaklcyzqfxkkgvqr.supabase.co").replace(/\/+$/, "");
        return `${supabaseUrl}/functions/v1/asaas-webhook`;
    }, []);

    const handleCopyWebhook = async () => {
        await navigator.clipboard.writeText(webhookUrl);
        setCopiedWebhook(true);
        window.setTimeout(() => setCopiedWebhook(false), 1800);
    };

    const getKycStatus = () => {
        if (!account) return { label: "Não iniciada", color: "text-zinc-500", bg: "bg-zinc-100 dark:bg-zinc-800" };
        if (isApproved) return { label: "Aprovada", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/30" };
        if (isAwaitingDocuments || isRestricted) return { label: "Pendências", color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-100 dark:bg-rose-900/30" };
        if (isAwaitingApproval || isPending) return { label: "Em Análise", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/30" };
        return { label: "Configurando", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30" };
    };

    const kycStatus = getKycStatus();

    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-[800px] h-[85vh] bg-white dark:bg-[#0A0A0B] border-zinc-200 dark:border-white/5 p-0 overflow-hidden flex flex-col rounded-[48px] shadow-2xl z-[150] backdrop-blur-3xl outline-none [&>button]:hidden">
                <DialogHeader className="px-10 py-8 border-b border-zinc-100 dark:border-white/5 flex flex-row items-center justify-between space-y-0 bg-zinc-50/50 dark:bg-white/[0.01]">
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-[18px] bg-zinc-900 dark:bg-white text-white dark:text-black flex items-center justify-center shadow-xl">
                            <Activity className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-[0.2em] leading-none mb-1.5">
                                Gestão Subconta Asaas
                            </DialogTitle>
                            <p className="text-[9px] text-zinc-400 font-black uppercase tracking-[0.3em] opacity-60">Automação de Recebimentos & Reembolso</p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 p-10 bg-zinc-50/30 dark:bg-black/20 overflow-y-auto custom-scrollbar">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="p-6 rounded-[32px] bg-gradient-to-br from-zinc-900 to-black dark:from-white dark:to-zinc-100 text-white dark:text-black border border-zinc-800 dark:border-white/10 shadow-xl"
                        >
                            <RefreshCcw className="h-6 w-6 mb-4 opacity-50" />
                            <h3 className="text-2xl font-black mb-1">Reembolso Assistido</h3>
                            <p className="text-xs opacity-70 font-medium tracking-wide">Gerencie faturas para saúde suplementar e recibos automatizados para pacientes.</p>
                        </motion.div>

                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="p-6 rounded-[32px] bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 shadow-sm"
                        >
                            <Wallet className="h-6 w-6 mb-4 text-emerald-500" />
                            <h3 className="text-xl font-black mb-1 text-zinc-900 dark:text-white">Automação Fiscal</h3>
                            <p className="text-xs text-zinc-500 font-medium tracking-wide">Exportação Dmed, fluxo Contábil e envio de XML recorrente.</p>
                        </motion.div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-[10px] uppercase font-black tracking-widest text-zinc-400 px-2">Configurações Base</h4>

                        <div className="bg-white dark:bg-zinc-900/50 rounded-[28px] border border-zinc-200/50 dark:border-white/5 divide-y divide-zinc-100 dark:divide-white/5">

                            <div className="flex items-center justify-between p-5 hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-black/50 flex items-center justify-center text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                                        <Building2 className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-zinc-900 dark:text-white">Dados da Subconta</p>
                                        <p className="text-[11px] text-zinc-500">Gerenciar CNPJ/CPF atrelado ao banco</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-5 hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-black/50 flex items-center justify-center text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                                        <Banknote className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-zinc-900 dark:text-white">Taxas & Repasses</p>
                                        <p className="text-[11px] text-zinc-500">Suas condições e tarifas bancárias</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-5 hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group rounded-b-[28px]">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-black/50 flex items-center justify-center text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                                        <ShieldCheck className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-zinc-900 dark:text-white">KYC & Compliance</p>
                                        <p className="text-[11px] text-zinc-500">Documentos e validação de limites</p>
                                    </div>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${kycStatus.bg} ${kycStatus.color}`}>
                                    {kycStatus.label}
                                </div>
                            </div>

                        </div>
                    </div>

                    <div className="mt-8 space-y-4">
                        <h4 className="text-[10px] uppercase font-black tracking-widest text-zinc-400 px-2">Webhook Produção</h4>

                        <div className="rounded-[28px] border border-zinc-200/70 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-zinc-900/50">
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div className="min-w-0">
                                    <p className="text-sm font-black text-zinc-900 dark:text-white">URL para eventos Asaas</p>
                                    <p className="mt-1 break-all font-mono text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                                        {webhookUrl}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleCopyWebhook}
                                    className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-700 transition-all hover:bg-zinc-100 active:scale-95 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-200 dark:hover:bg-white/[0.08]"
                                >
                                    {copiedWebhook ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    {copiedWebhook ? "Copiado" : "Copiar"}
                                </button>
                            </div>

                            <p className="mt-4 text-[10px] font-bold uppercase leading-relaxed tracking-[0.16em] text-zinc-400">
                                No painel Asaas, use esta URL em produção e configure o token de autenticação igual ao secret ASAAS_WEBHOOK_TOKEN.
                            </p>
                        </div>
                    </div>

                </div>
            </DialogContent>
        </Dialog>
    );
};
