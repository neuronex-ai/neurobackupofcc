import { useMemo, useState, type ReactNode } from "react";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  CircleDollarSign,
  FileBarChart,
  Landmark,
  ListChecks,
  Plus,
  Scale,
  TrendingUp,
  Wallet,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useFinancialMetrics } from "@/hooks/use-financial-metrics";
import { useTransactions } from "@/hooks/use-transactions";
import { cn } from "@/lib/utils";
import { MobileLayout } from "@/mobile/components/MobileLayout";

import { MobileFinancialEntrySheet } from "../components/MobileFinancialEntrySheet";
import {
  MobileEmptyState,
  MobileFinanceButton,
  MobileFinanceIconButton,
  MobileFinanceListRow,
  MobileFinanceTabs,
  formatMoney,
} from "../../shared/MobileFinancePrimitives";

type EntryType = "income" | "expense";
type FinanceArea = "management" | "neurofinance";
type TransactionFilter = "all" | "income" | "expense";
type SurfaceTone = "default" | "success" | "warning" | "danger";

type MobileFinanceTransaction = {
  id: string;
  type?: string | null;
  amount?: number | string | null;
  date?: string | Date | null;
  created_at?: string | Date | null;
  description?: string | null;
  category?: string | null;
};

const filters: Array<{ value: TransactionFilter; label: string }> = [
  { value: "all", label: "Todas" },
  { value: "income", label: "Receitas" },
  { value: "expense", label: "Despesas" },
];

const glassSurface =
  "border border-white/55 bg-background/72 shadow-[0_18px_55px_-42px_rgba(15,23,42,0.72)] backdrop-blur-2xl dark:border-white/[0.075] dark:bg-white/[0.035]";

const toneIconStyles: Record<SurfaceTone, string> = {
  default: "bg-foreground/[0.055] text-muted-foreground",
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  warning: "bg-amber-500/10 text-amber-700 dark:text-amber-200",
  danger: "bg-rose-500/10 text-rose-600 dark:text-rose-300",
};

const toneValueStyles: Record<SurfaceTone, string> = {
  default: "text-foreground",
  success: "text-emerald-700 dark:text-emerald-300",
  warning: "text-amber-700 dark:text-amber-200",
  danger: "text-rose-600 dark:text-rose-300",
};

const formatTransactionDate = (transaction: MobileFinanceTransaction) => {
  const rawDate = transaction.date || transaction.created_at;
  if (!rawDate) return "Recente";
  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return "Recente";
  return format(date, "d MMM, HH:mm", { locale: ptBR });
};

const getTransactionTime = (transaction: MobileFinanceTransaction) => {
  const rawDate = transaction.date || transaction.created_at;
  if (!rawDate) return 0;
  const time = new Date(rawDate).getTime();
  return Number.isFinite(time) ? time : 0;
};

function CompactMetric({
  label,
  value,
  caption,
  icon: Icon,
  tone = "default",
  onClick,
}: {
  label: string;
  value: string;
  caption: string;
  icon: LucideIcon;
  tone?: SurfaceTone;
  onClick?: () => void;
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-[11px]",
            toneIconStyles[tone],
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        {onClick ? (
          <span className="text-[7px] font-black uppercase tracking-[0.12em] text-muted-foreground/45">
            Ver
          </span>
        ) : null}
      </div>
      <div className="mt-3 min-w-0">
        <p className="truncate text-[7px] font-black uppercase tracking-[0.15em] text-muted-foreground/58">
          {label}
        </p>
        <p
          className={cn(
            "mt-1 truncate text-[15px] font-black tracking-[-0.04em]",
            toneValueStyles[tone],
          )}
        >
          {value}
        </p>
        <p className="mt-0.5 truncate text-[8px] font-semibold text-muted-foreground/55">
          {caption}
        </p>
      </div>
    </>
  );

  const className = cn(
    glassSurface,
    "min-h-[108px] rounded-[18px] p-3 text-left",
    onClick && "transition active:scale-[0.985] active:bg-foreground/[0.035]",
  );

  return onClick ? (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  ) : (
    <article className={className}>{content}</article>
  );
}

