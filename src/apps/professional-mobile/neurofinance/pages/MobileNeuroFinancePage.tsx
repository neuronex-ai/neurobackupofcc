import { useMemo, useState } from "react";
import { addYears, format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Barcode,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Eye,
  EyeOff,
  FileText,
  Landmark,
  Loader2,
  QrCode,
  Receipt,
  RefreshCw,
  Send,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useFinancialAccount } from "@/hooks/use-financial-account";
import { useNeuroFinanceBalance } from "@/hooks/use-neurofinance-balance";
import { useNeuroFinanceStatement } from "@/hooks/use-neurofinance-statement";
import { cn } from "@/lib/utils";
import { MobileLayout } from "@/mobile/components/MobileLayout";

import {
  MobileActionButton,
  MobileEmptyState,
  MobileFinanceButton,
  MobileFinanceHero,
  MobileFinanceIconButton,
  MobileFinanceInsightStrip,
  MobileFinanceListRow,
  MobileFinanceTabs,
  MobileSectionTitle,
  formatMoney,
  mobileFinanceSurface,
} from "../../shared/MobileFinancePrimitives";
import { MobileBillPaymentFlow } from "../components/MobileBillPaymentFlow";
import { MobileChargeFlow } from "../components/MobileChargeFlow";
import { MobileNeuroFinanceOnboardingSheet } from "../components/MobileNeuroFinanceOnboardingSheet";
import { MobilePixPaymentFlow } from "../components/MobilePixPaymentFlow";
import { MobileTransferFlow } from "../components/MobileTransferFlow";

type FinanceArea = "management" | "neurofinance";
type Flow =
  | "charge"
  | "bill"
  | "pix-payment"
  | "pix-transfer"
  | "bank-payout"
  | null;
type MobileStatementTransaction = {
  id: string;
  type?: string | null;
  amount?: number | string | null;
  date?: string | Date | null;
  created_at?: string | Date | null;
  description?: string | null;
  status?: string | null;
  category?: string | null;
};

const home = "/financeiro/neurofinance";

function flowFromPath(pathname: string): Flow {
  if (pathname.endsWith("/cobrar")) return "charge";
  if (pathname.endsWith("/pagamentos/boleto")) return "bill";
  if (pathname.endsWith("/pix/pagar")) return "pix-payment";
  if (pathname.endsWith("/transferir")) return "pix-transfer";
  if (pathname.endsWith("/saque")) return "bank-payout";
  return null;
}

const formatStatementDate = (transaction: MobileStatementTransaction) => {
  const rawDate = transaction.date || transaction.created_at;
  if (!rawDate) return "Recente";
  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return "Recente";
  return format(date, "d MMM, HH:mm", { locale: ptBR });
};

const accountHealthCopy = {
  active: {
    title: "Saude da conta boa",
    description: "Conta aprovada para cobrancas, Pix e repasses.",
    tone: "success",
  },
  account_missing: {
    title: "Conta desconectada",
    description: "A conexao com a subconta precisa de suporte.",
    tone: "danger",
  },
  restricted: {
    title: "Regularizacao pendente",
    description: "Revise as etapas solicitadas para liberar operacoes.",
    tone: "warning",
  },
  pending_review: {
    title: "Conta em analise",
    description: "Aguardando retorno da verificacao cadastral.",
    tone: "info",
  },
  onboarding: {
    title: "Dados pendentes",
    description: "Complete as informacoes de onboarding para continuar.",
    tone: "warning",
  },
  not_started: {
    title: "Onboarding nao iniciado",
    description: "Ative a conta pelo onboarding mobile.",
    tone: "warning",
  },
};

const healthToneClass = {
  success: "border-emerald-500/20 bg-emerald-500/[0.075] text-emerald-700 dark:text-emerald-300",
  warning: "border-amber-500/20 bg-amber-500/[0.075] text-amber-700 dark:text-amber-300",
  danger: "border-red-500/20 bg-red-500/[0.075] text-red-700 dark:text-red-300",
  info: "border-blue-500/20 bg-blue-500/[0.075] text-blue-700 dark:text-blue-300",
} as const;

const stageToneClass = {
  approved: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-300",
  pending: "bg-amber-500/12 text-amber-600 dark:text-amber-300",
  review: "bg-blue-500/12 text-blue-600 dark:text-blue-300",
  rejected: "bg-red-500/12 text-red-600 dark:text-red-300",
  missing: "bg-amber-500/12 text-amber-600 dark:text-amber-300",
  neutral: "bg-foreground/[0.06] text-muted-foreground",
} as const;

