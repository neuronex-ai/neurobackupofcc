import { Suspense, lazy, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
    AlertTriangle,
    ArrowRight,
    BarChart3,
    CalendarCheck,
    CheckCircle2,
    ChevronRight,
    CircleDollarSign,
    ClipboardList,
    CreditCard,
    FileText,
    Landmark,
    LayoutDashboard,
    Loader2,
    PieChart,
    Receipt,
    Settings,
    TrendingDown,
    TrendingUp,
    Wallet,
} from "lucide-react";
import {
    Bar,
    CartesianGrid,
    ComposedChart,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import { FeatureGate, LockedFeatureScreen } from "@/components/subscription";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const DesktopFinanceiro = lazy(() => import("@/pages/desktop/DesktopFinanceiro"));
const MobileFinanceiro = lazy(() => import("@/mobile/pages/MobileFinanceiro").then(m => ({ default: m.MobileFinanceiro })));

const PageLoader = () => (
    <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="relative">
            <div className="absolute inset-0 bg-foreground/10 blur-2xl animate-pulse rounded-full" />
            <Loader2 className="h-8 w-8 animate-spin text-foreground/20 relative z-10" />
        </div>
    </div>
);

const BANKING_QUERY_KEYS = ["onboarding", "payment"];

const FinanceiroCore = () => {
    const isMobile = useIsMobile();

    return (
        <Suspense fallback={<PageLoader />}>
            {isMobile ? <MobileFinanceiro /> : <DesktopFinanceiro />}
        </Suspense>
    );
};

const NeuroFinanceRoute = () => {
    return (
        <FeatureGate
            feature="advanced_finance"
            fallback={
                <LockedFeatureScreen
                    feature="advanced_finance"
                    title="NeuroFinance"
                    description="Conta bancaria NeuroFinance com saldo real, cobrancas PIX/Boleto/Cartao, transferencias, saques, antecipacao e extrato transacional. Disponivel a partir do plano Professional."
                />
            }
        >
            <FinanceiroCore />
        </FeatureGate>
    );
};

interface PortalCardProps {
    title: string;
    eyebrow: string;
    description: string;
    href: string;
    icon: LucideIcon;
    highlights: string[];
    badge?: string;
    delay: number;
}

const PortalCard = ({
    title,
    eyebrow,
    description,
    href,
    icon: Icon,
    highlights,
    badge,
    delay,
}: PortalCardProps) => (
    <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
        <Link to={href} className="group block h-full">
            <div className="relative flex h-full min-h-[360px] flex-col overflow-hidden rounded-[36px] border border-border/20 bg-card/80 p-8 text-left shadow-2xl backdrop-blur-[40px] transition-all duration-500 ease-apple hover:-translate-y-1 hover:border-border/40 hover:bg-card active:scale-[0.985] md:rounded-[48px] md:p-10">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_16%,rgba(255,255,255,0.10),transparent_34%),radial-gradient(circle_at_80%_90%,rgba(255,255,255,0.035),transparent_38%)]" />
                <div className="relative z-10 flex items-start justify-between gap-5">
                    <div className="flex h-16 w-16 items-center justify-center rounded-[22px] border border-border/20 bg-secondary/50 transition-all duration-500 group-hover:scale-105 group-hover:bg-foreground group-hover:text-background md:h-20 md:w-20 md:rounded-[28px]">
                        <Icon className="h-7 w-7 md:h-8 md:w-8" strokeWidth={1.6} />
                    </div>
                    {badge ? (
                        <span className="rounded-full border border-border/20 bg-secondary/40 px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                            {badge}
                        </span>
                    ) : null}
                </div>

                <div className="relative z-10 mt-8 flex-1">
                    <p className="mb-4 text-[10px] font-black uppercase tracking-[0.35em] text-muted-foreground/50">{eyebrow}</p>
                    <h2 className="text-3xl font-black tracking-[-0.045em] text-foreground md:text-4xl">{title}</h2>
                    <p className="mt-4 max-w-sm text-sm font-medium leading-relaxed text-muted-foreground md:text-base">
                        {description}
                    </p>

                    <div className="mt-8 space-y-3">
                        {highlights.map((item) => (
                            <div key={item} className="flex items-center gap-3 text-xs font-bold text-muted-foreground">
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-foreground/45" />
                                <span>{item}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative z-10 mt-10 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.35em] text-muted-foreground/45 transition-colors group-hover:text-foreground">
                    <span>Acessar</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1.5" />
                </div>
            </div>
        </Link>
    </motion.div>
);

const FinanceiroPortal = () => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const shouldForwardToNeuroFinance = BANKING_QUERY_KEYS.some((key) => searchParams.has(key));

    if (shouldForwardToNeuroFinance) {
        return <Navigate to={`/financeiro/neurofinance${location.search}`} replace />;
    }

    return (
        <div className="min-h-screen w-full overflow-hidden bg-background px-4 py-10 font-sans text-foreground selection:bg-foreground/10 md:px-8">
            <div className="pointer-events-none fixed inset-0 z-0">
                <div className="absolute left-[-12%] top-[-18%] h-[720px] w-[920px] rounded-full bg-foreground/[0.025] blur-[210px]" />
                <div className="absolute bottom-[-12%] right-[-12%] h-[560px] w-[760px] rounded-full bg-foreground/[0.018] blur-[180px]" />
            </div>

            <main className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl flex-col items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    className="mb-10 max-w-3xl text-center md:mb-14"
                >
                    <p className="mb-5 text-[10px] font-black uppercase tracking-[0.42em] text-muted-foreground/50">
                        Modulo financeiro
                    </p>
                    <h1 className="text-4xl font-black leading-tight tracking-[-0.055em] text-foreground md:text-7xl">
                        Escolha sua camada financeira.
                    </h1>
                    <p className="mx-auto mt-5 max-w-2xl text-sm font-medium leading-relaxed text-muted-foreground md:text-lg">
                        Separe a gestao interna do consultorio da conta bancaria real. O dinheiro previsto fica na gestao; o saldo real continua no NeuroFinance.
                    </p>
                </motion.div>

                <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2 md:gap-8">
                    <PortalCard
                        title="Gestao Financeira"
                        eyebrow="Controle gerencial"
                        description="Controle interno do consultorio ou clinica, para organizar receitas, despesas, inadimplencia, repasses e relatorios sem movimentar dinheiro real."
                        href="/financeiro/gestao"
                        icon={PieChart}
                        highlights={[
                            "Livre por padrao",
                            "Sem onboarding bancario",
                            "Sem criar cobranca ou transacao real",
                        ]}
                        badge="Gerencial"
                        delay={0.08}
                    />
                    <PortalCard
                        title="NeuroFinance"
                        eyebrow="Banking transacional"
                        description="Conta bancaria, saldo real, extrato, Pix, boleto, cartao, transferencias, saques, antecipacao, chargebacks e pagamentos."
                        href="/financeiro/neurofinance"
                        icon={Landmark}
                        highlights={[
                            "Exige plano Professional",
                            "Mantem onboarding atual",
                            "Movimenta dinheiro real",
                        ]}
                        badge="Professional"
                        delay={0.16}
                    />
                </div>
            </main>
        </div>
    );
};

