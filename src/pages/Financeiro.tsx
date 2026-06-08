import { Suspense, lazy } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
    AlertTriangle,
    ArrowRight,
    BadgeDollarSign,
    Banknote,
    BarChart3,
    CalendarCheck,
    CheckCircle2,
    CircleDollarSign,
    ClipboardList,
    CreditCard,
    FileText,
    Landmark,
    Layers3,
    Loader2,
    PieChart,
    Receipt,
    Repeat,
    ShieldCheck,
    TrendingDown,
    TrendingUp,
    Wallet,
} from "lucide-react";

import { FeatureGate, LockedFeatureScreen } from "@/components/subscription";
import { useIsMobile } from "@/hooks/use-mobile";

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

const managementStats = [
    { label: "Receita prevista no mes", source: "Fonte gerencial", icon: TrendingUp },
    { label: "Recebido no mes", source: "Marcado como pago", icon: BadgeDollarSign },
    { label: "A receber", source: "Contas pendentes", icon: CalendarCheck },
    { label: "Em atraso", source: "Inadimplencia", icon: AlertTriangle },
    { label: "Despesas do mes", source: "Saidas gerenciais", icon: TrendingDown },
    { label: "Resultado estimado", source: "Previsto - despesas", icon: BarChart3 },
    { label: "Saldo NeuroFinance", source: "Dado bancario futuro", icon: Wallet },
    { label: "A liberar", source: "Dado bancario futuro", icon: ShieldCheck },
] satisfies { label: string; source: string; icon: LucideIcon }[];

const managementModules = [
    { title: "Visao Geral", description: "Resumo gerencial mensal do consultorio.", icon: PieChart },
    { title: "Receitas", description: "Entradas manuais, externas e conciliadas.", icon: TrendingUp },
    { title: "Despesas", description: "Custos fixos, variaveis e lancamentos avulsos.", icon: TrendingDown },
    { title: "Contas a receber", description: "Receitas pendentes vinculadas a pacientes e agenda.", icon: CalendarCheck },
    { title: "Contas a pagar", description: "Obrigacoes planejadas e vencimentos.", icon: Receipt },
    { title: "Fluxo de caixa mensal", description: "Competencia, vencimentos e resultado previsto.", icon: BarChart3 },
    { title: "Inadimplencia", description: "Acompanhamento de atrasos sem tratar cobranca criada como recebida.", icon: AlertTriangle },
    { title: "Categorias", description: "Classificacao de receitas e despesas.", icon: Layers3 },
    { title: "Relatorios", description: "Analises gerenciais e filtros por periodo.", icon: ClipboardList },
    { title: "Repasses/Comissoes", description: "Regras internas para profissionais e clinica.", icon: CircleDollarSign },
    { title: "Notas fiscais", description: "Area fiscal gerencial, separada do banking.", icon: FileText },
    { title: "Recorrencias", description: "Modelos semanais, mensais e anuais.", icon: Repeat },
] satisfies { title: string; description: string; icon: LucideIcon }[];

