"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import type { ElementType } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
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
    sectionLabel?: string;
    subItems?: NavSubItem[];
}

const BANKING_QUERY_KEYS = ["onboarding", "payment"];

const FINANCE_NAV: NavItem[] = [
    {
        id: 'management-root',
        sectionLabel: 'Gestão Financeira',
        label: "Gestão",
        icon: Landmark,
        subItems: [
            { id: 'gestao-visao-geral', label: 'Visão Geral', icon: Landmark, description: 'Resultado, previsão, recebíveis e pendências do consultório' },
            { id: 'gestao-fluxo-caixa', label: 'Fluxo de Caixa', icon: TrendingUp, description: 'Realizado, previsto, projetado e cenários' },
            { id: 'gestao-receitas', label: 'Receitas', icon: ArrowUpRight, description: 'Entradas confirmadas, ticket médio e fontes de receita' },
            { id: 'gestao-despesas', label: 'Despesas', icon: ArrowDownLeft, description: 'Custos fixos, variáveis e categorias' },
            { id: 'gestao-cobrancas', label: 'Cobranças', icon: WalletCards, description: 'Cobranças abertas, vencidas e recorrentes' },
            { id: 'gestao-inadimplencia', label: 'Inadimplência', icon: Users, description: 'Pacientes, valores em aberto e atrasos' },
            { id: 'gestao-planejamento', label: 'Planejamento', icon: Sparkles, description: 'Metas, ponto de equilíbrio e previsibilidade' },
            { id: 'gestao-relatorios', label: 'Relatórios', icon: FileText, description: 'DRE simplificada, fluxo e resumo para contador' },
        ],
    },
    { id: 'account-balance-root', sectionLabel: 'NeuroFinance', label: "Conta e Saldo", icon: CreditCard, subItems: [{ id: 'conta-digital', label: 'Conta e Saldo', icon: CreditCard }] },
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
    { id: 'statement-root', label: "Extrato da conta", icon: FileText, subItems: [{ id: 'extrato', label: 'Extrato da conta', icon: FileText }] },
    { id: 'cobrancas-root', label: "Cobranças bancárias", icon: WalletCards, subItems: [{ id: 'cobrancas-historia', label: 'Todas as cobranças', icon: History }, { id: 'cobrancas-simulador', label: 'Simulador de vendas', icon: BadgeCent }, { id: 'cobrancas-config', label: 'Regras automáticas', icon: Settings }] },
    { id: 'pagamentos-root', label: "Pagamentos", icon: Receipt, subItems: [{ id: 'pagamentos-boletos', label: 'Pagar boletos', icon: Barcode, description: 'Digite, arraste imagem ou anexe PDF' }, { id: 'pagamentos-agendados', label: 'Pagamentos Agendados', icon: CalendarClock, description: 'Acompanhe pagamentos programados e comprovantes' }] },
    { id: 'antecipacoes-root', label: "Antecipação", icon: TrendingUp, subItems: [{ id: 'antecipacoes-lista', label: 'Minhas antecipações', icon: History }, { id: 'antecipacoes-solicitar', label: 'Antecipar recebimento', icon: TrendingUp }, { id: 'antecipacoes-automatica', label: 'Antecipação automática', icon: Repeat }] },
    { id: 'transfers-root', label: "Transferências", icon: Send, subItems: [{ id: 'pix-transferir', label: 'Transferir via Pix', icon: Send, tag: 'Grátis', description: 'Envie dinheiro para uma chave Pix' }] },
    {
        id: 'withdrawals-root',
        label: "Saques",
        icon: ArrowDownLeft,
        subItems: [
            { id: 'transferencias', label: 'Saques', icon: Send },
            { id: 'contas-bancarias', label: 'Conta Bancária e Pix', icon: Landmark },
        ],
    },
    { id: 'chargebacks-root', label: "Chargebacks", icon: Activity, subItems: [{ id: 'cobrancas-chargebacks', label: 'Chargebacks', icon: Activity }] },
    { id: 'fiscal-root', label: "NFS-e", icon: FileText, subItems: [{ id: 'fiscal-dados', label: 'Dados Fiscais', icon: Landmark }, { id: 'fiscal-nova', label: 'Emitir nova nota fiscal', icon: PlusCircle, tag: 'Em breve' }, { id: 'fiscal-lista', label: 'Minhas Notas Fiscais', icon: FileCheck }] },
    { id: 'tarifas-root', label: "Tarifas", icon: Receipt, subItems: [{ id: 'tarifas', label: 'Custos e prazos', icon: Receipt }] },
    { id: 'bank-settings-root', label: "Ajustes", icon: Settings, subItems: [{ id: 'saude-conta', label: 'Saúde da conta', icon: ShieldCheck }] },
];

