import { useMemo, useState } from "react";
import { subMonths } from "date-fns";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  ChevronRight,
  CircleDollarSign,
  FileBarChart,
  Landmark,
  ListChecks,
  Plus,
  Scale,
  WalletCards,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useFinancialMetrics } from "@/hooks/use-financial-metrics";
import { useTransactions } from "@/hooks/use-transactions";
import { cn } from "@/lib/utils";
import { MobileLayout } from "@/mobile/components/MobileLayout";
import { MobileFinancialEntrySheet } from "../components/MobileFinancialEntrySheet";
import {
  MobileActionButton,
  MobileEmptyState,
  MobileMetricCard,
  MobilePageTitle,
  MobileSectionTitle,
  formatMoney,
  mobileFinanceSurface,
} from "../../shared/MobileFinancePrimitives";

type EntryType = "income" | "expense";

export function MobileFinancialManagementPage() {
  const navigate = useNavigate();
  const { data: metrics, isLoading } = useFinancialMetrics();
  const { data: transactions = [] } = useTransactions(subMonths(new Date(), 3));
  const [entryOpen, setEntryOpen] = useState(false);
  const [entryType, setEntryType] = useState<EntryType>("income");

  const recent = useMemo(
    () =>
      [...transactions]
        .sort(
          (a: any, b: any) =>
            new Date(b.date || b.created_at).getTime() -
            new Date(a.date || a.created_at).getTime(),
        )
        .slice(0, 6),
    [transactions],
  );

  const openEntry = (type: EntryType) => {
    setEntryType(type);
    setEntryOpen(true);
  };

  return (
    <MobileLayout className="min-h-screen bg-background px-0">
      <div className="space-y-8 px-5 pb-32 pt-4">
        <MobilePageTitle
          eyebrow="Operação do consultório"
          title="Gestão Financeira"
          description="Receitas, despesas, pendências e resultado do consultório — sem movimentar dinheiro real."
          action={
            <Button
              size="icon"
              variant="outline"
              onClick={() => openEntry("income")}
              className="h-11 w-11 shrink-0 rounded-[16px] border-border/50 bg-card"
            >
              <Plus className="h-4 w-4" />
            </Button>
          }
        />

        <section className="grid grid-cols-2 gap-3">
          <MobileMetricCard
            label="Recebido"
            value={isLoading ? "—" : formatMoney(metrics?.currentMonthRevenue)}
            caption="No mês atual"
            icon={ArrowUpRight}
          />
          <MobileMetricCard
            label="A receber"
            value={isLoading ? "—" : formatMoney(metrics?.projectedRevenue)}
            caption={`${metrics?.pendingInvoices || 0} pendência(s)`}
            icon={WalletCards}
          />
          <MobileMetricCard
            label="Despesas"
            value={isLoading ? "—" : formatMoney(metrics?.currentMonthExpenses)}
            caption="No mês atual"
            icon={ArrowDownRight}
          />
          <MobileMetricCard
            label="Resultado"
            value={isLoading ? "—" : formatMoney(metrics?.netProfit)}
            caption="Receitas menos despesas"
            icon={Scale}
            emphasis
          />
        </section>

        <section className="space-y-4">
          <MobileSectionTitle
            title="Ações principais"
            description="As tarefas administrativas mais frequentes no celular."
          />
          <div className="grid grid-cols-2 gap-3">
            <MobileActionButton
              label="Registrar entrada"
              description="Recebimento ou receita manual"
              icon={ArrowUpRight}
              onClick={() => openEntry("income")}
            />
            <MobileActionButton
              label="Registrar despesa"
              description="Custo ou pagamento externo"
              icon={ArrowDownRight}
              onClick={() => openEntry("expense")}
            />
            <MobileActionButton
              label="Ver pendências"
              description="Valores ainda não recebidos"
              icon={ListChecks}
              onClick={() =>
                toast.info(
                  `${metrics?.pendingInvoices || 0} pendência(s) identificada(s) neste período.`,
                )
              }
            />
            <MobileActionButton
              label="Analisar com Synapse"
              description="Pergunte sobre caixa e projeções"
              icon={Bot}
              onClick={() => navigate("/synapse-ai")}
            />
          </div>
        </section>

        <section>
          <button
            type="button"
            onClick={() => navigate("/financeiro/neurofinance")}
            className={cn(
              mobileFinanceSurface,
              "group w-full overflow-hidden p-5 text-left transition active:scale-[0.99]",
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-foreground text-background">
                <Landmark className="h-5 w-5" strokeWidth={1.6} />
              </div>
              <ChevronRight className="mt-2 h-4 w-4 text-muted-foreground transition group-hover:translate-x-1" />
            </div>
            <p className="mt-6 text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Conta e movimentações reais
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
              NeuroFinance
            </h2>
            <p className="mt-2 max-w-[300px] text-xs leading-5 text-muted-foreground">
              Consulte saldo, cobre pacientes, pague boletos e Pix ou transfira valores com confirmação por PIN.
            </p>
          </button>
        </section>

        <section className="space-y-4">
          <MobileSectionTitle
            title="Lançamentos recentes"
            description="Movimentos administrativos registrados no consultório."
            trailing={
              <button
                type="button"
                onClick={() => navigate("/synapse-ai")}
                className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
              >
                Relatório
                <FileBarChart className="h-3.5 w-3.5" />
              </button>
            }
          />

          {recent.length === 0 ? (
            <MobileEmptyState
              title="Nenhum lançamento ainda"
              description="Registre uma entrada ou despesa para iniciar o acompanhamento financeiro."
            />
          ) : (
            <div className={cn(mobileFinanceSurface, "divide-y divide-border/35 px-4")}>
              {recent.map((transaction: any) => {
                const income = transaction.type === "income";
                return (
                  <article
                    key={transaction.id}
                    className="flex items-center justify-between gap-3 py-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] border border-border/40 bg-foreground/[0.035]">
                        {income ? (
                          <ArrowUpRight className="h-4 w-4" strokeWidth={1.6} />
                        ) : (
                          <ArrowDownRight className="h-4 w-4" strokeWidth={1.6} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-foreground">
                          {transaction.description || "Lançamento"}
                        </p>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {transaction.category || "Sem categoria"} ·{" "}
                          {new Date(
                            `${transaction.date || transaction.created_at}`,
                          ).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    <p className="shrink-0 text-[13px] font-semibold">
                      {income ? "+" : "−"} {formatMoney(Math.abs(transaction.amount))}
                    </p>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <MobileFinancialEntrySheet
        open={entryOpen}
        onOpenChange={setEntryOpen}
        defaultType={entryType}
      />
    </MobileLayout>
  );
}