const FinancialManagementHome = () => (
    <div className="min-h-screen bg-background px-4 py-8 font-sans text-foreground md:px-8 lg:px-12">
        <div className="pointer-events-none fixed inset-0 z-0">
            <div className="absolute left-[-12%] top-[-15%] h-[680px] w-[900px] rounded-full bg-foreground/[0.022] blur-[200px]" />
            <div className="absolute bottom-[-14%] right-[-14%] h-[520px] w-[720px] rounded-full bg-foreground/[0.016] blur-[170px]" />
        </div>

        <main className="relative z-10 mx-auto w-full max-w-[1500px] space-y-8 pt-4 md:pt-8">
            <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div>
                    <Link
                        to="/financeiro"
                        className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/20 bg-secondary/30 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground transition-colors hover:text-foreground"
                    >
                        Voltar ao portal
                    </Link>
                    <p className="text-[10px] font-black uppercase tracking-[0.42em] text-muted-foreground/50">Controle interno</p>
                    <h1 className="mt-4 text-4xl font-black tracking-[-0.055em] md:text-6xl">Gestao Financeira</h1>
                    <p className="mt-4 max-w-2xl text-sm font-medium leading-relaxed text-muted-foreground md:text-base">
                        Esta camada organiza dinheiro previsto, receitas manuais, despesas, contas a receber e repasses. Ela nao cria transacoes bancarias reais.
                    </p>
                </div>

                <Link
                    to="/financeiro/neurofinance"
                    className="inline-flex h-12 items-center justify-center gap-3 rounded-2xl bg-foreground px-6 text-[10px] font-black uppercase tracking-[0.25em] text-background shadow-xl transition-opacity hover:opacity-90"
                >
                    Abrir NeuroFinance
                    <ArrowRight className="h-4 w-4" />
                </Link>
            </header>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {managementStats.map((stat) => (
                    <div key={stat.label} className="rounded-[26px] border border-border/20 bg-card/55 p-5 shadow-sm backdrop-blur-2xl">
                        <div className="mb-5 flex items-center justify-between gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/20 bg-secondary/40">
                                <stat.icon className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <span className="rounded-full bg-secondary/40 px-3 py-1 text-[8px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                                A configurar
                            </span>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/55">{stat.label}</p>
                        <p className="mt-3 text-3xl font-black tracking-[-0.04em] text-foreground">--</p>
                        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/45">{stat.source}</p>
                    </div>
                ))}
            </section>

            <section className="rounded-[34px] border border-border/20 bg-card/40 p-5 shadow-sm backdrop-blur-2xl md:p-7">
                <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-muted-foreground/45">Areas da gestao</p>
                        <h2 className="mt-2 text-2xl font-black tracking-[-0.035em]">Estrutura gerencial incremental</h2>
                    </div>
                    <p className="max-w-xl text-xs font-medium leading-relaxed text-muted-foreground">
                        Os atalhos abaixo preparam a separacao do dominio gerencial. Nesta rodada eles nao executam cobrancas, Pix, boletos ou reconciliacoes.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {managementModules.map((module) => (
                        <button
                            key={module.title}
                            type="button"
                            disabled
                            className="group flex min-h-[128px] cursor-not-allowed items-start gap-4 rounded-[24px] border border-border/15 bg-background/35 p-5 text-left opacity-90"
                        >
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border/20 bg-secondary/40">
                                <module.icon className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-sm font-black uppercase tracking-[0.08em] text-foreground">{module.title}</h3>
                                    <span className="rounded-full bg-secondary/40 px-2 py-1 text-[8px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                                        Em breve
                                    </span>
                                </div>
                                <p className="mt-2 text-xs font-medium leading-relaxed text-muted-foreground">{module.description}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {[
                    {
                        title: "Sem mistura de saldos",
                        text: "Valores previstos e saldo NeuroFinance continuam tratados como fontes diferentes.",
                        icon: Wallet,
                    },
                    {
                        title: "Manual nao vira banking",
                        text: "Receitas em dinheiro, convenio ou transferencia externa ficam gerenciais.",
                        icon: Banknote,
                    },
                    {
                        title: "Cobranca nao e recebimento",
                        text: "Cobrancas criadas pelo NeuroFinance so viram receita paga apos confirmacao.",
                        icon: CreditCard,
                    },
                ].map((notice) => (
                    <div key={notice.title} className="rounded-[26px] border border-border/20 bg-card/35 p-6 backdrop-blur-2xl">
                        <notice.icon className="mb-4 h-5 w-5 text-muted-foreground" />
                        <h3 className="text-sm font-black uppercase tracking-[0.12em]">{notice.title}</h3>
                        <p className="mt-2 text-xs font-medium leading-relaxed text-muted-foreground">{notice.text}</p>
                    </div>
                ))}
            </section>
        </main>
    </div>
);

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
