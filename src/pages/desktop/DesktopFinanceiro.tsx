"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import type { ElementType } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
    QrCode,
    Key,
    ShieldCheck,
    TrendingUp,
    Landmark,
    Receipt,
    Loader2,
    FileText,
    Users,
    Settings,
    BadgeCent,
    Send,
    FileCheck,
    Barcode,
    CreditCard,
    ArrowDownLeft,
    ArrowUpRight,
    ChevronRight,
    ArrowRight,
    Sparkles,
    History,
    Repeat,
    WalletCards,
    Activity,
    PlusCircle,
    CalendarClock,
} from "lucide-react";

import { useTransactions } from "@/hooks/use-transactions";
import { useFinancialSettings } from "@/hooks/use-financial-settings";
import { useFinancialAccount } from "@/hooks/use-financial-account";
import { useNeuroFinanceStatement } from "@/hooks/use-neurofinance-statement";
import { useNeuroFinanceBalanceDetails } from "@/hooks/use-neurofinance-balance-details";
import { subMonths, subDays, isAfter } from "date-fns";

import { CustomOnboardingFlow } from "@/components/financeiro/CustomOnboardingFlow";
import { AsaasRegulatoryFooter } from "@/components/financeiro/AsaasRegulatoryFooter";
import { FinanceiroMainContent, FinanceView } from "@/components/financeiro/FinanceiroMainContent";
import { Transaction } from "@/types";

interface NavSubItem {
    id: FinanceView;
    label: string;
    icon: ElementType<{ className?: string }>;
    tag?: string;
    description?: string;
    subItems?: NavSubItem[];
}

interface NavItem {
    id: string;
    label: string;
    icon: ElementType<{ className?: string }>;
    subItems?: NavSubItem[];
}

const FINANCE_NAV: NavItem[] = [
    {
        id: 'account-balance-root',
        label: "Conta e Saldo",
        icon: CreditCard,
        subItems: [
            { id: 'conta-digital', label: 'Conta e Saldo', icon: CreditCard },
        ],
    },
    {
        id: 'pix-root',
        label: "Área Pix",
        icon: BadgeCent,
        subItems: [
            { id: 'pix-pagar', label: 'Pagar Pix', icon: QrCode, tag: 'Grátis', description: 'Cole um Pix copia e cola e pague pela conta NeuroFinance' },
            { id: 'pix-qrcode', label: 'Gerar QR Code', icon: QrCode, tag: 'Grátis', description: 'Crie um QR Code para receber na hora' },
            { id: 'pix-receber', label: 'Pix recebidos', icon: ArrowDownLeft, tag: 'Grátis', description: 'Veja o que entrou por Pix' },
            { id: 'pix-chaves', label: 'Minhas chaves', icon: Key, description: 'Cadastre e gerencie suas chaves Pix' },
            { id: 'pix-salarios', label: 'Pagar salários', icon: Users, tag: 'Grátis', description: 'Envie Pix em lote para sua equipe' },
            { id: 'pix-limites', label: 'Limites do Pix', icon: ShieldCheck, tag: 'No App', description: 'Ajuste limites de segurança da conta' },
        ],
    },
    {
        id: 'statement-root',
        label: "Extrato",
        icon: FileText,
        subItems: [
            { id: 'extrato', label: 'Extrato', icon: FileText },
        ],
    },
    {
        id: 'cobrancas-root',
        label: "Cobranças",
        icon: WalletCards,
        subItems: [
            { id: 'cobrancas-historia', label: 'Todas as cobranças', icon: History },
            { id: 'cobrancas-simulador', label: 'Simulador de vendas', icon: BadgeCent },
            { id: 'cobrancas-config', label: 'Regras automáticas', icon: Settings },
        ],
    },
    {
        id: 'receitas-root',
        label: "Receitas",
        icon: ArrowUpRight,
        subItems: [
            { id: 'receitas', label: 'Entradas Confirmadas', icon: ArrowUpRight },
        ],
    },
    {
        id: 'despesas-root',
        label: "Despesas",
        icon: ArrowDownLeft,
        subItems: [
            { id: 'despesas', label: 'Saídas Confirmadas', icon: ArrowDownLeft },
        ],
    },
    {
        id: 'pagamentos-root',
        label: "Pagamentos",
        icon: Receipt,
        subItems: [
            { id: 'pagamentos-boletos', label: 'Pagar boletos', icon: Barcode, description: 'Digite, arraste imagem ou anexe PDF' },
            { id: 'pagamentos-agendados', label: 'Pagamentos Agendados', icon: CalendarClock, description: 'Acompanhe pagamentos programados e comprovantes' },
        ],
    },
    {
        id: 'antecipacoes-root',
        label: "Antecipação",
        icon: TrendingUp,
        subItems: [
            { id: 'antecipacoes-lista', label: 'Minhas antecipações', icon: History },
            { id: 'antecipacoes-solicitar', label: 'Antecipar recebimento', icon: TrendingUp },
            { id: 'antecipacoes-automatica', label: 'Antecipação automática', icon: Repeat },
        ],
    },
    {
        id: 'transfers-root',
        label: "Transferências",
        icon: Send,
        subItems: [
            { id: 'pix-transferir', label: 'Transferir via Pix', icon: Send, tag: 'Grátis', description: 'Envie dinheiro para uma chave Pix' },
        ],
    },
    {
        id: 'withdrawals-root',
        label: "Saques",
        icon: ArrowDownLeft,
        subItems: [
            { id: 'transferencias', label: 'Saques', icon: Send },
        ],
    },
    {
        id: 'chargebacks-root',
        label: "Chargebacks",
        icon: Activity,
        subItems: [
            { id: 'cobrancas-chargebacks', label: 'Chargebacks', icon: Activity },
        ],
    },
    {
        id: 'fiscal-root',
        label: "NFS-e",
        icon: FileText,
        subItems: [
            { id: 'fiscal-dados', label: 'Dados Fiscais', icon: Landmark },
            { id: 'fiscal-nova', label: 'Emitir nova nota fiscal', icon: PlusCircle, tag: 'Em breve' },
            { id: 'fiscal-lista', label: 'Minhas Notas Fiscais', icon: FileCheck },
        ],
    },
    {
        id: 'tarifas-root',
        label: "Tarifas",
        icon: Receipt,
        subItems: [
            { id: 'tarifas', label: 'Custos e prazos', icon: Receipt },
        ],
    },
    {
        id: 'bank-settings-root',
        label: "Ajustes",
        icon: Landmark,
        subItems: [
            { id: 'contas-bancarias', label: 'Conta bancária', icon: Landmark },
            { id: 'saude-conta', label: 'Saúde da conta', icon: ShieldCheck },
        ],
    },
];

