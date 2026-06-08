import { Suspense, lazy, useState, type ReactNode } from "react";
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

type ManagementModal = "income" | "expense" | "manual-charge" | null;
type ManagementOptionsMenu = "income" | "expenses" | "statement" | "charges" | null;

interface ExpenseRow {
    id: string;
    category: string;
    description: string;
    property: string;
    due: string;
    amount: string;
    status: "Pago" | "Nao pago";
}

const incomeRows = [
    { patient: "Ana Martins", description: "Sessao individual", due: "08/06/2026", amount: "R$ 250,00", status: "Pago", origin: "Agenda" },
    { patient: "Bruno Lima", description: "Pacote mensal", due: "12/06/2026", amount: "R$ 900,00", status: "Nao pago", origin: "Manual" },
    { patient: "Convenio Vida", description: "Repasse convenio", due: "18/06/2026", amount: "R$ 1.420,00", status: "Nao pago", origin: "Convenio" },
    { patient: "Carla Nunes", description: "Sessao online", due: "24/06/2026", amount: "R$ 220,00", status: "Pago", origin: "Agenda" },
];

const expenseRowsSeed: ExpenseRow[] = [
    { id: "expense-1", category: "Aluguel", description: "Sala de atendimento", property: "Clinica", due: "05/06/2026", amount: "R$ 2.400,00", status: "Pago" },
    { id: "expense-2", category: "Agua", description: "Conta mensal", property: "Clinica", due: "11/06/2026", amount: "R$ 180,00", status: "Nao pago" },
    { id: "expense-3", category: "Adiantamento", description: "Repasse administrativo", property: "Particular", due: "20/06/2026", amount: "R$ 750,00", status: "Nao pago" },
    { id: "expense-4", category: "Ajuste de caixa", description: "Ajuste operacional", property: "Clinica", due: "28/06/2026", amount: "R$ 120,00", status: "Pago" },
];

const statementRows = [
    { date: "03/06/2026", description: "Sessao individual - Ana Martins", reason: "Receita", property: "Clinica", category: "Consulta", amount: "R$ 250,00" },
    { date: "05/06/2026", description: "Sala de atendimento", reason: "Despesa", property: "Clinica", category: "Aluguel", amount: "-R$ 2.400,00" },
    { date: "12/06/2026", description: "Pacote mensal - Bruno Lima", reason: "Receita", property: "Particular", category: "Mensalidade", amount: "R$ 900,00" },
];

const manualChargeRows = [
    { client: "Ana Martins", description: "Sessao individual", due: "08/06/2026", amount: "R$ 250,00", type: "Pix", status: "Pendente" },
    { client: "Bruno Lima", description: "Pacote mensal", due: "12/06/2026", amount: "R$ 900,00", type: "Boleto", status: "Gerada" },
    { client: "Carla Nunes", description: "Sessao online", due: "24/06/2026", amount: "R$ 220,00", type: "Manual", status: "Recebida" },
];

const financeChartData = overviewChartData.map((item) => ({
    ...item,
    totalIncome: item.paidIncome + item.unpaidIncome,
    totalExpenses: item.paidExpenses + item.unpaidExpenses,
}));

const financeFormCategories = {
    income: ["Cobranca Avulsa", "Comissao", "Deposito", "Mensalidade", "Receitas nao categorizadas", "Rendimentos"],
    expense: ["13 salario", "Adiantamento", "Agua", "Ajuste de caixa", "Alimentacao", "Aluguel"],
};

const paymentMethods = ["Pix", "Boleto", "Cartao", "Dinheiro", "Transferencia externa", "Convenio", "Outro"];

const moneyFormatter = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const SelectShell = ({ children, className }: { children: ReactNode; className?: string }) => (
    <select
        className={cn(
            "h-11 rounded-2xl border border-zinc-200 bg-white/70 px-4 text-sm font-bold text-zinc-600 outline-none transition-colors focus:border-zinc-400 dark:border-white/10 dark:bg-white/[0.035] dark:text-zinc-200",
            className
        )}
    >
        {children}
    </select>
);