export function MobileNeuroFinancePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const account = useFinancialAccount();
  const balance = useNeuroFinanceBalance();
  const statementStart = useMemo(() => subMonths(new Date(), 6), []);
  const statementEnd = useMemo(() => addYears(new Date(), 2), []);
  const statement = useNeuroFinanceStatement(statementStart, statementEnd);
  const [showBalance, setShowBalance] = useState(true);
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  const routeFlow = flowFromPath(location.pathname);
  const approved = account.isApproved;
  const transactions = ((statement.data || []) as MobileStatementTransaction[]).slice(0, 10);
  const availableBalance = Number(balance.data?.balance || 0);
  const pendingBalance = Number(balance.data?.pending || 0);
  const healthKey = (account.uiStatus || "not_started") as keyof typeof accountHealthCopy;
  const health = accountHealthCopy[healthKey] || accountHealthCopy.not_started;
  const HealthIcon = approved
    ? CheckCircle2
    : account.isRestricted || account.isAccountMissing
      ? AlertCircle
      : Clock3;

  const openFlow = (flow: Exclude<Flow, null>) => {
    const routes: Record<Exclude<Flow, null>, string> = {
      charge: `${home}/cobrar`,
      bill: `${home}/pagamentos/boleto`,
      "pix-payment": `${home}/pix/pagar`,
      "pix-transfer": `${home}/transferir`,
      "bank-payout": `${home}/saque`,
    };
    navigate(routes[flow]);
  };

  const closeFlow = () => navigate(home);

  const switchArea = (area: FinanceArea) => {
    navigate(area === "management" ? "/financeiro" : "/financeiro/neurofinance");
  };

  const refresh = async () => {
    try {
      await balance.syncNow();
      await statement.refetch();
      await account.refetch();
      toast.success("NeuroFinance atualizado.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível atualizar agora.",
      );
    }
  };

  if (account.isLoading) {
    return (
      <MobileLayout className="min-h-screen bg-background px-5">
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout className="min-h-screen bg-background px-0">
      <div className="mobile-scroll-owner h-full overflow-y-auto overflow-x-hidden px-5 pb-32 pt-3">
        <div className="space-y-5">
          <MobileFinanceTabs
            value="neurofinance"
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

          {!approved ? (
            <MobileFinanceListRow
              icon={ShieldCheck}
              title={
                account.needsInitialOnboarding || account.isAccountMissing
                  ? "Ative sua conta NeuroFinance"
                  : "Conta em validação"
              }
              description="Operações reais liberam após aprovação."
              status="Ajustes"
              tone="warning"
              onClick={() => account.needsInitialOnboarding ? setOnboardingOpen(true) : navigate("/ajustes")}
            />
          ) : null}

          <MobileFinanceHero
            eyebrow="Saldo disponível"
            title={approved ? "Conta NeuroFinance ativa" : "Conta restrita"}
            value={
              balance.isLoading
                ? "—"
                : showBalance
                  ? formatMoney(availableBalance)
                  : "R$ ••••••"
            }
            description={
              showBalance
                ? `${formatMoney(pendingBalance)} a liberar.`
                : "Saldo oculto nesta sessao."
            }
            icon={Wallet}
            tone={approved ? "default" : "warning"}
            action={
              <div className="flex items-center gap-2">
                <MobileFinanceIconButton
                  icon={showBalance ? EyeOff : Eye}
                  label={showBalance ? "Ocultar saldo" : "Mostrar saldo"}
                  onClick={() => setShowBalance((value) => !value)}
                  className="h-10 w-10 rounded-[14px] border-foreground/10 bg-background/70"
                />
                <MobileFinanceIconButton
                  icon={RefreshCw}
                  label="Atualizar NeuroFinance"
                  onClick={() => void refresh()}
                  className="h-10 w-10 rounded-[14px] border-foreground/10 bg-background/70"
                />
              </div>
            }
          >
            <div className="grid grid-cols-2 gap-2.5">
              <MobileFinanceButton
                variant={approved ? "primary" : "secondary"}
                disabled={!approved}
                onClick={() => openFlow("charge")}
              >
                <Receipt className="h-4 w-4" />
                Cobrar
              </MobileFinanceButton>
              <MobileFinanceButton
                variant="secondary"
                disabled={!approved}
                onClick={() => openFlow("pix-payment")}
              >
                <QrCode className="h-4 w-4" />
                Pagar Pix
              </MobileFinanceButton>
            </div>
          </MobileFinanceHero>

          <MobileFinanceInsightStrip
            items={[
              {
                label: "Status",
                value: approved ? "Ativo" : "Restrito",
                icon: ShieldCheck,
                tone: approved ? "success" : "warning",
              },
              {
                label: "A liberar",
                value: showBalance ? formatMoney(pendingBalance) : "••••",
                icon: CircleDollarSign,
              },
              {
                label: "Extrato",
                value: `${transactions.length}`,
                icon: FileText,
              },
            ]}
          />

          <section className="space-y-3">
            <MobileSectionTitle
              title="Saude da conta"
              trailing={
                <MobileFinanceButton
                  variant="ghost"
                  className="min-h-9 px-2.5"
                  onClick={() => void refresh()}
                >
                  Sincronizar
                </MobileFinanceButton>
              }
            />
            <div className={cn(
              mobileFinanceSurface,
              "space-y-4 p-4",
            )}>
              <div className={cn(
                "flex items-start gap-3 rounded-[18px] border p-3.5",
                healthToneClass[health.tone as keyof typeof healthToneClass],
              )}>
                <HealthIcon className="mt-0.5 h-5 w-5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black tracking-[-0.02em]">{health.title}</p>
                  <p className="mt-1 text-[11px] font-medium leading-relaxed opacity-75">{health.description}</p>
                </div>
              </div>

              <div className="grid gap-2">
                {(account.approvalStages || []).map((stage) => (
                  <div key={stage.id} className="flex items-center gap-3 rounded-[16px] border border-border/35 bg-background/55 p-3 dark:border-white/10 dark:bg-white/[0.025]">
                    <span className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px]",
                      stageToneClass[stage.tone] || stageToneClass.neutral,
                    )}>
                      {stage.tone === "approved" ? <CheckCircle2 className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-black text-foreground">{stage.label}</p>
                      <p className="mt-0.5 text-[10px] font-medium text-muted-foreground">{stage.statusLabel}</p>
                    </div>
                    {stage.actionable ? (
                      <span className="rounded-full bg-amber-500/12 px-2 py-1 text-[7px] font-black uppercase tracking-[0.1em] text-amber-600 dark:text-amber-300">
                        Acao
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <MobileSectionTitle
              title="Movimentar"
            />
            <div className="grid grid-cols-2 gap-3">
              <MobileActionButton
                label="Cobrar"
                description="Pix ou boleto"
                icon={Receipt}
                tone="success"
                onClick={() => openFlow("charge")}
                disabled={!approved}
              />
              <MobileActionButton
                label="Pagar boleto"
                description="Agora ou agendar"
                icon={Barcode}
                onClick={() => openFlow("bill")}
                disabled={!approved}
              />
              <MobileActionButton
                label="Pagar Pix"
                description="Copia e Cola"
                icon={QrCode}
                onClick={() => openFlow("pix-payment")}
                disabled={!approved}
              />
              <MobileActionButton
                label="Transferir Pix"
                description="Chave validada"
                icon={Send}
                onClick={() => openFlow("pix-transfer")}
                disabled={!approved}
              />
              <MobileActionButton
                label="Minha conta"
                description="Conta cadastrada"
                icon={Landmark}
                onClick={() => openFlow("bank-payout")}
                disabled={!approved}
              />
              <MobileActionButton
                label="Gestão"
                description="Controle"
                icon={CircleDollarSign}
                onClick={() => navigate("/financeiro")}
              />
            </div>
          </section>

          <section className="space-y-4">
            <MobileSectionTitle
              title="Extrato recente"
              trailing={
                <MobileFinanceButton
                  variant="ghost"
                  className="min-h-9 px-2.5"
                  onClick={() => void refresh()}
                >
                  Atualizar
                </MobileFinanceButton>
              }
            />

            {statement.isLoading ? (
              <div
                className={cn(
                  mobileFinanceSurface,
                  "flex h-28 items-center justify-center",
                )}
              >
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : transactions.length === 0 ? (
              <MobileEmptyState
                icon={FileText}
                title="Nenhuma movimentação"
                description="Operações confirmadas aparecem aqui."
              />
            ) : (
              <div className="space-y-2">
                {transactions.map((transaction) => {
                  const income = transaction.type === "income";
                  const amount = Math.abs(Number(transaction.amount || 0));

                  return (
                    <MobileFinanceListRow
                      key={transaction.id}
                      icon={income ? ArrowUpRight : ArrowDownRight}
                      title={transaction.description || "Movimentação"}
                      description={transaction.status || transaction.category || "Processada"}
                      meta={formatStatementDate(transaction)}
                      value={
                        showBalance
                          ? `${income ? "+" : "−"} ${formatMoney(amount)}`
                          : "••••"
                      }
                      tone={income ? "success" : "danger"}
                      valueMuted={!showBalance}
                    />
                  );
                })}
              </div>
            )}
          </section>

        </div>
      </div>

      <MobileChargeFlow
        open={routeFlow === "charge"}
        onOpenChange={(open) => !open && closeFlow()}
        onCompleted={() => void refresh()}
      />
      <MobileBillPaymentFlow
        open={routeFlow === "bill"}
        onOpenChange={(open) => !open && closeFlow()}
        onCompleted={() => void refresh()}
      />
      <MobilePixPaymentFlow
        open={routeFlow === "pix-payment"}
        onOpenChange={(open) => !open && closeFlow()}
        onCompleted={() => void refresh()}
      />
      <MobileTransferFlow
        open={routeFlow === "pix-transfer"}
        onOpenChange={(open) => !open && closeFlow()}
        purpose="transfer"
        onCompleted={() => void refresh()}
      />
      <MobileTransferFlow
        open={routeFlow === "bank-payout"}
        onOpenChange={(open) => !open && closeFlow()}
        purpose="payout"
        onCompleted={() => void refresh()}
      />
      <MobileNeuroFinanceOnboardingSheet
        open={onboardingOpen}
        onOpenChange={setOnboardingOpen}
        onComplete={() => void refresh()}
      />
    </MobileLayout>
  );
}