const DesktopFinanceiro = () => {
    const {
        syncAccount,
        isLoading: isLoadingConnect,
        refetch: refetchStatus,
        isConnected,
        needsInitialOnboarding
    } = useFinancialAccount();

    const { data: transactions, isLoading: isLoadingTransactions } = useTransactions(subMonths(new Date(), 3));
    const { data: nbStatement, isLoading: isNbStatementLoading } = useNeuroFinanceStatement(subDays(new Date(), 30), new Date());
    const { data: nbFutureDetails, isLoading: isNbFutureLoading } = useNeuroFinanceBalanceDetails("futuro");
    const { isLoading: isLoadingSettings } = useFinancialSettings();

    const [activeView, setActiveView] = useState<FinanceView>('conta-digital');
    const [extratoTab, setExtratoTab] = useState<'realizado' | 'futuro' | 'assinaturas'>('realizado');
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [expandedGroups, setExpandedGroups] = useState<string[]>(['account-balance-root']);
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
    const [showSidebarDetails, setShowSidebarDetails] = useState(false);
    const [onboardingStep, setOnboardingStep] = useState<'welcome' | 'wizard'>('welcome');
    const sidebarIntentTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const sidebarDetailsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const allTransactions = useMemo(() => {
        const merged = [...(transactions || [])];
        if (nbStatement) {
            nbStatement.forEach((nb: Transaction) => {
                if (!merged.find(m => m.id === nb.id || m.external_reference === nb.id)) {
                    merged.push(nb);
                }
            });
        }
        return merged;
    }, [transactions, nbStatement]);

    const realizedTransactions = useMemo(() =>
        allTransactions.filter(t => !isAfter(new Date(t.date), new Date()) && t.status === 'completed'),
        [allTransactions]);

    const futureTransactions = useMemo(() => {
        const merged = new Map<string, Transaction>();

        [...allTransactions, ...(nbFutureDetails || [])].forEach((transaction) => {
            const key = transaction.external_reference || transaction.id;
            if (!merged.has(key)) merged.set(key, transaction);
        });

        return Array.from(merged.values())
            .filter(t => isAfter(new Date(t.date), new Date()) || t.status === 'pending')
            .sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime());
    }, [allTransactions, nbFutureDetails]);

    const subscriptionTransactions = useMemo(() =>
        allTransactions.filter(t => t.description?.toLowerCase().includes('assinatura') || t.category === 'recurring'),
        [allTransactions]);

    useEffect(() => {
        const group = FINANCE_NAV.find(g =>
            g.subItems?.some(s =>
                s.id === activeView || s.subItems?.some(ss => ss.id === activeView)
            )
        );
        if (group) {
            setExpandedGroups((current) => current.includes(group.id) ? current : [group.id]);
        }
    }, [activeView]);

    useEffect(() => () => {
        if (sidebarIntentTimer.current) clearTimeout(sidebarIntentTimer.current);
        if (sidebarDetailsTimer.current) clearTimeout(sidebarDetailsTimer.current);
    }, []);

    useEffect(() => {
        if (sidebarDetailsTimer.current) clearTimeout(sidebarDetailsTimer.current);
        sidebarDetailsTimer.current = setTimeout(
            () => setShowSidebarDetails(isSidebarExpanded),
            isSidebarExpanded ? 35 : 170,
        );
    }, [isSidebarExpanded]);

    const setSidebarExpandedWithIntent = (expanded: boolean) => {
        if (sidebarIntentTimer.current) clearTimeout(sidebarIntentTimer.current);
        sidebarIntentTimer.current = setTimeout(
            () => setIsSidebarExpanded(expanded),
            expanded ? 55 : 130,
        );
    };

    const handleGroupClick = (group: NavItem) => {
        if (!isSidebarExpanded) {
            setExpandedGroups([group.id]);
            if (group.subItems && group.subItems.length > 0) {
                setActiveView(group.subItems[0].id);
            }
            return;
        }

        const isCurrentlyExpanded = expandedGroups.includes(group.id);
        if (isCurrentlyExpanded) {
            setExpandedGroups([]);
        } else {
            setExpandedGroups([group.id]);
            if (group.subItems && group.subItems.length > 0) {
                setActiveView(group.subItems[0].id);
            }
        }
    };

    // Mostra o dashboard mesmo com pendências menores, mas trava funções críticas
    const showMainDashboard = isConnected || !needsInitialOnboarding;

    const motionProps = {
        initial: { opacity: 0, x: 20, filter: "blur(10px)" },
        animate: { opacity: 1, x: 0, filter: "blur(0px)" },
        exit: { opacity: 0, x: -20, filter: "blur(10px)" },
        transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] as const }
    };

    if (isLoadingConnect || isLoadingSettings) {
        return (
            <div className="h-screen w-screen flex flex-col justify-center items-center font-sans bg-zinc-50 dark:bg-zinc-950">
                <Loader2 className="h-10 w-10 animate-spin text-zinc-300 dark:text-zinc-700" />
            </div>
        );
    }

    if (!showMainDashboard) {
        return (
            <div className="h-screen w-screen bg-background overflow-hidden relative font-sans">
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
                            className="relative z-10 flex flex-col items-center justify-center h-full px-6"
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                className="flex flex-col items-center text-center max-w-lg"
                            >
                                <div className="w-20 h-20 rounded-[24px] bg-foreground text-background flex items-center justify-center mb-8 shadow-2xl">
                                    <Sparkles className="w-9 h-9" />
                                </div>

                                <h1 className="text-4xl md:text-5xl font-black tracking-[-0.04em] text-foreground mb-4 uppercase">
                                    Bem-vindo ao NeuroFinance
                                </h1>
                                <p className="text-base text-muted-foreground font-medium leading-relaxed max-w-md mb-10">
                                    Sua conta bancária integrada.
                                    {isConnected ? " Sua conta já foi criada! Finalize as pendências para liberar todas as funções." : " Ative sua conta digital para emitir faturas profissionais e receber via PIX ou Cartão."}
                                </p>

                                <button
                                    onClick={() => setOnboardingStep('wizard')}
                                    className="h-16 px-12 rounded-2xl bg-foreground text-background font-black text-[11px] uppercase tracking-[0.3em] shadow-xl hover:opacity-90 transition-all active:scale-[0.98] flex items-center gap-3"
                                >
                                    {isConnected ? "Concluir Onboarding" : "Começar agora"}
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </motion.div>

                            <div className="absolute bottom-8 left-0 right-0 flex justify-center">
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
                            className="relative z-10 h-full w-full"
                        >
                            <div className="w-full h-full">
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
            </div>
        );
    }



    return (
        <div className="min-h-screen w-full flex flex-col font-sans relative bg-background text-foreground selection:bg-primary/20 pt-10">
            <div className="pointer-events-none fixed inset-0 z-0 premium-noise opacity-[0.025] mix-blend-overlay dark:opacity-[0.05]" />

            <div className="flex-1 w-full max-w-[2200px] mx-auto px-6 md:px-8 lg:px-12 xl:px-16 relative z-10 flex gap-6 pb-12">
                <motion.nav
                    initial={{ opacity: 0, x: -18 }}
                    animate={{ opacity: 1, x: 0, width: isSidebarExpanded ? 302 : 88 }}
                    transition={{
                        width: { type: "spring", stiffness: 420, damping: 42, mass: 0.58 },
                        opacity: { duration: 0.18 },
                        x: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
                    }}
                    onMouseEnter={() => setSidebarExpandedWithIntent(true)}
                    onMouseLeave={() => setSidebarExpandedWithIntent(false)}
                    style={{ willChange: "width, transform" }}
                    className="relative z-30 hidden shrink-0 lg:flex"
                >
                    <div className="sticky top-10 flex max-h-[calc(100vh-5rem)] w-full flex-col overflow-hidden rounded-[30px] border border-zinc-200/75 bg-white/85 p-3 shadow-[0_24px_74px_-54px_rgba(0,0,0,0.78),inset_0_1px_0_rgba(255,255,255,0.85)] ring-1 ring-black/[0.025] backdrop-blur-xl dark:border-white/[0.075] dark:bg-[#070708]/85 dark:shadow-[0_28px_86px_-58px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.055)] dark:ring-white/[0.035]">
                        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,.55),transparent_28%),radial-gradient(circle_at_0%_0%,rgba(255,255,255,.55),transparent_34%),radial-gradient(circle_at_100%_100%,rgba(0,0,0,.04),transparent_42%)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,.055),transparent_30%),radial-gradient(circle_at_0%_0%,rgba(255,255,255,.075),transparent_38%)]" />
                        <div className="premium-noise pointer-events-none absolute inset-0 opacity-[0.014] dark:opacity-[0.04]" />
                        <div className={cn(
                            "relative z-10 flex flex-col gap-2 overflow-y-auto overflow-x-hidden no-scrollbar",
                            showSidebarDetails ? "pr-1" : "items-center pr-0"
                        )}>
                            {FINANCE_NAV.map((group) => {
                                const isGroupExpanded = expandedGroups.includes(group.id);
                                const hasActiveSub = group.subItems?.some(s => s.id === activeView || s.subItems?.some(ss => ss.id === activeView));

                                return (
                                    <div key={group.id} className="flex flex-col gap-1 rounded-[22px]">
                                        <button
                                            onClick={() => handleGroupClick(group)}
                                            title={group.label}
                                            className={cn(
                                                "group relative flex h-12 items-center rounded-2xl transition-colors duration-200 ease-out",
                                                showSidebarDetails ? "w-full gap-3 px-3" : "w-14 justify-center px-0",
                                                hasActiveSub
                                                    ? "bg-zinc-950 text-white shadow-[0_16px_38px_-26px_rgba(0,0,0,0.9)] dark:bg-white dark:text-zinc-950"
                                                    : "text-zinc-500 hover:text-zinc-950 hover:bg-zinc-950/[0.045] dark:text-zinc-500 dark:hover:text-white dark:hover:bg-white/[0.055]"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-9 h-9 shrink-0 flex items-center justify-center rounded-xl transition-all",
                                                hasActiveSub ? "bg-white/14 dark:bg-black/10" : "bg-white/55 dark:bg-white/[0.035] border border-black/[0.035] dark:border-white/[0.055]"
                                            )}>
                                                <group.icon className="w-5 h-5" />
                                            </div>

                                            <AnimatePresence initial={false}>
                                                {showSidebarDetails ? (
                                                    <motion.div
                                                        initial={{ opacity: 0, x: -5 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: -4 }}
                                                        transition={{ duration: 0.12, ease: [0.22, 1, 0.36, 1] }}
                                                        className="flex min-w-0 flex-1 items-center justify-between overflow-hidden"
                                                    >
                                                        <span className="truncate text-[10px] font-black uppercase tracking-[0.15em]">
                                                            {group.label}
                                                        </span>
                                                        <ChevronRight className={cn(
                                                            "w-3.5 h-3.5 opacity-55 transition-transform duration-300",
                                                            isGroupExpanded && "rotate-90"
                                                        )} />
                                                    </motion.div>
                                                ) : null}
                                            </AnimatePresence>
                                        </button>

                                        <AnimatePresence>
                                            {showSidebarDetails && isGroupExpanded && group.subItems && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: showSidebarDetails ? 0.22 : 0.08, ease: [0.22, 1, 0.36, 1] }}
                                                    className="overflow-hidden flex flex-col gap-1 px-1 pb-1"
                                                >
                                                    {group.subItems.map((sub) => {
                                                        const isSubActive = activeView === sub.id || sub.subItems?.some(ss => ss.id === activeView);
                                                        return (
                                                            <div key={sub.id} className="space-y-1">
                                                                <button
                                                                    onClick={() => setActiveView(sub.id)}
                                                                    className={cn(
                                                                        "w-full min-h-10 flex items-center gap-3 px-3 py-2 rounded-[15px] transition-all duration-200 group/sub relative",
                                                                        isSubActive
                                                                            ? "bg-zinc-950/[0.075] text-zinc-950 dark:bg-white/[0.09] dark:text-white"
                                                                            : "text-zinc-500 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-950/[0.045] dark:hover:bg-white/[0.055]"
                                                                    )}
                                                                >
                                                                    {isSubActive && <motion.div layoutId="finance-sidebar-active" className="absolute inset-y-2 left-0 w-1 rounded-full bg-zinc-950 dark:bg-white" />}
                                                                    <sub.icon className="w-3.5 h-3.5 shrink-0 transition-colors" />
                                                                    <span className="text-[9px] font-black uppercase tracking-[0.1em] truncate flex-1 text-left leading-tight">
                                                                        {sub.label}
                                                                    </span>
                                                                    {sub.subItems?.length ? (
                                                                        <ChevronRight className={cn("h-3 w-3 opacity-45 transition-transform", isSubActive && "rotate-90")} />
                                                                    ) : null}
                                                                </button>

                                                                <AnimatePresence>
                                                                    {isSubActive && sub.subItems?.length ? (
                                                                        <motion.div
                                                                            initial={{ height: 0, opacity: 0 }}
                                                                            animate={{ height: "auto", opacity: 1 }}
                                                                            exit={{ height: 0, opacity: 0 }}
                                                                            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                                                                            className="overflow-hidden pl-7 pr-1"
                                                                        >
                                                                            <div className="flex flex-col gap-1 border-l border-zinc-200/70 pl-3 dark:border-white/10">
                                                                                {sub.subItems.map((child) => (
                                                                                    <button
                                                                                        key={child.id}
                                                                                        onClick={() => setActiveView(child.id)}
                                                                                        className={cn(
                                                                                            "rounded-xl px-3 py-2 text-left transition-all duration-200",
                                                                                            activeView === child.id
                                                                                                ? "bg-white text-zinc-950 shadow-sm dark:bg-white/[0.10] dark:text-white"
                                                                                                : "text-zinc-500 hover:bg-white/60 hover:text-zinc-950 dark:hover:bg-white/[0.055] dark:hover:text-white"
                                                                                        )}
                                                                                    >
                                                                                        <div className="flex items-center gap-2">
                                                                                            <span className="min-w-0 flex-1 truncate text-[8.5px] font-black uppercase tracking-[0.08em]">{child.label}</span>
                                                                                            {child.tag && <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[7px] font-black uppercase text-emerald-600 dark:text-emerald-400">{child.tag}</span>}
                                                                                        </div>
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        </motion.div>
                                                                    ) : null}
                                                                </AnimatePresence>
                                                            </div>
                                                        );
                                                    })}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </motion.nav>

                <div className="flex-1 rounded-[40px] bg-white/30 dark:bg-zinc-900/10 backdrop-blur-sm border border-zinc-200/30 dark:border-white/[0.02] shadow-sm relative">
                    <AnimatePresence mode="wait">
                        <FinanceiroMainContent
                            selectedTransaction={selectedTransaction}
                            setSelectedTransaction={setSelectedTransaction}
                            activeView={activeView}
                            setActiveView={setActiveView}
                            allTransactions={allTransactions}
                            isLoadingTransactions={isLoadingTransactions}
                            motionProps={motionProps}
                            extratoTab={extratoTab}
                            setExtratoTab={setExtratoTab}
                            realizedTransactions={realizedTransactions}
                            futureTransactions={futureTransactions}
                            subscriptionTransactions={subscriptionTransactions}
                            isNbStatementLoading={isNbStatementLoading || isNbFutureLoading}
                        />
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default DesktopFinanceiro;
