"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Landmark, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LockedFeatureScreen } from "@/components/subscription";
import { useSubscription } from "@/context/SubscriptionContext";
import { useFinancialAccount } from "@/hooks/use-financial-account";
import { FinancialDashboard, FinancialDashboardProps, FinanceView } from "./FinancialDashboard";
import { NeuroFinanceVerificationModal } from "./NeuroFinanceVerificationModal";
import { OnboardingPendingNotice } from "./OnboardingPendingNotice";
import { OnboardingRecoveryBoundary as CustomOnboardingFlow } from "./OnboardingRecoveryBoundary";
import { LEGACY_MANAGEMENT_VIEW_REDIRECTS, isNeuroFinanceView } from "./finance-view-classification";

export type { FinanceView };

const FINANCE_ROUTE_LABELS: Partial<Record<FinanceView, { groupLabel: string; viewLabel: string }>> = {
  "gestao-visao-geral": { groupLabel: "Gestão Financeira", viewLabel: "Visão Geral" },
  "gestao-fluxo-caixa": { groupLabel: "Gestão Financeira", viewLabel: "Fluxo de Caixa" },
  "gestao-receitas": { groupLabel: "Gestão Financeira", viewLabel: "Receitas" },
  "gestao-despesas": { groupLabel: "Gestão Financeira", viewLabel: "Despesas" },
  "gestao-cobrancas": { groupLabel: "Gestão Financeira", viewLabel: "Cobranças" },
  "gestao-inadimplencia": { groupLabel: "Gestão Financeira", viewLabel: "Pacientes & Inadimplência" },
  "gestao-planejamento": { groupLabel: "Gestão Financeira", viewLabel: "Planejamento" },
  "gestao-relatorios": { groupLabel: "Gestão Financeira", viewLabel: "Relatórios" },
  "conta-digital": { groupLabel: "NeuroFinance", viewLabel: "Conta e Saldo" },
  "pix": { groupLabel: "NeuroFinance", viewLabel: "Área Pix" },
  "pix-pagar": { groupLabel: "NeuroFinance", viewLabel: "Pagar Pix" },
  "pix-transferir": { groupLabel: "NeuroFinance", viewLabel: "Transferir via Pix" },
  "pix-qrcode": { groupLabel: "NeuroFinance", viewLabel: "Gerar QR Code" },
  "pix-receber": { groupLabel: "NeuroFinance", viewLabel: "Pix recebidos" },
  "pix-chaves": { groupLabel: "NeuroFinance", viewLabel: "Minhas chaves" },
  "pix-salarios": { groupLabel: "NeuroFinance", viewLabel: "Pagar salários" },
  "pix-limites": { groupLabel: "NeuroFinance", viewLabel: "Limites do Pix" },
  "transferencias": { groupLabel: "NeuroFinance", viewLabel: "Sacar fundos" },
  "contas-bancarias": { groupLabel: "NeuroFinance", viewLabel: "Conta Bancária e Pix" },
  "pagamentos": { groupLabel: "NeuroFinance", viewLabel: "Pagamentos" },
  "pagamentos-boletos": { groupLabel: "NeuroFinance", viewLabel: "Pagar boletos" },
  "pagamentos-agendados": { groupLabel: "NeuroFinance", viewLabel: "Pagamentos Agendados" },
  "pagamentos-agendar": { groupLabel: "NeuroFinance", viewLabel: "Agendar pagamento" },
  "pagamentos-grupos": { groupLabel: "NeuroFinance", viewLabel: "Grupos de pagamento" },
  "saude-conta": { groupLabel: "NeuroFinance", viewLabel: "Saúde da conta" },
  "extrato": { groupLabel: "NeuroFinance", viewLabel: "Extrato da conta" },
  "cobrancas-historia": { groupLabel: "NeuroFinance", viewLabel: "Todas as cobranças" },
  "cobrancas-config": { groupLabel: "NeuroFinance", viewLabel: "Regras automáticas" },
  "cobrancas-simulador": { groupLabel: "NeuroFinance", viewLabel: "Simulador de vendas" },
  "cobrancas-chargebacks": { groupLabel: "NeuroFinance", viewLabel: "Chargebacks" },
  "antecipacoes": { groupLabel: "NeuroFinance", viewLabel: "Antecipação" },
  "antecipacoes-lista": { groupLabel: "NeuroFinance", viewLabel: "Minhas antecipações" },
  "antecipacoes-solicitar": { groupLabel: "NeuroFinance", viewLabel: "Antecipar recebimento" },
  "antecipacoes-automatica": { groupLabel: "NeuroFinance", viewLabel: "Antecipação automática" },
  "antecipacoes-simulador": { groupLabel: "NeuroFinance", viewLabel: "Simulador" },
  "antecipacoes-historico": { groupLabel: "NeuroFinance", viewLabel: "Histórico" },
  "fiscal-dados": { groupLabel: "NeuroFinance", viewLabel: "Dados Fiscais" },
  "fiscal-nova": { groupLabel: "NeuroFinance", viewLabel: "Emitir nova nota fiscal" },
  "fiscal-lista": { groupLabel: "NeuroFinance", viewLabel: "Minhas Notas Fiscais" },
  "repasses-convenio": { groupLabel: "NeuroFinance", viewLabel: "Convênios" },
  "repasses-profissional": { groupLabel: "NeuroFinance", viewLabel: "Profissionais" },
  "repasses-salas": { groupLabel: "NeuroFinance", viewLabel: "Salas" },
  "tarifas": { groupLabel: "NeuroFinance", viewLabel: "Custos e prazos" },
};