const InputShell = ({ placeholder, className, type = "text" }: { placeholder?: string; className?: string; type?: string }) => (
    <input
        type={type}
        placeholder={placeholder}
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
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[220] flex items-center justify-center bg-zinc-950/70 p-4 backdrop-blur-3xl">
            <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 24, scale: 0.98 }}
                className={cn("relative max-h-[92vh] w-full overflow-hidden rounded-[34px] border border-white/10 bg-white shadow-2xl dark:bg-zinc-950", size)}
            >
                <div className="premium-noise pointer-events-none absolute inset-0 opacity-[0.025] dark:opacity-[0.055]" />
                <div className="relative z-10 flex items-center justify-between border-b border-zinc-200/70 px-7 py-6 dark:border-white/10">
                    <h2 className="text-2xl font-black tracking-[-0.04em] text-zinc-950 dark:text-white">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition-colors hover:text-zinc-950 dark:bg-white/5 dark:text-zinc-400 dark:hover:text-white"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="relative z-10 max-h-[calc(92vh-150px)] overflow-y-auto px-7 py-6 custom-scrollbar">{children}</div>
                {footer ? (
                    <div className="relative z-10 flex justify-end gap-3 border-t border-zinc-200/70 px-7 py-5 dark:border-white/10">
                        {footer}
                    </div>
                ) : null}
            </motion.div>
        </div>
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
    const [paid, setPaid] = useState(false);
    const [repeat, setRepeat] = useState(false);
    const isIncome = type === "income";

    return (
        <PremiumModal
            open={open}
            title={isIncome ? "Adicionar receita" : "Adicionar despesa"}
            onClose={onClose}
            footer={
                <>
                    <ModalButton variant="secondary" onClick={onClose}>Cancelar</ModalButton>
                    <ModalButton onClick={onClose}>Salvar</ModalButton>
                </>
            }
        >
            <div className="space-y-6">
                <div>
                    <FormLabel>Propriedade <HelpCircle className="ml-1 inline h-3.5 w-3.5 text-zinc-400" /></FormLabel>
                    <SelectShell className="w-full">
                        <option>Clinica</option>
                        <option>Particular</option>
                    </SelectShell>
                </div>

                <div className="h-px bg-zinc-200 dark:bg-white/10" />

                <div>
                    <FormLabel required>Categoria financeira <HelpCircle className="ml-1 inline h-3.5 w-3.5 text-zinc-400" /></FormLabel>
                    <div className="flex gap-3">
                        <SelectShell className="flex-1">
                            <option>Selecione</option>
                            {financeFormCategories[type].map((category) => (
                                <option key={category}>{category}</option>
                            ))}
                        </SelectShell>
                        <button type="button" className="flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-500 hover:text-zinc-950 dark:border-white/10 dark:bg-white/[0.035] dark:hover:text-white">
                            <Plus className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div>
                    <FormLabel>Descricao</FormLabel>
                    <InputShell placeholder="Digite aqui" className="w-full" />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <FormLabel required>Valor</FormLabel>
                        <InputShell placeholder="R$ 0,00" className="w-full" />
                    </div>
                    <div>
                        <FormLabel required>Data de vencimento</FormLabel>
                        <InputShell placeholder="__/__/____" className="w-full" />
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
                            <InputShell placeholder="__/__/____" className="w-full" />
                        </div>
                        <div>
                            <FormLabel>Forma de pagamento</FormLabel>
                            <SelectShell className="w-full">
                                <option>-- Selecione --</option>
                                {paymentMethods.map((method) => (
                                    <option key={method}>{method}</option>
                                ))}
                            </SelectShell>
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
                                <SelectShell className="w-full">
                                    <option>Semanalmente</option>
                                    <option>Mensalmente</option>
                                    <option>Anualmente</option>
                                </SelectShell>
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
                                <InputShell placeholder="__/__/____" className="w-36" />
                            </label>
                        </div>
                    </div>
                ) : null}

                <div>
                    <FormLabel>Observacoes</FormLabel>
                    <textarea
                        placeholder="Digite aqui"
                        className="min-h-[112px] w-full rounded-2xl border border-zinc-200 bg-white/70 px-4 py-3 text-sm font-bold text-zinc-600 outline-none placeholder:text-zinc-400 focus:border-zinc-400 dark:border-white/10 dark:bg-white/[0.035] dark:text-zinc-200"
                    />
                    <p className="mt-2 text-xs font-bold text-zinc-400">0 de 400 caracteres</p>
                </div>
            </div>
        </PremiumModal>
    );
};

const ManualChargeModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => (
    <PremiumModal
        open={open}
        title="Gerar Cobranca Manual"
        onClose={onClose}
        footer={
            <>
                <ModalButton variant="secondary" onClick={onClose}>Cancelar</ModalButton>
                <button
                    type="button"
                    onClick={onClose}
                    className="h-11 rounded-2xl bg-zinc-300 px-8 text-[11px] font-black uppercase tracking-[0.18em] text-white dark:bg-white/20"
                >
                    Gerar Cobranca
                </button>
            </>
        }
    >
        <div className="space-y-6">
            <div>
                <FormLabel>Cliente</FormLabel>
                <SelectShell className="w-full">
                    <option>-- Selecione --</option>
                    <option>Ana Martins</option>
                    <option>Bruno Lima</option>
                    <option>Carla Nunes</option>
                </SelectShell>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                    <FormLabel required>Vencimento</FormLabel>
                    <InputShell placeholder="08/06/2026" className="w-full" />
                </div>
                <div>
                    <FormLabel required>Valor</FormLabel>
                    <InputShell placeholder="R$ 0,00" className="w-full" />
                </div>
                <div>
                    <FormLabel>Tipo de cobranca</FormLabel>
                    <SelectShell className="w-full">
                        <option>-- Selecione --</option>
                        <option>Pix</option>
                        <option>Boleto</option>
                        <option>Cartao</option>
                    </SelectShell>
                </div>
            </div>
            <div>
                <FormLabel required>Descricao</FormLabel>
                <InputShell placeholder="Digite aqui" className="w-full md:w-1/2" />
            </div>
            <div className="flex min-h-[130px] items-center justify-center rounded-[28px] border border-dashed border-zinc-200 bg-zinc-50/70 text-center text-sm font-bold text-zinc-500 dark:border-white/10 dark:bg-white/[0.025] dark:text-zinc-400">
                Escolha um cliente para visualizar os debitos.
            </div>
        </div>
    </PremiumModal>
);

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
                <span className="w-fit rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.16em] text-zinc-500 dark:border-white/10 dark:bg-white/[0.035] dark:text-zinc-400">
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
    addLabel,
    onAdd,
    options,
}: {
    periodLabel?: string;
    periodValue?: string;
    addLabel?: string;
    onAdd?: () => void;
    options?: ReactNode;
}) => (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <label className="flex h-11 w-fit items-center gap-3 rounded-2xl border border-zinc-200 bg-white/70 px-4 shadow-sm dark:border-white/10 dark:bg-white/[0.035]">
            <span className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">{periodLabel}</span>
            <select className="bg-transparent text-xs font-black text-zinc-700 outline-none dark:text-zinc-200" defaultValue={periodValue}>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="jun/2026">Jun/2026</option>
            </select>
        </label>
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
}: {
    title: string;
    subtitle: string;
    bars: { key: string; name: string; fill: string; stackId?: string }[];
    lineKey: string;
    lineName: string;
}) => (
    <section className="relative overflow-hidden rounded-[34px] border border-zinc-200/50 bg-white/55 p-6 shadow-sm backdrop-blur-2xl dark:border-white/[0.045] dark:bg-white/[0.012]">
        <div className="premium-noise pointer-events-none absolute inset-0 opacity-[0.018] dark:opacity-[0.04]" />
        <div className="relative z-10 mb-6">
            <h3 className="text-lg font-black uppercase tracking-tight text-zinc-950 dark:text-white">{title}</h3>
            <p className="mt-2 max-w-xl text-xs font-medium leading-relaxed text-zinc-500 dark:text-zinc-400">{subtitle}</p>
        </div>
        <div className="relative z-10 h-[330px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={financeChartData} margin={{ top: 16, right: 24, bottom: 8, left: 0 }}>
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
                    {bars.map((bar) => (
                        <Bar key={bar.key} name={bar.name} dataKey={bar.key} stackId={bar.stackId} fill={bar.fill} radius={[8, 8, 0, 0]} />
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

const IncomeView = ({
    motionProps,
    onAdd,
    onManualCharge,
    openMenu,
    setOpenMenu,
}: {
    motionProps: any;
    onAdd: () => void;
    onManualCharge: () => void;
    openMenu: ManagementOptionsMenu;
    setOpenMenu: (menu: ManagementOptionsMenu) => void;
}) => (
    <motion.div {...motionProps} key="income-view" className="space-y-6 px-6 py-6">
        <ManagementSectionHeader icon={TrendingUp} title="Receitas" subtitle="Entradas previstas, pagas e nao pagas" />
        <FinanceToolbar
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
        <FinanceMetricCards
            cards={[
                { title: "Total Previsto", value: "R$ --", footer: ["Periodo: Junho 2026"], icon: BarChart3 },
                { title: "Receitas Pagas", value: "R$ --", footer: ["Pago: R$ --"], icon: TrendingUp },
                { title: "Receitas Nao Pagas", value: "R$ --", footer: ["Nao pago: R$ --"], icon: AlertTriangle },
            ]}
        />
        <FinancialBarsChart
            title="Receitas previstas"
            subtitle="Visualizacao de receitas pagas, nao pagas e total previsto por mes."
            bars={[
                { key: "paidIncome", name: "Receitas Pagas", fill: "#10b981", stackId: "income" },
                { key: "unpaidIncome", name: "Receitas Nao Pagas", fill: "#86efac", stackId: "income" },
            ]}
            lineKey="totalIncome"
            lineName="Total previsto"
        />
        <InfoBlock>
            <p>A listagem abaixo sao todas as entradas lancadas no sistema, compostas por sessoes ou outras receitas, que:</p>
            <p className="mt-3 font-black">1- Foram Pagas no Periodo: Junho 2026.</p>
            <p className="mt-1 font-black">2- Possuem status de Nao pago com a Data de Vencimento no Periodo: Junho 2026.</p>
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
                        {incomeRows.map((row) => (
                            <tr key={`${row.patient}-${row.due}`} className="bg-white/50 text-sm dark:bg-white/[0.01]">
                                <td className="px-5 py-4 font-black text-zinc-900 dark:text-white">{row.patient}</td>
                                <td className="px-5 py-4 text-zinc-500 dark:text-zinc-400">{row.description}</td>
                                <td className="px-5 py-4 text-zinc-500 dark:text-zinc-400">{row.origin}</td>
                                <td className="px-5 py-4 text-zinc-500 dark:text-zinc-400">{row.due}</td>
                                <td className="px-5 py-4">
                                    <span className={cn("rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em]", row.status === "Pago" ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950" : "border border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-white/10 dark:bg-white/[0.035] dark:text-zinc-300")}>{row.status}</span>
                                </td>
                                <td className="px-5 py-4 text-right font-black text-zinc-900 dark:text-white">{row.amount}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    </motion.div>
);

const ExpensesView = ({
    motionProps,
    rows,
    selectedIds,
    toggleSelected,
    onAdd,
    onDeleteSelected,
    openMenu,
    setOpenMenu,
}: {
    motionProps: any;
    rows: ExpenseRow[];
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
            periodLabel="Periodo"
            periodValue="jun/2026"
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
        <FinanceMetricCards
            cards={[
                { title: "Total de Despesas", value: "R$ --", footer: ["Periodo: Junho 2026"], icon: BarChart3 },
                { title: "Despesas pagas", value: "R$ --", footer: ["Pago: R$ --"], icon: TrendingDown },
                { title: "Despesas nao pagas", value: "R$ --", footer: ["A pagar: R$ --"], icon: AlertTriangle },
            ]}
        />
        <FinancialBarsChart
            title="Despesas previstas"
            subtitle="Visualizacao de despesas pagas, nao pagas e total mensal previsto."
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
                    <p className="mt-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">Selecione despesas para usar a opcao de exclusao local.</p>
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
                        {rows.map((row) => (
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
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    </motion.div>
);

const StatementView = ({
    motionProps,
    openMenu,
    setOpenMenu,
}: {
    motionProps: any;
    openMenu: ManagementOptionsMenu;
    setOpenMenu: (menu: ManagementOptionsMenu) => void;
}) => (
    <motion.div {...motionProps} key="statement-view" className="space-y-6 px-6 py-6">
        <ManagementSectionHeader icon={ClipboardList} title="Extrato" subtitle="Pagamentos gerenciais no periodo" />
        <section className="relative overflow-hidden rounded-[34px] border border-zinc-200/50 bg-white/55 p-6 shadow-sm backdrop-blur-2xl dark:border-white/[0.045] dark:bg-white/[0.012]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-4">
                    <span className="text-lg font-bold text-zinc-800 dark:text-zinc-200">Periodo:</span>
                    <SelectShell className="w-64">
                        <option>Jun/2026</option>
                        <option>Mai/2026</option>
                        <option>Abr/2026</option>
                    </SelectShell>
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
        <FinanceMetricCards
            cards={[
                { title: "Saldo atual", value: "R$ 0,00", footer: ["Periodo: Junho 2026"], icon: Wallet },
                { title: "Receitas pagas", value: "R$ 0,00", footer: ["Pagamentos no periodo"], icon: TrendingUp },
                { title: "Despesas pagas", value: "R$ 0,00", footer: ["Pagamentos no periodo"], icon: TrendingDown },
            ]}
        />
        <InfoBlock>
            <p>O relatorio do <span className="font-black">Extrato</span> e composto pela listagem de todas as <span className="font-black">Receitas e Despesas</span> com <span className="font-black">Data de Pagamento</span> dentro do <span className="font-black">Periodo: Junho 2026</span>.</p>
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
                        {statementRows.map((row) => (
                            <tr key={`${row.date}-${row.description}`} className="bg-white/50 text-sm dark:bg-white/[0.01]">
                                <td className="px-5 py-4 font-black text-zinc-900 dark:text-white">{row.date}</td>
                                <td className="px-5 py-4 text-zinc-500 dark:text-zinc-400">{row.description}</td>
                                <td className="px-5 py-4 text-zinc-500 dark:text-zinc-400">{row.reason}</td>
                                <td className="px-5 py-4 text-zinc-500 dark:text-zinc-400">{row.property}</td>
                                <td className="px-5 py-4 text-zinc-500 dark:text-zinc-400">{row.category}</td>
                                <td className={cn("px-5 py-4 text-right font-black", row.amount.startsWith("-") ? "text-zinc-500 dark:text-zinc-400" : "text-zinc-950 dark:text-white")}>{row.amount}</td>
                            </tr>
                        ))}
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

const CashFlowView = ({ motionProps, onShowIntro }: { motionProps: any; onShowIntro: () => void }) => {
    const months = ["Jan/26", "Fev/26", "Mar/26", "Abr/26", "Mai/26", "Jun/26", "Jul/26", "Ago/26", "Set/26", "Out/26", "Nov/26", "Dez/26"];
    const rows = [
        { label: "Receitas recebidas", tone: "bg-zinc-100/80 text-zinc-800", values: months.map(() => "-") },
        { label: "Receitas a receber", tone: "bg-zinc-50 text-zinc-600", values: months.map(() => "-") },
        { label: "Total receitas", tone: "bg-white text-zinc-950 font-black", values: months.map(() => "-") },
        { label: "Despesas pagas", tone: "bg-zinc-100/70 text-zinc-700", values: months.map(() => "-") },
        { label: "Despesas a pagar", tone: "bg-zinc-50 text-zinc-600", values: months.map(() => "-") },
        { label: "Total despesas", tone: "bg-white text-zinc-950 font-black", values: months.map(() => "-") },
        { label: "Resultados", tone: "bg-white text-zinc-950 font-black", values: months.map(() => "R$ 0,00") },
    ];

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
    onManualCharge,
    openMenu,
    setOpenMenu,
}: {
    motionProps: any;
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
            {[
                { label: "Geradas", value: "3", icon: Receipt },
                { label: "Pendentes", value: "2", icon: AlertTriangle },
                { label: "Recebidas", value: "1", icon: CheckCircle2 },
            ].map((card) => (
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
                        {manualChargeRows.map((row) => (
                            <tr key={`${row.client}-${row.due}`} className="bg-white/50 text-sm dark:bg-white/[0.01]">
                                <td className="px-5 py-4 font-black text-zinc-900 dark:text-white">{row.client}</td>
                                <td className="px-5 py-4 text-zinc-500 dark:text-zinc-400">{row.description}</td>
                                <td className="px-5 py-4 text-zinc-500 dark:text-zinc-400">{row.due}</td>
                                <td className="px-5 py-4 text-zinc-500 dark:text-zinc-400">{row.type}</td>
                                <td className="px-5 py-4">
                                    <span className="rounded-full bg-zinc-950/5 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-zinc-600 dark:bg-white/10 dark:text-zinc-300">{row.status}</span>
                                </td>
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
    const [activeModal, setActiveModal] = useState<ManagementModal>(null);
    const [openMenu, setOpenMenu] = useState<ManagementOptionsMenu>(null);
    const [showCashFlowIntro, setShowCashFlowIntro] = useState(false);
    const [expenseRows, setExpenseRows] = useState<ExpenseRow[]>(expenseRowsSeed);
    const [selectedExpenseIds, setSelectedExpenseIds] = useState<string[]>([]);

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
        setExpenseRows((current) => current.filter((row) => !selectedExpenseIds.includes(row.id)));
        setSelectedExpenseIds([]);
    };

    const renderContent = () => {
        if (activeView === "overview") return <ManagementOverview motionProps={motionProps} />;
        if (activeView === "income") {
            return (
                <IncomeView
                    motionProps={motionProps}
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
                    rows={expenseRows}
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
            return <StatementView motionProps={motionProps} openMenu={openMenu} setOpenMenu={setOpenMenu} />;
        }
        if (activeView === "cash-flow") {
            return <CashFlowView motionProps={motionProps} onShowIntro={() => setShowCashFlowIntro(true)} />;
        }
        if (activeView === "charges-generated") {
            return (
                <ManualChargesView
                    motionProps={motionProps}
                    onManualCharge={() => setActiveModal("manual-charge")}
                    openMenu={openMenu}
                    setOpenMenu={setOpenMenu}
                />
            );
        }
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

            <FinancialEntryModal type="income" open={activeModal === "income"} onClose={() => setActiveModal(null)} />
            <FinancialEntryModal type="expense" open={activeModal === "expense"} onClose={() => setActiveModal(null)} />
            <ManualChargeModal open={activeModal === "manual-charge"} onClose={() => setActiveModal(null)} />
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
