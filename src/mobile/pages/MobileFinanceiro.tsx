import { NewInvoiceModal } from "@/components/financeiro/NewInvoiceModal";
import { NewTransactionModal } from "@/components/financeiro/NewTransactionModal";
import { CustomOnboardingFlow } from "@/components/financeiro/CustomOnboardingFlow";
import { AsaasRegulatoryFooter } from "@/components/financeiro/AsaasRegulatoryFooter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useFinancialMetrics } from "@/hooks/use-financial-metrics";
import { useFinancialAccount } from "@/hooks/use-financial-account";

import { useTransactions } from "@/hooks/use-transactions";
import { cn, formatCurrency } from "@/lib/utils";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AnimatePresence, motion } from "framer-motion";
import {
    AlertTriangle, ArrowDownRight, ArrowRightLeft, ArrowUpRight, Barcode, ChevronRight, Eye,
    EyeOff, FileText, Landmark, Loader2, MoreHorizontal, Plus, QrCode, Receipt, TrendingUp, Wallet, Sparkles, ArrowRight
} from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import { MobileLayout } from "../components/MobileLayout";
import { useNeuroFinanceBalance } from "@/hooks/use-neurofinance-balance";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RequirementsList } from "@/components/financeiro/RequirementsList";

export const MobileFinanceiro = () => {
    const { data: metrics, isLoading: isLoadingMetrics } = useFinancialMetrics();
    const { data: transactions } = useTransactions(subMonths(new Date(), 3));

    // NeuroFinance v2: account & balance hooks
    const {
        hasAccount, isApproved, isLoading: isLoadingAccount,
        isAwaitingDocuments, isAwaitingApproval, isPending,
        needsInitialOnboarding,
        refetch: refetchStatus, syncAccount,
    } = useFinancialAccount();
    const { data: balanceData, isLoading: isLoadingBalance } = useNeuroFinanceBalance();
    const balance = balanceData || { balance: 0, pending: 0 };

    const [searchParams, setSearchParams] = useSearchParams();
    const [showBalance, setShowBalance] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'income' | 'expense'>('all');
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [onboardingStep, setOnboardingStep] = useState<'welcome' | 'wizard'>('welcome');

    // Handle onboarding return
    useEffect(() => {
        let shouldUpdateParams = false;

        const onboardingStatus = searchParams.get('onboarding');
        if (onboardingStatus === 'complete' || onboardingStatus === 'refresh') {
            syncAccount.mutate(undefined, {
                onSettled: () => {
                    searchParams.delete('onboarding');
                    setSearchParams(searchParams);
                }
            });
        }

        const paymentStatus = searchParams.get('payment');
        if (paymentStatus) {
            if (paymentStatus === 'success') {
                toast.success('Cobrança gerada/paga com sucesso!');
            } else if (paymentStatus === 'canceled') {
                toast.info('Pagamento cancelado ou não concluído.');
            }
            searchParams.delete('payment');
            searchParams.delete('id');
            shouldUpdateParams = true;
        }

        if (shouldUpdateParams) {
            setSearchParams(searchParams, { replace: true });
        }
    }, [searchParams, setSearchParams, syncAccount]);

    const isPendingActivation = hasAccount && !isApproved;
    const showMainDashboard = !needsInitialOnboarding;

    const chartData = transactions?.slice(0, 20).map(t => ({ value: t.amount })) || [];
    const isProfit = (metrics?.netProfit || 0) >= 0;

    const filteredTransactions = transactions?.filter(t => {
        if (activeTab === 'all') return true;
        if (activeTab === 'income') return t.type === 'income';
        return t.type === 'expense';
    });

    // ─── Loading state ─────────────────────────────
    if (isLoadingAccount) {
        return (
            <MobileLayout className="px-0 min-h-screen overflow-y-auto bg-background">
                <div className="flex flex-col items-center justify-center min-h-[80vh] px-5">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/30 mb-4" />
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Sincronizando...</p>
                </div>
            </MobileLayout>
        );
    }

    // ─── Onboarding wizard (mobile) ─────────────────
    if (!showMainDashboard) {
        return (
            <MobileLayout className="px-0 min-h-screen overflow-hidden bg-background" showBottomNav={false}>
                <div className="absolute inset-0 pointer-events-none z-0">
                    <div className="absolute top-[-15%] left-[-10%] w-[900px] h-[700px] bg-foreground/[0.02] blur-[200px] rounded-full" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[500px] bg-foreground/[0.015] blur-[160px] rounded-full" />
                </div>

                <AnimatePresence mode="wait">
                    {onboardingStep === 'welcome' ? (
                        <motion.div
                            key="welcome"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="relative z-10 flex flex-col items-center justify-center h-full px-6 pt-10"
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                className="flex flex-col items-center text-center max-w-lg w-full"
                            >
                                <div className="w-20 h-20 rounded-[24px] bg-foreground text-background flex items-center justify-center mb-8 shadow-2xl">
                                    <Sparkles className="w-9 h-9" />
                                </div>

                                <h1 className="text-3xl font-black tracking-[-0.04em] text-foreground mb-4 uppercase">
                                    Bem-vindo ao NeuroFinance
                                </h1>
                                <p className="text-sm text-muted-foreground font-medium leading-relaxed max-w-md mb-10">
                                    Para acessar as funcionalidades de transferências, PIX e extratos detalhados,
                                    precisamos que conclua o onboarding da sua conta digital. É rápido e seguro.
                                </p>

                                <button
                                    onClick={() => setOnboardingStep('wizard')}
                                    className="w-full h-14 rounded-2xl bg-foreground text-background font-black text-[11px] uppercase tracking-[0.3em] shadow-xl hover:opacity-90 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                                >
                                    Começar agora
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </motion.div>

                            <div className="absolute bottom-8 left-0 right-0 flex justify-center pb-safe">
                                <AsaasRegulatoryFooter />
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="wizard"
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -40 }}
                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                            className="relative z-10 h-full w-full flex items-center justify-center"
                        >
                            <div className="w-full h-full bg-background overflow-y-auto overflow-x-hidden">
                                <CustomOnboardingFlow
                                    fullScreen
                                    onCancel={() => setOnboardingStep('welcome')}
                                    onComplete={async () => {
                                        await syncAccount.mutateAsync();
                                        refetchStatus();
                                    }}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </MobileLayout>
        );
    }

    // ─── Activation Banner (mobile) ─────────────────
    const renderActivationBanner = () => {
        if (!isPendingActivation) return null;

        let message = '';
        let ctaLabel = '';

        if (isAwaitingDocuments) {
            message = 'Envie seus documentos para ativar Pix, Transferências e outras funcionalidades.';
            ctaLabel = 'Enviar Documentos';
        } else if (isAwaitingApproval) {
            message = 'Documentos em análise (até 48h). Funcionalidades serão liberadas após aprovação.';
            ctaLabel = 'Ver Status';
        } else if (isPending) {
            message = 'Sua conta está sendo configurada. Aguarde a ativação.';
            ctaLabel = 'Verificar';
        } else {
            message = 'Existem pendências na sua conta NeuroFinance.';
            ctaLabel = 'Resolver';
        }

        return (
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-[20px] bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-500/15 flex items-start gap-3"
            >
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0 space-y-2">
                    <p className="text-[11px] font-bold text-amber-800 dark:text-amber-200 leading-relaxed">{message}</p>
                    <button
                        onClick={() => setShowUpdateModal(true)}
                        className="px-4 py-1.5 rounded-lg bg-amber-600 text-white text-[9px] font-black uppercase tracking-[0.15em] active:scale-95 transition-all shadow-md"
                    >
                        {ctaLabel}
                    </button>
                </div>
            </motion.div>
        );
    };

    return (
        <MobileLayout className="px-0 min-h-screen overflow-y-auto bg-background">

            {/* Content */}
            <div className="px-5 pb-32 pt-[6.5rem] space-y-5">

                {/* Page Header */}
                <header className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground tracking-tight">NeuroFinance</h1>
                        <p className="text-xs text-muted-foreground font-medium mt-0.5">Gestão de Caixa</p>
                    </div>

                    <div className="flex gap-2">
                        <NewTransactionModal>
                            <Button
                                size="icon"
                                className="h-11 w-11 rounded-xl bg-secondary/50 hover:bg-secondary text-foreground border border-border/10 active:scale-95 transition-all"
                            >
                                <Plus className="w-5 h-5" />
                            </Button>
                        </NewTransactionModal>
                    </div>
                </header>

                {/* Activation Banner */}
                {renderActivationBanner()}

                {/* --- Balance Card (Premium NeoBank Style) --- */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="relative rounded-[28px] bg-gradient-to-br from-card to-card/50 border border-border/10 p-6 overflow-hidden shadow-sm">
                        {/* Ambient glow */}
                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/5 rounded-full blur-[60px]" />

                        {/* Top Row */}
                        <div className="relative z-10 flex justify-between items-center mb-6">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-secondary/50 flex items-center justify-center border border-border/10">
                                    <Wallet className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Saldo</span>
                            </div>
                            <button
                                onClick={() => setShowBalance(!showBalance)}
                                className="w-9 h-9 rounded-xl bg-secondary/30 flex items-center justify-center text-muted-foreground/50 hover:text-muted-foreground active:scale-90 transition-all"
                            >
                                {showBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            </button>
                        </div>

                        {/* Balance Value */}
                        <div className="relative z-10 mb-8">
                            {isLoadingBalance ? (
                                <Skeleton className="h-12 w-40 bg-secondary/20 rounded-xl" />
                            ) : (
                                <div className="flex items-baseline gap-1">
                                    <span className="text-lg text-muted-foreground/50 font-medium">R$</span>
                                    <span className="text-4xl font-bold text-foreground tracking-tighter">
                                        {showBalance ? (balance?.balance?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || "0,00") : "••••••"}
                                    </span>
                                </div>
                            )}
                            <p className="text-[11px] text-muted-foreground/70 mt-2 font-medium">
                                + R$ {showBalance ? (balance?.pending?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || "0,00") : "•••"} a liberar
                            </p>
                        </div>

                        {/* Actions */}
                        {/* Actions removed from card path, moving to scrolling list below */}
                    </div>
                </motion.section>

                {/* --- Quick Actions (Premium Horizontal Scroll) --- */}
                <div className="flex gap-4 overflow-x-auto px-5 -mx-5 pb-4 no-scrollbar snap-x">
                    {/* Cobrar - Opens Modal */}
                    <NewInvoiceModal>
                        <button className="flex flex-col items-center gap-2 group min-w-[72px] snap-start">
                            <div className="w-16 h-16 rounded-[24px] bg-foreground text-background flex items-center justify-center shadow-lg shadow-foreground/10 transition-transform active:scale-90 group-hover:scale-105">
                                <Receipt className="w-7 h-7" strokeWidth={1.5} />
                            </div>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider group-active:text-foreground transition-colors">Cobrar</span>
                        </button>
                    </NewInvoiceModal>

                    {/* Transferir */}
                    <button
                        onClick={() => toast.info("Funcionalidade em desenvolvimento")}
                        className="flex flex-col items-center gap-2 group min-w-[72px] snap-start"
                    >
                        <div className="w-16 h-16 rounded-[24px] bg-secondary/50 border border-border/10 flex items-center justify-center backdrop-blur-md transition-transform active:scale-90 group-hover:bg-secondary/80">
                            <ArrowRightLeft className="w-7 h-7 text-foreground/80" strokeWidth={1.5} />
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider group-active:text-foreground transition-colors">Transferir</span>
                    </button>

                    {/* Pix */}
                    <button
                        onClick={() => toast.info("Funcionalidade em desenvolvimento")}
                        className="flex flex-col items-center gap-2 group min-w-[72px] snap-start"
                    >
                        <div className="w-16 h-16 rounded-[24px] bg-secondary/50 border border-border/10 flex items-center justify-center backdrop-blur-md transition-transform active:scale-90 group-hover:bg-secondary/80">
                            <QrCode className="w-7 h-7 text-foreground/80" strokeWidth={1.5} />
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider group-active:text-foreground transition-colors">Pix</span>
                    </button>

                    {/* Pagar */}
                    <button
                        onClick={() => toast.info("Funcionalidade em desenvolvimento")}
                        className="flex flex-col items-center gap-2 group min-w-[72px] snap-start"
                    >
                        <div className="w-16 h-16 rounded-[24px] bg-secondary/50 border border-border/10 flex items-center justify-center backdrop-blur-md transition-transform active:scale-90 group-hover:bg-secondary/80">
                            <Barcode className="w-7 h-7 text-foreground/80" strokeWidth={1.5} />
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider group-active:text-foreground transition-colors">Pagar</span>
                    </button>

                    {/* Sacar */}
                    <button
                        onClick={() => toast.info("Funcionalidade em desenvolvimento")}
                        className="flex flex-col items-center gap-2 group min-w-[72px] snap-start"
                    >
                        <div className="w-16 h-16 rounded-[24px] bg-secondary/50 border border-border/10 flex items-center justify-center backdrop-blur-md transition-transform active:scale-90 group-hover:bg-secondary/80">
                            <Landmark className="w-7 h-7 text-foreground/80" strokeWidth={1.5} />
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider group-active:text-foreground transition-colors">Sacar</span>
                    </button>

                    {/* Extrato */}
                    <button
                        onClick={() => toast.info("Funcionalidade em desenvolvimento")}
                        className="flex flex-col items-center gap-2 group min-w-[72px] snap-start"
                    >
                        <div className="w-16 h-16 rounded-[24px] bg-secondary/50 border border-border/10 flex items-center justify-center backdrop-blur-md transition-transform active:scale-90 group-hover:bg-secondary/80">
                            <FileText className="w-7 h-7 text-foreground/80" strokeWidth={1.5} />
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider group-active:text-foreground transition-colors">Extrato</span>
                    </button>

                    {/* Mais */}
                    <button
                        onClick={() => toast.info("Funcionalidade em desenvolvimento")}
                        className="flex flex-col items-center gap-2 group min-w-[72px] snap-start pr-5"
                    >
                        <div className="w-16 h-16 rounded-[24px] bg-secondary/50 border border-border/10 flex items-center justify-center backdrop-blur-md transition-transform active:scale-90 group-hover:bg-secondary/80">
                            <MoreHorizontal className="w-7 h-7 text-foreground/80" strokeWidth={1.5} />
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider group-active:text-foreground transition-colors">Mais</span>
                    </button>
                </div>

                {/* --- Quick Metrics Monochrome --- */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-2 gap-4"
                >
                    {/* Revenue */}
                    <div className="p-5 rounded-[24px] bg-card border border-border/10 shadow-sm">
                        <div className="w-9 h-9 rounded-xl bg-foreground/5 flex items-center justify-center mb-4">
                            <ArrowUpRight className="h-4 w-4 text-foreground/70" />
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Entradas</p>
                        <p className="text-xl font-bold text-foreground tracking-tight">
                            {isLoadingMetrics ? "..." : formatCurrency(metrics?.currentMonthRevenue || 0).replace('R$', '').trim()}
                        </p>
                        <p className="text-[10px] text-muted-foreground/40 mt-1">Este mês</p>
                    </div>

                    {/* Expenses */}
                    <div className="p-5 rounded-[24px] bg-card border border-border/10 shadow-sm">
                        <div className="w-9 h-9 rounded-xl bg-foreground/5 flex items-center justify-center mb-4">
                            <ArrowDownRight className="h-4 w-4 text-foreground/70" />
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Saídas</p>
                        <p className="text-xl font-bold text-foreground tracking-tight">
                            {isLoadingMetrics ? "..." : formatCurrency(metrics?.currentMonthExpenses || 0).replace('R$', '').trim()}
                        </p>
                        <p className="text-[10px] text-muted-foreground/40 mt-1">Este mês</p>
                    </div>
                </motion.section>

                {/* --- Mini Chart Monochrome --- */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="p-6 rounded-[28px] bg-card border border-border/10 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Fluxo Recente</p>
                            <div className={cn(
                                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider",
                                "bg-foreground/5 text-foreground/80"
                            )}>
                                <TrendingUp className={cn("h-3 w-3", !isProfit && "rotate-180")} />
                                {isProfit ? "Positivo" : "Negativo"}
                            </div>
                        </div>

                        <div className="h-24 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="mobileChartGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#888888" stopOpacity={0.2} />
                                            <stop offset="100%" stopColor="#888888" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#888888"
                                        strokeWidth={2}
                                        fill="url(#mobileChartGrad)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </motion.section>

                {/* --- Transaction Filters --- */}
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 no-scrollbar snap-x">
                    {[
                        { key: 'all', label: 'Todos' },
                        { key: 'income', label: 'Entradas' },
                        { key: 'expense', label: 'Saídas' },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as any)}
                            className={cn(
                                "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 whitespace-nowrap snap-start",
                                activeTab === tab.key
                                    ? "bg-foreground text-background shadow-md transform scale-105"
                                    : "bg-secondary/30 text-muted-foreground border border-transparent hover:bg-secondary/50"
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* --- Transactions List --- */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-foreground tracking-tight">Transações</h3>
                        <Button variant="ghost" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground px-3 h-8">
                            Ver Tudo
                            <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <AnimatePresence mode="popLayout">
                            {filteredTransactions?.slice(0, 10).map((t, i) => (
                                <motion.div
                                    key={t.id || i}
                                    initial={{ opacity: 0, x: -10, scale: 0.98 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    exit={{ opacity: 0, x: 10, scale: 0.98 }}
                                    transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 30 }}
                                    className="group flex items-center justify-between p-4 rounded-[20px] bg-card border border-border/10 hover:bg-secondary/20 active:scale-[0.98] transition-all duration-300 relative overflow-hidden shadow-sm"
                                >
                                    <div className="flex items-center gap-3.5 flex-1 min-w-0 mr-3">
                                        <div className={cn(
                                            "w-10 h-10 shrink-0 rounded-[14px] flex items-center justify-center border transition-colors",
                                            t.type === 'income'
                                                ? "bg-emerald-500/[0.08] text-emerald-500 border-emerald-500/10"
                                                : "bg-rose-500/[0.08] text-rose-500 border-rose-500/10"
                                        )}>
                                            {t.type === 'income' ? <ArrowUpRight className="w-4.5 h-4.5" /> : <ArrowDownRight className="w-4.5 h-4.5" />}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="text-[13px] font-bold text-foreground truncate leading-tight">
                                                {t.description || t.category || 'Transação'}
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <span className="text-[10px] font-medium text-muted-foreground">
                                                    {t.date ? format(new Date(t.date), "d MMM, HH:mm", { locale: ptBR }) : 'Recente'}
                                                </span>
                                                {t.category && (
                                                    <>
                                                        <span className="w-px h-2 bg-border/20" />
                                                        <span className="text-[10px] font-medium text-muted-foreground truncate max-w-[80px]">
                                                            {t.category}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <p className={cn(
                                            "text-[13px] font-bold tracking-tight mb-0.5",
                                            t.type === 'income' ? "text-emerald-500" : "text-foreground"
                                        )}>
                                            {t.type === 'income' ? '+' : '-'} {formatCurrency(Math.abs(t.amount)).replace('R$', '').trim()}
                                        </p>
                                        <div className={cn(
                                            "inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider",
                                            t.status === 'completed'
                                                ? "bg-emerald-500/[0.08] text-emerald-500/80"
                                                : "bg-secondary text-muted-foreground"
                                        )}>
                                            {t.status === 'completed' ? 'Pago' : 'Pendente'}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {(!filteredTransactions || filteredTransactions.length === 0) && (
                            <div className="py-16 text-center rounded-2xl border border-dashed border-border/20 bg-card/10">
                                <Landmark className="h-8 w-8 text-muted-foreground/30 mx-auto mb-4" />
                                <p className="text-xs text-muted-foreground font-medium">Nenhuma transação encontrada</p>
                            </div>
                        )}
                    </div>
                </motion.section>

            </div>

            {/* Modal de Atualização de Dados (Asaas BaaS) */}
            <Dialog open={showUpdateModal} onOpenChange={(open) => {
                setShowUpdateModal(open);
                if (open) refetchStatus();
            }}>
                <DialogContent className="w-[95vw] max-w-lg h-[80vh] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 p-0 overflow-hidden flex flex-col rounded-[24px]">
                    <DialogHeader className="p-6 pb-4 border-b border-zinc-100 dark:border-white/5 shrink-0">
                        <DialogTitle className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Centro de Verificação</DialogTitle>
                        <DialogDescription className="text-[11px] text-zinc-500 font-medium">
                            Acompanhe e resolva pendências em tempo real.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 bg-zinc-50 dark:bg-zinc-900/50 p-4 overflow-auto relative custom-scrollbar">
                        <div className="mb-6">
                            <RequirementsList onSelectRequirement={() => { }} activeRequirement={null} />
                        </div>

                        {showUpdateModal && (
                            <div className="rounded-[24px] border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-950 overflow-hidden">
                                <CustomOnboardingFlow
                                    fullScreen={false}
                                    onComplete={() => {
                                        setShowUpdateModal(false);
                                        syncAccount.mutate();
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </MobileLayout>
    );
};