const SIDEBAR_COLLAPSED_WIDTH = 88;
const SIDEBAR_EXPANDED_WIDTH = 318;
const SIDEBAR_EASE = [0.22, 1, 0.36, 1] as const;
const SIDEBAR_ENTER_DELAY = 45;
const SIDEBAR_LEAVE_DELAY = 180;
const SIDEBAR_DETAILS_REVEAL_DELAY = 70;
const SIDEBAR_DETAILS_RECOVER_DELAY = 20;
const SIDEBAR_WIDTH_COLLAPSE_DELAY = 160;
const SIDEBAR_WIDTH_TRANSITION = { type: "spring", stiffness: 330, damping: 38, mass: 0.76 } as const;

const getInitialFinanceView = (pathname: string, search: string): FinanceView => {
    const searchParams = new URLSearchParams(search);
    const shouldOpenNeuroFinance = pathname.includes('/neurofinance') || BANKING_QUERY_KEYS.some((key) => searchParams.has(key));
    return shouldOpenNeuroFinance ? 'conta-digital' : 'gestao-visao-geral';
};

const DesktopFinanceiro = () => {
    const location = useLocation();
    const shouldReduceSidebarMotion = useReducedMotion();
    const { isLoading: isLoadingConnect } = useFinancialAccount();
    const { data: transactions, isLoading: isLoadingTransactions } = useTransactions(subMonths(new Date(), 3));
    const { data: nbStatement, isLoading: isNbStatementLoading } = useNeuroFinanceStatement(subDays(new Date(), 30), new Date());
    const { data: nbFutureDetails, isLoading: isNbFutureLoading } = useNeuroFinanceBalanceDetails("futuro");
    const { isLoading: isLoadingSettings } = useFinancialSettings();

    const [activeView, setActiveView] = useState<FinanceView>(() => getInitialFinanceView(location.pathname, location.search));
    const [extratoTab, setExtratoTab] = useState<'realizado' | 'futuro' | 'assinaturas'>('realizado');
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [expandedGroups, setExpandedGroups] = useState<string[]>([getInitialFinanceView(location.pathname, location.search) === 'conta-digital' ? 'account-balance-root' : 'management-root']);
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
    const [showSidebarDetails, setShowSidebarDetails] = useState(false);
    const sidebarIntentTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const sidebarDetailsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const sidebarWidthTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const allTransactions = useMemo(() => {
        const merged = [...(transactions || [])];
        if (nbStatement) {
            nbStatement.forEach((nb: Transaction) => {
                if (!merged.find(m => m.id === nb.id || m.external_reference === nb.id)) merged.push(nb);
            });
        }
        return merged;
    }, [transactions, nbStatement]);

    const realizedTransactions = useMemo(() => allTransactions.filter(t => !isAfter(new Date(t.date), new Date()) && t.status === 'completed'), [allTransactions]);
    const futureTransactions = useMemo(() => {
        const merged = new Map<string, Transaction>();
        [...allTransactions, ...(nbFutureDetails || [])].forEach((transaction) => {
            const key = transaction.external_reference || transaction.id;
            if (!merged.has(key)) merged.set(key, transaction);
        });
        return Array.from(merged.values()).filter(t => isAfter(new Date(t.date), new Date()) || t.status === 'pending').sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime());
    }, [allTransactions, nbFutureDetails]);
    const subscriptionTransactions = useMemo(() => allTransactions.filter(t => t.description?.toLowerCase().includes('assinatura') || t.category === 'recurring'), [allTransactions]);

    useEffect(() => {
        const group = FINANCE_NAV.find(g => g.subItems?.some(s => s.id === activeView || s.subItems?.some(ss => ss.id === activeView)));
        if (group) setExpandedGroups((current) => current.includes(group.id) ? current : [group.id]);
    }, [activeView]);

    const clearSidebarTimers = useCallback(() => {
        if (sidebarIntentTimer.current) {
            clearTimeout(sidebarIntentTimer.current);
            sidebarIntentTimer.current = null;
        }
        if (sidebarDetailsTimer.current) {
            clearTimeout(sidebarDetailsTimer.current);
            sidebarDetailsTimer.current = null;
        }
        if (sidebarWidthTimer.current) {
            clearTimeout(sidebarWidthTimer.current);
            sidebarWidthTimer.current = null;
        }
    }, []);

    useEffect(() => () => clearSidebarTimers(), [clearSidebarTimers]);

    const setSidebarExpandedWithIntent = useCallback((expanded: boolean) => {
        clearSidebarTimers();

        if (shouldReduceSidebarMotion) {
            setShowSidebarDetails(expanded);
            setIsSidebarExpanded(expanded);
            return;
        }

        sidebarIntentTimer.current = setTimeout(() => {
            if (expanded) {
                setIsSidebarExpanded(true);
                sidebarDetailsTimer.current = setTimeout(
                    () => setShowSidebarDetails(true),
                    isSidebarExpanded ? SIDEBAR_DETAILS_RECOVER_DELAY : SIDEBAR_DETAILS_REVEAL_DELAY,
                );
                return;
            }

            setShowSidebarDetails(false);
            sidebarWidthTimer.current = setTimeout(() => setIsSidebarExpanded(false), SIDEBAR_WIDTH_COLLAPSE_DELAY);
        }, expanded ? SIDEBAR_ENTER_DELAY : SIDEBAR_LEAVE_DELAY);
    }, [clearSidebarTimers, isSidebarExpanded, shouldReduceSidebarMotion]);

    const handleGroupClick = (group: NavItem) => {
        if (!showSidebarDetails) {
            setExpandedGroups([group.id]);
            if (group.subItems && group.subItems.length > 0) setActiveView(group.subItems[0].id);
            return;
        }
        const isCurrentlyExpanded = expandedGroups.includes(group.id);
        if (isCurrentlyExpanded) setExpandedGroups([]);
        else {
            setExpandedGroups([group.id]);
            if (group.subItems && group.subItems.length > 0) setActiveView(group.subItems[0].id);
        }
    };

    const sidebarTransition = shouldReduceSidebarMotion ? { duration: 0 } : {
        width: SIDEBAR_WIDTH_TRANSITION,
        opacity: { duration: 0.18 },
        x: { duration: 0.24, ease: SIDEBAR_EASE },
    };

    const sidebarDetailTransition = shouldReduceSidebarMotion ? { duration: 0 } : { duration: 0.14, ease: SIDEBAR_EASE };

    const sidebarDisclosureTransition = shouldReduceSidebarMotion ? { duration: 0 } : { duration: 0.2, ease: SIDEBAR_EASE };

    const motionProps = { initial: { opacity: 0, x: 20, filter: "blur(10px)" }, animate: { opacity: 1, x: 0, filter: "blur(0px)" }, exit: { opacity: 0, x: -20, filter: "blur(10px)" }, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] as const } };

    if (isLoadingConnect || isLoadingSettings) {
        return <div className="h-screen w-screen flex flex-col justify-center items-center font-sans bg-zinc-50 dark:bg-zinc-950"><Loader2 className="h-10 w-10 animate-spin text-zinc-300 dark:text-zinc-700" /></div>;
    }

    return (
        <div className="min-h-screen w-full flex flex-col font-sans relative bg-background text-foreground selection:bg-primary/20 pt-10">
            <div className="pointer-events-none fixed inset-0 z-0 premium-noise opacity-[0.025] mix-blend-overlay dark:opacity-[0.05]" />
            <div className="flex-1 w-full max-w-[2200px] mx-auto px-6 md:px-8 lg:px-12 xl:px-16 relative z-10 flex gap-6 pb-12">
                <motion.nav initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0, width: isSidebarExpanded ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_COLLAPSED_WIDTH }} transition={sidebarTransition} onMouseEnter={() => setSidebarExpandedWithIntent(true)} onMouseLeave={() => setSidebarExpandedWithIntent(false)} style={{ willChange: "width, transform" }} className="relative z-30 hidden shrink-0 lg:flex">
                    <div className="sticky top-10 flex max-h-[calc(100vh-5rem)] w-full flex-col overflow-hidden rounded-[30px] border border-zinc-200/75 bg-white/85 p-3 shadow-[0_24px_74px_-54px_rgba(0,0,0,0.78),inset_0_1px_0_rgba(255,255,255,0.85)] ring-1 ring-black/[0.025] backdrop-blur-xl dark:border-white/[0.075] dark:bg-[#070708]/85 dark:shadow-[0_28px_86px_-58px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.055)] dark:ring-white/[0.035]">
                        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,.55),transparent_28%),radial-gradient(circle_at_0%_0%,rgba(255,255,255,.55),transparent_34%),radial-gradient(circle_at_100%_100%,rgba(0,0,0,.04),transparent_42%)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,.055),transparent_30%),radial-gradient(circle_at_0%_0%,rgba(255,255,255,.075),transparent_38%)]" />
                        <div className="premium-noise pointer-events-none absolute inset-0 opacity-[0.014] dark:opacity-[0.04]" />
                        <div className={cn("relative z-10 flex flex-col gap-2 overflow-y-auto overflow-x-hidden no-scrollbar", showSidebarDetails ? "pr-1" : "items-center pr-0")}>
                            {FINANCE_NAV.map((group) => {
                                const isGroupExpanded = expandedGroups.includes(group.id);
                                const hasActiveSub = group.subItems?.some(s => s.id === activeView || s.subItems?.some(ss => ss.id === activeView));
                                return (
                                    <div key={group.id} className="flex flex-col gap-1 rounded-[22px]">
                                        {group.sectionLabel && (
                                            <div className={cn("transition-all", showSidebarDetails ? "px-3 pb-1 pt-3 text-[8px] font-black uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-600" : "mx-auto my-2 h-px w-8 rounded-full bg-zinc-200 dark:bg-white/10")}>
                                                {showSidebarDetails ? group.sectionLabel : null}
                                            </div>
                                        )}
                                        <button onClick={() => handleGroupClick(group)} title={group.label} aria-expanded={showSidebarDetails ? isGroupExpanded : undefined} className={cn("group relative flex h-12 items-center rounded-2xl transition-colors duration-200 ease-out", showSidebarDetails ? "w-full gap-3 px-3" : "w-14 justify-center px-0", hasActiveSub ? "bg-zinc-950 text-white shadow-[0_16px_38px_-26px_rgba(0,0,0,0.9)] dark:bg-white dark:text-zinc-950" : "text-zinc-500 hover:text-zinc-950 hover:bg-zinc-950/[0.045] dark:text-zinc-500 dark:hover:text-white dark:hover:bg-white/[0.055]")}>
                                            <div className={cn("w-9 h-9 shrink-0 flex items-center justify-center rounded-xl transition-all", hasActiveSub ? "bg-white/14 dark:bg-black/10" : "bg-white/55 dark:bg-white/[0.035] border border-black/[0.035] dark:border-white/[0.055]")}><group.icon className="w-5 h-5" /></div>
                                            <AnimatePresence initial={false}>{showSidebarDetails ? <motion.div initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -4 }} transition={sidebarDetailTransition} className="flex min-w-0 flex-1 items-center justify-between overflow-hidden"><span className="truncate text-[10px] font-black uppercase tracking-[0.15em]">{group.label}</span><ChevronRight className={cn("w-3.5 h-3.5 opacity-55 transition-transform duration-300", isGroupExpanded && "rotate-90")} /></motion.div> : null}</AnimatePresence>
                                        </button>
                                        <AnimatePresence>{showSidebarDetails && isGroupExpanded && group.subItems && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={sidebarDisclosureTransition} className="overflow-hidden flex flex-col gap-1 px-1 pb-1">{group.subItems.map((sub) => { const isSubActive = activeView === sub.id || sub.subItems?.some(ss => ss.id === activeView); return <div key={sub.id} className="space-y-1"><button onClick={() => setActiveView(sub.id)} className={cn("w-full min-h-10 flex items-center gap-3 px-3 py-2 rounded-[15px] transition-all duration-200 group/sub relative", isSubActive ? "bg-zinc-950/[0.075] text-zinc-950 dark:bg-white/[0.09] dark:text-white" : "text-zinc-500 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-950/[0.045] dark:hover:bg-white/[0.055]")}>{isSubActive && <motion.div layoutId="finance-sidebar-active" className="absolute inset-y-2 left-0 w-1 rounded-full bg-zinc-950 dark:bg-white" />}<sub.icon className="w-3.5 h-3.5 shrink-0 transition-colors" /><span className="text-[9px] font-black uppercase tracking-[0.1em] truncate flex-1 text-left leading-tight">{sub.label}</span>{sub.subItems?.length ? <ChevronRight className={cn("h-3 w-3 opacity-45 transition-transform", isSubActive && "rotate-90")} /> : null}</button></div>; })}</motion.div>}</AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </motion.nav>
                <div className="flex-1 rounded-[40px] bg-white/30 dark:bg-zinc-900/10 backdrop-blur-sm border border-zinc-200/30 dark:border-white/[0.02] shadow-sm relative"><AnimatePresence mode="wait"><FinanceiroMainContent selectedTransaction={selectedTransaction} setSelectedTransaction={setSelectedTransaction} activeView={activeView} setActiveView={setActiveView} allTransactions={allTransactions} isLoadingTransactions={isLoadingTransactions} motionProps={motionProps} extratoTab={extratoTab} setExtratoTab={setExtratoTab} realizedTransactions={realizedTransactions} futureTransactions={futureTransactions} subscriptionTransactions={subscriptionTransactions} isNbStatementLoading={isNbStatementLoading || isNbFutureLoading} /></AnimatePresence></div>
            </div>
        </div>
    );
};

export default DesktopFinanceiro;