type ManagementView =
    | "overview"
    | "financial-panel"
    | "income"
    | "expenses"
    | "statement"
    | "cash-flow"
    | "charges-generated"
    | "client-config"
    | "invoice-panel";

interface ManagementSubItem {
    id: ManagementView;
    label: string;
    icon: LucideIcon;
    description?: string;
}

interface ManagementNavGroup {
    id: string;
    label: string;
    icon: LucideIcon;
    view?: ManagementView;
    subItems?: ManagementSubItem[];
}

const MANAGEMENT_NAV: ManagementNavGroup[] = [
    {
        id: "overview-root",
        label: "Visao Geral",
        icon: PieChart,
        view: "overview",
    },
    {
        id: "transactions-root",
        label: "Transacoes",
        icon: Receipt,
        subItems: [
            { id: "financial-panel", label: "Painel financeiro", icon: LayoutDashboard, description: "Resumo operacional das entradas e saidas." },
            { id: "income", label: "Receitas", icon: TrendingUp, description: "Receitas previstas, pendentes e pagas." },
            { id: "expenses", label: "Despesas", icon: TrendingDown, description: "Despesas previstas, pendentes e pagas." },
            { id: "statement", label: "Extrato", icon: ClipboardList, description: "Extrato gerencial sem transacoes bancarias reais." },
            { id: "cash-flow", label: "Fluxo de caixa", icon: BarChart3, description: "Competencia, vencimentos e resultado mensal." },
        ],
    },
    {
        id: "charges-root",
        label: "Cobrancas",
        icon: CreditCard,
        subItems: [
            { id: "charges-generated", label: "Cobrancas geradas", icon: Receipt, description: "Cobrancas vinculadas a receitas gerenciais." },
            { id: "client-config", label: "Configuracao por cliente", icon: Settings, description: "Preferencias de cobranca por paciente ou convenio." },
        ],
    },
    {
        id: "invoice-root",
        label: "Nota fiscal",
        icon: FileText,
        subItems: [
            { id: "invoice-panel", label: "Painel", icon: FileText, description: "Base visual para emissao e acompanhamento fiscal." },
        ],
    },
];

