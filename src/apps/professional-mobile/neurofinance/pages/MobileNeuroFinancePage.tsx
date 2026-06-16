import { useMemo, useState } from "react";
import { addYears, format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowDownRight,
  ArrowUpRight,
  Barcode,
  CircleDollarSign,
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
  MobilePageTitle,
  MobileSectionTitle,
  formatMoney,
  mobileFinanceSurface,
} from "../../shared/MobileFinancePrimitives";
import { MobileBillPaymentFlow } from "../components/MobileBillPaymentFlow";
import { MobileChargeFlow } from "../components/MobileChargeFlow";
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

export function MobileNeuroFinancePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const account = useFinancialAccount();
  const balance = useNeuroFinanceBalance();
  const statementStart = useMemo(() => subMonths(new Date(), 6), []);
  const statementEnd = useMemo(() => addYears(new Date(), 2), []);
  const statement = useNeuroFinanceStatement(statementStart, statementEnd);
  const [showBalance, setShowBalance] = useState(true);

  const routeFlow = flowFromPath(location.pathname);
  const approved = account.isApproved;
  const transactions = ((statement.data || []) as MobileStatementTransaction[]).slice(0, 10);
  const availableBalance = Number(balance.data?.balance || 0);
  const pendingBalance = Number(balance.data?.pending || 0);

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
      <div className="mobile-scroll-owner h-full overflow-y-auto overflow-x-hidden px-5 pb-32 pt-4">
        <div className="space-y-6">
          <MobilePageTitle
            eyebrow="Conta e movimentações reais"
            title="Financeiro"
            description="Operações bancárias com revisão dos dados, validação de saldo e PIN financeiro."
            action={
              <MobileFinanceIconButton
                icon={showBalance ? EyeOff : Eye}
                label={showBalance ? "Ocultar saldo" : "Mostrar saldo"}
                onClick={() => setShowBalance((value) => !value)}
              />
            }
          />

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
              description="A Gestão Financeira continua disponível. Operações reais serão liberadas quando a conta estiver aprovada."
              status="Ação"
              tone="warning"
              onClick={() => navigate("/ajustes")}
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
                ? `${formatMoney(pendingBalance)} a liberar. O saldo é conferido novamente antes de qualquer envio.`
                : "Valores ocultos nesta sessão. As operações continuam protegidas por PIN."
            }
            icon={Wallet}
            tone={approved ? "default" : "warning"}
            action={
              <MobileFinanceButton
                variant={approved ? "light" : "secondary"}
                className="min-h-10 px-3"
                onClick={() => void refresh()}
              >
                <RefreshCw className="h-4 w-4" />
              </MobileFinanceButton>
            }
          >
            <div className="grid grid-cols-2 gap-2.5">
              <MobileFinanceButton
                variant={approved ? "light" : "secondary"}
                disabled={!approved}
                onClick={() => openFlow("charge")}
              >
                <Receipt className="h-4 w-4" />
                Cobrar
              </MobileFinanceButton>
              <MobileFinanceButton
                variant="secondary"
                disabled={!approved}
                className={cn(
                  approved && "border-background/15 bg-background/[0.07] text-background",
                )}
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

          <section className="space-y-4">
            <MobileSectionTitle
              title="Movimentar"
              description="Ações essenciais da conta, com revisão antes do PIN."
            />
            <div className="grid grid-cols-2 gap-3">
              <MobileActionButton
                label="Cobrar"
                description="Pix, boleto ou cartão"
                icon={Receipt}
                tone="success"
                onClick={() => openFlow("charge")}
                disabled={!approved}
              />
              <MobileActionButton
                label="Pagar boleto"
                description="Pagar agora ou agendar"
                icon={Barcode}
                onClick={() => openFlow("bill")}
                disabled={!approved}
              />
              <MobileActionButton
                label="Pagar Pix"
                description="Pix Copia e Cola"
                icon={QrCode}
                onClick={() => openFlow("pix-payment")}
                disabled={!approved}
              />
              <MobileActionButton
                label="Transferir Pix"
                description="Validar chave e titular"
                icon={Send}
                onClick={() => openFlow("pix-transfer")}
                disabled={!approved}
              />
              <MobileActionButton
                label="Minha conta"
                description="Enviar para conta cadastrada"
                icon={Landmark}
                onClick={() => openFlow("bank-payout")}
                disabled={!approved}
              />
              <MobileActionButton
                label="Gestão"
                description="Receitas e despesas"
                icon={CircleDollarSign}
                onClick={() => navigate("/financeiro")}
              />
            </div>
          </section>

          <section className="space-y-4">
            <MobileSectionTitle
              title="Extrato recente"
              description="Movimentações sincronizadas da conta."
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
                description="As operações confirmadas aparecerão aqui automaticamente."
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

          <section
            className={cn(
              mobileFinanceSurface,
              "flex items-start gap-3 p-4 text-[11px] font-medium leading-relaxed text-muted-foreground/70",
            )}
          >
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
            <p>
              Pagamentos e transferências exigem revisão dos dados e PIN. O saldo
              é validado novamente no momento da execução.
            </p>
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
    </MobileLayout>
  );
}