function CompactAction({
  label,
  description,
  icon: Icon,
  tone = "default",
  badge,
  onClick,
}: {
  label: string;
  description: string;
  icon: LucideIcon;
  tone?: SurfaceTone;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        glassSurface,
        "flex min-h-[82px] items-center gap-3 rounded-[18px] p-3 text-left transition active:scale-[0.985] active:bg-foreground/[0.035]",
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px]",
          toneIconStyles[tone],
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-[12px] font-black tracking-[-0.02em] text-foreground">
            {label}
          </span>
          {badge ? (
            <span className="shrink-0 rounded-full bg-foreground/[0.055] px-1.5 py-0.5 text-[6px] font-black uppercase tracking-[0.1em] text-muted-foreground">
              {badge}
            </span>
          ) : null}
        </span>
        <span className="mt-0.5 block truncate text-[8px] font-semibold text-muted-foreground/58">
          {description}
        </span>
      </span>
    </button>
  );
}

function MiniInsight({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: SurfaceTone;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 px-2 py-1.5">
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px]",
          toneIconStyles[tone],
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[6px] font-black uppercase tracking-[0.12em] text-muted-foreground/50">
          {label}
        </span>
        <span className="mt-0.5 block truncate text-[10px] font-black text-foreground">
          {value}
        </span>
      </span>
    </div>
  );
}

function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-[14px] font-black tracking-[-0.03em] text-foreground">
        {title}
      </h2>
      {action}
    </div>
  );
}