const MANAGEMENT_VIEW_META: Record<ManagementView, { title: string; subtitle: string; icon: LucideIcon; items: string[] }> = {
    overview: {
        title: "Visao Geral",
        subtitle: "Indicadores gerenciais do consultorio",
        icon: PieChart,
        items: [],
    },
    "financial-panel": {
        title: "Painel financeiro",
        subtitle: "Resumo operacional de transacoes gerenciais",
        icon: LayoutDashboard,
        items: ["Filtros por periodo", "Lancamentos manuais", "Separacao entre previsto e realizado"],
    },
    income: {
        title: "Receitas",
        subtitle: "Entradas internas, externas e conciliaveis",
        icon: TrendingUp,
        items: ["Receitas manuais", "Receitas vinculadas a agenda", "Status planned, pending, paid, overdue e cancelled"],
    },
    expenses: {
        title: "Despesas",
        subtitle: "Contas a pagar e custos do consultorio",
        icon: TrendingDown,
        items: ["Despesas fixas e variaveis", "Recorrencias", "Competencia e vencimento separados"],
    },
    statement: {
        title: "Extrato",
        subtitle: "Historico gerencial sem movimentacao bancaria real",
        icon: ClipboardList,
        items: ["Lancamentos internos", "Origem do lancamento", "Vinculo opcional com paciente e agenda"],
    },
    "cash-flow": {
        title: "Fluxo de caixa",
        subtitle: "Resultado previsto por competencia e vencimento",
        icon: BarChart3,
        items: ["Fluxo mensal", "Previsto versus pago", "Receitas e despesas em atraso"],
    },
    "charges-generated": {
        title: "Cobrancas geradas",
        subtitle: "Camada gerencial das cobrancas",
        icon: Receipt,
        items: ["Cobrancas NeuroFinance vinculadas", "Cobrancas ainda aguardando pagamento", "Separacao entre criado e recebido"],
    },
    "client-config": {
        title: "Configuracao por cliente",
        subtitle: "Preferencias financeiras por paciente ou convenio",
        icon: Settings,
        items: ["Metodo padrao", "Prazos de vencimento", "Regras de cobranca por perfil"],
    },
    "invoice-panel": {
        title: "Painel fiscal",
        subtitle: "Base visual para notas fiscais",
        icon: FileText,
        items: ["Notas emitidas", "Notas pendentes", "Vinculo com receita gerencial"],
    },
};

const overviewCards = [
    {
        title: "Resultado previsto",
        value: "R$ --",
        footer: ["Resultado atual: R$ --"],
        icon: BarChart3,
    },
    {
        title: "Receitas previstas",
        value: "R$ --",
        footer: ["Pago: R$ --", "Nao pago: R$ --"],
        icon: TrendingUp,
    },
    {
        title: "Despesas previstas",
        value: "R$ --",
        footer: ["Pago: R$ --", "A pagar: R$ --"],
        icon: TrendingDown,
    },
] satisfies { title: string; value: string; footer: string[]; icon: LucideIcon }[];

