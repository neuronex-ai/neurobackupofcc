import { Suspense, lazy, useEffect, useMemo, useState, type ReactNode } from "react";
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
    Download,
    Eye,
    FileText,
    Filter,
    HelpCircle,
    Landmark,
    Loader2,
    MoreHorizontal,
    PieChart,
    Plus,
    Receipt,
    Search,
    Settings,
    Trash2,
    TrendingDown,
    TrendingUp,
    Users,
    Wallet,
    X,
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
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import {
    useCreateFinancialEntry,
    useCreateFinancialCategory,
    useCreateRecurringFinancialEntry,
    useDeleteFinancialEntries,
    useFinancialAutomationSettings,
    useFinancialCategories,
    useFinancialSummary,
    useSaveFinancialAutomationSettings,
    type FinancialEntry,
    type FinancialEntryPaymentMethod,
    type FinancialMonthlyPoint,
} from "@/hooks/use-financial-entries";
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
                    <h1 className="whitespace-nowrap text-3xl font-bold leading-tight tracking-[-0.05em] text-foreground sm:text-4xl md:text-7xl">
                        Escolha o seu <span className="font-medium italic text-foreground/30">Fluxo</span>
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
    | "income"
    | "expenses"
    | "statement"
    | "cash-flow"
    | "charges-generated"
    | "client-config"
    | "repasses-convenio"
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
            { id: "income", label: "Receitas", icon: TrendingUp, description: "Receitas previstas, pendentes e pagas." },
            { id: "expenses", label: "Despesas", icon: TrendingDown, description: "Despesas previstas, pendentes e pagas." },
            { id: "statement", label: "Extrato", icon: ClipboardList, description: "Extrato gerencial sem transacoes bancarias reais." },
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
        id: "analytics-root",
        label: "Gestao & Analise",
        icon: PieChart,
        subItems: [
            { id: "cash-flow", label: "Fluxo de caixa", icon: BarChart3, description: "Competencia, vencimentos e resultado mensal." },
        ],
    },
    {
        id: "repasses-root",
        label: "Repasses/Convenio",
        icon: Users,
        subItems: [
            { id: "repasses-convenio", label: "Repasses de convenio", icon: Users, description: "Conciliacao de sessoes realizadas com convenio." },
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
    "repasses-convenio": {
        title: "Repasses/Convenio",
        subtitle: "Sessoes liberadas, conciliadas e nao conciliadas",
        icon: Users,
        items: ["Conciliacao em lote", "Filtro por convenio", "Alteracao de repasses em massa"],
    },
    "invoice-panel": {
        title: "Painel fiscal",
        subtitle: "Base visual para notas fiscais",
        icon: FileText,
        items: ["Notas emitidas", "Notas pendentes", "Vinculo com receita gerencial"],
    },
};

type ManagementModal = "income" | "expense" | "manual-charge" | "batch-reconcile" | "batch-update-transfer" | null;
type ManagementOptionsMenu = "income" | "expenses" | "statement" | "charges" | "agreements" | null;

type MetricCard = { title: string; value: string; footer: string[]; icon: LucideIcon; tone?: string };
type ChartPoint = FinancialMonthlyPoint | ({ month: string } & Partial<Record<string, string | number>>);

interface OverdueIncomeRow {
    patient: string;
    description: string;
    due: string;
    amount: string;
}

interface ExpenseRow {
    id: string;
    category: string;
    description: string;
    property: string;
    due: string;
    amount: string;
    status: "Pago" | "Nao pago";
}

interface IncomeRow {
    patient: string;
    description: string;
    due: string;
    amount: string;
    status: "Pago" | "Nao pago";
    origin: string;
}

interface StatementRow {
    date: string;
    description: string;
    reason: string;
    property: string;
    category: string;
    amount: string;
}

interface ManualChargeRow {
    client: string;
    description: string;
    due: string;
    amount: string;
    type: string;
    status: string;
}

interface AgreementRepassRow {
    patient: string;
    session: string;
    agreement: string;
    releaseDate: string;
    transferDate: string;
    status: "Conciliado" | "Nao conciliado";
    amount: string;
}

interface CashFlowTableRow {
    label: string;
    tone: string;
    values: string[];
}

const financeFormCategories = {
    income: ["Cobranca Avulsa", "Comissao", "Deposito", "Mensalidade", "Receitas nao categorizadas", "Rendimentos"],
    expense: ["13 salario", "Adiantamento", "Agua", "Ajuste de caixa", "Alimentacao", "Aluguel"],
};

const paymentMethods = ["Pix", "Boleto", "Cartao", "Dinheiro", "Transferencia externa", "Convenio", "Outro"];

const moneyFormatter = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fullMonthNames = [
    "Janeiro",
    "Fevereiro",
    "Marco",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
];

const buildPeriodLabel = (year: number, month: number) => `${fullMonthNames[month]} ${year}`;

const formatDateLabel = (value: string) => {
    const [year, month, day] = value.split("-");
    return year && month && day ? `${day}/${month}/${year}` : value;
};

const entryDateLabel = (entry: FinancialEntry) =>
    formatDateLabel(entry.paid_at?.slice(0, 10) || entry.due_date || entry.competence_date || entry.created_at.slice(0, 10));

const entryCategoryLabel = (entry: FinancialEntry) => {
    const category = entry.metadata?.category;
    return typeof category === "string" && category ? category : entry.type === "income" ? "Receita" : "Despesa";
};

const entryClientLabel = (entry: FinancialEntry) => {
    const clientName = entry.metadata?.client;
    if (entry.patients?.name) return entry.patients.name;
    return typeof clientName === "string" && clientName ? clientName : "Paciente nao vinculado";
};

const entryStatusLabel = (entry: FinancialEntry): "Pago" | "Nao pago" =>
    entry.status === "paid" ? "Pago" : "Nao pago";

const entryOriginLabel = (entry: FinancialEntry) => {
    if (entry.origin === "neurofinance") return "NeuroFinance";
    if (entry.origin === "appointment") return "Agenda";
    if (entry.origin === "convenio") return "Convenio";
    if (entry.origin === "package") return "Pacote";
    return "Manual";
};

const isOpenFinancialEntry = (entry: FinancialEntry) => ["planned", "pending", "overdue"].includes(entry.status);

const isOverdueIncomeEntry = (entry: FinancialEntry) => {
    const today = new Date().toISOString().slice(0, 10);
    return entry.type === "income" && isOpenFinancialEntry(entry) && Boolean(entry.due_date) && String(entry.due_date) < today;
};

const paymentMethodLabel = (method: FinancialEntryPaymentMethod) => {
    if (method === "pix") return "Pix";
    if (method === "boleto") return "Boleto";
    if (method === "card") return "Cartao";
    if (method === "cash") return "Dinheiro";
    if (method === "external_transfer") return "Transferencia";
    if (method === "convenio") return "Convenio";
    if (method === "manual") return "Manual";
    return "Outro";
};

const manualChargeStatusLabel = (entry: FinancialEntry) => {
    if (entry.status === "paid") return "Recebida";
    if (entry.status === "cancelled") return "Cancelada";
    if (entry.neurofinance_charge_id) return "Gerada";
    return "Pendente";
};

const agreementStatusLabel = (entry: FinancialEntry): AgreementRepassRow["status"] =>
    entry.status === "paid" ? "Conciliado" : "Nao conciliado";

const parseMoneyInput = (value: string) => {
    const normalized = value.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
    return Math.abs(Number(normalized || 0));
};

const normalizeDateInput = (value: string) => {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    const match = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return "";
    return `${match[3]}-${match[2]}-${match[1]}`;
};

const paymentMethodFromLabel = (value: string): FinancialEntryPaymentMethod => {
    const normalized = value.toLowerCase();
    if (normalized.includes("pix")) return "pix";
    if (normalized.includes("boleto")) return "boleto";
    if (normalized.includes("cartao")) return "card";
    if (normalized.includes("dinheiro")) return "cash";
    if (normalized.includes("transferencia")) return "external_transfer";
    if (normalized.includes("convenio")) return "convenio";
    return "manual";
};

const PremiumBarShape = (props: any) => {
    const { x = 0, y = 0, width = 0, height = 0, fill = "#18181b" } = props;
    const numericWidth = Number(width);
    const numericHeight = Number(height);
    const numericX = Number(x);
    const numericY = Number(y);

    if (numericHeight <= 0 || numericWidth <= 0) return null;

    const fillColor = String(fill);
    const radius = Math.min(10, numericWidth / 2);
    const glowId = `bar-glow-${fillColor.replace(/[^a-zA-Z0-9]/g, "")}-${Math.round(numericX)}-${Math.round(numericY)}`;

    return (
        <g>
            <defs>
                <filter id={glowId} x="-80%" y="-80%" width="260%" height="260%">
                    <feGaussianBlur stdDeviation="5" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            <rect
                x={numericX}
                y={numericY + numericHeight - Math.min(18, numericHeight)}
                width={numericWidth}
                height={Math.min(28, numericHeight + 10)}
                rx={radius}
                fill={fillColor}
                opacity={0.18}
                filter={`url(#${glowId})`}
            />
            <rect
                x={numericX}
                y={numericY}
                width={numericWidth}
                height={numericHeight}
                rx={radius}
                ry={radius}
                fill={fillColor}
                opacity={0.96}
            />
            <rect
                x={numericX + Math.max(2, numericWidth * 0.16)}
                y={numericY + 2}
                width={Math.max(2, numericWidth * 0.32)}
                height={Math.max(0, numericHeight - 4)}
                rx={Math.max(1, radius / 2)}
                fill="rgba(255,255,255,0.24)"
            />
            <rect
                x={numericX + 1}
                y={numericY + 1}
                width={Math.max(0, numericWidth - 2)}
                height={Math.min(12, numericHeight / 2)}
                rx={Math.max(1, radius - 1)}
                fill="rgba(255,255,255,0.16)"
            />
        </g>
    );
};

const SelectShell = ({
    options,
    defaultValue,
    value,
    onChange,
    placeholder = "Selecione",
    className,
}: {
    options: string[];
    defaultValue?: string;
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    className?: string;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [internalSelected, setInternalSelected] = useState(defaultValue ?? options[0] ?? "");
    const selected = value ?? internalSelected;
    const currentLabel = selected || placeholder;

    return (
        <div className={cn("relative", className)}>
            <button
                type="button"
                onClick={() => setIsOpen((value) => !value)}
                className={cn(
                    "group flex h-11 w-full items-center justify-between gap-3 rounded-2xl border border-zinc-200/80 bg-white/85 px-4 text-left text-sm font-bold text-zinc-700 shadow-[0_12px_34px_-30px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.8)] outline-none transition-all duration-200 hover:border-zinc-300 hover:bg-white dark:border-white/10 dark:bg-white/[0.045] dark:text-zinc-200 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] dark:hover:bg-white/[0.07]",
                    isOpen && "border-zinc-400 ring-4 ring-zinc-950/[0.035] dark:border-white/20 dark:ring-white/[0.045]"
                )}
            >
                <span className={cn("truncate", !selected && "text-zinc-400")}>{currentLabel}</span>
                <ChevronRight className={cn("h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-300 ease-out group-hover:text-zinc-700 dark:group-hover:text-zinc-200", isOpen && "rotate-90")} />
            </button>

            <AnimatePresence>
                {isOpen ? (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98, filter: "blur(6px)" }}
                        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: 8, scale: 0.98, filter: "blur(6px)" }}
                        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute left-0 right-0 top-[calc(100%+8px)] z-[230] max-h-64 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/95 p-1.5 shadow-[0_28px_90px_-38px_rgba(0,0,0,0.85)] backdrop-blur-3xl dark:border-white/10 dark:bg-zinc-950/95"
                    >
                        <div className="custom-scrollbar max-h-60 overflow-y-auto pr-1">
                            {options.map((option) => {
                                const isSelected = option === selected;
                                return (
                                    <button
                                        key={option}
                                        type="button"
                                        onClick={() => {
                                            setInternalSelected(option);
                                            onChange?.(option);
                                            setIsOpen(false);
                                        }}
                                        className={cn(
                                            "flex min-h-10 w-full items-center justify-between gap-3 rounded-xl px-3 text-left text-sm font-bold transition-all duration-150",
                                            isSelected
                                                ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"
                                                : "text-zinc-500 hover:bg-zinc-950/[0.045] hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
                                        )}
                                    >
                                        <span className="truncate">{option}</span>
                                        {isSelected ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : null}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    );
};

const InputShell = ({
    placeholder,
    className,
    type = "text",
    value,
    onChange,
}: {
    placeholder?: string;
    className?: string;
    type?: string;
    value?: string;
    onChange?: (value: string) => void;
}) => (
    <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        className={cn(
            "h-11 rounded-2xl border border-zinc-200 bg-white/70 px-4 text-sm font-bold text-zinc-600 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 dark:border-white/10 dark:bg-white/[0.035] dark:text-zinc-200",
            className
        )}
    />
);

const FormLabel = ({ children, required }: { children: ReactNode; required?: boolean }) => (
    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
        {children}
        {required ? <span className="ml-1 text-zinc-950 dark:text-white">*</span> : null}
    </label>
);

const TogglePill = ({ active, onClick }: { active: boolean; onClick: () => void }) => (
    <button
        type="button"
        onClick={onClick}
        className={cn(
            "flex h-8 w-[72px] items-center rounded-xl border p-0.5 transition-colors",
            active
                ? "border-zinc-950 bg-zinc-950 dark:border-white dark:bg-white"
                : "border-zinc-200 bg-white dark:border-white/10 dark:bg-white/[0.035]"
        )}
    >
        <span
            className={cn(
                "flex h-7 w-10 items-center justify-center rounded-[10px] text-[10px] font-black uppercase transition-transform",
                active
                    ? "translate-x-0 bg-white text-zinc-950 dark:bg-zinc-950 dark:text-white"
                    : "translate-x-7 bg-zinc-400 text-white dark:bg-zinc-600"
            )}
        >
            {active ? "Sim" : "Nao"}
        </span>
    </button>
);

const PremiumModal = ({
    open,
    title,
    children,
    onClose,
    footer,
    size = "max-w-2xl",
}: {
    open: boolean;
    title: string;
    children: ReactNode;
    onClose: () => void;
    footer?: ReactNode;
    size?: string;
}) => {
    return (
        <ResponsiveModal
            open={open}
            onOpenChange={(nextOpen) => {
                if (!nextOpen) onClose();
            }}
            className={cn(
                "max-h-[88vh] w-[94vw] gap-0 overflow-hidden rounded-[32px] border border-zinc-200/80 bg-white/95 p-0 shadow-[0_54px_120px_-48px_rgba(0,0,0,0.62)] ring-1 ring-black/5 backdrop-blur-3xl outline-none dark:border-white/[0.08] dark:bg-[#080809]/95 dark:ring-white/5 [&>button]:hidden",
                size
            )}
            drawerClassName="bg-white dark:bg-[#080809]"
        >
            <div className="relative flex max-h-[88vh] min-h-0 flex-col overflow-hidden">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-zinc-500/[0.035] to-transparent dark:from-white/[0.025]" />
                <div className="premium-noise pointer-events-none absolute inset-0 opacity-[0.018] dark:opacity-[0.045]" />
                <div className="relative z-10 flex shrink-0 items-center justify-between border-b border-zinc-200/70 px-6 py-5 dark:border-white/10 md:px-8">
                    <h2 className="text-xl font-black tracking-[-0.035em] text-zinc-950 dark:text-white md:text-2xl">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition-all hover:bg-zinc-200 hover:text-zinc-950 active:scale-95 dark:bg-white/5 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="custom-scrollbar relative z-10 min-h-0 flex-1 overflow-y-auto px-6 py-5 md:px-8 md:py-6">{children}</div>
                {footer ? (
                    <div className="relative z-10 flex shrink-0 justify-end gap-3 border-t border-zinc-200/70 bg-zinc-50/70 px-6 py-4 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.025] md:px-8">
                        {footer}
                    </div>
                ) : null}
            </div>
        </ResponsiveModal>
    );
};

const ModalButton = ({ children, variant = "primary", onClick }: { children: ReactNode; variant?: "primary" | "secondary"; onClick?: () => void }) => (
    <button
        type="button"
        onClick={onClick}
        className={cn(
            "h-11 rounded-2xl px-8 text-[11px] font-black uppercase tracking-[0.18em] transition-all active:scale-[0.98]",
            variant === "primary"
                ? "bg-zinc-950 text-white hover:opacity-90 dark:bg-white dark:text-zinc-950"
                : "border border-zinc-200 bg-white text-zinc-500 hover:text-zinc-950 dark:border-white/10 dark:bg-white/[0.035] dark:text-zinc-400 dark:hover:text-white"
        )}
    >
        {children}
    </button>
);

const FinancialEntryModal = ({ type, open, onClose }: { type: "income" | "expense"; open: boolean; onClose: () => void }) => {
    const [property, setProperty] = useState("Clinica");
    const [category, setCategory] = useState("Selecione");
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [paidDate, setPaidDate] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("-- Selecione --");
    const [notes, setNotes] = useState("");
    const [paid, setPaid] = useState(false);
    const [repeat, setRepeat] = useState(false);
    const [recurrenceFrequency, setRecurrenceFrequency] = useState("Semanalmente");
    const [recurrenceEndDate, setRecurrenceEndDate] = useState("");
    const [showNewCategory, setShowNewCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const createFinancialEntry = useCreateFinancialEntry();
    const createRecurringFinancialEntry = useCreateRecurringFinancialEntry();
    const createFinancialCategory = useCreateFinancialCategory();
    const { data: categories = [] } = useFinancialCategories(type);
    const isIncome = type === "income";
    const categoryOptions = useMemo(() => ["Selecione", ...categories.map((item) => item.name)], [categories]);
    const selectedCategory = categories.find((item) => item.name === category);
    const isSaving = createFinancialEntry.isPending || createRecurringFinancialEntry.isPending;

    const handleSave = async () => {
        const normalizedDueDate = normalizeDateInput(dueDate);
        const normalizedPaidDate = normalizeDateInput(paidDate || dueDate);
        const normalizedRecurrenceEndDate = normalizeDateInput(recurrenceEndDate);
        const parsedAmount = parseMoneyInput(amount);

        if (!normalizedDueDate || parsedAmount <= 0) return;

        try {
            const title = description || (isIncome ? "Receita manual" : "Despesa manual");
            await createFinancialEntry.mutateAsync({
                type,
                title,
                description: title,
                amount: parsedAmount,
                dueDate: new Date(`${normalizedDueDate}T12:00:00`),
                competenceDate: new Date(`${normalizedDueDate}T12:00:00`),
                paidAt: paid && normalizedPaidDate ? new Date(`${normalizedPaidDate}T12:00:00`) : null,
                status: paid ? "paid" : "pending",
                paymentMethod: paid ? paymentMethodFromLabel(paymentMethod) : "manual",
                origin: repeat ? "recurring" : "manual",
                categoryId: selectedCategory?.id || null,
                metadata: {
                    property,
                    category: selectedCategory?.name || null,
                    notes: notes || null,
                    repeat,
                },
            });

            if (repeat) {
                await createRecurringFinancialEntry.mutateAsync({
                    type,
                    title,
                    amount: parsedAmount,
                    categoryId: selectedCategory?.id || null,
                    frequency: recurrenceFrequency.includes("Mensal") ? "monthly" : recurrenceFrequency.includes("Anual") ? "yearly" : "weekly",
                    startDate: new Date(`${normalizedDueDate}T12:00:00`),
                    endDate: normalizedRecurrenceEndDate ? new Date(`${normalizedRecurrenceEndDate}T12:00:00`) : null,
                    metadata: {
                        property,
                        notes: notes || null,
                        source: "financial_entry_modal",
                    },
                });
            }

            onClose();
        } catch (error) {
            console.error("[FinancialEntryModal] Falha ao salvar lancamento gerencial", error);
        }
    };

    const handleCreateCategory = () => {
        const name = newCategoryName.trim();
        if (!name) return;
        createFinancialCategory.mutate({ type, name }, {
            onSuccess: (created) => {
                setCategory(created.name);
                setNewCategoryName("");
                setShowNewCategory(false);
            },
        });
    };

    return (
        <PremiumModal
            open={open}
            title={isIncome ? "Adicionar receita" : "Adicionar despesa"}
            onClose={onClose}
            footer={
                <>
                    <ModalButton variant="secondary" onClick={onClose}>Cancelar</ModalButton>
                    <ModalButton onClick={handleSave}>{isSaving ? "Salvando" : "Salvar"}</ModalButton>
                </>
            }
        >
            <div className="space-y-6">
                <div>
                    <FormLabel>Propriedade <HelpCircle className="ml-1 inline h-3.5 w-3.5 text-zinc-400" /></FormLabel>
                    <SelectShell className="w-full" options={["Clinica", "Particular"]} value={property} onChange={setProperty} />
                </div>

                <div className="h-px bg-zinc-200 dark:bg-white/10" />

                <div>
                    <FormLabel required>Categoria financeira <HelpCircle className="ml-1 inline h-3.5 w-3.5 text-zinc-400" /></FormLabel>
                    <div className="flex gap-3">
                        <SelectShell className="flex-1" options={categoryOptions.length > 1 ? categoryOptions : ["Selecione", ...financeFormCategories[type]]} value={category} onChange={setCategory} />
                        <button type="button" onClick={() => setShowNewCategory((value) => !value)} className="flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-500 hover:text-zinc-950 dark:border-white/10 dark:bg-white/[0.035] dark:hover:text-white">
                            <Plus className="h-4 w-4" />
                        </button>
                    </div>
                    <AnimatePresence>
                        {showNewCategory ? (
                            <motion.div
                                initial={{ opacity: 0, y: -6, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: "auto" }}
                                exit={{ opacity: 0, y: -6, height: 0 }}
                                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                                className="mt-3 overflow-hidden"
                            >
                                <div className="flex flex-col gap-3 rounded-[22px] border border-zinc-200/75 bg-zinc-50/80 p-3 dark:border-white/10 dark:bg-white/[0.025] sm:flex-row">
                                    <InputShell placeholder={`Nova categoria de ${isIncome ? "receita" : "despesa"}`} className="flex-1" value={newCategoryName} onChange={setNewCategoryName} />
                                    <button
                                        type="button"
                                        onClick={handleCreateCategory}
                                        disabled={createFinancialCategory.isPending}
                                        className="h-11 rounded-2xl bg-zinc-950 px-5 text-[10px] font-black uppercase tracking-[0.16em] text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-zinc-950"
                                    >
                                        {createFinancialCategory.isPending ? "Criando" : "Criar"}
                                    </button>
                                </div>
                            </motion.div>
                        ) : null}
                    </AnimatePresence>
                </div>

                <div>
                    <FormLabel>Descricao</FormLabel>
                    <InputShell placeholder="Digite aqui" className="w-full" value={description} onChange={setDescription} />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <FormLabel required>Valor</FormLabel>
                        <InputShell placeholder="R$ 0,00" className="w-full" value={amount} onChange={setAmount} />
                    </div>
                    <div>
                        <FormLabel required>Data de vencimento</FormLabel>
                        <InputShell type="date" placeholder="__/__/____" className="w-full" value={dueDate} onChange={setDueDate} />
                    </div>
                </div>

                <div className="h-px bg-zinc-200 dark:bg-white/10" />

                <div className="flex flex-wrap items-center gap-4">
                    <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Marcar como Pago:</span>
                    <TogglePill active={paid} onClick={() => setPaid((value) => !value)} />
                </div>

                {paid ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <FormLabel required>Data de pagamento</FormLabel>
                            <InputShell type="date" placeholder="__/__/____" className="w-full" value={paidDate} onChange={setPaidDate} />
                        </div>
                        <div>
                            <FormLabel>Forma de pagamento</FormLabel>
                            <SelectShell className="w-full" options={["-- Selecione --", ...paymentMethods]} value={paymentMethod} onChange={setPaymentMethod} />
                        </div>
                    </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-4">
                    <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Repetir evento: <HelpCircle className="ml-1 inline h-3.5 w-3.5 text-zinc-400" /></span>
                    <TogglePill active={repeat} onClick={() => setRepeat((value) => !value)} />
                </div>

                {repeat ? (
                    <div className="space-y-4 rounded-[24px] border border-zinc-200/70 bg-zinc-50/70 p-4 dark:border-white/10 dark:bg-white/[0.025]">
                        <div>
                            <FormLabel>Escolha a recorrencia</FormLabel>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                <SelectShell className="w-full" options={["Semanalmente", "Mensalmente", "Anualmente"]} value={recurrenceFrequency} onChange={setRecurrenceFrequency} />
                                <InputShell placeholder="Toda Segunda-Feira" className="w-full opacity-70" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <label className="flex items-center gap-3 text-sm font-bold text-zinc-600 dark:text-zinc-300">
                                <input type="radio" defaultChecked className="h-4 w-4" />
                                Terminar apos:
                                <InputShell type="number" placeholder="1" className="w-24" />
                                repeticao(oes)
                            </label>
                            <label className="flex items-center gap-3 text-sm font-bold text-zinc-600 dark:text-zinc-300">
                                <input type="radio" className="h-4 w-4" />
                                Terminar em:
                                <InputShell type="date" placeholder="__/__/____" className="w-36" value={recurrenceEndDate} onChange={setRecurrenceEndDate} />
                            </label>
                        </div>
                    </div>
                ) : null}

                <div>
                    <FormLabel>Observacoes</FormLabel>
                    <textarea
                        placeholder="Digite aqui"
                        value={notes}
                        onChange={(event) => setNotes(event.target.value.slice(0, 400))}
                        className="min-h-[112px] w-full rounded-2xl border border-zinc-200 bg-white/70 px-4 py-3 text-sm font-bold text-zinc-600 outline-none placeholder:text-zinc-400 focus:border-zinc-400 dark:border-white/10 dark:bg-white/[0.035] dark:text-zinc-200"
                    />
                    <p className="mt-2 text-xs font-bold text-zinc-400">{notes.length} de 400 caracteres</p>
                </div>
            </div>
        </PremiumModal>
    );
};

const ManualChargeModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
    const [client, setClient] = useState("-- Selecione --");
    const [dueDate, setDueDate] = useState("");
    const [amount, setAmount] = useState("");
    const [chargeType, setChargeType] = useState("-- Selecione --");
    const [description, setDescription] = useState("");
    const createFinancialEntry = useCreateFinancialEntry();

    const handleCreate = () => {
        const normalizedDueDate = normalizeDateInput(dueDate);
        const parsedAmount = parseMoneyInput(amount);
        if (!normalizedDueDate || parsedAmount <= 0 || !description.trim()) return;

        createFinancialEntry.mutate({
            type: "income",
            title: description.trim(),
            description: description.trim(),
            amount: parsedAmount,
            dueDate: new Date(`${normalizedDueDate}T12:00:00`),
            competenceDate: new Date(`${normalizedDueDate}T12:00:00`),
            status: "pending",
            paymentMethod: paymentMethodFromLabel(chargeType),
            origin: "manual",
            metadata: {
                manual_charge: true,
                client: client === "-- Selecione --" ? null : client,
                charge_type: chargeType === "-- Selecione --" ? null : chargeType,
                source: "financial_management_manual_charge",
            },
        }, {
            onSuccess: () => {
                setClient("-- Selecione --");
                setDueDate("");
                setAmount("");
                setChargeType("-- Selecione --");
                setDescription("");
                onClose();
            },
        });
    };

    const canCreate = Boolean(normalizeDateInput(dueDate)) && parseMoneyInput(amount) > 0 && Boolean(description.trim());

    return (
        <PremiumModal
            open={open}
            title="Gerar Cobranca Manual"
            onClose={onClose}
            footer={
                <>
                    <ModalButton variant="secondary" onClick={onClose}>Cancelar</ModalButton>
                    <button
                        type="button"
                        onClick={handleCreate}
                        disabled={!canCreate || createFinancialEntry.isPending}
                        className={cn(
                            "h-11 rounded-2xl px-8 text-[11px] font-black uppercase tracking-[0.18em] text-white transition-all active:scale-[0.98]",
                            canCreate && !createFinancialEntry.isPending
                                ? "bg-zinc-950 hover:opacity-90 dark:bg-white dark:text-zinc-950"
                                : "cursor-not-allowed bg-zinc-300 dark:bg-white/20"
                        )}
                    >
                        {createFinancialEntry.isPending ? "Gerando" : "Gerar Cobranca"}
                    </button>
                </>
            }
        >
            <div className="space-y-6">
                <div>
                    <FormLabel>Cliente</FormLabel>
                    <SelectShell className="w-full" options={["-- Selecione --", "Cliente avulso", "Paciente nao vinculado"]} value={client} onChange={setClient} />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                        <FormLabel required>Vencimento</FormLabel>
                        <InputShell type="date" placeholder="08/06/2026" className="w-full" value={dueDate} onChange={setDueDate} />
                    </div>
                    <div>
                        <FormLabel required>Valor</FormLabel>
                        <InputShell placeholder="R$ 0,00" className="w-full" value={amount} onChange={setAmount} />
                    </div>
                    <div>
                        <FormLabel>Tipo de cobranca</FormLabel>
                        <SelectShell className="w-full" options={["-- Selecione --", "Pix", "Boleto", "Cartao"]} value={chargeType} onChange={setChargeType} />
                    </div>
                </div>
                <div>
                    <FormLabel required>Descricao</FormLabel>
                    <InputShell placeholder="Digite aqui" className="w-full md:w-1/2" value={description} onChange={setDescription} />
                </div>
                <div className="rounded-[28px] border border-dashed border-zinc-200 bg-zinc-50/70 p-6 text-center text-sm font-bold leading-relaxed text-zinc-500 dark:border-white/10 dark:bg-white/[0.025] dark:text-zinc-400">
                    Esta acao cria uma receita pendente na Gestao Financeira. Ela nao cria cobranca bancaria Asaas nem movimentacao NeuroFinance.
                </div>
            </div>
        </PremiumModal>
    );
};

const OptionsDropdown = ({
    id,
    openMenu,
    setOpenMenu,
    items,
}: {
    id: Exclude<ManagementOptionsMenu, null>;
    openMenu: ManagementOptionsMenu;
    setOpenMenu: (menu: ManagementOptionsMenu) => void;
    items: { label: string; icon: LucideIcon; onClick: () => void; danger?: boolean }[];
}) => {
    const isOpen = openMenu === id;

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpenMenu(isOpen ? null : id)}
                className="inline-flex h-11 items-center gap-3 rounded-2xl border border-zinc-200 bg-white/70 px-5 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600 shadow-sm transition-colors hover:text-zinc-950 dark:border-white/10 dark:bg-white/[0.035] dark:text-zinc-300 dark:hover:text-white"
            >
                <MoreHorizontal className="h-4 w-4" />
                Opcoes
                <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-90")} />
            </button>
            <AnimatePresence>
                {isOpen ? (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        className="absolute right-0 top-14 z-[120] w-72 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-2 shadow-2xl dark:border-white/10 dark:bg-zinc-950"
                    >
                        {items.map((item) => (
                            <button
                                key={item.label}
                                type="button"
                                onClick={() => {
                                    setOpenMenu(null);
                                    item.onClick();
                                }}
                                className={cn(
                                    "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-xs font-black uppercase tracking-[0.1em] transition-colors",
                                    item.danger
                                        ? "text-zinc-950 hover:bg-zinc-950/10 dark:text-white dark:hover:bg-white/10"
                                        : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 dark:hover:bg-white/5 dark:hover:text-white"
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </button>
                        ))}
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    );
};

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

const ManagementOverview = ({
    motionProps,
    cards,
    chartData,
    overdueRows,
    selectedYear,
    yearOptions,
    onYearChange,
}: {
    motionProps: any;
    cards: MetricCard[];
    chartData: FinancialMonthlyPoint[];
    overdueRows: OverdueIncomeRow[];
    selectedYear: number;
    yearOptions: string[];
    onYearChange: (value: string) => void;
}) => (
    <motion.div {...motionProps} key="management-overview" className="space-y-6 px-6 py-6">
        <ManagementSectionHeader icon={PieChart} title="Visao Geral" subtitle="Resultado previsto, receitas, despesas e atrasos" />

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            {cards.map((card) => (
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
                            Ledger real
                        </span>
                    </div>
                    <p className="mt-2 max-w-xl text-xs font-medium leading-relaxed text-zinc-500 dark:text-zinc-400">
                        Grafico combinado para Receitas e Despesas a partir dos lancamentos gerenciais do periodo.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">Ano</span>
                    <SelectShell className="w-32" options={yearOptions} value={String(selectedYear)} onChange={onYearChange} />
                </div>
            </div>

            <div className="relative z-10 h-[360px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} barCategoryGap="22%" barGap={5} margin={{ top: 16, right: 24, bottom: 8, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-zinc-200 dark:text-white/10" />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: "currentColor" }} className="text-zinc-400" />
                        <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `R$${Number(value) / 1000}k`} tick={{ fontSize: 10, fontWeight: 800, fill: "currentColor" }} className="text-zinc-400" />
                        <Tooltip
                            formatter={(value: number, name: string) => [moneyFormatter(Number(value)), name]}
                            cursor={{ fill: "rgba(24,24,27,0.035)", radius: 18 }}
                            contentStyle={{
                                borderRadius: 18,
                                border: "1px solid rgba(148,163,184,.25)",
                                background: "rgba(9,9,11,.92)",
                                color: "white",
                                boxShadow: "0 18px 60px -30px rgba(0,0,0,.8)",
                            }}
                            labelStyle={{ color: "rgba(255,255,255,.65)", fontWeight: 800 }}
                        />
                        <Bar name="Receitas Pagas" dataKey="paidIncome" stackId="income" fill="#10b981" barSize={18} maxBarSize={22} shape={<PremiumBarShape />} />
                        <Bar name="Receitas Nao Pagas" dataKey="unpaidIncome" stackId="income" fill="#86efac" barSize={18} maxBarSize={22} shape={<PremiumBarShape />} />
                        <Bar name="Despesas Pagas" dataKey="paidExpenses" stackId="expenses" fill="#f43f5e" barSize={18} maxBarSize={22} shape={<PremiumBarShape />} />
                        <Bar name="Despesas Nao Pagas" dataKey="unpaidExpenses" stackId="expenses" fill="#fda4af" barSize={18} maxBarSize={22} shape={<PremiumBarShape />} />
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
                <span className="w-fit rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.16em] text-zinc-500 dark:border-white/10 dark:bg-white/[0.035] dark:text-zinc-400">
                    {overdueRows.length} em aberto
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
                        {overdueRows.length > 0 ? (
                            overdueRows.map((row) => (
                                <tr key={`${row.patient}-${row.due}-${row.description}`} className="bg-white/50 text-sm dark:bg-white/[0.01]">
                                    <td className="px-5 py-4 font-black text-zinc-900 dark:text-white">{row.patient}</td>
                                    <td className="px-5 py-4 text-zinc-500 dark:text-zinc-400">{row.description}</td>
                                    <td className="px-5 py-4 text-zinc-500 dark:text-zinc-400">{row.due}</td>
                                    <td className="px-5 py-4 text-right font-black text-zinc-900 dark:text-white">{row.amount}</td>
                                </tr>
                            ))
                        ) : (
                            <EmptyTableRow colSpan={4} title="Nenhuma receita atrasada no periodo" description="Quando houver lancamentos vencidos e nao pagos, eles aparecem aqui." />
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    </motion.div>
);

const FinanceMetricCards = ({ cards }: { cards: { title: string; value: string; footer: string[]; icon: LucideIcon; tone?: string }[] }) => (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {cards.map((card) => (
            <div key={card.title} className="relative overflow-hidden rounded-[32px] border border-zinc-200/60 bg-white/72 p-6 shadow-[0_18px_70px_-55px_rgba(0,0,0,0.95)] backdrop-blur-2xl dark:border-white/[0.055] dark:bg-white/[0.018]">
                <div className="premium-noise pointer-events-none absolute inset-0 opacity-[0.016] dark:opacity-[0.04]" />
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-950/10 to-transparent dark:via-white/12" />
                <div className="relative z-10 flex items-start justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.26em] text-zinc-500 dark:text-zinc-500">{card.title}</p>
                        <p className="mt-5 text-4xl font-black tracking-[-0.055em] text-zinc-950 dark:text-white">{card.value}</p>
                    </div>
                    <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-zinc-950/10 bg-zinc-950 text-white shadow-[0_18px_45px_-28px_rgba(0,0,0,0.9)] dark:border-white/15 dark:bg-white dark:text-zinc-950", card.tone)}>
                        <card.icon className="h-5 w-5" />
                    </div>
                </div>
                <div className="relative z-10 mt-6 flex flex-wrap gap-2">
                    {card.footer.map((item) => (
                        <span key={item} className="rounded-full border border-zinc-200/75 bg-zinc-50/90 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-zinc-600 dark:border-white/10 dark:bg-white/[0.035] dark:text-zinc-400">
                            {item}
                        </span>
                    ))}
                </div>
            </div>
        ))}
    </div>
);

const FinanceToolbar = ({
    periodLabel = "Ano",
    periodValue = "2026",
    periodOptions = ["2026", "2025", "2024"],
    onPeriodChange,
    addLabel,
    onAdd,
    options,
}: {
    periodLabel?: string;
    periodValue?: string;
    periodOptions?: string[];
    onPeriodChange?: (value: string) => void;
    addLabel?: string;
    onAdd?: () => void;
    options?: ReactNode;
}) => (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex w-fit items-center gap-3">
            <span className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">{periodLabel}</span>
            <SelectShell className="w-36" options={periodOptions} value={periodValue} onChange={onPeriodChange} />
        </div>
        <div className="flex flex-wrap gap-3">
            {addLabel && onAdd ? (
                <button
                    type="button"
                    onClick={onAdd}
                    className="inline-flex h-11 items-center gap-3 rounded-2xl bg-zinc-950 px-5 text-[10px] font-black uppercase tracking-[0.16em] text-white shadow-xl transition-opacity hover:opacity-90 dark:bg-white dark:text-zinc-950"
                >
                    <Plus className="h-4 w-4" />
                    {addLabel}
                </button>
            ) : null}
            {options}
        </div>
    </div>
);

const FinancialBarsChart = ({
    title,
    subtitle,
    bars,
    lineKey,
    lineName,
    data,
}: {
    title: string;
    subtitle: string;
    bars: { key: string; name: string; fill: string; stackId?: string }[];
    lineKey: string;
    lineName: string;
    data: ChartPoint[];
}) => (
    <section className="relative overflow-hidden rounded-[34px] border border-zinc-200/50 bg-white/55 p-6 shadow-sm backdrop-blur-2xl dark:border-white/[0.045] dark:bg-white/[0.012]">
        <div className="premium-noise pointer-events-none absolute inset-0 opacity-[0.018] dark:opacity-[0.04]" />
        <div className="relative z-10 mb-6">
            <h3 className="text-lg font-black uppercase tracking-tight text-zinc-950 dark:text-white">{title}</h3>
            <p className="mt-2 max-w-xl text-xs font-medium leading-relaxed text-zinc-500 dark:text-zinc-400">{subtitle}</p>
        </div>
        <div className="relative z-10 h-[330px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} barCategoryGap="24%" barGap={5} margin={{ top: 16, right: 24, bottom: 8, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-zinc-200 dark:text-white/10" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: "currentColor" }} className="text-zinc-400" />
                    <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `R$${Number(value) / 1000}k`} tick={{ fontSize: 10, fontWeight: 800, fill: "currentColor" }} className="text-zinc-400" />
                    <Tooltip
                        formatter={(value: number, name: string) => [moneyFormatter(Number(value)), name]}
                        cursor={{ fill: "rgba(24,24,27,0.035)", radius: 18 }}
                        contentStyle={{
                            borderRadius: 18,
                            border: "1px solid rgba(148,163,184,.25)",
                            background: "rgba(9,9,11,.92)",
                            color: "white",
                            boxShadow: "0 18px 60px -30px rgba(0,0,0,.8)",
                        }}
                        labelStyle={{ color: "rgba(255,255,255,.65)", fontWeight: 800 }}
                    />
                    {bars.map((bar) => (
                        <Bar key={bar.key} name={bar.name} dataKey={bar.key} stackId={bar.stackId} fill={bar.fill} barSize={18} maxBarSize={22} shape={<PremiumBarShape />} />
                    ))}
                    <Line name={lineName} type="monotone" dataKey={lineKey} stroke="#18181b" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
        <div className="relative z-10 mt-6 flex flex-wrap gap-3">
            {bars.map((bar) => (
                <div key={bar.key} className="flex items-center gap-2 rounded-full border border-zinc-200/70 bg-zinc-50/80 px-3 py-1.5 dark:border-white/10 dark:bg-white/[0.035]">
                    <span className="h-2 w-2 rounded-full" style={{ background: bar.fill }} />
                    <span className="text-[9px] font-black uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">{bar.name}</span>
                </div>
            ))}
            <div className="flex items-center gap-2 rounded-full border border-zinc-200/70 bg-zinc-50/80 px-3 py-1.5 dark:border-white/10 dark:bg-white/[0.035]">
                <span className="h-2 w-6 rounded-full bg-zinc-950 dark:bg-white" />
                <span className="text-[9px] font-black uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">{lineName}</span>
            </div>
        </div>
    </section>
);

const InfoBlock = ({ children }: { children: ReactNode }) => (
    <div className="rounded-[26px] border border-zinc-200/75 bg-zinc-50/85 p-5 text-sm font-medium leading-relaxed text-zinc-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:border-white/10 dark:bg-white/[0.035] dark:text-zinc-300">
        {children}
    </div>
);

const EmptyTableRow = ({
    colSpan,
    title,
    description,
}: {
    colSpan: number;
    title: string;
    description: string;
}) => (
    <tr className="bg-white/50 dark:bg-white/[0.01]">
        <td colSpan={colSpan} className="px-5 py-10 text-center">
            <p className="text-sm font-black text-zinc-800 dark:text-white">{title}</p>
            <p className="mt-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">{description}</p>
        </td>
    </tr>
);

const IncomeView = ({
    motionProps,
    rows,
    cards,
    chartData,
    periodLabel,
    selectedYear,
    yearOptions,
    onYearChange,
    onAdd,
    onManualCharge,
    openMenu,
    setOpenMenu,
}: {
    motionProps: any;
    rows: IncomeRow[];
    cards: MetricCard[];
    chartData: FinancialMonthlyPoint[];
    periodLabel: string;
    selectedYear: number;
    yearOptions: string[];
    onYearChange: (value: string) => void;
    onAdd: () => void;
    onManualCharge: () => void;
    openMenu: ManagementOptionsMenu;
    setOpenMenu: (menu: ManagementOptionsMenu) => void;
}) => (
    <motion.div {...motionProps} key="income-view" className="space-y-6 px-6 py-6">
        <ManagementSectionHeader icon={TrendingUp} title="Receitas" subtitle="Entradas previstas, pagas e nao pagas" />
        <FinanceToolbar
            periodValue={String(selectedYear)}
            periodOptions={yearOptions}
            onPeriodChange={onYearChange}
            addLabel="Adicionar receita"
            onAdd={onAdd}
            options={
                <OptionsDropdown
                    id="income"
                    openMenu={openMenu}
                    setOpenMenu={setOpenMenu}
                    items={[
                        { label: "Exportar relatorio em PDF", icon: FileText, onClick: () => undefined },
                        { label: "Exportar relatorio em Excel", icon: Download, onClick: () => undefined },
                        { label: "Nova cobranca", icon: CreditCard, onClick: onManualCharge },
                    ]}
                />
            }
        />
        <FinanceMetricCards cards={cards} />
        <FinancialBarsChart
            title="Receitas previstas"
            subtitle="Visualizacao de receitas pagas, nao pagas e total previsto por mes."
            data={chartData}
            bars={[
                { key: "paidIncome", name: "Receitas Pagas", fill: "#10b981", stackId: "income" },
                { key: "unpaidIncome", name: "Receitas Nao Pagas", fill: "#86efac", stackId: "income" },
            ]}
            lineKey="totalIncome"
            lineName="Total previsto"
        />
        <InfoBlock>
            <p>A listagem abaixo sao todas as entradas lancadas no sistema, compostas por sessoes ou outras receitas, que:</p>
            <p className="mt-3 font-black">1- Foram Pagas no Periodo: {periodLabel}.</p>
            <p className="mt-1 font-black">2- Possuem status de Nao pago com a Data de Vencimento no Periodo: {periodLabel}.</p>
            <p className="mt-3">Nao encontrou o que precisa nessa lista? Clique aqui pois disponibilizamos um novo relatorio chamado: <span className="font-black">Pagamento por Sessao</span>. Se mesmo assim nao te ajudar, entre em contato com nossa equipe.</p>
        </InfoBlock>
        <section className="relative overflow-hidden rounded-[34px] border border-zinc-200/50 bg-white/55 p-6 shadow-sm backdrop-blur-2xl dark:border-white/[0.045] dark:bg-white/[0.012]">
            <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-black uppercase tracking-tight text-zinc-950 dark:text-white">Lista de receitas</h3>
                    <p className="mt-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">Entradas gerenciais do periodo selecionado.</p>
                </div>
                <div className="flex h-10 items-center gap-2 rounded-2xl border border-zinc-200 bg-white/70 px-4 dark:border-white/10 dark:bg-white/[0.035]">
                    <Search className="h-4 w-4 text-zinc-400" />
                    <span className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-400">Buscar</span>
                </div>
            </div>
            <div className="overflow-hidden rounded-[24px] border border-zinc-200/70 dark:border-white/10">
                <table className="w-full min-w-[860px] border-collapse text-left">
                    <thead className="bg-zinc-50/90 dark:bg-white/[0.035]">
                        <tr className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">
                            <th className="px-5 py-4">Paciente</th>
                            <th className="px-5 py-4">Descricao</th>
                            <th className="px-5 py-4">Origem</th>
                            <th className="px-5 py-4">Vencimento</th>
                            <th className="px-5 py-4">Status</th>
                            <th className="px-5 py-4 text-right">Valor</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/70 dark:divide-white/10">
                        {rows.length > 0 ? (
                            rows.map((row) => (
                                <tr key={`${row.patient}-${row.due}-${row.description}`} className="bg-white/50 text-sm dark:bg-white/[0.01]">
                                    <td className="px-5 py-4 font-black text-zinc-900 dark:text-white">{row.patient}</td>
                                    <td className="px-5 py-4 text-zinc-500 dark:text-zinc-400">{row.description}</td>
                                    <td className="px-5 py-4 text-zinc-500 dark:text-zinc-400">{row.origin}</td>
                                    <td className="px-5 py-4 text-zinc-500 dark:text-zinc-400">{row.due}</td>
                                    <td className="px-5 py-4">
                                        <span className={cn("rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em]", row.status === "Pago" ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950" : "border border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-white/10 dark:bg-white/[0.035] dark:text-zinc-300")}>{row.status}</span>
                                    </td>
                                    <td className="px-5 py-4 text-right font-black text-zinc-900 dark:text-white">{row.amount}</td>
                                </tr>
                            ))
                        ) : (
                            <EmptyTableRow colSpan={6} title="Nenhuma receita encontrada" description="Receitas manuais, de agenda ou NeuroFinance aparecem aqui quando existirem no periodo." />
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    </motion.div>
);

const ExpensesView = ({
    motionProps,
    rows,
    cards,
    chartData,
    selectedYear,
    yearOptions,
    onYearChange,
    selectedIds,
    toggleSelected,
    onAdd,
    onDeleteSelected,
    openMenu,
    setOpenMenu,
}: {
    motionProps: any;
    rows: ExpenseRow[];
    cards: MetricCard[];
    chartData: FinancialMonthlyPoint[];
    selectedYear: number;
    yearOptions: string[];
    onYearChange: (value: string) => void;
    selectedIds: string[];
    toggleSelected: (id: string) => void;
    onAdd: () => void;
    onDeleteSelected: () => void;
    openMenu: ManagementOptionsMenu;
    setOpenMenu: (menu: ManagementOptionsMenu) => void;
}) => (
    <motion.div {...motionProps} key="expenses-view" className="space-y-6 px-6 py-6">
        <ManagementSectionHeader icon={TrendingDown} title="Despesas" subtitle="Saidas previstas, pagas e nao pagas" />
        <FinanceToolbar
            periodLabel="Ano"
            periodValue={String(selectedYear)}
            periodOptions={yearOptions}
            onPeriodChange={onYearChange}
            addLabel="Adicionar despesa"
            onAdd={onAdd}
            options={
                <OptionsDropdown
                    id="expenses"
                    openMenu={openMenu}
                    setOpenMenu={setOpenMenu}
                    items={[
                        { label: "Exportar relatorio em PDF", icon: FileText, onClick: () => undefined },
                        { label: "Exportar relatorio em Excel", icon: Download, onClick: () => undefined },
                        { label: "Excluir despesa", icon: Trash2, onClick: onDeleteSelected, danger: true },
                    ]}
                />
            }
        />
        <FinanceMetricCards cards={cards} />
        <FinancialBarsChart
            title="Despesas previstas"
            subtitle="Visualizacao de despesas pagas, nao pagas e total mensal previsto."
            data={chartData}
            bars={[
                { key: "paidExpenses", name: "Despesas Pagas", fill: "#f43f5e", stackId: "expenses" },
                { key: "unpaidExpenses", name: "Despesas Nao Pagas", fill: "#fda4af", stackId: "expenses" },
            ]}
            lineKey="totalExpenses"
            lineName="Total de despesas"
        />
        <section className="relative overflow-hidden rounded-[34px] border border-zinc-200/50 bg-white/55 p-6 shadow-sm backdrop-blur-2xl dark:border-white/[0.045] dark:bg-white/[0.012]">
            <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <h3 className="text-lg font-black uppercase tracking-tight text-zinc-950 dark:text-white">Lista de despesas</h3>
                    <p className="mt-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">Selecione despesas para excluir lancamentos gerenciais.</p>
                </div>
                <span className="rounded-full bg-zinc-950 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.16em] text-white dark:bg-white dark:text-zinc-950">
                    {selectedIds.length} selecionada(s)
                </span>
            </div>
            <div className="overflow-hidden rounded-[24px] border border-zinc-200/70 dark:border-white/10">
                <table className="w-full min-w-[860px] border-collapse text-left">
                    <thead className="bg-zinc-50/90 dark:bg-white/[0.035]">
                        <tr className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">
                            <th className="px-5 py-4">Selecionar</th>
                            <th className="px-5 py-4">Categoria</th>
                            <th className="px-5 py-4">Descricao</th>
                            <th className="px-5 py-4">Propriedade</th>
                            <th className="px-5 py-4">Vencimento</th>
                            <th className="px-5 py-4">Status</th>
                            <th className="px-5 py-4 text-right">Valor</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/70 dark:divide-white/10">
                        {rows.length > 0 ? (
                            rows.map((row) => (
                                <tr key={row.id} className="bg-white/50 text-sm dark:bg-white/[0.01]">
                                    <td className="px-5 py-4">
                                        <input type="checkbox" checked={selectedIds.includes(row.id)} onChange={() => toggleSelected(row.id)} className="h-4 w-4 rounded border-zinc-300" />
                                    </td>
                                    <td className="px-5 py-4 font-black text-zinc-900 dark:text-white">{row.category}</td>
                                    <td className="px-5 py-4 text-zinc-500 dark:text-zinc-400">{row.description}</td>
                                    <td className="px-5 py-4 text-zinc-500 dark:text-zinc-400">{row.property}</td>
                                    <td className="px-5 py-4 text-zinc-500 dark:text-zinc-400">{row.due}</td>
                                    <td className="px-5 py-4">
                                        <span className={cn("rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em]", row.status === "Pago" ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950" : "border border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-white/10 dark:bg-white/[0.035] dark:text-zinc-300")}>{row.status}</span>
                                    </td>
                                    <td className="px-5 py-4 text-right font-black text-zinc-900 dark:text-white">{row.amount}</td>
                                </tr>
                            ))
                        ) : (
                            <EmptyTableRow colSpan={7} title="Nenhuma despesa encontrada" description="Despesas criadas manualmente ou por recorrencia aparecem aqui quando existirem no periodo." />
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    </motion.div>
);

const StatementView = ({
    motionProps,
    rows,
    cards,
    periodLabel,
    openMenu,
    setOpenMenu,
}: {
    motionProps: any;
    rows: StatementRow[];
    cards: MetricCard[];
    periodLabel: string;
    openMenu: ManagementOptionsMenu;
    setOpenMenu: (menu: ManagementOptionsMenu) => void;
}) => (
    <motion.div {...motionProps} key="statement-view" className="space-y-6 px-6 py-6">
        <ManagementSectionHeader icon={ClipboardList} title="Extrato" subtitle="Pagamentos gerenciais no periodo" />
        <section className="relative overflow-hidden rounded-[34px] border border-zinc-200/50 bg-white/55 p-6 shadow-sm backdrop-blur-2xl dark:border-white/[0.045] dark:bg-white/[0.012]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-4">
                    <span className="text-lg font-bold text-zinc-800 dark:text-zinc-200">Periodo:</span>
                    <SelectShell className="w-64" options={[periodLabel]} value={periodLabel} />
                    <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-200 bg-white/70 text-zinc-500 dark:border-white/10 dark:bg-white/[0.035]">
                        <Eye className="h-4 w-4" />
                    </button>
                </div>
                <OptionsDropdown
                    id="statement"
                    openMenu={openMenu}
                    setOpenMenu={setOpenMenu}
                    items={[
                        { label: "Exportar relatorio em PDF", icon: FileText, onClick: () => undefined },
                        { label: "Exportar relatorio em Excel", icon: Download, onClick: () => undefined },
                    ]}
                />
            </div>
        </section>
        <FinanceMetricCards cards={cards} />
        <InfoBlock>
            <p>O relatorio do <span className="font-black">Extrato</span> e composto pela listagem de todas as <span className="font-black">Receitas e Despesas</span> com <span className="font-black">Data de Pagamento</span> dentro do <span className="font-black">Periodo: {periodLabel}</span>.</p>
            <p>O relatorio mostra somente pagamentos com algum valor. Pagamentos R$0,00 nao serao exibidos no relatorio.</p>
            <p>As totalizacoes podem nao coincidir com o modulo Financeiro do sistema, pois sao utilizadas formas diferentes para o calculo.</p>
        </InfoBlock>
        <div className="flex flex-wrap gap-3">
            {["Razao: Todas", "Propriedade: Todas", "Categoria Financeira: Todas"].map((filter) => (
                <button key={filter} className="inline-flex h-11 items-center gap-2 rounded-2xl border border-zinc-200 bg-white/70 px-5 text-sm font-bold text-zinc-500 dark:border-white/10 dark:bg-white/[0.035] dark:text-zinc-300">
                    <Filter className="h-4 w-4" />
                    {filter}
                </button>
            ))}
        </div>
        <section className="relative overflow-hidden rounded-[34px] border border-zinc-200/50 bg-white/55 p-6 shadow-sm backdrop-blur-2xl dark:border-white/[0.045] dark:bg-white/[0.012]">
            <div className="overflow-hidden rounded-[24px] border border-zinc-200/70 dark:border-white/10">
                <table className="w-full min-w-[860px] border-collapse text-left">
                    <thead className="bg-zinc-50/90 dark:bg-white/[0.035]">
                        <tr className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">
                            <th className="px-5 py-4">Data</th>
                            <th className="px-5 py-4">Descricao</th>
                            <th className="px-5 py-4">Razao</th>
                            <th className="px-5 py-4">Propriedade</th>
                            <th className="px-5 py-4">Categoria</th>
                            <th className="px-5 py-4 text-right">Valor</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/70 dark:divide-white/10">
                        {rows.length > 0 ? (
                            rows.map((row) => (
                                <tr key={`${row.date}-${row.description}`} className="bg-white/50 text-sm dark:bg-white/[0.01]">
                                    <td className="px-5 py-4 font-black text-zinc-900 dark:text-white">{row.date}</td>
                                    <td className="px-5 py-4 text-zinc-500 dark:text-zinc-400">{row.description}</td>
                                    <td className="px-5 py-4 text-zinc-500 dark:text-zinc-400">{row.reason}</td>
                                    <td className="px-5 py-4 text-zinc-500 dark:text-zinc-400">{row.property}</td>
                                    <td className="px-5 py-4 text-zinc-500 dark:text-zinc-400">{row.category}</td>
                                    <td className={cn("px-5 py-4 text-right font-black", row.amount.startsWith("-") ? "text-zinc-500 dark:text-zinc-400" : "text-zinc-950 dark:text-white")}>{row.amount}</td>
                                </tr>
                            ))
                        ) : (
                            <EmptyTableRow colSpan={6} title="Nenhum pagamento no periodo" description="Apenas receitas e despesas pagas aparecem no extrato gerencial." />
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    </motion.div>
);

const CashFlowIntroModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => (
    <PremiumModal open={open} title="Conheca o Fluxo de Caixa" onClose={onClose} size="max-w-3xl" footer={<ModalButton variant="secondary" onClick={onClose}>Fechar</ModalButton>}>
        <div className="space-y-6">
            <p className="text-base font-black leading-relaxed text-zinc-800 dark:text-zinc-100">
                Consulte facilmente receitas, despesas e o resultado mensal do seu consultorio!
            </p>
            <div className="space-y-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                <p className="font-black text-zinc-900 dark:text-white">Como funciona o fluxo de caixa:</p>
                <ul className="list-disc space-y-2 pl-5">
                    <li><span className="font-black">Resultados mensais:</span> O saldo mensal entre o total de receitas e despesas.</li>
                    <li><span className="font-black">Configuracoes de convenio:</span> Se usar convenios, configure as regras de recebimento para refletirem no fluxo de caixa.</li>
                    <li><span className="font-black">Visualizacao simplificada:</span> Facil acesso as receitas e despesas mensais, pagas e a pagar.</li>
                </ul>
            </div>
            <div className="mx-auto max-w-xl rounded-[28px] border border-zinc-200 bg-zinc-50 p-4 shadow-2xl dark:border-white/10 dark:bg-white/[0.035]">
                <div className="rounded-2xl bg-white p-4 dark:bg-zinc-950">
                    <div className="mb-3 h-4 w-28 rounded bg-zinc-200 dark:bg-white/10" />
                    <div className="grid grid-cols-6 gap-1 text-[7px] font-black">
                        {Array.from({ length: 36 }).map((_, index) => (
                            <div key={index} className={cn("h-6 rounded", index % 6 === 0 ? "bg-zinc-300" : index % 5 === 0 ? "bg-zinc-200" : "bg-zinc-100")} />
                        ))}
                    </div>
                </div>
            </div>
            <div className="space-y-3">
                {[
                    ["Saldo inicial", "Tenha o valor disponivel no comeco do periodo."],
                    ["Resultado acumulado", "Visualizacao acumulada dos resultados, para melhor entendimento de lucro ou prejuizo do seu consultorio."],
                    ["Exportar", "Exporte seu fluxo de caixa em PDF ou Excel."],
                    ["Agrupamento por categorias", "Veja as maiores receitas e despesas."],
                    ["Filtros", "Consiga filtrar por Ano, Mes, Semana ou Dia."],
                    ["Para clinicas", "Consiga filtrar o fluxo de caixa por profissional."],
                ].map(([title, text]) => (
                    <div key={title} className="flex gap-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                        <span className="h-fit rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-zinc-600 dark:border-white/10 dark:bg-white/[0.035] dark:text-zinc-300">Em breve</span>
                        <p><span className="font-black text-zinc-900 dark:text-white">{title}:</span> {text}</p>
                    </div>
                ))}
            </div>
        </div>
    </PremiumModal>
);

const CashFlowView = ({
    motionProps,
    onShowIntro,
    months,
    rows,
}: {
    motionProps: any;
    onShowIntro: () => void;
    months: string[];
    rows: CashFlowTableRow[];
}) => {
    return (
        <motion.div {...motionProps} key="cash-flow-view" className="space-y-6 px-6 py-6">
            <ManagementSectionHeader icon={BarChart3} title="Fluxo de caixa" subtitle="Entradas, saidas e resultado mensal" />
            <InfoBlock>
                <p><span className="font-black">Fluxo de caixa</span> e um demonstrativo de todas as <span className="font-black">entradas e saidas em um determinado periodo</span>. Para esse acompanhamento estao incluidos:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                    <li><span className="font-black">Total Receitas:</span> total de receitas recebidas e receitas a receber.</li>
                    <li><span className="font-black">Total Despesas:</span> total de despesas pagas e despesas a pagar.</li>
                    <li><span className="font-black">Resultados:</span> diferenca entre total receitas e total despesas.</li>
                </ul>
            </InfoBlock>
            <div className="flex justify-end">
                <button onClick={onShowIntro} className="h-11 rounded-2xl bg-zinc-200 px-8 text-sm font-bold text-zinc-600 transition-colors hover:text-zinc-950 dark:bg-white/10 dark:text-zinc-300 dark:hover:text-white">
                    Como funciona?
                </button>
            </div>
            <section className="relative overflow-hidden rounded-[34px] border border-zinc-200/50 bg-white/55 p-6 shadow-sm backdrop-blur-2xl dark:border-white/[0.045] dark:bg-white/[0.012]">
                <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-zinc-500 shadow-sm dark:bg-white/[0.06]">
                        <BarChart3 className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-[0.12em] text-zinc-900 dark:text-white">Fluxo de caixa</h3>
                </div>
                <div className="overflow-x-auto rounded-[24px] border border-zinc-200/70 dark:border-white/10">
                    <table className="w-full min-w-[1180px] border-collapse text-center text-sm">
                        <thead className="bg-white dark:bg-white/[0.035]">
                            <tr>
                                <th className="px-4 py-4 text-left text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">Indicador</th>
                                {months.map((month) => (
                                    <th key={month} className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">{month}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr key={row.label} className={row.tone}>
                                    <td className="px-4 py-4 text-left text-xs font-black">{row.label}</td>
                                    {row.values.map((value, index) => (
                                        <td key={`${row.label}-${months[index]}`} className="px-4 py-4">{value}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </motion.div>
    );
};

const ManualChargesView = ({
    motionProps,
    rows,
    cards,
    onManualCharge,
    openMenu,
    setOpenMenu,
}: {
    motionProps: any;
    rows: ManualChargeRow[];
    cards: { label: string; value: string; icon: LucideIcon }[];
    onManualCharge: () => void;
    openMenu: ManagementOptionsMenu;
    setOpenMenu: (menu: ManagementOptionsMenu) => void;
}) => (
    <motion.div {...motionProps} key="manual-charges-view" className="space-y-6 px-6 py-6">
        <ManagementSectionHeader icon={Receipt} title="Cobrancas geradas" subtitle="Cobrancas manuais da Gestao Financeira" />
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex h-11 min-w-[280px] items-center gap-3 rounded-2xl border border-zinc-200 bg-white/70 px-4 dark:border-white/10 dark:bg-white/[0.035]">
                <Search className="h-4 w-4 text-zinc-400" />
                <span className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-400">Buscar cobranca</span>
            </div>
            <div className="flex gap-3">
                <button onClick={onManualCharge} className="inline-flex h-11 items-center gap-3 rounded-2xl bg-zinc-950 px-5 text-[10px] font-black uppercase tracking-[0.16em] text-white shadow-xl transition-opacity hover:opacity-90 dark:bg-white dark:text-zinc-950">
                    <Plus className="h-4 w-4" />
                    Nova cobranca
                </button>
                <OptionsDropdown
                    id="charges"
                    openMenu={openMenu}
                    setOpenMenu={setOpenMenu}
                    items={[
                        { label: "Exportar relatorio em PDF", icon: FileText, onClick: () => undefined },
                        { label: "Exportar relatorio em Excel", icon: Download, onClick: () => undefined },
                    ]}
                />
            </div>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {cards.map((card) => (
                <div key={card.label} className="rounded-[30px] border border-zinc-200/50 bg-white/60 p-6 shadow-sm backdrop-blur-2xl dark:border-white/[0.045] dark:bg-white/[0.015]">
                    <card.icon className="mb-5 h-5 w-5 text-zinc-500" />
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-400">{card.label}</p>
                    <p className="mt-3 text-4xl font-black tracking-[-0.05em] text-zinc-950 dark:text-white">{card.value}</p>
                </div>
            ))}
        </div>
        <section className="relative overflow-hidden rounded-[34px] border border-zinc-200/50 bg-white/55 p-6 shadow-sm backdrop-blur-2xl dark:border-white/[0.045] dark:bg-white/[0.012]">
            <div className="overflow-hidden rounded-[24px] border border-zinc-200/70 dark:border-white/10">
                <table className="w-full min-w-[860px] border-collapse text-left">
                    <thead className="bg-zinc-50/90 dark:bg-white/[0.035]">
                        <tr className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">
                            <th className="px-5 py-4">Cliente</th>
                            <th className="px-5 py-4">Descricao</th>
                            <th className="px-5 py-4">Vencimento</th>
                            <th className="px-5 py-4">Tipo</th>
                            <th className="px-5 py-4">Status</th>
                            <th className="px-5 py-4 text-right">Valor</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/70 dark:divide-white/10">
                        {rows.length > 0 ? (
                            rows.map((row) => (
                                <tr key={`${row.client}-${row.due}-${row.description}`} className="bg-white/50 text-sm dark:bg-white/[0.01]">
                                    <td className="px-5 py-4 font-black text-zinc-900 dark:text-white">{row.client}</td>
                                    <td className="px-5 py-4 text-zinc-500 dark:text-zinc-400">{row.description}</td>
                                    <td className="px-5 py-4 text-zinc-500 dark:text-zinc-400">{row.due}</td>
                                    <td className="px-5 py-4 text-zinc-500 dark:text-zinc-400">{row.type}</td>
                                    <td className="px-5 py-4">
                                        <span className="rounded-full bg-zinc-950/5 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-zinc-600 dark:bg-white/10 dark:text-zinc-300">{row.status}</span>
                                    </td>
                                    <td className="px-5 py-4 text-right font-black text-zinc-900 dark:text-white">{row.amount}</td>
                                </tr>
                            ))
                        ) : (
                            <EmptyTableRow colSpan={6} title="Nenhuma cobranca gerencial encontrada" description="Cobrancas manuais ou vinculadas ao NeuroFinance aparecem aqui quando tiverem vinculo com um lancamento." />
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    </motion.div>
);

const BatchAgreementModal = ({
    open,
    onClose,
    title,
    actionLabel,
    startDate,
    endDate,
}: {
    open: boolean;
    onClose: () => void;
    title: string;
    actionLabel: string;
    startDate: string;
    endDate: string;
}) => (
    <PremiumModal
        open={open}
        title={title}
        onClose={onClose}
        size="max-w-xl"
        footer={
            <>
                <ModalButton variant="secondary" onClick={onClose}>Cancelar</ModalButton>
                <ModalButton onClick={onClose}>{actionLabel}</ModalButton>
            </>
        }
    >
        <div className="space-y-5">
            <div className="rounded-[26px] border border-zinc-200/75 bg-zinc-50/85 p-5 text-sm font-medium leading-relaxed text-zinc-600 dark:border-white/10 dark:bg-white/[0.035] dark:text-zinc-300">
                <p>
                    Com esta opcao, voce consegue {title === "Conciliar varias sessoes em lote" ? "conciliar varias sessoes em lote" : "alterar o valor do repasse para varias sessoes"} que atendem aos seguintes criterios:
                </p>
                <ol className="mt-4 space-y-2 pl-5 font-black text-zinc-900 dark:text-white">
                    <li>1. Nao foram Conciliadas</li>
                    <li>2. O periodo aplicado e de {formatDateLabel(startDate)} a {formatDateLabel(endDate)}</li>
                </ol>
                <p className="mt-4">
                    E importante notar que essa lista e a mesma encontrada na tela de relatorio de Repasses de Convenio com os filtros aplicados.
                </p>
            </div>
            <div className="rounded-[24px] border border-dashed border-zinc-200 bg-white/65 p-5 text-xs font-bold leading-relaxed text-zinc-500 dark:border-white/10 dark:bg-white/[0.02] dark:text-zinc-400">
                Nesta etapa, a acao ainda e apenas visual. A conciliacao real e a atualizacao em lote entram na rodada de backend/Supabase.
            </div>
        </div>
    </PremiumModal>
);

const AgreementDateInput = ({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
}) => (
    <label className="flex h-11 items-center gap-3 rounded-2xl border border-zinc-200/80 bg-white/85 px-4 shadow-[0_12px_34px_-30px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.8)] dark:border-white/10 dark:bg-white/[0.045]">
        <CalendarCheck className="h-4 w-4 text-zinc-400" />
        <span className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-400">{label}</span>
        <input
            type="date"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="h-full bg-transparent text-xs font-black text-zinc-700 outline-none dark:text-zinc-200"
        />
    </label>
);

const AgreementRepassesView = ({
    motionProps,
    cards,
    chartData,
    rows,
    openMenu,
    setOpenMenu,
    onBatchReconcile,
    onBatchUpdate,
    period,
    setPeriod,
}: {
    motionProps: any;
    cards: MetricCard[];
    chartData: ChartPoint[];
    rows: AgreementRepassRow[];
    openMenu: ManagementOptionsMenu;
    setOpenMenu: (menu: ManagementOptionsMenu) => void;
    onBatchReconcile: () => void;
    onBatchUpdate: () => void;
    period: { start: string; end: string };
    setPeriod: (period: { start: string; end: string }) => void;
}) => {
    const [showValues, setShowValues] = useState(true);
    const displayedValue = (value: string) => showValues ? value : "R$ ---";

    return (
        <motion.div {...motionProps} key="agreement-repasses-view" className="space-y-6 px-6 py-6">
            <ManagementSectionHeader icon={Users} title="Repasses/Convenio" subtitle="Conciliacao gerencial de sessoes com convenio" />

            <section className="relative overflow-visible rounded-[34px] border border-zinc-200/50 bg-white/55 p-6 shadow-sm backdrop-blur-2xl dark:border-white/[0.045] dark:bg-white/[0.012]">
                <div className="premium-noise pointer-events-none absolute inset-0 opacity-[0.018] dark:opacity-[0.04]" />
                <div className="relative z-10 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-wrap gap-3">
                        <AgreementDateInput label="Inicio" value={period.start} onChange={(start) => setPeriod({ ...period, start })} />
                        <AgreementDateInput label="Fim" value={period.end} onChange={(end) => setPeriod({ ...period, end })} />
                        <button
                            type="button"
                            onClick={() => setShowValues((value) => !value)}
                            className="flex h-11 items-center gap-3 rounded-2xl border border-zinc-200/80 bg-white/85 px-4 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600 shadow-[0_12px_34px_-30px_rgba(0,0,0,0.9)] transition-colors hover:text-zinc-950 dark:border-white/10 dark:bg-white/[0.045] dark:text-zinc-300 dark:hover:text-white"
                        >
                            <Eye className="h-4 w-4" />
                            Valores
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={onBatchReconcile}
                            className="inline-flex h-11 items-center gap-3 rounded-2xl bg-zinc-950 px-5 text-[10px] font-black uppercase tracking-[0.16em] text-white shadow-xl transition-opacity hover:opacity-90 dark:bg-white dark:text-zinc-950"
                        >
                            <CheckCircle2 className="h-4 w-4" />
                            Conciliar em lote
                        </button>
                        <OptionsDropdown
                            id="agreements"
                            openMenu={openMenu}
                            setOpenMenu={setOpenMenu}
                            items={[
                                { label: "Gerar relatorio em PDF", icon: FileText, onClick: () => undefined },
                                { label: "Gerar relatorio em Excel", icon: Download, onClick: () => undefined },
                                { label: "Alterar valor de varios repasses", icon: CircleDollarSign, onClick: onBatchUpdate },
                            ]}
                        />
                    </div>
                </div>
            </section>

            <FinanceMetricCards
                cards={cards.map((card) => ({ ...card, value: displayedValue(card.value) }))}
            />

            <InfoBlock>
                Este relatorio apresenta apenas as sessoes realizadas com convenio cujo status esta Liberado, ou seja, sessoes em que o cliente usou o cartao do convenio ou pagou diretamente. Caso o convenio ou plano de saude tenha repassado os valores das sessoes para a clinica, e possivel alterar o status das sessoes para Conciliados.
            </InfoBlock>

            <FinancialBarsChart
                title="Repasses de convenio"
                subtitle="Total previsto, subtotal conciliado e subtotal nao conciliado por mes."
                data={chartData}
                bars={[
                    { key: "reconciledAgreement", name: "Subtotal Conciliados", fill: "#10b981", stackId: "agreements" },
                    { key: "unreconciledAgreement", name: "Subtotal Nao Conciliados", fill: "#f43f5e", stackId: "agreements" },
                ]}
                lineKey="totalAgreement"
                lineName="Total previsto"
            />

            <section className="relative overflow-visible rounded-[34px] border border-zinc-200/50 bg-white/55 p-6 shadow-sm backdrop-blur-2xl dark:border-white/[0.045] dark:bg-white/[0.012]">
                <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-wrap gap-3">
                        <SelectShell className="w-48" options={["Situacao: Todas", "Conciliados", "Nao conciliados"]} />
                        <SelectShell className="w-52" options={["Convenio: Todos", "Convenio Vida", "Saude Plena", "Clinica Mais"]} />
                        <SelectShell className="w-72" options={["Filtrar por data de: Liberacao", "Repasse de convenio", "Vencimento ou sessao"]} />
                    </div>
                    <button className="inline-flex h-11 items-center gap-3 rounded-2xl border border-zinc-950/80 bg-white/80 px-5 text-sm font-black text-zinc-800 transition-colors hover:bg-zinc-950 hover:text-white dark:border-white/20 dark:bg-white/[0.035] dark:text-zinc-200 dark:hover:bg-white dark:hover:text-zinc-950">
                        <Filter className="h-4 w-4" />
                        Mais Filtros
                    </button>
                </div>
                <div className="overflow-hidden rounded-[24px] border border-zinc-200/70 dark:border-white/10">
                    <table className="w-full min-w-[980px] border-collapse text-left">
                        <thead className="bg-zinc-50/90 dark:bg-white/[0.035]">
                            <tr className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">
                                <th className="px-5 py-4">Paciente</th>
                                <th className="px-5 py-4">Sessao</th>
                                <th className="px-5 py-4">Convenio</th>
                                <th className="px-5 py-4">Liberacao</th>
                                <th className="px-5 py-4">Repasse</th>
                                <th className="px-5 py-4">Situacao</th>
                                <th className="px-5 py-4 text-right">Valor</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200/70 dark:divide-white/10">
                            {rows.length > 0 ? (
                                rows.map((row) => (
                                    <tr key={`${row.patient}-${row.releaseDate}-${row.session}`} className="bg-white/50 text-sm dark:bg-white/[0.01]">
                                        <td className="px-5 py-4 font-black text-zinc-900 dark:text-white">{row.patient}</td>
                                        <td className="px-5 py-4 text-zinc-500 dark:text-zinc-400">{row.session}</td>
                                        <td className="px-5 py-4 text-zinc-500 dark:text-zinc-400">{row.agreement}</td>
                                        <td className="px-5 py-4 text-zinc-500 dark:text-zinc-400">{row.releaseDate}</td>
                                        <td className="px-5 py-4 text-zinc-500 dark:text-zinc-400">{row.transferDate}</td>
                                        <td className="px-5 py-4">
                                            <span className={cn("rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em]", row.status === "Conciliado" ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950" : "border border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-white/10 dark:bg-white/[0.035] dark:text-zinc-300")}>{row.status}</span>
                                        </td>
                                        <td className="px-5 py-4 text-right font-black text-zinc-900 dark:text-white">{displayedValue(row.amount)}</td>
                                    </tr>
                                ))
                            ) : (
                                <EmptyTableRow colSpan={7} title="Nenhum repasse de convenio encontrado" description="Sessoes e lancamentos com metodo ou origem convenio aparecem aqui quando existirem." />
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </motion.div>
    );
};

const FinancialAutomationSettingsView = ({ motionProps }: { motionProps: any }) => {
    const { data: settings, isLoading, error } = useFinancialAutomationSettings();
    const { data: incomeCategories = [] } = useFinancialCategories("income");
    const saveSettings = useSaveFinancialAutomationSettings();

    const [autoCreate, setAutoCreate] = useState(false);
    const [defaultAmount, setDefaultAmount] = useState("");
    const [dueDays, setDueDays] = useState("0");
    const [selectedCategoryName, setSelectedCategoryName] = useState("Selecione");
    const [moveAttendedToPending, setMoveAttendedToPending] = useState(true);

    const categoryOptions = useMemo(() => ["Selecione", ...incomeCategories.map((category) => category.name)], [incomeCategories]);
    const selectedCategory = incomeCategories.find((category) => category.name === selectedCategoryName);

    useEffect(() => {
        setAutoCreate(Boolean(settings?.appointment_auto_create_enabled));
        setDefaultAmount(settings?.appointment_default_amount ? String(settings.appointment_default_amount).replace(".", ",") : "");
        setDueDays(String(settings?.appointment_due_days ?? 0));
        setMoveAttendedToPending(settings?.attended_status_moves_to_pending ?? true);

        const configuredCategory = incomeCategories.find((category) => category.id === settings?.appointment_default_category_id);
        setSelectedCategoryName(configuredCategory?.name || "Selecione");
    }, [settings, incomeCategories]);

    const handleSave = () => {
        saveSettings.mutate({
            appointmentAutoCreateEnabled: autoCreate,
            appointmentDefaultAmount: parseMoneyInput(defaultAmount) || null,
            appointmentDefaultCategoryId: selectedCategory?.id || null,
            appointmentDueDays: Number(dueDays || 0),
            attendedStatusMovesToPending: moveAttendedToPending,
            metadata: {
                source: "financial_management_desktop",
                saved_at: new Date().toISOString(),
            },
        });
    };

    const statusCards: MetricCard[] = [
        {
            title: "Automacao da Agenda",
            value: autoCreate ? "Ativa" : "Inativa",
            footer: [autoCreate ? "Novas sessoes podem gerar receitas planned" : "Sem criacao automatica de receitas"],
            icon: CalendarCheck,
        },
        {
            title: "Valor padrao",
            value: moneyFormatter(parseMoneyInput(defaultAmount)),
            footer: ["Usado apenas em sessoes sem lancamento explicito"],
            icon: CircleDollarSign,
        },
        {
            title: "Vencimento",
            value: `${Number(dueDays || 0)} dia(s)`,
            footer: ["A partir da data da sessao"],
            icon: ClipboardList,
        },
    ];

    return (
        <motion.div {...motionProps} key="financial-automation-settings" className="space-y-6 px-6 py-6">
            <ManagementSectionHeader icon={Settings} title="Configuracao por cliente" subtitle="Regras gerenciais para Agenda, pacientes e cobrancas" />

            {isLoading || error ? (
                <div className="rounded-[26px] border border-zinc-200/70 bg-white/70 p-5 text-xs font-black uppercase tracking-[0.14em] text-zinc-500 dark:border-white/10 dark:bg-white/[0.035] dark:text-zinc-300">
                    {isLoading ? "Carregando configuracoes financeiras..." : `Nao foi possivel carregar as configuracoes: ${error?.message || "erro desconhecido"}`}
                </div>
            ) : null}

            <FinanceMetricCards cards={statusCards} />

            <InfoBlock>
                <p>
                    Estas configuracoes conectam a Agenda a <span className="font-black">financial_entries</span>, sem criar cobranca bancaria, Pix, boleto ou transacao NeuroFinance.
                    O saldo real e o dinheiro a liberar continuam exclusivos do dominio bancario.
                </p>
            </InfoBlock>

            <section className="relative overflow-hidden rounded-[34px] border border-zinc-200/50 bg-white/55 p-6 shadow-sm backdrop-blur-2xl dark:border-white/[0.045] dark:bg-white/[0.012]">
                <div className="premium-noise pointer-events-none absolute inset-0 opacity-[0.018] dark:opacity-[0.04]" />
                <div className="relative z-10 grid gap-6 xl:grid-cols-[1fr_0.85fr]">
                    <div className="space-y-5">
                        <div className="rounded-[28px] border border-zinc-200/70 bg-white/70 p-5 dark:border-white/10 dark:bg-white/[0.025]">
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Gerar receita ao criar sessao</p>
                                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                                        Quando ativo, sessoes clinicas criadas sem lancamento financeiro explicito podem gerar uma receita prevista.
                                    </p>
                                </div>
                                <TogglePill active={autoCreate} onClick={() => setAutoCreate((value) => !value)} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div>
                                <FormLabel>Valor padrao da sessao</FormLabel>
                                <InputShell placeholder="R$ 0,00" className="w-full" value={defaultAmount} onChange={setDefaultAmount} />
                            </div>
                            <div>
                                <FormLabel>Dias ate vencimento</FormLabel>
                                <InputShell type="number" placeholder="0" className="w-full" value={dueDays} onChange={setDueDays} />
                            </div>
                            <div>
                                <FormLabel>Categoria padrao</FormLabel>
                                <SelectShell className="w-full" options={categoryOptions} value={selectedCategoryName} onChange={setSelectedCategoryName} />
                            </div>
                        </div>

                        <div className="rounded-[28px] border border-zinc-200/70 bg-white/70 p-5 dark:border-white/10 dark:bg-white/[0.025]">
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Sessao realizada vira a receber</p>
                                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                                        Ao marcar a sessao como realizada, o lancamento previsto muda para pendente, mantendo pagamento manual separado de transacao bancaria.
                                    </p>
                                </div>
                                <TogglePill active={moveAttendedToPending} onClick={() => setMoveAttendedToPending((value) => !value)} />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-[30px] border border-zinc-200/70 bg-zinc-50/80 p-6 dark:border-white/10 dark:bg-white/[0.025]">
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Fluxo aplicado</p>
                        <div className="mt-5 space-y-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                            <p><span className="font-black text-zinc-950 dark:text-white">1.</span> Nova sessao sem cobranca explicita cria receita <span className="font-black">planned</span>.</p>
                            <p><span className="font-black text-zinc-950 dark:text-white">2.</span> Sessao realizada muda para <span className="font-black">pending</span>, se a regra estiver ativa.</p>
                            <p><span className="font-black text-zinc-950 dark:text-white">3.</span> Pagamento manual marca como <span className="font-black">paid</span> sem criar transacao NeuroFinance.</p>
                            <p><span className="font-black text-zinc-950 dark:text-white">4.</span> Cobrancas NeuroFinance continuam em rota propria e so conciliam quando houver vinculo.</p>
                        </div>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saveSettings.isPending}
                            className="mt-7 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-zinc-950 px-6 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-xl transition-opacity hover:opacity-90 disabled:opacity-55 dark:bg-white dark:text-zinc-950"
                        >
                            {saveSettings.isPending ? "Salvando" : "Salvar configuracoes"}
                        </button>
                    </div>
                </div>
            </section>
        </motion.div>
    );
};

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
    const [activeModal, setActiveModal] = useState<ManagementModal>(null);
    const [openMenu, setOpenMenu] = useState<ManagementOptionsMenu>(null);
    const [showCashFlowIntro, setShowCashFlowIntro] = useState(false);
    const [selectedExpenseIds, setSelectedExpenseIds] = useState<string[]>([]);
    const [agreementPeriod, setAgreementPeriod] = useState(() => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
        return { start, end };
    });
    const currentDate = useMemo(() => new Date(), []);
    const currentMonth = currentDate.getMonth();
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
    const yearOptions = useMemo(() => {
        const currentYear = currentDate.getFullYear();
        return [currentYear, currentYear - 1, currentYear - 2].map(String);
    }, [currentDate]);
    const selectedPeriodLabel = buildPeriodLabel(selectedYear, currentMonth);
    const {
        data: financialSummary,
        entries: financialEntries = [],
        chartData,
        isLoading: isFinancialLoading,
        error: financialError,
    } = useFinancialSummary(selectedYear, currentMonth);
    const deleteFinancialEntries = useDeleteFinancialEntries();

    const periodEntries = useMemo(() => financialEntries.filter((entry) => {
        const date = entry.paid_at?.slice(0, 10) || entry.due_date || entry.competence_date || entry.created_at.slice(0, 10);
        return date.startsWith(`${selectedYear}-${String(currentMonth + 1).padStart(2, "0")}`);
    }), [financialEntries, selectedYear, currentMonth]);

    const incomeEntryRows = useMemo<IncomeRow[]>(() => periodEntries
        .filter((entry) => entry.type === "income")
        .map((entry) => ({
            patient: entryClientLabel(entry),
            description: entry.description || entry.title,
            due: entryDateLabel(entry),
            amount: moneyFormatter(Number(entry.amount || 0)),
            status: entryStatusLabel(entry),
            origin: entryOriginLabel(entry),
        })), [periodEntries]);

    const expenseEntryRows = useMemo<ExpenseRow[]>(() => periodEntries
        .filter((entry) => entry.type === "expense")
        .map((entry) => ({
            id: entry.id,
            category: entryCategoryLabel(entry),
            description: entry.description || entry.title,
            property: entry.clinic_id ? "Clinica" : "Particular",
            due: entryDateLabel(entry),
            amount: moneyFormatter(Number(entry.amount || 0)),
            status: entryStatusLabel(entry),
        })), [periodEntries]);

    const statementEntryRows = useMemo<StatementRow[]>(() => periodEntries
        .filter((entry) => entry.status === "paid")
        .map((entry) => ({
            date: entryDateLabel(entry),
            description: entry.description || entry.title,
            reason: entry.type === "income" ? "Receita" : "Despesa",
            property: entry.clinic_id ? "Clinica" : "Particular",
            category: entryCategoryLabel(entry),
            amount: `${entry.type === "expense" ? "-" : ""}${moneyFormatter(Number(entry.amount || 0))}`,
        })), [periodEntries]);

    const overdueIncomeRows = useMemo<OverdueIncomeRow[]>(() => financialEntries
        .filter(isOverdueIncomeEntry)
        .filter((entry) => (entry.due_date || "").startsWith(`${selectedYear}-${String(currentMonth + 1).padStart(2, "0")}`))
        .map((entry) => ({
            patient: entryClientLabel(entry),
            description: entry.description || entry.title,
            due: entry.due_date ? formatDateLabel(entry.due_date) : entryDateLabel(entry),
            amount: moneyFormatter(Number(entry.amount || 0)),
        })), [financialEntries, selectedYear, currentMonth]);

    const manualChargeRows = useMemo<ManualChargeRow[]>(() => periodEntries
        .filter((entry) => entry.type === "income" && (entry.neurofinance_charge_id || entry.origin === "neurofinance" || entry.metadata?.manual_charge === true))
        .map((entry) => ({
            client: entryClientLabel(entry),
            description: entry.description || entry.title,
            due: entry.due_date ? formatDateLabel(entry.due_date) : entryDateLabel(entry),
            amount: moneyFormatter(Number(entry.amount || 0)),
            type: paymentMethodLabel(entry.payment_method),
            status: manualChargeStatusLabel(entry),
        })), [periodEntries]);

    const agreementEntries = useMemo(() => periodEntries.filter((entry) =>
        entry.type === "income" && (entry.payment_method === "convenio" || entry.origin === "convenio")
    ), [periodEntries]);

    const agreementRows = useMemo<AgreementRepassRow[]>(() => agreementEntries.map((entry) => ({
        patient: entryClientLabel(entry),
        session: entry.description || entry.title,
        agreement: typeof entry.metadata?.agreement === "string" ? entry.metadata.agreement : "Convenio nao informado",
        releaseDate: entry.competence_date ? formatDateLabel(entry.competence_date) : entryDateLabel(entry),
        transferDate: entry.due_date ? formatDateLabel(entry.due_date) : entryDateLabel(entry),
        status: agreementStatusLabel(entry),
        amount: moneyFormatter(Number(entry.amount || 0)),
    })), [agreementEntries]);

    const overviewCards = useMemo<MetricCard[]>(() => [
        {
            title: "Resultado previsto",
            value: moneyFormatter(financialSummary.resultPlanned),
            footer: [`Resultado atual: ${moneyFormatter(financialSummary.resultCurrent)}`],
            icon: BarChart3,
        },
        {
            title: "Receitas previstas",
            value: moneyFormatter(financialSummary.incomePlanned),
            footer: [`Pago: ${moneyFormatter(financialSummary.incomePaid)}`, `Nao pago: ${moneyFormatter(financialSummary.incomeUnpaid)}`],
            icon: TrendingUp,
        },
        {
            title: "Despesas previstas",
            value: moneyFormatter(financialSummary.expensePlanned),
            footer: [`Pago: ${moneyFormatter(financialSummary.expensePaid)}`, `A pagar: ${moneyFormatter(financialSummary.expenseUnpaid)}`],
            icon: TrendingDown,
        },
    ], [financialSummary]);

    const incomeCards = useMemo<MetricCard[]>(() => [
        { title: "Total Previsto", value: moneyFormatter(financialSummary.incomePlanned), footer: [`Periodo: ${selectedPeriodLabel}`], icon: BarChart3 },
        { title: "Receitas Pagas", value: moneyFormatter(financialSummary.incomePaid), footer: [`Pago: ${moneyFormatter(financialSummary.incomePaid)}`], icon: TrendingUp },
        { title: "Receitas Nao Pagas", value: moneyFormatter(financialSummary.incomeUnpaid), footer: [`Nao pago: ${moneyFormatter(financialSummary.incomeUnpaid)}`], icon: AlertTriangle },
    ], [financialSummary, selectedPeriodLabel]);

    const expenseCards = useMemo<MetricCard[]>(() => [
        { title: "Total de Despesas", value: moneyFormatter(financialSummary.expensePlanned), footer: [`Periodo: ${selectedPeriodLabel}`], icon: BarChart3 },
        { title: "Despesas pagas", value: moneyFormatter(financialSummary.expensePaid), footer: [`Pago: ${moneyFormatter(financialSummary.expensePaid)}`], icon: TrendingDown },
        { title: "Despesas nao pagas", value: moneyFormatter(financialSummary.expenseUnpaid), footer: [`A pagar: ${moneyFormatter(financialSummary.expenseUnpaid)}`], icon: AlertTriangle },
    ], [financialSummary, selectedPeriodLabel]);

    const statementCards = useMemo<MetricCard[]>(() => [
        { title: "Saldo atual", value: moneyFormatter(financialSummary.resultCurrent), footer: [`Periodo: ${selectedPeriodLabel}`], icon: Wallet },
        { title: "Receitas pagas", value: moneyFormatter(financialSummary.incomePaid), footer: ["Pagamentos no periodo"], icon: TrendingUp },
        { title: "Despesas pagas", value: moneyFormatter(financialSummary.expensePaid), footer: ["Pagamentos no periodo"], icon: TrendingDown },
    ], [financialSummary, selectedPeriodLabel]);

    const manualChargeCards = useMemo(() => {
        const received = manualChargeRows.filter((row) => row.status === "Recebida").length;
        const generated = manualChargeRows.filter((row) => row.status === "Gerada").length;
        const pending = manualChargeRows.filter((row) => row.status === "Pendente").length;
        return [
            { label: "Geradas", value: String(generated), icon: Receipt },
            { label: "Pendentes", value: String(pending), icon: AlertTriangle },
            { label: "Recebidas", value: String(received), icon: CheckCircle2 },
        ];
    }, [manualChargeRows]);

    const agreementTotals = useMemo(() => agreementEntries.reduce((acc, entry) => {
        const amount = Number(entry.amount || 0);
        acc.total += amount;
        if (entry.status === "paid") acc.conciliated += amount;
        else acc.pending += amount;
        return acc;
    }, { total: 0, conciliated: 0, pending: 0 }), [agreementEntries]);

    const agreementCards = useMemo<MetricCard[]>(() => [
        { title: "Total Previsto", value: moneyFormatter(agreementTotals.total), footer: [`Periodo: ${formatDateLabel(agreementPeriod.start)} a ${formatDateLabel(agreementPeriod.end)}`], icon: BarChart3 },
        { title: "Subtotal Conciliados", value: moneyFormatter(agreementTotals.conciliated), footer: ["Sessoes com repasse conciliado"], icon: CheckCircle2 },
        { title: "Subtotal Nao Conciliados", value: moneyFormatter(agreementTotals.pending), footer: ["Sessoes liberadas pendentes"], icon: AlertTriangle },
    ], [agreementTotals, agreementPeriod]);

    const agreementChartData = useMemo<ChartPoint[]>(() => chartData.map((point) => ({
        ...point,
        reconciledAgreement: point.convenioPaid,
        unreconciledAgreement: point.convenioPending,
        totalAgreement: point.convenioTotal,
    })), [chartData]);

    const cashFlowMonths = useMemo(() => chartData.map((point, index) => `${point.month}/${String(selectedYear).slice(-2) || String(index + 1)}`), [chartData, selectedYear]);

    const cashFlowRows = useMemo<CashFlowTableRow[]>(() => [
        { label: "Receitas recebidas", tone: "bg-zinc-100/80 text-zinc-800 dark:bg-white/[0.06] dark:text-zinc-100", values: chartData.map((point) => moneyFormatter(point.paidIncome)) },
        { label: "Receitas a receber", tone: "bg-zinc-50 text-zinc-600 dark:bg-white/[0.025] dark:text-zinc-300", values: chartData.map((point) => moneyFormatter(point.unpaidIncome)) },
        { label: "Total receitas", tone: "bg-white text-zinc-950 font-black dark:bg-white/[0.04] dark:text-white", values: chartData.map((point) => moneyFormatter(point.totalIncome)) },
        { label: "Despesas pagas", tone: "bg-zinc-100/70 text-zinc-700 dark:bg-white/[0.05] dark:text-zinc-200", values: chartData.map((point) => moneyFormatter(point.paidExpenses)) },
        { label: "Despesas a pagar", tone: "bg-zinc-50 text-zinc-600 dark:bg-white/[0.025] dark:text-zinc-300", values: chartData.map((point) => moneyFormatter(point.unpaidExpenses)) },
        { label: "Total despesas", tone: "bg-white text-zinc-950 font-black dark:bg-white/[0.04] dark:text-white", values: chartData.map((point) => moneyFormatter(point.totalExpenses)) },
        { label: "Resultados", tone: "bg-white text-zinc-950 font-black dark:bg-white/[0.04] dark:text-white", values: chartData.map((point) => moneyFormatter(point.result)) },
    ], [chartData]);

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
        if (view === "cash-flow") setShowCashFlowIntro(true);
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

    const toggleExpenseSelected = (id: string) => {
        setSelectedExpenseIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    };

    const deleteSelectedExpenses = () => {
        if (selectedExpenseIds.length === 0) return;
        deleteFinancialEntries.mutate(selectedExpenseIds, {
            onSuccess: () => setSelectedExpenseIds([]),
        });
    };

    const renderContent = () => {
        if (activeView === "overview") {
            return (
                <ManagementOverview
                    motionProps={motionProps}
                    cards={overviewCards}
                    chartData={chartData}
                    overdueRows={overdueIncomeRows}
                    selectedYear={selectedYear}
                    yearOptions={yearOptions}
                    onYearChange={(value) => setSelectedYear(Number(value))}
                />
            );
        }
        if (activeView === "income") {
            return (
                <IncomeView
                    motionProps={motionProps}
                    rows={incomeEntryRows}
                    cards={incomeCards}
                    chartData={chartData}
                    periodLabel={selectedPeriodLabel}
                    selectedYear={selectedYear}
                    yearOptions={yearOptions}
                    onYearChange={(value) => setSelectedYear(Number(value))}
                    onAdd={() => setActiveModal("income")}
                    onManualCharge={() => setActiveModal("manual-charge")}
                    openMenu={openMenu}
                    setOpenMenu={setOpenMenu}
                />
            );
        }
        if (activeView === "expenses") {
            return (
                <ExpensesView
                    motionProps={motionProps}
                    rows={expenseEntryRows}
                    cards={expenseCards}
                    chartData={chartData}
                    selectedYear={selectedYear}
                    yearOptions={yearOptions}
                    onYearChange={(value) => setSelectedYear(Number(value))}
                    selectedIds={selectedExpenseIds}
                    toggleSelected={toggleExpenseSelected}
                    onAdd={() => setActiveModal("expense")}
                    onDeleteSelected={deleteSelectedExpenses}
                    openMenu={openMenu}
                    setOpenMenu={setOpenMenu}
                />
            );
        }
        if (activeView === "statement") {
            return <StatementView motionProps={motionProps} rows={statementEntryRows} cards={statementCards} periodLabel={selectedPeriodLabel} openMenu={openMenu} setOpenMenu={setOpenMenu} />;
        }
        if (activeView === "cash-flow") {
            return <CashFlowView motionProps={motionProps} onShowIntro={() => setShowCashFlowIntro(true)} months={cashFlowMonths} rows={cashFlowRows} />;
        }
        if (activeView === "charges-generated") {
            return (
                <ManualChargesView
                    motionProps={motionProps}
                    rows={manualChargeRows}
                    cards={manualChargeCards}
                    onManualCharge={() => setActiveModal("manual-charge")}
                    openMenu={openMenu}
                    setOpenMenu={setOpenMenu}
                />
            );
        }
        if (activeView === "client-config") {
            return <FinancialAutomationSettingsView motionProps={motionProps} />;
        }
        if (activeView === "repasses-convenio") {
            return (
                <AgreementRepassesView
                    motionProps={motionProps}
                    cards={agreementCards}
                    chartData={agreementChartData}
                    rows={agreementRows}
                    openMenu={openMenu}
                    setOpenMenu={setOpenMenu}
                    onBatchReconcile={() => setActiveModal("batch-reconcile")}
                    onBatchUpdate={() => setActiveModal("batch-update-transfer")}
                    period={agreementPeriod}
                    setPeriod={setAgreementPeriod}
                />
            );
        }
        return <ManagementPlaceholderView view={activeView} motionProps={motionProps} />;
    };

    return (
        <div className="min-h-screen w-full flex flex-col font-sans relative bg-background text-foreground selection:bg-primary/20 pt-10">
            <div className="pointer-events-none fixed inset-0 z-0 premium-noise opacity-[0.025] mix-blend-overlay dark:opacity-[0.05]" />

            <div className="flex-1 w-full max-w-[2200px] mx-auto px-6 md:px-8 lg:px-12 xl:px-16 relative z-10 flex gap-6 pb-12">
                <motion.nav
                    initial={{ opacity: 0, x: -18 }}
                    animate={{ opacity: 1, x: 0, width: isSidebarExpanded ? 302 : 88 }}
                    transition={{ type: "spring", stiffness: 260, damping: 32, mass: 0.72 }}
                    onMouseEnter={() => setIsSidebarExpanded(true)}
                    onMouseLeave={() => setIsSidebarExpanded(false)}
                    className="relative z-30 hidden shrink-0 lg:flex"
                >
                    <div className="sticky top-10 flex max-h-[calc(100vh-5rem)] w-full flex-col overflow-hidden rounded-[30px] border border-zinc-200/75 bg-white/80 p-3 shadow-[0_24px_74px_-54px_rgba(0,0,0,0.78),inset_0_1px_0_rgba(255,255,255,0.85)] ring-1 ring-black/[0.025] backdrop-blur-3xl dark:border-white/[0.075] dark:bg-[#070708]/80 dark:shadow-[0_28px_86px_-58px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.055)] dark:ring-white/[0.035]">
                        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,.55),transparent_28%),radial-gradient(circle_at_0%_0%,rgba(255,255,255,.55),transparent_34%),radial-gradient(circle_at_100%_100%,rgba(0,0,0,.04),transparent_42%)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,.055),transparent_30%),radial-gradient(circle_at_0%_0%,rgba(255,255,255,.075),transparent_38%)]" />
                        <div className="premium-noise pointer-events-none absolute inset-0 opacity-[0.014] dark:opacity-[0.04]" />
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
                                                "group relative flex h-12 items-center rounded-2xl transition-all duration-300 ease-out",
                                                isSidebarExpanded ? "w-full gap-3 px-3" : "w-14 justify-center px-0",
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
                                                {isSidebarExpanded ? (
                                                    <motion.div
                                                        initial={{ opacity: 0, x: -8, width: 0 }}
                                                        animate={{ opacity: 1, x: 0, width: "auto" }}
                                                        exit={{ opacity: 0, x: -8, width: 0 }}
                                                        transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
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
                                                    transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
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

                <div className="fixed left-0 right-0 top-0 z-[80] border-b border-zinc-200/50 bg-background/80 px-4 py-3 backdrop-blur-2xl dark:border-white/10 lg:hidden">
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
                    {isFinancialLoading || financialError ? (
                        <div className="mx-6 mt-6 rounded-[22px] border border-zinc-200/70 bg-white/75 px-5 py-4 text-xs font-black uppercase tracking-[0.14em] text-zinc-500 shadow-sm dark:border-white/10 dark:bg-white/[0.035] dark:text-zinc-300">
                            {isFinancialLoading ? "Carregando lancamentos gerenciais..." : `Nao foi possivel carregar os lancamentos: ${financialError?.message || "erro desconhecido"}`}
                        </div>
                    ) : null}
                    <AnimatePresence mode="wait">
                        {renderContent()}
                    </AnimatePresence>
                </div>
            </div>

            <FinancialEntryModal type="income" open={activeModal === "income"} onClose={() => setActiveModal(null)} />
            <FinancialEntryModal type="expense" open={activeModal === "expense"} onClose={() => setActiveModal(null)} />
            <ManualChargeModal open={activeModal === "manual-charge"} onClose={() => setActiveModal(null)} />
            <BatchAgreementModal
                open={activeModal === "batch-reconcile"}
                onClose={() => setActiveModal(null)}
                title="Conciliar varias sessoes em lote"
                actionLabel="Conciliar em lote"
                startDate={agreementPeriod.start}
                endDate={agreementPeriod.end}
            />
            <BatchAgreementModal
                open={activeModal === "batch-update-transfer"}
                onClose={() => setActiveModal(null)}
                title="Alterar valor de varios repasses"
                actionLabel="Alterar repasses"
                startDate={agreementPeriod.start}
                endDate={agreementPeriod.end}
            />
            <CashFlowIntroModal open={showCashFlowIntro} onClose={() => setShowCashFlowIntro(false)} />
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
