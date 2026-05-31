"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
    History
} from "lucide-react";

import { useFinancialMetrics } from "@/hooks/use-financial-metrics";
import { useTransactions } from "@/hooks/use-transactions";
import { useFinancialSettings } from "@/hooks/use-financial-settings";
import { useFinancialAccount } from "@/hooks/use-financial-account";
import { useNeuroFinanceStatement } from "@/hooks/use-neurofinance-statement";
import { subMonths, subDays, isAfter } from "date-fns";

import { CustomOnboardingFlow } from "@/components/financeiro/CustomOnboardingFlow";
import { AsaasRegulatoryFooter } from "@/components/financeiro/AsaasRegulatoryFooter";
import { NeuroFinanceVerificationModal } from "@/components/financeiro/NeuroFinanceVerificationModal";
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
        disabled?: boolean;
    }[];
    disabled?: boolean;
}

const FINANCE_NAV: NavItem[] = [
    {
        id: 'neurofinance',
        label: "NeuroFinance",
        icon: Landmark,
        subItems: [
            { id: 'conta-digital', label: 'Visão Geral', icon: CreditCard },
            { id: 'transferencias', label: 'Saque', icon: Send },
            {
                id: 'pagamentos',
                label: 'Pagamentos',
                icon: Receipt,
                disabled: true,
                subItems: [
                    { id: 'pagamentos-agendar', label: 'Agendar Pagamentos', icon: Calendar, description: 'Agende boletos e Pix para aprovação' },
                    { id: 'pagamentos-dda', label: 'Consulta DDA', icon: Barcode, description: 'Boletos pendentes no DDA' },
                    { id: 'pagamentos-grupos', label: 'Meus Grupos', icon: FolderOpen, description: 'Acompanhe seus grupos de pagamentos' },
                ]
            },
            { id: 'contas-bancarias', label: 'Conta Bancária', icon: Landmark },
            { id: 'extrato', label: 'Extrato Detalhado', icon: FileText },
            { id: 'cartoes', label: 'Cartões', icon: CreditCard },
            {
                id: 'pix',
                label: 'Área Pix',
                icon: BadgeCent,
                disabled: true,
                subItems: [
                    { id: 'pix-pagar', label: 'Pagar Pix Copia e Cola', icon: QrCode, tag: 'Grátis', description: 'Faça pagamentos de forma fácil e rápida' },
                    { id: 'pix-transferir', label: 'Transferir', icon: Send, tag: 'Grátis', description: 'Transferências gratuitas e ilimitadas' },
                    { id: 'pix-qrcode', label: 'Gerar QR Code', icon: QrCode, tag: 'Grátis', description: 'Gere um QR Code e receba na hora' },
                    { id: 'pix-receber', label: 'Receber', icon: ArrowDownLeft, tag: 'Grátis', description: 'Receba valores como e quando quiser' },
                    { id: 'pix-chaves', label: 'Minhas chaves', icon: Key, description: 'Cadastre e gerencie suas chaves Pix' },
                    { id: 'pix-salarios', label: 'Pagar salários via Pix', icon: Users, tag: 'Grátis', description: 'Pagamentos dos seus funcionários via envio de arquivos com a praticidade do Pix' },
                    { id: 'pix-limites', label: 'Limites para transações', icon: ShieldCheck, tag: 'No App', description: 'Configure seus limites de acordo com a sua necessidade' },
                ]
            },
        ],
    },
    {
        id: 'receitas-root',
        label: "Receitas",
        icon: ArrowUpRight,
        subItems: [
            { id: 'receitas', label: 'Entradas Confirmadas', icon: ArrowUpRight },
            { id: 'cobrancas-historia', label: 'Gerenciador de Faturas', icon: History },
            { id: 'cobrancas-config', label: 'Regras por Cliente', icon: Settings },
        ],
    },
    {
        id: 'despesas-root',
        label: "Despesas",
        icon: ArrowDownLeft,
        subItems: [
            { id: 'despesas', label: 'Saídas Confirmadas', icon: ArrowDownLeft },
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
        label: "Gestão & Analise",
        icon: PieChart,
        subItems: [
            { id: 'fluxo-caixa', label: 'Fluxo de Caixa', icon: TrendingUp },
            { id: 'repasses-profissional', label: 'Split & Repasses', icon: Users },
        ]
    },
    {
        id: 'config-root',
        label: "Avançado",
        icon: Settings,
        subItems: [
            { id: 'configuracoes', label: 'Preferências', icon: Settings },
        ]
    }
];


const DesktopFinanceiro = () => {
    const {
        syncAccount,
        isLoading: isLoadingConnect,
        refetch: refetchStatus,
        isConnected,
        isApproved,
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
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [selectedRequirement, setSelectedRequirement] = useState<string | null>(null);
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

    const handleOpenModal = useCallback((open: boolean) => {
        setShowUpdateModal(open);
        if (open) {
            refetchStatus();
        }
    }, [refetchStatus]);

    const handleGroupClick = (group: NavItem) => {
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

    // Lógica para mostrar dashboard mesmo com pendências menores, mas travar funções críticas
    const showMainDashboard = isConnected || !needsInitialOnboarding;

    const activeSubWithChildren = FINANCE_NAV
        .flatMap(g => g.subItems || [])
        .find(s =>
            (s.id === activeView || s.subItems?.some(ss => ss.id === activeView)) &&
            s.subItems && s.subItems.length > 0
        );

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
                    onHoverStart={() => setIsSidebarExpanded(true)}
                    onHoverEnd={() => setIsSidebarExpanded(false)}
                    animate={{
                        width: isSidebarExpanded ? 280 : 80,
                        transition: { type: "spring", stiffness: 350, damping: 35 }
                    }}
                    className="hidden lg:flex shrink-0 relative z-[70]"
                >
                    <div className="w-full sticky top-10 h-fit bg-white/70 dark:bg-black/50 backdrop-blur-3xl border border-zinc-200/80 dark:border-white/[0.08] rounded-[32px] shadow-2xl flex flex-col p-3 overflow-hidden">
                        <div className="flex flex-col gap-2">
                            {FINANCE_NAV.map((group) => {
                                const isGroupExpanded = expandedGroups.includes(group.id);
                                const hasActiveSub = group.subItems?.some(s => s.id === activeView);

                                return (
                                    <div key={group.id} className="flex flex-col gap-1">
                                        <button
                                            onClick={() => handleGroupClick(group)}
                                            className={cn(
                                                "w-full h-12 flex items-center gap-3 rounded-2xl transition-all duration-300 group relative",
                                                isSidebarExpanded ? "px-3" : "justify-center",
                                                hasActiveSub && !isGroupExpanded ? "bg-zinc-900/5 dark:bg-white/5" : "hover:bg-zinc-900/5 dark:hover:bg-white/5"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-10 h-10 shrink-0 flex items-center justify-center rounded-xl transition-all",
                                                hasActiveSub ? "bg-zinc-900 dark:bg-white text-white dark:text-black shadow-lg" : "text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white"
                                            )}>
                                                <group.icon className="w-5 h-5" />
                                            </div>

                                            <AnimatePresence>
                                                {isSidebarExpanded && (
                                                    <motion.div
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: -10 }}
                                                        className="flex-1 flex items-center justify-between min-w-0"
                                                    >
                                                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-900 dark:text-white truncate">
                                                            {group.label}
                                                        </span>
                                                        <ChevronRight className={cn(
                                                            "w-3 h-3 text-zinc-400 transition-transform duration-300",
                                                            isGroupExpanded && "rotate-90"
                                                        )} />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </button>

                                        <AnimatePresence>
                                            {isGroupExpanded && isSidebarExpanded && group.subItems && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden flex flex-col gap-1 pl-12 pr-2"
                                                >
                                                    {group.subItems.map((sub) => {
                                                        const isSubActive = activeView === sub.id || sub.subItems?.some(ss => ss.id === activeView);
                                                        return (
                                                            <button
                                                                key={sub.id}
                                                                onClick={() => !sub.disabled && setActiveView(sub.id)}
                                                                disabled={sub.disabled}
                                                                title={sub.disabled ? "Em desenvolvimento, em breve você receberá novidades!" : undefined}
                                                                className={cn(
                                                                    "w-full h-10 flex items-center gap-3 px-4 rounded-xl transition-all duration-200 group/sub relative",
                                                                    isSubActive
                                                                        ? "bg-zinc-900/10 dark:bg-white/10 text-zinc-900 dark:text-white"
                                                                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-900/5 dark:hover:bg-white/5",
                                                                    sub.disabled && "opacity-40 cursor-not-allowed hover:bg-transparent dark:hover:bg-transparent hover:text-zinc-500 dark:hover:text-zinc-500"
                                                                )}
                                                            >
                                                                <sub.icon className={cn(
                                                                    "w-3.5 h-3.5 shrink-0 transition-colors",
                                                                    isSubActive ? "text-zinc-900 dark:text-white" : "text-zinc-400 group-hover/sub:text-zinc-900 dark:group-hover/sub:text-white"
                                                                )} />
                                                                <span className="text-[9px] font-bold uppercase tracking-wider truncate flex-1 text-left">
                                                                    {sub.label}
                                                                </span>
                                                            </button>
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

                <AnimatePresence>
                    {activeSubWithChildren && (
                        <motion.aside
                            initial={{ width: 0, opacity: 0, x: -20 }}
                            animate={{ width: 260, opacity: 1, x: 0 }}
                            exit={{ width: 0, opacity: 0, x: -20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="hidden xl:flex shrink-0 relative z-[60]"
                        >
                            <div className="w-full sticky top-10 h-fit bg-white/40 dark:bg-white/[0.02] backdrop-blur-3xl border border-zinc-200/50 dark:border-white/[0.05] rounded-[32px] shadow-xl p-5 flex flex-col gap-6 overflow-hidden">
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center gap-3 px-2 mb-2">
                                        <div className="w-8 h-8 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-black flex items-center justify-center shadow-lg">
                                            <activeSubWithChildren.icon className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-white">{activeSubWithChildren.label}</span>
                                            <span className="text-[7px] font-black text-zinc-400 uppercase tracking-widest">Opções Avançadas</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        {activeSubWithChildren.subItems?.map((child) => (
                                            <button
                                                key={child.id}
                                                onClick={() => setActiveView(child.id)}
                                                className={cn(
                                                    "w-full p-4 flex flex-col items-start gap-1 rounded-[20px] transition-all duration-300 group/child text-left relative overflow-hidden",
                                                    activeView === child.id ? "bg-white dark:bg-white/10 shadow-lg border border-zinc-200/50 dark:border-white/10" : "hover:bg-white/50 dark:hover:bg-white/[0.05]"
                                                )}
                                            >
                                                <div className="flex items-center gap-2 w-full relative z-10">
                                                    <span className={cn("text-[9px] font-black uppercase tracking-tight flex-1", activeView === child.id ? "text-zinc-900 dark:text-white" : "text-zinc-500 group-hover:text-zinc-900")}>{child.label}</span>
                                                    {child.tag && <span className="text-[7px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">{child.tag}</span>}
                                                </div>
                                                {child.description && <p className="text-[8px] font-medium text-zinc-400 leading-relaxed">{child.description}</p>}
                                                {activeView === child.id && <motion.div layoutId="active-pill" className="absolute inset-y-0 left-0 w-1 bg-zinc-900 dark:bg-white rounded-full" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>

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
                            isConnected={isConnected}
                            handleOpenModal={handleOpenModal}
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

            <NeuroFinanceVerificationModal
                open={showUpdateModal}
                onOpenChange={handleOpenModal}
                selectedRequirement={selectedRequirement}
                setSelectedRequirement={setSelectedRequirement}
                onSuccess={() => { syncAccount.mutate(); setSelectedRequirement(null); }}
            />
        </div>
    );
};

export default DesktopFinanceiro;