const overviewChartData = [
    { month: "Jan", paidIncome: 12800, unpaidIncome: 2200, paidExpenses: 4200, unpaidExpenses: 900, result: 7900 },
    { month: "Fev", paidIncome: 14200, unpaidIncome: 1800, paidExpenses: 4600, unpaidExpenses: 1200, result: 8400 },
    { month: "Mar", paidIncome: 13600, unpaidIncome: 2600, paidExpenses: 5100, unpaidExpenses: 800, result: 8300 },
    { month: "Abr", paidIncome: 15800, unpaidIncome: 2100, paidExpenses: 5300, unpaidExpenses: 1100, result: 9500 },
    { month: "Mai", paidIncome: 17100, unpaidIncome: 1900, paidExpenses: 5900, unpaidExpenses: 1400, result: 9700 },
    { month: "Jun", paidIncome: 16400, unpaidIncome: 2800, paidExpenses: 6100, unpaidExpenses: 1300, result: 8800 },
    { month: "Jul", paidIncome: 17600, unpaidIncome: 2400, paidExpenses: 6200, unpaidExpenses: 1000, result: 10800 },
    { month: "Ago", paidIncome: 18200, unpaidIncome: 2300, paidExpenses: 6400, unpaidExpenses: 900, result: 11300 },
    { month: "Set", paidIncome: 16900, unpaidIncome: 3100, paidExpenses: 6600, unpaidExpenses: 1500, result: 7900 },
    { month: "Out", paidIncome: 18800, unpaidIncome: 2500, paidExpenses: 6900, unpaidExpenses: 1100, result: 12300 },
    { month: "Nov", paidIncome: 19400, unpaidIncome: 2200, paidExpenses: 7200, unpaidExpenses: 1200, result: 13200 },
    { month: "Dez", paidIncome: 20100, unpaidIncome: 2600, paidExpenses: 7600, unpaidExpenses: 1400, result: 13100 },
];

const overdueRows = [
    { patient: "Paciente exemplo", description: "Sessao individual", due: "10/06/2026", amount: "R$ --" },
    { patient: "Convenio exemplo", description: "Repasse pendente", due: "14/06/2026", amount: "R$ --" },
    { patient: "Paciente exemplo", description: "Pacote de sessoes", due: "20/06/2026", amount: "R$ --" },
];

const moneyFormatter = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const ManagementSectionHeader = ({
    icon: Icon,
    title,
    subtitle,
}: {
    icon: LucideIcon;
    title: string;
    subtitle: string;
}) => (
    <div className="relative overflow-hidden rounded-[32px] border border-zinc-200/50 bg-white/60 p-7 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.04)] backdrop-blur-2xl dark:border-white/[0.05] dark:bg-white/[0.015] dark:shadow-[0_8px_32px_-12px_rgba(0,0,0,0.3)]">
        <div className="premium-noise pointer-events-none absolute inset-0 opacity-[0.02] mix-blend-overlay dark:opacity-[0.04]" />
        <div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-5">
                <div className="group relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[16px] bg-zinc-900 text-white shadow-2xl dark:bg-white dark:text-black">
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    <Icon className="relative z-10 h-5 w-5" />
                </div>
                <div>
                    <h3 className="text-lg font-black uppercase leading-none tracking-tight text-zinc-900 dark:text-white">{title}</h3>
                    <p className="mt-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">{subtitle}</p>
                </div>
            </div>
            <Link
                to="/financeiro"
                className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-100 px-4 text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500 transition-colors hover:text-zinc-900 dark:bg-white/5 dark:text-zinc-500 dark:hover:text-white"
            >
                Portal financeiro
            </Link>
        </div>
    </div>
);