export function MobileFinancialManagementPage() {
  const navigate = useNavigate();
  const { data: metrics, isLoading } = useFinancialMetrics();
  const { data: transactionData = [] } = useTransactions(subMonths(new Date(), 3));
  const transactions = transactionData as MobileFinanceTransaction[];
  const [entryOpen, setEntryOpen] = useState(false);
  const [entryType, setEntryType] = useState<EntryType>("income");
  const [filter, setFilter] = useState<TransactionFilter>("all");

  const recent = useMemo(
    () =>
      [...transactions]
        .sort(
          (a, b) =>
            getTransactionTime(b) -
            getTransactionTime(a),
        )
        .slice(0, 16),
    [transactions],
  );

  const visibleTransactions = useMemo(
    () =>
      recent.filter((transaction) => {
        if (filter === "all") return true;
        return transaction.type === filter;
      }),
    [filter, recent],
  );

  const result = Number(metrics?.netProfit || 0);
  const pendingInvoices = Number(metrics?.pendingInvoices || 0);
  const resultTone: SurfaceTone = result >= 0 ? "success" : "warning";

  const openEntry = (type: EntryType) => {
    setEntryType(type);
    setEntryOpen(true);
  };

  const switchArea = (area: FinanceArea) => {
    navigate(area === "management" ? "/financeiro" : "/financeiro/neurofinance");
  };

  const showPendingInvoices = () => {
    toast.info(
      `${pendingInvoices} pendência(s) identificada(s) neste período.`,
    );
  };

  return (
    <MobileLayout className="min-h-screen bg-background px-0">
      <div className="mobile-scroll-owner h-full overflow-y-auto overflow-x-hidden pb-32">
        <div className="min-h-full bg-[radial-gradient(circle_at_8%_0%,rgba(148,163,184,0.12),transparent_30%),radial-gradient(circle_at_100%_22%,rgba(148,163,184,0.08),transparent_28%)] px-3.5 pb-6 pt-3 dark:bg-[radial-gradient(circle_at_8%_0%,rgba(255,255,255,0.055),transparent_30%),radial-gradient(circle_at_100%_22%,rgba(255,255,255,0.035),transparent_28%)]">
          <div className="space-y-4">
            <header
              className={cn(
                glassSurface,
                "flex items-center justify-between gap-3 rounded-[19px] px-3.5 py-3",
              )}
            >
              <div className="min-w-0">
                <p className="text-[7px] font-black uppercase tracking-[0.17em] text-muted-foreground/52">
                  Operação do consultório
                </p>
                <h1 className="mt-0.5 truncate text-[17px] font-black tracking-[-0.04em] text-foreground">
                  Gestão financeira
                </h1>
              </div>
              <MobileFinanceIconButton
                icon={Plus}
                label="Novo lançamento"
                className="h-10 w-10 rounded-[13px] border-white/55 bg-background/68 shadow-none backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.045]"
                onClick={() => openEntry("income")}
              />
            </header>

            <MobileFinanceTabs
              value="management"
              onValueChange={switchArea}
              options={[
                {
                  value: "management",
                  label: "Gestão",
                  description: "Controle",
                  icon: TrendingUp,
                },
                {
                  value: "neurofinance",
                  label: "NeuroFinance",
                  description: "Conta",
                  icon: Wallet,
                },
              ]}
              className="sticky top-2 z-30 rounded-[17px] border-white/55 bg-background/78 shadow-[0_14px_42px_-34px_rgba(15,23,42,0.9)] dark:border-white/[0.075] dark:bg-background/78"
            />

            <section
              className={cn(
                glassSurface,
                "overflow-hidden rounded-[21px] p-4",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px]",
                      toneIconStyles[resultTone],
                    )}
                  >
                    <Scale className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[7px] font-black uppercase tracking-[0.16em] text-muted-foreground/52">
                      Resultado do mês
                    </p>
                    <p className="mt-0.5 truncate text-[11px] font-black text-foreground">
                      Receitas − despesas
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-1 text-[6px] font-black uppercase tracking-[0.12em]",
                    result >= 0
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "bg-amber-500/10 text-amber-700 dark:text-amber-200",
                  )}
                >
                  {result >= 0 ? "Positivo" : "Atenção"}
                </span>
              </div>

              <p
                className={cn(
                  "mt-4 truncate text-[2rem] font-black leading-none tracking-[-0.065em]",
                  toneValueStyles[resultTone],
                )}
              >
                {isLoading ? "—" : formatMoney(result)}
              </p>

              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="truncate text-[9px] font-semibold text-muted-foreground/60">
                  {pendingInvoices} pendência(s) no período
                </p>
                <button
                  type="button"
                  onClick={showPendingInvoices}
                  className="text-[7px] font-black uppercase tracking-[0.12em] text-foreground/70"
                >
                  Detalhes
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <MobileFinanceButton
                  variant="primary"
                  className="min-h-10 rounded-[13px]"
                  onClick={() => openEntry("income")}
                >
                  <ArrowUpRight className="h-4 w-4" />
                  Entrada
                </MobileFinanceButton>
                <MobileFinanceButton
                  variant="secondary"
                  className="min-h-10 rounded-[13px] border-white/55 bg-background/62 text-foreground backdrop-blur-xl dark:border-white/[0.075] dark:bg-white/[0.04]"
                  onClick={() => openEntry("expense")}
                >
                  <ArrowDownRight className="h-4 w-4" />
                  Despesa
                </MobileFinanceButton>
              </div>
            </section>

            <section className="grid grid-cols-2 gap-2.5">
              <CompactMetric
                label="Recebido"
                value={isLoading ? "—" : formatMoney(metrics?.currentMonthRevenue)}
                caption="Confirmado"
                icon={ArrowUpRight}
                tone="success"
                onClick={() => setFilter("income")}
              />
              <CompactMetric
                label="A receber"
                value={isLoading ? "—" : formatMoney(metrics?.projectedRevenue)}
                caption={`${pendingInvoices} pendência(s)`}
                icon={WalletCards}
                tone={pendingInvoices > 0 ? "warning" : "default"}
                onClick={showPendingInvoices}
              />
              <CompactMetric
                label="Despesas"
                value={isLoading ? "—" : formatMoney(metrics?.currentMonthExpenses)}
                caption="Registradas"
                icon={ArrowDownRight}
                tone="danger"
                onClick={() => setFilter("expense")}
              />
              <CompactMetric
                label="Resultado"
                value={isLoading ? "—" : formatMoney(metrics?.netProfit)}
                caption="Saldo gerencial"
                icon={CircleDollarSign}
                tone={resultTone}
              />
            </section>

            <section
              className={cn(
                glassSurface,
                "grid grid-cols-3 divide-x divide-border/30 rounded-[18px] p-1 dark:divide-white/[0.06]",
              )}
            >
              <MiniInsight
                icon={ListChecks}
                label="Pendências"
                value={`${pendingInvoices}`}
                tone={pendingInvoices > 0 ? "warning" : "success"}
              />
              <MiniInsight
                icon={Bot}
                label="Synapse"
                value="Análise"
              />
              <MiniInsight
                icon={FileBarChart}
                label="Relatório"
                value="Mensal"
              />
            </section>

            <section className="space-y-2.5">
              <SectionHeader title="Ações rápidas" />
              <div className="grid grid-cols-2 gap-2.5">
                <CompactAction
                  label="Entrada"
                  description="Receita manual"
                  icon={ArrowUpRight}
                  tone="success"
                  onClick={() => openEntry("income")}
                />
                <CompactAction
                  label="Despesa"
                  description="Custo externo"
                  icon={ArrowDownRight}
                  tone="danger"
                  onClick={() => openEntry("expense")}
                />
                <CompactAction
                  label="Pendências"
                  description="Valores a receber"
                  icon={ListChecks}
                  badge={`${pendingInvoices}`}
                  tone={pendingInvoices > 0 ? "warning" : "default"}
                  onClick={showPendingInvoices}
                />
                <CompactAction
                  label="Analisar caixa"
                  description="Abrir Synapse"
                  icon={Bot}
                  onClick={() => navigate("/synapse-ai")}
                />
              </div>
            </section>

            <section>
              <MobileFinanceListRow
                icon={Landmark}
                title="NeuroFinance"
                description="Pix, cobranças, boleto, transferências e saldo real."
                meta="Conta protegida por PIN"
                status="Conta"
                className={cn(
                  glassSurface,
                  "rounded-[18px] border-white/55 bg-background/72 p-3 dark:border-white/[0.075] dark:bg-white/[0.035]",
                )}
                onClick={() => navigate("/financeiro/neurofinance")}
              />
            </section>

            <section className="space-y-2.5">
              <SectionHeader
                title="Lançamentos recentes"
                action={
                  <MobileFinanceButton
                    variant="ghost"
                    className="min-h-8 rounded-[11px] px-2.5 text-[7px]"
                    onClick={() => navigate("/synapse-ai")}
                  >
                    Relatório
                  </MobileFinanceButton>
                }
              />

              <div className="-mx-3.5 overflow-x-auto px-3.5 pb-0.5 no-scrollbar">
                <div className="flex gap-1.5">
                  {filters.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setFilter(item.value)}
                      className={cn(
                        "min-h-9 shrink-0 rounded-[12px] px-3.5 text-[7px] font-black uppercase tracking-[0.12em] transition",
                        filter === item.value
                          ? "bg-foreground text-background"
                          : cn(
                              glassSurface,
                              "border-white/55 bg-background/64 text-muted-foreground shadow-none dark:border-white/[0.065] dark:bg-white/[0.03]",
                            ),
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {visibleTransactions.length === 0 ? (
                <MobileEmptyState
                  icon={ListChecks}
                  title="Nenhum lançamento"
                  description="Registre uma entrada ou despesa para começar."
                  action={
                    <MobileFinanceButton onClick={() => openEntry("income")}>
                      <Plus className="h-4 w-4" />
                      Novo lançamento
                    </MobileFinanceButton>
                  }
                />
              ) : (
                <div className="space-y-1.5">
                  {visibleTransactions.slice(0, 10).map((transaction) => {
                    const income = transaction.type === "income";
                    const amount = Math.abs(Number(transaction.amount || 0));

                    return (
                      <MobileFinanceListRow
                        key={transaction.id}
                        icon={income ? ArrowUpRight : ArrowDownRight}
                        title={transaction.description || "Lançamento"}
                        description={transaction.category || "Sem categoria"}
                        meta={formatTransactionDate(transaction)}
                        value={`${income ? "+" : "−"} ${formatMoney(amount)}`}
                        tone={income ? "success" : "danger"}
                        className={cn(
                          glassSurface,
                          "rounded-[17px] border-white/50 bg-background/68 p-3 shadow-none dark:border-white/[0.065] dark:bg-white/[0.03]",
                        )}
                      />
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      <MobileFinancialEntrySheet
        open={entryOpen}
        onOpenChange={setEntryOpen}
        defaultType={entryType}
      />
    </MobileLayout>
  );
}
