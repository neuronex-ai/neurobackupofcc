import { useMemo, useState } from "react";
import { addYears, subMonths } from "date-fns";
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
  Send,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useFinancialAccount } from "@/hooks/use-financial-account";
import { useNeuroFinanceBalance } from "@/hooks/use-neurofinance-balance";
import { useNeuroFinanceStatement } from "@/hooks/use-neurofinance-statement";
import { cn } from "@/lib/utils";
import { MobileLayout } from "@/mobile/components/MobileLayout";

import {
  MobileActionButton,
  MobileEmptyState,
  MobilePageTitle,
  MobileSectionTitle,
  formatMoney,
  mobileFinanceSurface,
} from "../../shared/MobileFinancePrimitives";
import { MobileBillPaymentFlow } from "../components/MobileBillPaymentFlow";
import { MobileChargeFlow } from "../components/MobileChargeFlow";
import { MobilePixPaymentFlow } from "../components/MobilePixPaymentFlow";
import { MobileTransferFlow } from "../components/MobileTransferFlow";

type Flow =
  | "charge"
  | "bill"
  | "pix-payment"
  | "pix-transfer"
  | "bank-payout"
  | null;

const home = "/financeiro/neurofinance";

function flowFromPath(pathname: string): Flow {
  if (pathname.endsWith("/cobrar")) return "charge";
  if (pathname.endsWith("/pagamentos/boleto")) return "bill";
  if (pathname.endsWith("/pix/pagar")) return "pix-payment";
  if (pathname.endsWith("/transferir")) return "pix-transfer";
  if (pathname.endsWith("/saque")) return "bank-payout";
  return null;
}

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
  const transactions = (statement.data || []).slice(0, 8);

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
      <div className="space-y-8 px-5 pb-32 pt-4">
        <MobilePageTitle
          eyebrow="Conta e movimentações reais"
          title="NeuroFinance"
          description="Saldo, recebimentos e movimentações reais com revisão dos dados, validação de saldo e PIN financeiro."
          action={
            <Button
              size="icon"
              variant="outline"
              onClick={() => setShowBalance((value) => !value)}
              className="h-11 w-11 shrink-0 rounded-[16px] border-border/50 bg-card"
            >
              {showBalance ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          }
        />

        {!approved ? (
          <section className={cn(mobileFinanceSurface, "p-5")}>
            <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-foreground text-background">
              <ShieldCheck className="h-5 w-5" strokeWidth={1.6} />
            </div>
            <p className="mt-5 text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Conta protegida
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-[-0.035em]">
              {account.needsInitialOnboarding || account.isAccountMissing
                ? "Ative sua conta NeuroFinance"
                : "Conta em validação"}
            </h2>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              A Gestão Financeira continua disponível. As operações reais serão
              liberadas quando a conta estiver aprovada.
            </p>
            <Button
              variant="outline"
              onClick={() => navigate("/ajustes")}
              className="mt-5 h-12 w-full rounded-[18px]"
            >
              Ver situação da conta
            </Button>
          </section>
        ) : null}

        <section
          className={cn(
            mobileFinanceSurface,
            "relative overflow-hidden bg-foreground p-6 text-background",
          )}
        >
          <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-background/10 blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-[14px] border border-background/15 bg-background/10">
                  <Wallet className="h-4 w-4" strokeWidth={1.6} />
                </div>
                <p className="text-[9px] font-medium uppercase tracking-[0.22em] text-background/60">
                  Saldo disponível
                </p>
              </div>
              <span className="rounded-full border border-background/15 px-3 py-1 text-[9px] uppercase tracking-[0.16em] text-background/65">
                {approved ? "Ativo" : "Restrito"}
              </span>
            </div>
            <p className="mt-7 text-[35px] font-semibold tracking-[-0.055em]">
              {showBalance ? formatMoney(balance.data?.balance) : "R$ ••••••"}
            </p>
            <p className="mt-2 text-[11px] text-background/55">
              {showBalance
                ? `${formatMoney(balance.data?.pending)} a liberar`
                : "Valores ocultos"}
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <MobileSectionTitle
            title="Movimentar"
            description="Ações essenciais da conta adaptadas para celular."
          />
          <div className="grid grid-cols-2 gap-3">
            <MobileActionButton
              label="Cobrar"
              description="Pix, boleto ou cartão"
              icon={Receipt}
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
              description="Transferir para conta cadastrada"
              icon={Landmark}
              onClick={() => openFlow("bank-payout")}
              disabled={!approved}
            />
            <MobileActionButton
              label="Gestão"
              description="Receitas, despesas e resultado"
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
              <button
                type="button"
                onClick={() => void refresh()}
                className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
              >
                Atualizar
                <FileText className="h-3.5 w-3.5" />
              </button>
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
              title="Nenhuma movimentação"
              description="As operações confirmadas aparecerão aqui automaticamente."
            />
          ) : (
            <div
              className={cn(
                mobileFinanceSurface,
                "divide-y divide-border/35 px-4",
              )}
            >
              {transactions.map((transaction: any) => {
                const income = transaction.type === "income";
                return (
                  <article
                    key={transaction.id}
                    className="flex items-center justify-between gap-3 py-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] border border-border/40 bg-foreground/[0.035]">
                        {income ? (
                          <ArrowUpRight
                            className="h-4 w-4"
                            strokeWidth={1.6}
                          />
                        ) : (
                          <ArrowDownRight
                            className="h-4 w-4"
                            strokeWidth={1.6}
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold">
                          {transaction.description || "Movimentação"}
                        </p>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {transaction.status || transaction.category || "Processada"} ·{" "}
                          {new Date(
                            transaction.date || transaction.created_at || Date.now(),
                          ).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    <p className="shrink-0 text-[13px] font-semibold">
                      {income ? "+" : "−"}{" "}
                      {showBalance
                        ? formatMoney(Math.abs(transaction.amount))
                        : "••••"}
                    </p>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section
          className={cn(
            mobileFinanceSurface,
            "flex items-start gap-3 p-4 text-[11px] leading-4 text-muted-foreground",
          )}
        >
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
          <p>
            Pagamentos e transferências exigem revisão dos dados e PIN. O saldo
            é validado novamente no momento da execução.
          </p>
        </section>
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
