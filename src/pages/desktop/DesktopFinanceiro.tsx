"use client";

import { useState, useEffect, useMemo } from "react";
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
    LayoutDashboard,
    Users,
    Settings,
    BadgeCent,
    Send,
    FileCheck,
    Barcode,
    FolderOpen,
    CreditCard,
    ArrowDownLeft,
    Calendar,
    ArrowUpRight,
    PieChart,
    ChevronRight,
    ArrowRight,
    Sparkles,
    History,
    Repeat,
    WalletCards
} from "lucide-react";

import { useFinancialMetrics } from "@/hooks/use-financial-metrics";
import { useTransactions } from "@/hooks/use-transactions";
import { useFinancialSettings } from "@/hooks/use-financial-settings";
import { useFinancialAccount } from "@/hooks/use-financial-account";
import { useNeuroFinanceStatement } from "@/hooks/use-neurofinance-statement";
import { subMonths, subDays, isAfter } from "date-fns";

import { CustomOnboardingFlow } from "@/components/financeiro/CustomOnboardingFlow";
import { AsaasRegulatoryFooter } from "@/components/financeiro/AsaasRegulatoryFooter";
import { FinanceiroMainContent, FinanceView } from "@/components/financeiro/FinanceiroMainContent";
import { Transaction } from "@/types";

interface NavItem {
    id: string;
    label: string;
    icon: any;
    subItems?: {
        id: FinanceView;
        label: string;
        icon: any;
        tag?: string;
        description?: string;
        subItems?: any[];
    }[];
}

const FINANCE_NAV: NavItem[] = [
    {
        id: 'neurofinance',
        label: "NeuroFinance",
        icon: Landmark,
        subItems: [
            { id: 'conta-digital', label: 'Vis?o Geral', icon: CreditCard },
            {
                id: 'pix',
                label: '?rea Pix',
                icon: BadgeCent,
                subItems: [
                    { id: 'pix-pagar', label: 'Pagar Pix', icon: QrCode, tag: 'Gr?tis', description: 'Cole um Pix copia e cola e pague pela conta NeuroFinance' },
                    { id: 'pix-transferir', label: 'Transferir por Pix', icon: Send, tag: 'Gr?tis', description: 'Envie dinheiro para uma chave Pix' },
                    { id: 'pix-qrcode', label: 'Gerar QR Code', icon: QrCode, tag: 'Gr?tis', description: 'Crie um QR Code para receber na hora' },
                    { id: 'pix-receber', label: 'Pix recebidos', icon: ArrowDownLeft, tag: 'Gr?tis', description: 'Veja o que entrou por Pix' },
                    { id: 'pix-chaves', label: 'Minhas chaves', icon: Key, description: 'Cadastre e gerencie suas chaves Pix' },
                    { id: 'pix-salarios', label: 'Pagar sal?rios', icon: Users, tag: 'Gr?tis', description: 'Envie Pix em lote para sua equipe' },
                    { id: 'pix-limites', label: 'Limites do Pix', icon: ShieldCheck, tag: 'No App', description: 'Ajuste limites de seguran?a da conta' },
                ]
            },
            { id: 'transferencias', label: 'Saque', icon: Send },
            {
                id: 'pagamentos',
                label: 'Pagamentos',
                icon: Receipt,
                subItems: [
                    { id: 'pagamentos-boletos', label: 'Pagar boletos', icon: Barcode, description: 'Digite, arraste imagem ou anexe PDF' },
                    { id: 'pagamentos-pix', label: 'Pagar Pix', icon: QrCode, description: 'Pague com Pix copia e cola' },
                    { id: 'pagamentos-grupos', label: 'Pagamentos em lote', icon: FolderOpen, description: 'Acompanhe grupos de pagamentos' },
                ]
            },
            { id: 'contas-bancarias', label: 'Conta banc?ria', icon: Landmark },
            { id: 'extrato', label: 'Extrato Detalhado', icon: FileText },
        ],
    },
    {
        id: 'cobrancas-root',
        label: "Cobran?as",
        icon: WalletCards,
        subItems: [
            { id: 'cobrancas-historia', label: 'Todas as cobran?as', icon: History },
            { id: 'cobrancas-simulador', label: 'Simulador de vendas', icon: BadgeCent },
            { id: 'cobrancas-chargebacks', label: 'Chargebacks', icon: Activity },
            { id: 'cobrancas-config', label: 'Regras autom?ticas', icon: Settings },
        ],
    },
    {
        id: 'antecipacoes-root',
        label: "Antecipa??es",
        icon: TrendingUp,
        subItems: [
            { id: 'antecipacoes-lista', label: 'Minhas antecipa??es', icon: History },
            { id: 'antecipacoes-solicitar', label: 'Antecipar recebimento', icon: TrendingUp },
            { id: 'antecipacoes-automatica', label: 'Antecipa??o autom?tica', icon: Repeat },
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
            { id: 'despesas', label: 'Sa?das Confirmadas', icon: ArrowDownLeft },
        ]
    },
    {
        id: 'fiscal-root',
        label: "NFS-e",
        icon: FileText,
        subItems: [
            { id: 'fiscal-painel', label: 'Painel Fiscal', icon: LayoutDashboard },
            { id: 'fiscal-lista', label: 'Minhas Notas', icon: FileCheck },
        ],
    },
    {
        id: 'fluxo-caixa-root',
        label: "Gest?o & An?lise",
        icon: PieChart,
        subItems: [
            { id: 'fluxo-caixa', label: 'Fluxo de Caixa', icon: TrendingUp },
            { id: 'repasses-profissional', label: 'Split & Repasses', icon: Users },
        ]
    },
    {
        id: 'tarifas-root',
        label: "Tarifas",
        icon: Receipt,
        subItems: [
            { id: 'tarifas', label: 'Custos e prazos', icon: Receipt },
        ]
    },
    {
        id: 'config-root',
        label: "Avan?ado",
        icon: Settings,
        subItems: [
            { id: 'configuracoes', label: 'Prefer?ncias', icon: Settings },
        ]
    }
];