const NeuroFinanceActivationScreen = ({ onStart }: { onStart: () => void }) => (
  <div className="px-6 py-6">
    <div className="relative overflow-hidden rounded-[42px] border border-zinc-200/70 bg-zinc-950 p-8 text-white shadow-[0_34px_110px_-76px_rgba(0,0,0,0.9)] dark:border-white/[0.075] dark:bg-white dark:text-zinc-950 md:p-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_12%,rgba(255,255,255,.12),transparent_34%),radial-gradient(circle_at_90%_86%,rgba(255,255,255,.055),transparent_36%)] dark:bg-[radial-gradient(circle_at_22%_12%,rgba(0,0,0,.06),transparent_34%),radial-gradient(circle_at_90%_86%,rgba(0,0,0,.035),transparent_36%)]" />
      <div className="relative z-10 grid gap-10 xl:grid-cols-[minmax(0,1fr)_390px] xl:items-end">
        <div>
          <div className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.055] px-4 py-2 text-[9px] font-black uppercase tracking-[0.24em] opacity-68 dark:border-zinc-950/10 dark:bg-zinc-950/[0.045]">
            <Landmark className="h-4 w-4" /> NeuroFinance
          </div>
          <h1 className="mt-9 max-w-4xl text-[clamp(3rem,5.5vw,6rem)] font-black leading-[0.88] tracking-[-0.075em]">
            Ative sua conta financeira.
          </h1>
          <p className="mt-6 max-w-2xl text-base font-medium leading-relaxed opacity-62 md:text-lg">
            A Gestão Financeira já funciona sem conta bancária. Para usar Pix, boletos, saques, pagamentos, antecipação e saldo real, conclua a criação do NeuroFinance.
          </p>
          <div className="mt-8 grid max-w-3xl gap-3 md:grid-cols-3">
            {["Pix, boleto e cartão", "Saques e transferências", "Pagamentos e antecipação"].map((item) => (
              <div key={item} className="rounded-[22px] border border-white/10 bg-white/[0.055] p-4 text-[10px] font-black uppercase leading-relaxed tracking-[0.16em] opacity-62 dark:border-zinc-950/10 dark:bg-zinc-950/[0.045]">
                {item}
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[32px] border border-white/10 bg-white/[0.06] p-6 dark:border-zinc-950/10 dark:bg-zinc-950/[0.045]">
          <ShieldCheck className="h-7 w-7 opacity-62" />
          <h3 className="mt-8 text-3xl font-black leading-[0.92] tracking-[-0.06em]">Onboarding seguro e guiado.</h3>
          <p className="mt-4 text-sm font-medium leading-relaxed opacity-58">Você poderá acompanhar pendências e análise em Saúde da Conta após enviar os dados.</p>
          <Button onClick={onStart} className="mt-8 h-14 w-full rounded-2xl bg-white text-[10px] font-black uppercase tracking-[0.2em] text-zinc-950 hover:bg-white/90 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900">
            Começar agora <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  </div>
);

export const FinanceiroMainContent = (props: FinancialDashboardProps) => {
  const {
    isLoading,
    needsInitialOnboarding,
    needsVerification,
    isAccountMissing,
    syncAccount,
    refetch,
  } = useFinancialAccount();
  const { canAccess, isDevAccount, isTrial } = useSubscription();

  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<string | null>(null);
  const [showNeuroFinanceOnboarding, setShowNeuroFinanceOnboarding] = useState(false);
  const neuroFinanceView = isNeuroFinanceView(props.activeView);
  const canUseNeuroFinance = isDevAccount || (!isTrial && canAccess("advanced_finance"));

  useEffect(() => {
    const redirect = LEGACY_MANAGEMENT_VIEW_REDIRECTS[props.activeView];
    if (redirect) props.setActiveView(redirect);
  }, [props]);

  useEffect(() => {
    const routeContext = FINANCE_ROUTE_LABELS[props.activeView] || {
      groupLabel: "Gestão Financeira",
      viewLabel: "Visão Geral",
    };

    window.dispatchEvent(new CustomEvent("neuronex:finance-route-context", { detail: routeContext }));
  }, [props.activeView]);

  useEffect(() => {
    const handleFinanceNavigate = (event: Event) => {
      const view = (event as CustomEvent<{ view?: FinanceView }>).detail?.view;
      if (view) props.setActiveView(view);
    };

    window.addEventListener("neuronex:finance-navigate", handleFinanceNavigate);
    return () => window.removeEventListener("neuronex:finance-navigate", handleFinanceNavigate);
  }, [props]);

  const handleOpenOnboarding = () => {
    if (needsInitialOnboarding || isAccountMissing) {
      setShowNeuroFinanceOnboarding(true);
      return;
    }
    if (needsVerification) setShowVerificationModal(true);
  };

  const handleVerificationSuccess = () => {
    setShowVerificationModal(false);
    setSelectedRequirement(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-32 w-full rounded-[32px]" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Skeleton className="h-40 rounded-[24px]" />
          <Skeleton className="h-40 rounded-[24px]" />
          <Skeleton className="h-40 rounded-[24px]" />
        </div>
      </div>
    );
  }

  if (neuroFinanceView) {
    if (!canUseNeuroFinance) {
      return (
        <LockedFeatureScreen
          feature="advanced_finance"
          title="NeuroFinance"
          description="Durante o teste gratis, a Gestao Financeira continua liberada para receitas, despesas e fluxo de caixa. Pix, boletos, saques, pagamentos, antecipacao e saldo real ficam disponiveis depois da assinatura ativa."
        />
      );
    }

    return (
      <>
        <div className="space-y-6 animate-fade-in">
          {(needsInitialOnboarding || isAccountMissing) ? (
            showNeuroFinanceOnboarding ? (
              <div className="h-[calc(100dvh-112px)] min-h-[620px] overflow-hidden rounded-[40px] pb-1">
                <CustomOnboardingFlow
                  fullScreen
                  onCancel={() => setShowNeuroFinanceOnboarding(false)}
                  onComplete={async () => {
                    await syncAccount.mutateAsync();
                    await refetch();
                    setShowNeuroFinanceOnboarding(false);
                  }}
                />
              </div>
            ) : (
              <NeuroFinanceActivationScreen onStart={handleOpenOnboarding} />
            )
          ) : (
            <>
              {needsVerification && <OnboardingPendingNotice onRequestOnboarding={handleOpenOnboarding} />}
              <FinancialDashboard {...props} />
            </>
          )}
        </div>

        <NeuroFinanceVerificationModal
          open={showVerificationModal}
          onOpenChange={setShowVerificationModal}
          selectedRequirement={selectedRequirement}
          setSelectedRequirement={setSelectedRequirement}
          onSuccess={handleVerificationSuccess}
        />
      </>
    );
  }

  return <FinancialDashboard {...props} />;
};
