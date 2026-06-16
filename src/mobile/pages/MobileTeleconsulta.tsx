import { AsaasRegulatoryFooter } from "@/components/financeiro/AsaasRegulatoryFooter";
import { CustomOnboardingFlow } from "@/components/financeiro/CustomOnboardingFlow";
import { NewInvoiceModal } from "@/components/financeiro/NewInvoiceModal";
import { NewTransactionModal } from "@/components/financeiro/NewTransactionModal";
import { RequirementsList } from "@/components/financeiro/RequirementsList";
import { FeatureGate } from "@/components/subscription";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useFinancialAccount } from "@/hooks/use-financial-account";
import { useFinancialMetrics } from "@/hooks/use-financial-metrics";
import { useNeuroFinanceBalance } from "@/hooks/use-neurofinance-balance";
import { useTransactions } from "@/hooks/use-transactions";
import { cn, formatCurrency } from "@/lib/utils";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AnimatePresence, motion } from "framer-motion";
import {
    ArrowDownRight,
    ArrowRight,
    ArrowRightLeft,
    ArrowUpRight,
    Barcode,
    CalendarRange,
    ChevronRight,
    CircleDollarSign,
    Eye,
    EyeOff,
    FileBarChart,
    FileText,
    Landmark,
    ListFilter,
    Loader2,
    Plus,
    QrCode,
    Receipt,
    ShieldCheck,
    Sparkles,
    Target,
    TrendingUp,
    Users,
    Wallet,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

import {
    MobileActionListItem,
    MobileEmptyState,
    MobileLoadingState,
    MobilePageHeader,
    MobilePageScaffold,
    MobileSectionHeader,
    MobileSegmentedControl,
    MobileSkeletonCard,
    MobileStatusBanner,
} from "../components/MobilePagePrimitives";

type FinanceArea = "management" | "neurofinance";
type TransactionFilter = "all" | "income" | "expense";

const MANAGEMENT_MODULES = [
    {
        id: "overview",
        icon: Landmark,
        title: "Visão geral",
        description: "Resultado do mês, previsão, recebíveis e pendências.",
        status: "Ativo",
    },
    {
        id: "cashflow",
        icon: TrendingUp,
        title: "Fluxo de caixa",
        description: "Acompanhe o movimento recente e a tendência do consultório.",
        status: "Ativo",
    },
    {
        id: "income",
        icon: ArrowUpRight,
        title: "Receitas",
        description: "Entradas confirmadas e fontes de receita.",
        status: "Ativo",
    },
    {
        id: "expense",
        icon: ArrowDownRight,
        title: "Despesas",
        description: "Custos fixos, variáveis e categorias.",
        status: "Ativo",
    },
] as const;

const UPCOMING_MANAGEMENT_MODULES = [
    {
        icon: Users,
        title: "Inadimplência",
        description: "Pacientes, valores em aberto e atrasos.",
    },
    {
        icon: Target,
        title: "Planejamento",
        description: "Metas, ponto de equilíbrio e previsibilidade.",
    },
    {
        icon: FileBarChart,
        title: "Relatórios",
        description: "DRE simplificada, fluxo e resumo para contador.",
    },
] as const;

export const MobileFinanceiro = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const area: FinanceArea = location.pathname.includes("/neurofinance")
        ? "neurofinance"
        : "management";

    const { data: metrics, isLoading: isLoadingMetrics } = useFinancialMetrics();
    const { data: transactions, isLoading: isLoadingTransactions } = useTransactions(subMonths(new Date(), 3));

    const {
        hasAccount,
        isApproved,
        isLoading: isLoadingAccount,
        isAwaitingDocuments,
        isAwaitingApproval,
        isPending,
        needsInitialOnboarding,
        refetch: refetchStatus,
        syncAccount,
    } = useFinancialAccount();

    const { data: balanceData, isLoading: isLoadingBalance } = useNeuroFinanceBalance();

    const [showBalance, setShowBalance] = useState(true);
    const [activeTab, setActiveTab] = useState<TransactionFilter>("all");
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [onboardingStep, setOnboardingStep] = useState<"welcome" | "wizard">("welcome");

    const cashflowRef = useRef<HTMLDivElement>(null);
    const transactionsRef = useRef<HTMLDivElement>(null);

    const balance = balanceData || { balance: 0, pending: 0 };
    const isPendingActivation = hasAccount && !isApproved;

    useEffect(() => {
        const onboardingStatus = searchParams.get("onboarding");

        if (onboardingStatus === "complete" || onboardingStatus === "refresh") {
            syncAccount.mutate(undefined, {
                onSettled: () => {
                    const next = new URLSearchParams(searchParams);
                    next.delete("onboarding");
                    setSearchParams(next, { replace: true });
                },
            });
        }

        const paymentStatus = searchParams.get("payment");

        if (paymentStatus) {
            if (paymentStatus === "success") toast.success("Cobrança processada com sucesso.");
            if (paymentStatus === "canceled") toast.info("Pagamento cancelado ou não concluído.");

            const next = new URLSearchParams(searchParams);
            next.delete("payment");
            next.delete("id");
            setSearchParams(next, { replace: true });
        }
    }, [searchParams, setSearchParams, syncAccount]);

    const chartData = useMemo(
        () =>
            [...(transactions || [])]
                .slice(0, 24)
                .reverse()
                .map((transaction) => ({ value: Number(transaction.amount || 0) })),
        [transactions],
    );

    const filteredTransactions = useMemo(
        () =>
            (transactions || []).filter((transaction) => {
                if (activeTab === "all") return true;
                return transaction.type === activeTab;
            }),
        [activeTab, transactions],
    );

    const switchArea = (nextArea: FinanceArea) => {
        if (nextArea === area) return;

        if (nextArea === "management") navigate("/financeiro");
        else navigate("/financeiro/neurofinance");
    };

    const focusTransactions = (filter: TransactionFilter) => {
        setActiveTab(filter);

        requestAnimationFrame(() => {
            transactionsRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        });
    };

    const handleManagementModule = (moduleId: typeof MANAGEMENT_MODULES[number]["id"]) => {
        if (moduleId === "overview") {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }

        if (moduleId === "cashflow") {
            cashflowRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }

        if (moduleId === "income") focusTransactions("income");
        if (moduleId === "expense") focusTransactions("expense");
    };

    if (area === "neurofinance" && onboardingStep === "wizard") {
        return (
            <MobilePageScaffold
                immersive
                showNavigation={false}
                showBottomNavigation={false}
                contentClassName="h-[100dvh] overflow-y-auto overscroll-y-contain px-0 pb-0 [-webkit-overflow-scrolling:touch]"
            >
                <div className="min-h-[100dvh] bg-background">
                    <CustomOnboardingFlow
                        fullScreen
                        onCancel={() => setOnboardingStep("welcome")}
                        onComplete={async () => {
                            await syncAccount.mutateAsync();
                            await refetchStatus();
                            setOnboardingStep("welcome");
                        }}
                    />
                </div>
            </MobilePageScaffold>
        );
    }

    return (
        <MobilePageScaffold
            contentClassName={cn(
                "h-[100dvh] overflow-y-auto overscroll-y-contain pt-[5.75rem]",
                "pb-[calc(7rem+env(safe-area-inset-bottom))]",
                "[-webkit-overflow-scrolling:touch]",
            )}
        >
            <div className="mx-auto flex w-full max-w-md flex-col gap-5 px-4">
                <MobilePageHeader
                    eyebrow="Finanças do consultório"
                    title="Financeiro"
                    description={
                        area === "management"
                            ? "Organize o caixa sem depender de uma conta bancária."
                            : "Movimente dinheiro real pela sua conta NeuroFinance."
                    }
                    actions={
                        area === "management" ? (
                            <NewTransactionModal>
                                <Button
                                    size="icon"
                                    className={cn(
                                        "h-11 w-11 rounded-[18px]",
                                        "shadow-sm shadow-foreground/5",
                                        "active:scale-[0.97]",
                                    )}
                                >
                                    <Plus className="h-5 w-5" />
                                    <span className="sr-only">Nova transação</span>
                                </Button>
                            </NewTransactionModal>
                        ) : null
                    }
                />

                <div className="sticky top-3 z-20 -mx-1 rounded-[24px] bg-background/80 px-1 py-1.5 backdrop-blur-xl supports-[backdrop-filter]:bg-background/65">
                    <MobileSegmentedControl
                        value={area}
                        onValueChange={switchArea}
                        ariaLabel="Área financeira"
                        options={[
                            { value: "management", label: "Gestão", icon: TrendingUp },
                            { value: "neurofinance", label: "NeuroFinance", icon: Wallet },
                        ]}
                    />
                </div>

                <AnimatePresence mode="wait">
                    {area === "management" ? (
                        <motion.div
                            key="management"
                            initial={{ opacity: 0, x: -10, filter: "blur(6px)" }}
                            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                            exit={{ opacity: 0, x: 10, filter: "blur(6px)" }}
                            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                            className="space-y-8 pt-1"
                        >
                            <section className="grid grid-cols-2 gap-3">
                                {[
                                    {
                                        label: "Receitas",
                                        value: metrics?.currentMonthRevenue || 0,
                                        helper: "Confirmadas no mês",
                                        icon: ArrowUpRight,
                                    },
                                    {
                                        label: "Despesas",
                                        value: metrics?.currentMonthExpenses || 0,
                                        helper: "Registradas no mês",
                                        icon: ArrowDownRight,
                                    },
                                    {
                                        label: "Resultado",
                                        value: metrics?.netProfit || 0,
                                        helper: (metrics?.netProfit || 0) >= 0 ? "Saldo operacional positivo" : "Atenção ao caixa",
                                        icon: CircleDollarSign,
                                    },
                                    {
                                        label: "A receber",
                                        value: metrics?.pendingInvoices || 0,
                                        helper: "Cobranças pendentes",
                                        icon: CalendarRange,
                                    },
                                ].map(({ label, value, helper, icon: Icon }) => (
                                    <div
                                        key={label}
                                        className={cn(
                                            "group relative overflow-hidden rounded-[28px]",
                                            "border border-border/45 bg-card/80 p-4.5",
                                            "shadow-sm shadow-foreground/[0.03]",
                                            "transition-all duration-300 active:scale-[0.985]",
                                            "dark:border-white/10 dark:bg-white/[0.035]",
                                        )}
                                    >
                                        <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-foreground/[0.035] blur-2xl" />

                                        <div className="relative flex h-10 w-10 items-center justify-center rounded-[17px] bg-foreground/[0.055] text-muted-foreground">
                                            <Icon className="h-4 w-4" />
                                        </div>

                                        <p className="relative mt-4 text-[8px] font-black uppercase tracking-[0.18em] text-muted-foreground/60">
                                            {label}
                                        </p>

                                        <p className="relative mt-1.5 text-[18px] font-black leading-none tracking-[-0.045em] text-foreground">
                                            {isLoadingMetrics ? "—" : formatCurrency(value)}
                                        </p>

                                        <p className="relative mt-2 text-[9.5px] font-semibold leading-relaxed text-muted-foreground/55">
                                            {helper}
                                        </p>
                                    </div>
                                ))}
                            </section>

                            <section className="space-y-3.5">
                                <MobileSectionHeader
                                    eyebrow="Atalhos"
                                    title="Gestão do consultório"
                                    description="A conta NeuroFinance é opcional para estes recursos."
                                />

                                <div className="grid gap-2.5">
                                    {MANAGEMENT_MODULES.map((module) => (
                                        <MobileActionListItem
                                            key={module.id}
                                            icon={module.icon}
                                            title={module.title}
                                            description={module.description}
                                            status={module.status}
                                            onClick={() => handleManagementModule(module.id)}
                                        />
                                    ))}

                                    <NewInvoiceModal>
                                        <button type="button" className="w-full text-left active:scale-[0.99]">
                                            <MobileActionListItem
                                                icon={Receipt}
                                                title="Cobranças"
                                                description="Gere cobranças vinculadas aos seus pacientes."
                                                status="Ativo"
                                                trailing={<ChevronRight className="h-4 w-4 text-muted-foreground/35" />}
                                            />
                                        </button>
                                    </NewInvoiceModal>

                                    {UPCOMING_MANAGEMENT_MODULES.map((module) => (
                                        <MobileActionListItem
                                            key={module.title}
                                            icon={module.icon}
                                            title={module.title}
                                            description={module.description}
                                            status="Próxima etapa"
                                            disabled
                                        />
                                    ))}
                                </div>
                            </section>

                            <section ref={cashflowRef} className="scroll-mt-32 space-y-3.5">
                                <MobileSectionHeader
                                    eyebrow="Últimos lançamentos"
                                    title="Fluxo recente"
                                    description="Movimentação gerencial registrada no consultório."
                                />

                                <div
                                    className={cn(
                                        "overflow-hidden rounded-[30px]",
                                        "border border-border/45 bg-card/80 p-5",
                                        "shadow-sm shadow-foreground/[0.03]",
                                        "dark:border-white/10 dark:bg-white/[0.035]",
                                    )}
                                >
                                    {isLoadingTransactions ? (
                                        <MobileSkeletonCard className="border-0 bg-transparent p-0" />
                                    ) : chartData.length > 1 ? (
                                        <div className="h-40 w-full text-foreground">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={chartData}>
                                                    <defs>
                                                        <linearGradient id="managementCashflow" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor="currentColor" stopOpacity={0.22} />
                                                            <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>

                                                    <Area
                                                        type="monotone"
                                                        dataKey="value"
                                                        stroke="currentColor"
                                                        strokeWidth={2.25}
                                                        fill="url(#managementCashflow)"
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    ) : (
                                        <MobileEmptyState
                                            icon={TrendingUp}
                                            title="Fluxo ainda vazio"
                                            description="Registre receitas e despesas para visualizar a evolução do caixa."
                                            className="min-h-[220px]"
                                            action={
                                                <NewTransactionModal>
                                                    <Button className="h-11 rounded-2xl px-5 text-[9px] font-black uppercase tracking-[0.14em]">
                                                        Registrar transação
                                                    </Button>
                                                </NewTransactionModal>
                                            }
                                        />
                                    )}
                                </div>
                            </section>

                            <section ref={transactionsRef} className="scroll-mt-32 space-y-4">
                                <MobileSectionHeader
                                    eyebrow="Caixa gerencial"
                                    title="Transações"
                                    action={
                                        <NewTransactionModal>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-9 rounded-[14px] px-3 text-[8px] font-black uppercase tracking-[0.12em]"
                                            >
                                                <Plus className="mr-1.5 h-3.5 w-3.5" />
                                                Nova
                                            </Button>
                                        </NewTransactionModal>
                                    }
                                />

                                <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1.5 no-scrollbar">
                                    {[
                                        { value: "all", label: "Todas" },
                                        { value: "income", label: "Receitas" },
                                        { value: "expense", label: "Despesas" },
                                    ].map((filter) => (
                                        <button
                                            key={filter.value}
                                            type="button"
                                            onClick={() => setActiveTab(filter.value as TransactionFilter)}
                                            className={cn(
                                                "min-h-10 shrink-0 rounded-[15px] px-4",
                                                "text-[8px] font-black uppercase tracking-[0.13em]",
                                                "transition-all duration-200 active:scale-[0.97]",
                                                activeTab === filter.value
                                                    ? "bg-foreground text-background shadow-sm shadow-foreground/10"
                                                    : "border border-border/45 bg-card/70 text-muted-foreground dark:border-white/10 dark:bg-white/[0.035]",
                                            )}
                                        >
                                            {filter.label}
                                        </button>
                                    ))}
                                </div>

                                {isLoadingTransactions ? (
                                    <div className="space-y-2.5">
                                        <MobileSkeletonCard lines={1} />
                                        <MobileSkeletonCard lines={1} />
                                    </div>
                                ) : filteredTransactions.length ? (
                                    <div className="space-y-2.5">
                                        {filteredTransactions.slice(0, 12).map((transaction) => (
                                            <div
                                                key={transaction.id}
                                                className={cn(
                                                    "flex items-center gap-3 rounded-[24px]",
                                                    "border border-border/45 bg-card/80 p-4",
                                                    "shadow-sm shadow-foreground/[0.025]",
                                                    "transition-all duration-200 active:scale-[0.99]",
                                                    "dark:border-white/10 dark:bg-white/[0.035]",
                                                )}
                                            >
                                                <div
                                                    className={cn(
                                                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-[17px]",
                                                        transaction.type === "income"
                                                            ? "bg-emerald-500/10 text-emerald-500"
                                                            : "bg-rose-500/10 text-rose-500",
                                                    )}
                                                >
                                                    {transaction.type === "income" ? (
                                                        <ArrowUpRight className="h-4 w-4" />
                                                    ) : (
                                                        <ArrowDownRight className="h-4 w-4" />
                                                    )}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-[13px] font-black leading-tight text-foreground">
                                                        {transaction.description || transaction.category || "Transação"}
                                                    </p>

                                                    <p className="mt-1.5 text-[9.5px] font-semibold text-muted-foreground/60">
                                                        {transaction.date
                                                            ? format(new Date(transaction.date), "d MMM, HH:mm", { locale: ptBR })
                                                            : "Recente"}
                                                    </p>
                                                </div>

                                                <div className="min-w-fit text-right">
                                                    <p
                                                        className={cn(
                                                            "text-[12px] font-black leading-tight",
                                                            transaction.type === "income" ? "text-emerald-500" : "text-foreground",
                                                        )}
                                                    >
                                                        {transaction.type === "income" ? "+" : "−"}{" "}
                                                        {formatCurrency(Math.abs(Number(transaction.amount || 0)))}
                                                    </p>

                                                    <p className="mt-1.5 text-[8px] font-black uppercase tracking-[0.11em] text-muted-foreground/50">
                                                        {transaction.status === "completed" || transaction.status === "paid"
                                                            ? "Concluída"
                                                            : "Pendente"}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <MobileEmptyState
                                        icon={ListFilter}
                                        title="Nenhuma transação"
                                        description="Não encontramos lançamentos para este filtro."
                                        className="min-h-[260px]"
                                    />
                                )}
                            </section>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="neurofinance"
                            initial={{ opacity: 0, x: 10, filter: "blur(6px)" }}
                            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                            exit={{ opacity: 0, x: -10, filter: "blur(6px)" }}
                            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                            className="space-y-8 pt-1"
                        >
                            <FeatureGate
                                feature="advanced_finance"
                                fallback={
                                    <MobileStatusBanner
                                        variant="warning"
                                        title="NeuroFinance disponível no plano Profissional"
                                        description="A Gestão Financeira continua liberada. Pix, pagamentos, saques e saldo real exigem o módulo bancário."
                                        action={
                                            <Button
                                                onClick={() => switchArea("management")}
                                                variant="outline"
                                                className="h-10 rounded-[14px] text-[8px] font-black uppercase tracking-[0.13em]"
                                            >
                                                Voltar para Gestão
                                            </Button>
                                        }
                                    />
                                }
                            >
                                {isLoadingAccount ? (
                                    <MobileLoadingState label="Sincronizando conta" />
                                ) : needsInitialOnboarding ? (
                                    <section
                                        className={cn(
                                            "relative overflow-hidden rounded-[34px]",
                                            "border border-border/40 bg-foreground p-6 text-background",
                                            "shadow-xl shadow-foreground/10 dark:border-white/10",
                                        )}
                                    >
                                        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-background/10 blur-3xl" />
                                        <div className="pointer-events-none absolute -bottom-24 -left-24 h-52 w-52 rounded-full bg-background/[0.07] blur-3xl" />

                                        <div className="relative flex h-14 w-14 items-center justify-center rounded-[22px] bg-background/10">
                                            <Sparkles className="h-6 w-6" />
                                        </div>

                                        <p className="relative mt-8 text-[9px] font-black uppercase tracking-[0.2em] opacity-55">
                                            Conta digital
                                        </p>

                                        <h2 className="relative mt-2 text-3xl font-black leading-[0.95] tracking-[-0.055em]">
                                            Ative o NeuroFinance.
                                        </h2>

                                        <p className="relative mt-4 text-sm font-medium leading-relaxed opacity-70">
                                            A Gestão já está disponível. Abra a conta somente para movimentar dinheiro real, usar Pix, pagar boletos e acompanhar saldo bancário.
                                        </p>

                                        <div className="relative mt-6 grid gap-2.5">
                                            {["Pix, boleto e cobranças", "Transferências e saques", "Saldo e extrato bancário"].map((item) => (
                                                <div
                                                    key={item}
                                                    className="rounded-[18px] border border-background/10 bg-background/[0.06] px-4 py-3 text-[10px] font-black uppercase tracking-[0.11em] opacity-80"
                                                >
                                                    {item}
                                                </div>
                                            ))}
                                        </div>

                                        <Button
                                            onClick={() => setOnboardingStep("wizard")}
                                            className="relative mt-7 h-13 w-full rounded-[20px] bg-background text-[9px] font-black uppercase tracking-[0.17em] text-foreground hover:bg-background/90 active:scale-[0.99]"
                                        >
                                            Começar agora
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>

                                        <div className="relative mt-6 opacity-60">
                                            <AsaasRegulatoryFooter />
                                        </div>
                                    </section>
                                ) : (
                                    <div className="space-y-6">
                                        {isPendingActivation ? (
                                            <MobileStatusBanner
                                                variant="warning"
                                                title={
                                                    isAwaitingDocuments
                                                        ? "Documentos necessários"
                                                        : isAwaitingApproval
                                                            ? "Conta em análise"
                                                            : isPending
                                                                ? "Ativação em andamento"
                                                                : "Existem pendências na conta"
                                                }
                                                description={
                                                    isAwaitingDocuments
                                                        ? "Envie os documentos solicitados para liberar Pix e transferências."
                                                        : isAwaitingApproval
                                                            ? "A análise pode levar até 48 horas. Você pode acompanhar o status abaixo."
                                                            : "Abra o centro de verificação para conferir a situação atual."
                                                }
                                                action={
                                                    <Button
                                                        onClick={() => setShowUpdateModal(true)}
                                                        variant="outline"
                                                        className="h-10 rounded-[14px] text-[8px] font-black uppercase tracking-[0.13em]"
                                                    >
                                                        Abrir verificação
                                                    </Button>
                                                }
                                            />
                                        ) : null}

                                        <section
                                            className={cn(
                                                "relative overflow-hidden rounded-[32px]",
                                                "border border-border/45 bg-card/85 p-6",
                                                "shadow-sm shadow-foreground/[0.03]",
                                                "dark:border-white/10 dark:bg-white/[0.04]",
                                            )}
                                        >
                                            <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-foreground/[0.055] blur-3xl" />
                                            <div className="pointer-events-none absolute -bottom-28 -left-20 h-44 w-44 rounded-full bg-foreground/[0.035] blur-3xl" />

                                            <div className="relative flex items-center justify-between gap-4">
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-foreground/[0.055] text-muted-foreground">
                                                        <Wallet className="h-5 w-5" />
                                                    </div>

                                                    <div className="min-w-0">
                                                        <p className="truncate text-[8px] font-black uppercase tracking-[0.18em] text-muted-foreground/55">
                                                            Saldo disponível
                                                        </p>

                                                        <p className="mt-1 truncate text-[10px] font-bold text-muted-foreground">
                                                            Conta NeuroFinance
                                                        </p>
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => setShowBalance((current) => !current)}
                                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[17px] bg-foreground/[0.05] text-muted-foreground transition-all active:scale-[0.96]"
                                                >
                                                    {showBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                                </button>
                                            </div>

                                            <div className="relative mt-8">
                                                {isLoadingBalance ? (
                                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/35" />
                                                ) : (
                                                    <p className="break-words text-4xl font-black tracking-[-0.06em] text-foreground">
                                                        {showBalance ? formatCurrency(balance.balance || 0) : "R$ ••••••"}
                                                    </p>
                                                )}

                                                <p className="mt-2 text-[10px] font-bold text-muted-foreground/55">
                                                    {showBalance ? `${formatCurrency(balance.pending || 0)} a liberar` : "Saldo protegido"}
                                                </p>
                                            </div>
                                        </section>

                                        <section className="space-y-3.5">
                                            <MobileSectionHeader
                                                eyebrow="Movimentação bancária"
                                                title="Ações da conta"
                                                description="Recursos que já possuem fluxo mobile aparecem como ativos."
                                            />

                                            <div className="grid gap-2.5">
                                                <NewInvoiceModal>
                                                    <button type="button" className="w-full text-left active:scale-[0.99]">
                                                        <MobileActionListItem
                                                            icon={Receipt}
                                                            title="Cobrar"
                                                            description="Gere uma cobrança bancária para um paciente."
                                                            status="Ativo"
                                                            trailing={<ChevronRight className="h-4 w-4 text-muted-foreground/35" />}
                                                        />
                                                    </button>
                                                </NewInvoiceModal>

                                                <MobileActionListItem
                                                    icon={QrCode}
                                                    title="Pix"
                                                    description="Pagar, receber, gerar QR Code e gerenciar chaves."
                                                    status="Em adaptação"
                                                    disabled
                                                />

                                                <MobileActionListItem
                                                    icon={ArrowRightLeft}
                                                    title="Transferências"
                                                    description="Envios Pix e transferências protegidas pelo PIN financeiro."
                                                    status="Em adaptação"
                                                    disabled
                                                />

                                                <MobileActionListItem
                                                    icon={Barcode}
                                                    title="Pagar boleto"
                                                    description="Leitura, confirmação e comprovante em fluxo mobile."
                                                    status="Em adaptação"
                                                    disabled
                                                />

                                                <MobileActionListItem
                                                    icon={FileText}
                                                    title="Extrato"
                                                    description="Movimentações realizadas, futuras e assinaturas."
                                                    status="Em adaptação"
                                                    disabled
                                                />

                                                <MobileActionListItem
                                                    icon={ShieldCheck}
                                                    title="Saúde da conta"
                                                    description="Pendências cadastrais, limites e situação operacional."
                                                    status={isApproved ? "Regular" : "Requer ação"}
                                                    onClick={() => setShowUpdateModal(true)}
                                                />
                                            </div>
                                        </section>
                                    </div>
                                )}
                            </FeatureGate>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <Dialog
                open={showUpdateModal}
                onOpenChange={(open) => {
                    setShowUpdateModal(open);
                    if (open) refetchStatus();
                }}
            >
                <DialogContent
                    className={cn(
                        "flex h-[88dvh] max-h-[88dvh] w-[calc(100vw-1rem)] max-w-lg flex-col overflow-hidden",
                        "rounded-[30px] border-border/45 bg-background p-0 shadow-2xl",
                        "dark:border-white/10",
                    )}
                >
                    <DialogHeader className="shrink-0 border-b border-border/40 p-5 text-left dark:border-white/10">
                        <DialogTitle className="text-xl font-black tracking-[-0.04em]">
                            Saúde da conta
                        </DialogTitle>

                        <DialogDescription className="text-xs font-medium leading-relaxed">
                            Acompanhe pendências e conclua as etapas necessárias.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] [-webkit-overflow-scrolling:touch]">
                        <RequirementsList onSelectRequirement={() => undefined} activeRequirement={null} />

                        {showUpdateModal ? (
                            <div className="mt-4 overflow-hidden rounded-[26px] border border-border/40 dark:border-white/10">
                                <CustomOnboardingFlow
                                    fullScreen={false}
                                    onComplete={() => {
                                        setShowUpdateModal(false);
                                        syncAccount.mutate();
                                    }}
                                />
                            </div>
                        ) : null}
                    </div>
                </DialogContent>
            </Dialog>
        </MobilePageScaffold>
    );
};