const DesktopFinanceiro = () => {
    const {
        syncAccount,
        isLoading: isLoadingConnect,
        refetch: refetchStatus,
        isConnected,
        needsInitialOnboarding
    } = useFinancialAccount();

    const { data: metrics } = useFinancialMetrics();
    const { data: transactions, isLoading: isLoadingTransactions } = useTransactions(subMonths(new Date(), 3));
    const { data: nbStatement, isLoading: isNbStatementLoading } = useNeuroFinanceStatement(subDays(new Date(), 30), new Date());
    const { isLoading: isLoadingSettings } = useFinancialSettings();

    const [activeView, setActiveView] = useState<FinanceView>('conta-digital');
    const [extratoTab, setExtratoTab] = useState<'realizado' | 'futuro' | 'assinaturas'>('realizado');
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [expandedGroups, setExpandedGroups] = useState<string[]>(['neurofinance']);
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
    const [onboardingStep, setOnboardingStep] = useState<'welcome' | 'wizard'>('welcome');

    const currentMonthShort = new Date().toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');

    const allTransactions = useMemo(() => {
        const merged = [...(transactions || [])];
        if (nbStatement) {
            nbStatement.forEach(nb => {
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

    const futureTransactions = useMemo(() =>
        allTransactions.filter(t => isAfter(new Date(t.date), new Date()) || t.status === 'pending'),
        [allTransactions]);

    const subscriptionTransactions = useMemo(() =>
        allTransactions.filter(t => t.description?.toLowerCase().includes('assinatura') || t.category === 'recurring'),
        [allTransactions]);

    useEffect(() => {
        const group = FINANCE_NAV.find(g =>
            g.subItems?.some(s =>
                s.id === activeView || s.subItems?.some(ss => ss.id === activeView)
            )
        );
        if (group && !expandedGroups.includes(group.id)) {
            setExpandedGroups([group.id]);
        }
    }, [activeView]);

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
        transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] as any }
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
            <div className="absolute inset-0 premium-noise opacity-[0.03] dark:opacity-[0.06] pointer-events-none fixed z-[100] mix-blend-overlay" />

            <div className="flex-1 w-full max-w-[2200px] mx-auto px-6 md:px-8 lg:px-12 xl:px-16 relative z-10 flex gap-6 pb-12">
                <motion.nav
                    initial={{ opacity: 0, x: -18 }}
                    animate={{ opacity: 1, x: 0, width: isSidebarExpanded ? 302 : 88 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    onMouseEnter={() => setIsSidebarExpanded(true)}
                    onMouseLeave={() => setIsSidebarExpanded(false)}
                    className="hidden lg:flex shrink-0 relative z-[70]"
                >
                    <div className="w-full sticky top-10 max-h-[calc(100vh-5rem)] bg-white/72 dark:bg-[#070708]/72 backdrop-blur-3xl border border-zinc-200/70 dark:border-white/[0.08] rounded-[30px] shadow-[0_24px_90px_-60px_rgba(0,0,0,0.72)] flex flex-col p-3 overflow-hidden">
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(255,255,255,.82),transparent_34%),radial-gradient(circle_at_100%_100%,rgba(0,0,0,.045),transparent_42%)] dark:bg-[radial-gradient(circle_at_0%_0%,rgba(255,255,255,.07),transparent_38%)]" />
                        <div className="premium-noise pointer-events-none absolute inset-0 opacity-[0.018] dark:opacity-[0.045]" />
                        <div className={cn(
                            "relative z-10 flex flex-col gap-2 overflow-y-auto overflow-x-hidden custom-scrollbar",
                            isSidebarExpanded ? "pr-1" : "items-center pr-0"
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
                                                "h-12 flex items-center rounded-2xl transition-all duration-300 group relative",
                                                isSidebarExpanded ? "w-full gap-3 px-3" : "w-14 justify-center px-0",
                                                hasActiveSub
                                                    ? "bg-zinc-950 text-white shadow-[0_14px_34px_-22px_rgba(0,0,0,0.9)] dark:bg-white dark:text-zinc-950"
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
                                                {isSidebarExpanded ? (
                                                    <motion.div
                                                        initial={{ opacity: 0, x: -8, width: 0 }}
                                                        animate={{ opacity: 1, x: 0, width: "auto" }}
                                                        exit={{ opacity: 0, x: -8, width: 0 }}
                                                        transition={{ duration: 0.18 }}
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
                                            {isSidebarExpanded && isGroupExpanded && group.subItems && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
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
                                                                            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
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
                            metrics={metrics}
                            currentMonthShort={currentMonthShort}
                            motionProps={motionProps}
                            extratoTab={extratoTab}
                            setExtratoTab={setExtratoTab}
                            realizedTransactions={realizedTransactions}
                            futureTransactions={futureTransactions}
                            subscriptionTransactions={subscriptionTransactions}
                            isNbStatementLoading={isNbStatementLoading}
                        />
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default DesktopFinanceiro;
