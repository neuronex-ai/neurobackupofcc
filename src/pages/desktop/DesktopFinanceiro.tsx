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
    { id: 'account-balance-root', label: "Conta e Saldo", icon: CreditCard, subItems: [{ id: 'conta-digital', label: 'Conta e Saldo', icon: CreditCard }] },
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
    { id: 'statement-root', label: "Extrato", icon: FileText, subItems: [{ id: 'extrato', label: 'Extrato', icon: FileText }] },
    { id: 'cobrancas-root', label: "Cobranças", icon: WalletCards, subItems: [{ id: 'cobrancas-historia', label: 'Todas as cobranças', icon: History }, { id: 'cobrancas-simulador', label: 'Simulador de vendas', icon: BadgeCent }, { id: 'cobrancas-config', label: 'Regras automáticas', icon: Settings }] },
    { id: 'receitas-root', label: "Receitas", icon: ArrowUpRight, subItems: [{ id: 'receitas', label: 'Entradas Confirmadas', icon: ArrowUpRight }] },
    { id: 'despesas-root', label: "Despesas", icon: ArrowDownLeft, subItems: [{ id: 'despesas', label: 'Saídas Confirmadas', icon: ArrowDownLeft }] },
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

const DesktopFinanceiro = () => {
    const { syncAccount, isLoading: isLoadingConnect, refetch: refetchStatus, isConnected, needsInitialOnboarding } = useFinancialAccount();
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

    useEffect(() => () => {
        if (sidebarIntentTimer.current) clearTimeout(sidebarIntentTimer.current);
        if (sidebarDetailsTimer.current) clearTimeout(sidebarDetailsTimer.current);
    }, []);

    useEffect(() => {
        if (sidebarDetailsTimer.current) clearTimeout(sidebarDetailsTimer.current);
        sidebarDetailsTimer.current = setTimeout(() => setShowSidebarDetails(isSidebarExpanded), isSidebarExpanded ? 35 : 170);
    }, [isSidebarExpanded]);

    const setSidebarExpandedWithIntent = (expanded: boolean) => {
        if (sidebarIntentTimer.current) clearTimeout(sidebarIntentTimer.current);
        sidebarIntentTimer.current = setTimeout(() => setIsSidebarExpanded(expanded), expanded ? 55 : 130);
    };

    const handleGroupClick = (group: NavItem) => {
        if (!isSidebarExpanded) {
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

    const showMainDashboard = isConnected || !needsInitialOnboarding;
    const motionProps = { initial: { opacity: 0, x: 20, filter: "blur(10px)" }, animate: { opacity: 1, x: 0, filter: "blur(0px)" }, exit: { opacity: 0, x: -20, filter: "blur(10px)" }, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] as const } };

    if (isLoadingConnect || isLoadingSettings) {
        return <div className="h-screen w-screen flex flex-col justify-center items-center font-sans bg-zinc-50 dark:bg-zinc-950"><Loader2 className="h-10 w-10 animate-spin text-zinc-300 dark:text-zinc-700" /></div>;
    }

    if (!showMainDashboard) {
        return (
            <div className="relative h-screen w-screen overflow-hidden bg-zinc-50 font-sans text-zinc-950 dark:bg-[#020204] dark:text-white">
                <div className="premium-noise pointer-events-none absolute inset-0 z-0 opacity-[0.018] dark:opacity-[0.04]" />
                <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_12%_16%,rgba(255,255,255,.7),transparent_30%),radial-gradient(circle_at_82%_88%,rgba(0,0,0,.035),transparent_34%)] dark:bg-[radial-gradient(circle_at_16%_18%,rgba(255,255,255,.08),transparent_30%),radial-gradient(circle_at_82%_80%,rgba(255,255,255,.04),transparent_32%)]" />
                <div className="pointer-events-none absolute left-1/2 top-0 z-0 h-px w-[72vw] -translate-x-1/2 bg-gradient-to-r from-transparent via-zinc-950/10 to-transparent dark:via-white/12" />

                <AnimatePresence mode="wait">
                    {onboardingStep === 'welcome' ? (
                        <motion.div key="welcome" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.985 }} className="relative z-10 mx-auto grid h-full w-full max-w-[1760px] gap-4 p-4 pt-[92px] md:p-6 md:pt-[102px] lg:grid-cols-[0.84fr_1.16fr]">
                            <motion.aside initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }} className="relative hidden min-h-0 overflow-hidden rounded-[32px] border border-zinc-200/70 bg-white/78 p-6 shadow-[0_28px_90px_-64px_rgba(0,0,0,0.66)] backdrop-blur-3xl dark:border-white/[0.07] dark:bg-white/[0.028] lg:flex lg:flex-col lg:justify-between xl:p-7">
                                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,.46),transparent_32%),radial-gradient(circle_at_0%_0%,rgba(0,0,0,.035),transparent_38%)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,.045),transparent_34%),radial-gradient(circle_at_0%_0%,rgba(255,255,255,.05),transparent_42%)]" />
                                <div className="relative z-10 flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-[15px] bg-zinc-950 text-white shadow-xl dark:bg-white dark:text-zinc-950"><Landmark className="h-4.5 w-4.5" /></div>
                                    <div><p className="text-[7px] font-black uppercase tracking-[0.3em] text-zinc-400">NeuroNex</p><p className="text-[11px] font-black uppercase tracking-[0.22em]">NeuroFinance</p></div>
                                </div>
                                <div className="relative z-10 max-w-md space-y-5 py-8">
                                    <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3.5 py-1.5 text-[7px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:border-white/10 dark:bg-white/[0.045] dark:text-zinc-300"><ShieldCheck className="h-3.5 w-3.5" /> Ambiente seguro</div>
                                    <h2 className="max-w-md text-[clamp(2.2rem,3.35vw,4.2rem)] font-black leading-[0.92] tracking-[-0.07em]">Banking para sua clínica.</h2>
                                    <p className="max-w-sm text-xs font-medium leading-relaxed text-zinc-500 dark:text-zinc-400 xl:text-sm">Receba consultas, organize cobranças e acompanhe repasses em uma experiência financeira feita para psicólogos.</p>
                                </div>
                                <div className="relative z-10 grid grid-cols-2 gap-2.5">
                                    {["Pix", "Cartão", "Boletos", "Saques"].map((item) => <div key={item} className="rounded-[18px] border border-zinc-200/70 bg-zinc-50/60 px-3.5 py-2.5 text-[8px] font-black uppercase tracking-[0.16em] text-zinc-500 dark:border-white/10 dark:bg-white/[0.035] dark:text-zinc-300">{item}</div>)}
                                </div>
                            </motion.aside>

                            <motion.main initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="relative flex min-h-0 flex-col overflow-y-auto overflow-x-hidden rounded-[32px] border border-zinc-200/70 bg-zinc-950 p-5 text-white shadow-[0_34px_110px_-76px_rgba(0,0,0,0.9)] dark:border-white/[0.075] dark:bg-[#070708]/88 md:p-7 xl:p-8">
                                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_32%_16%,rgba(255,255,255,.11),transparent_33%),radial-gradient(circle_at_90%_82%,rgba(255,255,255,.052),transparent_34%)]" />
                                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/16 to-transparent" />
                                <div className="relative z-10 flex shrink-0 items-center justify-between gap-4">
                                    <div className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-[8px] font-black uppercase tracking-[0.2em] text-white/54"><Sparkles className="h-3.5 w-3.5 text-white" /> Início protegido</div>
                                    <div className="hidden items-center gap-2 md:flex">{[1, 2, 3].map((step, index) => <div key={step} className={cn("h-1.5 rounded-full transition-all", index === 0 ? "w-7 bg-white" : "w-1.5 bg-white/18")} />)}</div>
                                </div>

                                <div className="relative z-10 flex min-h-0 flex-1 flex-col justify-center py-5 md:py-6">
                                    <p className="mb-3 text-[8px] font-black uppercase tracking-[0.32em] text-white/36 md:text-[9px]">Conta financeira para psicólogos</p>
                                    <h1 className="max-w-3xl text-[clamp(2.45rem,4.75vw,5.25rem)] font-black leading-[0.9] tracking-[-0.075em]">Comece a receber com o NeuroFinance.</h1>
                                    <p className="mt-4 max-w-2xl text-xs font-semibold leading-relaxed text-white/54 md:text-sm">{isConnected ? "Sua conta já foi criada. Revise as pendências para liberar todos os recursos com segurança." : "Crie sua conta, envie os dados necessários e comece a emitir cobranças profissionais por Pix, cartão e boleto."}</p>
                                    <div className="mt-5 grid gap-2.5 md:grid-cols-3">
                                        {["Receba com Pix e cartão", "Acompanhe saúde da conta", "Proteja saques com PIN"].map((item) => <div key={item} className="rounded-[18px] border border-white/10 bg-white/[0.038] p-3 text-[8px] font-black uppercase leading-relaxed tracking-[0.12em] text-white/52">{item}</div>)}
                                    </div>
                                </div>

                                <div className="relative z-10 flex shrink-0 flex-col gap-3 border-t border-white/10 pt-4 lg:flex-row lg:items-center lg:justify-between">
                                    <div className="max-w-md text-[9px] font-medium leading-relaxed text-white/36 md:text-[10px]">O processo é guiado, seguro e leva poucos minutos. Você poderá acompanhar a análise em Saúde da Conta.</div>
                                    <button onClick={() => setOnboardingStep('wizard')} className="group flex h-12 shrink-0 items-center justify-center gap-3 rounded-[18px] bg-white px-6 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-950 shadow-[0_18px_48px_-34px_rgba(255,255,255,0.72)] transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] md:h-13">
                                        {isConnected ? "Finalizar cadastro" : "Começar agora"}
                                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                    </button>
                                </div>
                                <div className="relative z-10 mt-4 flex shrink-0 justify-center opacity-55"><AsaasRegulatoryFooter /></div>
                            </motion.main>
                        </motion.div>
                    ) : (
                        <motion.div key="wizard" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="relative z-10 h-full w-full">
                            <div className="w-full h-full"><CustomOnboardingFlow fullScreen onCancel={() => setOnboardingStep('welcome')} onComplete={async () => { await syncAccount.mutateAsync(); refetchStatus(); }} /></div>
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
                <motion.nav initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0, width: isSidebarExpanded ? 302 : 88 }} transition={{ width: { type: "spring", stiffness: 420, damping: 42, mass: 0.58 }, opacity: { duration: 0.18 }, x: { duration: 0.24, ease: [0.22, 1, 0.36, 1] } }} onMouseEnter={() => setSidebarExpandedWithIntent(true)} onMouseLeave={() => setSidebarExpandedWithIntent(false)} style={{ willChange: "width, transform" }} className="relative z-30 hidden shrink-0 lg:flex">
                    <div className="sticky top-10 flex max-h-[calc(100vh-5rem)] w-full flex-col overflow-hidden rounded-[30px] border border-zinc-200/75 bg-white/85 p-3 shadow-[0_24px_74px_-54px_rgba(0,0,0,0.78),inset_0_1px_0_rgba(255,255,255,0.85)] ring-1 ring-black/[0.025] backdrop-blur-xl dark:border-white/[0.075] dark:bg-[#070708]/85 dark:shadow-[0_28px_86px_-58px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.055)] dark:ring-white/[0.035]">
                        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,.55),transparent_28%),radial-gradient(circle_at_0%_0%,rgba(255,255,255,.55),transparent_34%),radial-gradient(circle_at_100%_100%,rgba(0,0,0,.04),transparent_42%)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,.055),transparent_30%),radial-gradient(circle_at_0%_0%,rgba(255,255,255,.075),transparent_38%)]" />
                        <div className="premium-noise pointer-events-none absolute inset-0 opacity-[0.014] dark:opacity-[0.04]" />
                        <div className={cn("relative z-10 flex flex-col gap-2 overflow-y-auto overflow-x-hidden no-scrollbar", showSidebarDetails ? "pr-1" : "items-center pr-0")}>
                            {FINANCE_NAV.map((group) => {
                                const isGroupExpanded = expandedGroups.includes(group.id);
                                const hasActiveSub = group.subItems?.some(s => s.id === activeView || s.subItems?.some(ss => ss.id === activeView));
                                return (
                                    <div key={group.id} className="flex flex-col gap-1 rounded-[22px]">
                                        <button onClick={() => handleGroupClick(group)} title={group.label} className={cn("group relative flex h-12 items-center rounded-2xl transition-colors duration-200 ease-out", showSidebarDetails ? "w-full gap-3 px-3" : "w-14 justify-center px-0", hasActiveSub ? "bg-zinc-950 text-white shadow-[0_16px_38px_-26px_rgba(0,0,0,0.9)] dark:bg-white dark:text-zinc-950" : "text-zinc-500 hover:text-zinc-950 hover:bg-zinc-950/[0.045] dark:text-zinc-500 dark:hover:text-white dark:hover:bg-white/[0.055]")}>
                                            <div className={cn("w-9 h-9 shrink-0 flex items-center justify-center rounded-xl transition-all", hasActiveSub ? "bg-white/14 dark:bg-black/10" : "bg-white/55 dark:bg-white/[0.035] border border-black/[0.035] dark:border-white/[0.055]")}><group.icon className="w-5 h-5" /></div>
                                            <AnimatePresence initial={false}>{showSidebarDetails ? <motion.div initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -4 }} transition={{ duration: 0.12, ease: [0.22, 1, 0.36, 1] }} className="flex min-w-0 flex-1 items-center justify-between overflow-hidden"><span className="truncate text-[10px] font-black uppercase tracking-[0.15em]">{group.label}</span><ChevronRight className={cn("w-3.5 h-3.5 opacity-55 transition-transform duration-300", isGroupExpanded && "rotate-90")} /></motion.div> : null}</AnimatePresence>
                                        </button>
                                        <AnimatePresence>{showSidebarDetails && isGroupExpanded && group.subItems && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: showSidebarDetails ? 0.22 : 0.08, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden flex flex-col gap-1 px-1 pb-1">{group.subItems.map((sub) => { const isSubActive = activeView === sub.id || sub.subItems?.some(ss => ss.id === activeView); return <div key={sub.id} className="space-y-1"><button onClick={() => setActiveView(sub.id)} className={cn("w-full min-h-10 flex items-center gap-3 px-3 py-2 rounded-[15px] transition-all duration-200 group/sub relative", isSubActive ? "bg-zinc-950/[0.075] text-zinc-950 dark:bg-white/[0.09] dark:text-white" : "text-zinc-500 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-950/[0.045] dark:hover:bg-white/[0.055]")}>{isSubActive && <motion.div layoutId="finance-sidebar-active" className="absolute inset-y-2 left-0 w-1 rounded-full bg-zinc-950 dark:bg-white" />}<sub.icon className="w-3.5 h-3.5 shrink-0 transition-colors" /><span className="text-[9px] font-black uppercase tracking-[0.1em] truncate flex-1 text-left leading-tight">{sub.label}</span>{sub.subItems?.length ? <ChevronRight className={cn("h-3 w-3 opacity-45 transition-transform", isSubActive && "rotate-90")} /> : null}</button></div>; })}</motion.div>}</AnimatePresence>
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
