import { useMemo, useRef, useState } from "react";
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
  MobileFinanceHero,
  MobileFinanceIconButton,
  MobileFinanceInsightStrip,
  MobileFinanceListRow,
  MobileFinanceTabs,
  MobileMetricCard,
  MobilePageTitle,
  MobileSectionTitle,
  formatMoney,
} from "../../shared/MobileFinancePrimitives";

type EntryType = "income" | "expense";
type FinanceArea = "management" | "neurofinance";
type TransactionFilter = "all" | "income" | "expense";
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

const filterLabels: Record<TransactionFilter, string> = {
  all: "Todas",
  income: "Receitas",
  expense: "Despesas",
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

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function MobileFinancialManagementPage() {
  const navigate = useNavigate();
  const transactionsRef = useRef<HTMLElement>(null);
  const { data: metrics, isLoading } = useFinancialMetrics();
  const { data: transactionData = [] } = useTransactions(subMonths(new Date(), 3));
  const transactions = transactionData as MobileFinanceTransaction[];
  const [entryOpen, setEntryOpen] = useState(false);
  const [entryType, setEntryType] = useState<EntryType>("income");
  const [filter, setFilter] = useState<TransactionFilter>("all");

  const recent = useMemo(
    () =>
      [...transactions]
        .sort((a, b) => getTransactionTime(b) - getTransactionTime(a))
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
  const resultTone = result >= 0 ? "success" : "warning";
  const resultDescription =
    result >= 0
      ? "A operação está positiva no período. Continue acompanhando recebíveis e despesas recorrentes."
      : "O período pede atenção. Revise despesas e pendências antes de assumir novos compromissos.";

  const openEntry = (type: EntryType) => {
    setEntryType(type);
    setEntryOpen(true);
  };

  const switchArea = (area: FinanceArea) => {
    navigate(area === "management" ? "/financeiro" : "/financeiro/neurofinance");
  };

  const focusTransactions = (nextFilter: TransactionFilter) => {
    setFilter(nextFilter);
    requestAnimationFrame(() => {
      transactionsRef.current?.scrollIntoView({
        block: "start",
        behavior: prefersReducedMotion() ? "auto" : "smooth",
      });
    });
  };

  const announcePending = () => {
    toast.info(`${pendingInvoices} pendência(s) identificada(s) neste período.`);
  };

  return (
    <MobileLayout className="min-h-screen bg-background px-0">
      <div className="mobile-scroll-owner h-full overflow-y-auto overflow-x-hidden px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto max-w-md space-y-5">
          <MobilePageTitle
            eyebrow="Operação do consultório"
            title="Financeiro"
            description="Controle receitas, despesas e previsibilidade sem movimentar dinheiro real."
            action={
              <MobileFinanceIconButton
                icon={Plus}
                label="Novo lançamento"
                onClick={() => openEntry("income")}
              />
            }
          />

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
            className="sticky top-2 z-30"
          />

          <MobileFinanceHero
            eyebrow="Resultado do mês"
            title="Resumo operacional"
            value={isLoading ? "-" : formatMoney(result)}
            description={resultDescription}
            icon={Scale}
            tone={result >= 0 ? "default" : "warning"}
          >
            <div className="grid grid-cols-2 gap-2.5">
              <MobileFinanceButton onClick={() => openEntry("income")}>
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                Entrada
              </MobileFinanceButton>
              <MobileFinanceButton
                variant="secondary"
                onClick={() => openEntry("expense")}
              >
                <ArrowDownRight className="h-4 w-4" aria-hidden="true" />
                Despesa
              </MobileFinanceButton>
            </div>
          </MobileFinanceHero>

          <section className="space-y-3" aria-labelledby="finance-metrics-title">
            <MobileSectionTitle
              title="Indicadores"
              description="Toque em uma métrica para filtrar lançamentos relacionados."
            />
            <div id="finance-metrics-title" className="grid grid-cols-2 gap-3">
              <MobileMetricCard
                label="Recebido"
                value={isLoading ? "-" : formatMoney(metrics?.currentMonthRevenue)}
                caption="Entradas confirmadas"
                icon={ArrowUpRight}
                tone="success"
                onClick={() => focusTransactions("income")}
              />
              <MobileMetricCard
                label="A receber"
                value={isLoading ? "-" : formatMoney(metrics?.projectedRevenue)}
                caption={`${pendingInvoices} pendência(s)`}
                icon={WalletCards}
                tone={pendingInvoices > 0 ? "warning" : "default"}
                onClick={announcePending}
              />
              <MobileMetricCard
                label="Despesas"
                value={isLoading ? "-" : formatMoney(metrics?.currentMonthExpenses)}
                caption="Custos registrados"
                icon={ArrowDownRight}
                tone="danger"
                onClick={() => focusTransactions("expense")}
              />
              <MobileMetricCard
                label="Resultado"
                value={isLoading ? "-" : formatMoney(metrics?.netProfit)}
                caption="Receitas menos despesas"
                icon={CircleDollarSign}
                tone={resultTone}
              />
            </div>
          </section>

          <MobileFinanceInsightStrip
            items={[
              {
                label: "Pendências",
                value: `${pendingInvoices}`,
                icon: ListChecks,
                tone: pendingInvoices > 0 ? "warning" : "success",
              },
              {
                label: "Synapse",
                value: "Análise",
                icon: Bot,
              },
              {
                label: "Relatório",
                value: "Mensal",
                icon: FileBarChart,
              },
            ]}
          />

          <section className="space-y-3">
            <MobileSectionTitle
              title="Ações principais"
              description="Tarefas frequentes com revisão clara antes de salvar."
            />
            <div className="space-y-2" role="list">
              <MobileFinanceListRow
                icon={ArrowUpRight}
                title="Registrar entrada"
                description="Recebimento, sessão ou receita manual."
                status="Gestão"
                tone="success"
                onClick={() => openEntry("income")}
              />
              <MobileFinanceListRow
                icon={ArrowDownRight}
                title="Registrar despesa"
                description="Custo, pagamento externo ou ajuste administrativo."
                status="Gestão"
                tone="danger"
                onClick={() => openEntry("expense")}
              />
              <MobileFinanceListRow
                icon={ListChecks}
                title="Ver pendências"
                description="Recebíveis que ainda precisam de acompanhamento."
                value={`${pendingInvoices}`}
                tone={pendingInvoices > 0 ? "warning" : "success"}
                onClick={announcePending}
              />
              <MobileFinanceListRow
                icon={Bot}
                title="Analisar caixa"
                description="Abra o Synapse para interpretar o período atual."
                onClick={() => navigate("/synapse-ai")}
              />
            </div>
          </section>

          <section>
            <MobileFinanceListRow
              icon={Landmark}
              title="NeuroFinance"
              description="Pix, cobranças, boleto, transferências e saldo real ficam na aba de conta."
              meta="Operação bancária protegida por PIN"
              status="Conta"
              onClick={() => navigate("/financeiro/neurofinance")}
            />
          </section>

          <section ref={transactionsRef} className="scroll-mt-24 space-y-3">
            <MobileSectionTitle
              title="Lançamentos recentes"
              description="Movimentos administrativos registrados no consultório."
              trailing={
                <MobileFinanceButton
                  variant="ghost"
                  className="min-h-10 px-3"
                  onClick={() => navigate("/synapse-ai")}
                >
                  Relatório
                </MobileFinanceButton>
              }
            />

            <p className="sr-only" aria-live="polite">
              Filtro atual: {filterLabels[filter]}. {visibleTransactions.length} lançamento(s).
            </p>

            <div
              role="tablist"
              aria-label="Filtro de lançamentos"
              className="grid grid-cols-3 gap-1 rounded-2xl border border-border/60 bg-background/85 p-1 dark:border-white/10"
            >
              {filters.map((item) => {
                const active = filter === item.value;

                return (
                  <button
                    key={item.value}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    aria-controls="finance-transactions-panel"
                    onClick={() => setFilter(item.value)}
                    className={cn(
                      "min-h-11 rounded-xl px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none",
                      active
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:bg-muted/70",
                    )}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            {visibleTransactions.length === 0 ? (
              <MobileEmptyState
                icon={ListChecks}
                title="Nenhum lançamento por aqui"
                description="Registre uma entrada ou despesa para iniciar o acompanhamento financeiro."
                action={
                  <MobileFinanceButton onClick={() => openEntry("income")}>
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Novo lançamento
                  </MobileFinanceButton>
                }
              />
            ) : (
              <div
                id="finance-transactions-panel"
                role="list"
                aria-live="polite"
                className="space-y-2"
              >
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
                      value={`${income ? "+" : "-"} ${formatMoney(amount)}`}
                      tone={income ? "success" : "danger"}
                    />
                  );
                })}
              </div>
            )}
          </section>
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