const ManagementOverview = ({ motionProps }: { motionProps: any }) => (
    <motion.div {...motionProps} key="management-overview" className="space-y-6 px-6 py-6">
        <ManagementSectionHeader icon={PieChart} title="Visao Geral" subtitle="Resultado previsto, receitas, despesas e atrasos" />

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            {overviewCards.map((card) => (
                <div key={card.title} className="relative overflow-hidden rounded-[32px] border border-zinc-200/50 bg-white/60 p-6 shadow-sm backdrop-blur-2xl dark:border-white/[0.045] dark:bg-white/[0.015]">
                    <div className="premium-noise pointer-events-none absolute inset-0 opacity-[0.02] dark:opacity-[0.04]" />
                    <div className="relative z-10 flex items-start justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.26em] text-zinc-400 dark:text-zinc-500">{card.title}</p>
                            <p className="mt-5 text-4xl font-black tracking-[-0.055em] text-zinc-950 dark:text-white">{card.value}</p>
                        </div>
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-white/10 dark:bg-white/[0.04]">
                            <card.icon className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="relative z-10 mt-6 flex flex-wrap gap-2">
                        {card.footer.map((item) => (
                            <span key={item} className="rounded-full border border-zinc-200/70 bg-zinc-50/80 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-zinc-500 dark:border-white/10 dark:bg-white/[0.035] dark:text-zinc-400">
                                {item}
                            </span>
                        ))}
                    </div>
                </div>
            ))}
        </div>

        <section className="relative overflow-hidden rounded-[34px] border border-zinc-200/50 bg-white/55 p-6 shadow-sm backdrop-blur-2xl dark:border-white/[0.045] dark:bg-white/[0.012]">
            <div className="premium-noise pointer-events-none absolute inset-0 opacity-[0.018] dark:opacity-[0.04]" />
            <div className="relative z-10 mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-black uppercase tracking-tight text-zinc-950 dark:text-white">
                            Resultado previsto
                        </h3>
                        <span className="rounded-full bg-zinc-950 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.16em] text-white dark:bg-white dark:text-zinc-950">
                            Preview visual
                        </span>
                    </div>
                    <p className="mt-2 max-w-xl text-xs font-medium leading-relaxed text-zinc-500 dark:text-zinc-400">
                        Grafico combinado para Receitas e Despesas. Nesta etapa os dados sao placeholders de layout, sem consulta ao Supabase.
                    </p>
                </div>
                <label className="flex h-11 items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/80 px-4 dark:border-white/10 dark:bg-white/[0.035]">
                    <span className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">Ano</span>
                    <select className="bg-transparent text-xs font-black text-zinc-700 outline-none dark:text-zinc-200" defaultValue="2026">
                        <option value="2026">2026</option>
                        <option value="2025">2025</option>
                        <option value="2024">2024</option>
                    </select>
                </label>
            </div>

            <div className="relative z-10 h-[360px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={overviewChartData} margin={{ top: 16, right: 24, bottom: 8, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-zinc-200 dark:text-white/10" />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: "currentColor" }} className="text-zinc-400" />
                        <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `R$${Number(value) / 1000}k`} tick={{ fontSize: 10, fontWeight: 800, fill: "currentColor" }} className="text-zinc-400" />
                        <Tooltip
                            formatter={(value: number, name: string) => [moneyFormatter(Number(value)), name]}
                            contentStyle={{
                                borderRadius: 18,
                                border: "1px solid rgba(148,163,184,.25)",
                                background: "rgba(9,9,11,.92)",
                                color: "white",
                                boxShadow: "0 18px 60px -30px rgba(0,0,0,.8)",
                            }}
                            labelStyle={{ color: "rgba(255,255,255,.65)", fontWeight: 800 }}
                        />
                        <Bar name="Receitas Pagas" dataKey="paidIncome" stackId="income" fill="#10b981" radius={[8, 8, 0, 0]} />
                        <Bar name="Receitas Nao Pagas" dataKey="unpaidIncome" stackId="income" fill="#86efac" radius={[8, 8, 0, 0]} />
                        <Bar name="Despesas Pagas" dataKey="paidExpenses" stackId="expenses" fill="#f43f5e" radius={[8, 8, 0, 0]} />
                        <Bar name="Despesas Nao Pagas" dataKey="unpaidExpenses" stackId="expenses" fill="#fda4af" radius={[8, 8, 0, 0]} />
                        <Line name="Resultado previsto" type="monotone" dataKey="result" stroke="#18181b" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            <div className="relative z-10 mt-6 flex flex-wrap gap-3">
                {[
                    ["Receitas Pagas", "bg-emerald-500"],
                    ["Receitas Nao Pagas", "bg-emerald-300"],
                    ["Despesas Pagas", "bg-rose-500"],
                    ["Despesas Nao Pagas", "bg-rose-300"],
                ].map(([label, color]) => (
                    <div key={label} className="flex items-center gap-2 rounded-full border border-zinc-200/70 bg-zinc-50/80 px-3 py-1.5 dark:border-white/10 dark:bg-white/[0.035]">
                        <span className={cn("h-2 w-2 rounded-full", color)} />
                        <span className="text-[9px] font-black uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">{label}</span>
                    </div>
                ))}
            </div>
        </section>

        <section className="relative overflow-hidden rounded-[34px] border border-zinc-200/50 bg-white/55 p-6 shadow-sm backdrop-blur-2xl dark:border-white/[0.045] dark:bg-white/[0.012]">
            <div className="premium-noise pointer-events-none absolute inset-0 opacity-[0.018] dark:opacity-[0.04]" />
            <div className="relative z-10 mb-5 flex flex-col justify-between gap-2 md:flex-row md:items-end">
                <div>
                    <h3 className="text-lg font-black uppercase tracking-tight text-zinc-950 dark:text-white">Receitas atrasadas no periodo selecionado</h3>
                    <p className="mt-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">Tabela base para inadimplencia gerencial.</p>
                </div>
                <span className="w-fit rounded-full bg-amber-500/10 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.16em] text-amber-600 dark:text-amber-300">
                    Layout sem dados reais
                </span>
            </div>

            <div className="relative z-10 overflow-hidden rounded-[24px] border border-zinc-200/70 dark:border-white/10">
                <table className="w-full min-w-[720px] border-collapse text-left">
                    <thead className="bg-zinc-50/90 dark:bg-white/[0.035]">
                        <tr className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">
                            <th className="px-5 py-4">Paciente</th>
                            <th className="px-5 py-4">Descricao</th>
                            <th className="px-5 py-4">Vencimento</th>
                            <th className="px-5 py-4 text-right">Valor</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/70 dark:divide-white/10">
                        {overdueRows.map((row) => (
                            <tr key={`${row.patient}-${row.due}`} className="bg-white/50 text-sm dark:bg-white/[0.01]">
                                <td className="px-5 py-4 font-black text-zinc-900 dark:text-white">{row.patient}</td>
                                <td className="px-5 py-4 text-zinc-500 dark:text-zinc-400">{row.description}</td>
                                <td className="px-5 py-4 text-zinc-500 dark:text-zinc-400">{row.due}</td>
                                <td className="px-5 py-4 text-right font-black text-zinc-900 dark:text-white">{row.amount}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    </motion.div>
);

const ManagementPlaceholderView = ({ view, motionProps }: { view: ManagementView; motionProps: any }) => {
    const meta = MANAGEMENT_VIEW_META[view];
    const Icon = meta.icon;

    return (
        <motion.div {...motionProps} key={view} className="space-y-6 px-6 py-6">
            <ManagementSectionHeader icon={Icon} title={meta.title} subtitle={meta.subtitle} />
            <div className="relative overflow-hidden rounded-[34px] border border-zinc-200/50 bg-white/55 p-8 shadow-sm backdrop-blur-2xl dark:border-white/[0.045] dark:bg-white/[0.012]">
                <div className="premium-noise pointer-events-none absolute inset-0 opacity-[0.018] dark:opacity-[0.04]" />
                <div className="relative z-10 flex min-h-[360px] flex-col items-center justify-center text-center">
                    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-white/10 dark:bg-white/[0.04]">
                        <Icon className="h-7 w-7" />
                    </div>
                    <p className="mb-3 text-[10px] font-black uppercase tracking-[0.35em] text-zinc-400">Base visual pronta</p>
                    <h3 className="text-2xl font-black tracking-tight text-zinc-950 dark:text-white">{meta.title}</h3>
                    <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                        Esta aba ainda nao consulta Supabase nem executa acoes. Ela prepara a organizacao do front para a proxima rodada de dados gerenciais.
                    </p>
                    <div className="mt-8 flex flex-wrap justify-center gap-3">
                        {meta.items.map((item) => (
                            <span key={item} className="rounded-full border border-zinc-200/70 bg-zinc-50/80 px-4 py-2 text-[9px] font-black uppercase tracking-[0.14em] text-zinc-500 dark:border-white/10 dark:bg-white/[0.035] dark:text-zinc-400">
                                {item}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const FinancialManagementHome = () => {
    const [activeView, setActiveView] = useState<ManagementView>("overview");
    const [expandedGroups, setExpandedGroups] = useState<string[]>(["overview-root"]);
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

    const motionProps = {
        initial: { opacity: 0, x: 20, filter: "blur(10px)" },
        animate: { opacity: 1, x: 0, filter: "blur(0px)" },
        exit: { opacity: 0, x: -20, filter: "blur(10px)" },
        transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] as any },
    };

    const activateView = (view: ManagementView) => {
        setActiveView(view);
        const parent = MANAGEMENT_NAV.find((group) => group.view === view || group.subItems?.some((sub) => sub.id === view));
        if (parent) setExpandedGroups([parent.id]);
    };

    const handleGroupClick = (group: ManagementNavGroup) => {
        if (group.view) {
            activateView(group.view);
            return;
        }

        const nextView = group.subItems?.[0]?.id;
        if (!isSidebarExpanded) {
            setExpandedGroups([group.id]);
            if (nextView) setActiveView(nextView);
            return;
        }

        const isCurrentlyExpanded = expandedGroups.includes(group.id);
        if (isCurrentlyExpanded) {
            setExpandedGroups([]);
        } else {
            setExpandedGroups([group.id]);
            if (nextView) setActiveView(nextView);
        }
    };

    const renderContent = () => {
        if (activeView === "overview") return <ManagementOverview motionProps={motionProps} />;
        return <ManagementPlaceholderView view={activeView} motionProps={motionProps} />;
    };

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
                            {MANAGEMENT_NAV.map((group) => {
                                const isGroupExpanded = expandedGroups.includes(group.id);
                                const hasActiveSub = group.view === activeView || group.subItems?.some((sub) => sub.id === activeView);

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
                                                        {group.subItems?.length ? (
                                                            <ChevronRight className={cn(
                                                                "w-3.5 h-3.5 opacity-55 transition-transform duration-300",
                                                                isGroupExpanded && "rotate-90"
                                                            )} />
                                                        ) : null}
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
                                                        const isSubActive = activeView === sub.id;
                                                        return (
                                                            <button
                                                                key={sub.id}
                                                                onClick={() => activateView(sub.id)}
                                                                className={cn(
                                                                    "w-full min-h-10 flex items-center gap-3 px-3 py-2 rounded-[15px] transition-all duration-200 group/sub relative",
                                                                    isSubActive
                                                                        ? "bg-zinc-950/[0.075] text-zinc-950 dark:bg-white/[0.09] dark:text-white"
                                                                        : "text-zinc-500 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-950/[0.045] dark:hover:bg-white/[0.055]"
                                                                )}
                                                            >
                                                                {isSubActive && <motion.div layoutId="management-sidebar-active" className="absolute inset-y-2 left-0 w-1 rounded-full bg-zinc-950 dark:bg-white" />}
                                                                <sub.icon className="w-3.5 h-3.5 shrink-0 transition-colors" />
                                                                <span className="text-[9px] font-black uppercase tracking-[0.1em] truncate flex-1 text-left leading-tight">
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

                <div className="lg:hidden fixed left-0 right-0 top-0 z-[80] border-b border-zinc-200/50 bg-background/78 px-4 py-3 backdrop-blur-2xl dark:border-white/10">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                        {MANAGEMENT_NAV.flatMap((group) => group.view ? [{ id: group.view, label: group.label, icon: group.icon }] : group.subItems || []).map((item) => (
                            <button
                                key={item.id}
                                onClick={() => activateView(item.id)}
                                className={cn(
                                    "flex h-10 shrink-0 items-center gap-2 rounded-2xl px-4 text-[9px] font-black uppercase tracking-[0.12em]",
                                    activeView === item.id
                                        ? "bg-foreground text-background"
                                        : "bg-secondary/45 text-muted-foreground"
                                )}
                            >
                                <item.icon className="h-3.5 w-3.5" />
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 rounded-[40px] bg-white/30 dark:bg-zinc-900/10 backdrop-blur-sm border border-zinc-200/30 dark:border-white/[0.02] shadow-sm relative mt-12 lg:mt-0">
                    <AnimatePresence mode="wait">
                        {renderContent()}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

const Financeiro = () => {
    return (
        <Routes>
            <Route index element={<FinanceiroPortal />} />
            <Route path="gestao" element={<FinancialManagementHome />} />
            <Route path="neurofinance" element={<NeuroFinanceRoute />} />
            <Route path="*" element={<Navigate to="/financeiro" replace />} />
        </Routes>
    );
};

export default Financeiro;
