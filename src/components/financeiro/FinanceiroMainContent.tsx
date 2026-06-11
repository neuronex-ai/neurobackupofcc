"use client";

import { useEffect, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { useFinancialAccount } from "@/hooks/use-financial-account";
import { FinancialDashboard, FinancialDashboardProps, FinanceView } from "./FinancialDashboard";
import { NeuroFinanceVerificationModal } from "./NeuroFinanceVerificationModal";
import { OnboardingPendingNotice } from "./OnboardingPendingNotice";

export type { FinanceView };

const FINANCE_ROUTE_LABELS: Partial<Record<FinanceView, { groupLabel: string; viewLabel: string }>> = {
  "conta-digital": { groupLabel: "Conta e Saldo", viewLabel: "Conta e Saldo" },
  "pix": { groupLabel: "Área Pix", viewLabel: "Área Pix" },
  "pix-pagar": { groupLabel: "Área Pix", viewLabel: "Pagar Pix" },
  "pix-transferir": { groupLabel: "Transferências", viewLabel: "Transferir via Pix" },
  "pix-qrcode": { groupLabel: "Área Pix", viewLabel: "Gerar QR Code" },
  "pix-receber": { groupLabel: "Área Pix", viewLabel: "Pix recebidos" },
  "pix-chaves": { groupLabel: "Área Pix", viewLabel: "Minhas chaves" },
  "pix-salarios": { groupLabel: "Área Pix", viewLabel: "Pagar salários" },
  "pix-limites": { groupLabel: "Área Pix", viewLabel: "Limites do Pix" },
  "transferencias": { groupLabel: "Saques", viewLabel: "Saques" },
  "pagamentos": { groupLabel: "Pagamentos", viewLabel: "Pagamentos" },
  "pagamentos-boletos": { groupLabel: "Pagamentos", viewLabel: "Pagar boletos" },
  "pagamentos-agendados": { groupLabel: "Pagamentos", viewLabel: "Pagamentos Agendados" },
  "pagamentos-agendar": { groupLabel: "Pagamentos", viewLabel: "Agendar pagamento" },
  "pagamentos-grupos": { groupLabel: "Pagamentos", viewLabel: "Grupos de pagamento" },
  "contas-bancarias": { groupLabel: "Ajustes", viewLabel: "Conta bancária" },
  "saude-conta": { groupLabel: "Ajustes", viewLabel: "Saúde da conta" },
  "extrato": { groupLabel: "Extrato", viewLabel: "Extrato" },
  "fluxo-caixa": { groupLabel: "Extrato", viewLabel: "Fluxo de caixa" },
  "receitas": { groupLabel: "Receitas", viewLabel: "Entradas Confirmadas" },
  "despesas": { groupLabel: "Despesas", viewLabel: "Saídas Confirmadas" },
  "cobrancas-historia": { groupLabel: "Cobranças", viewLabel: "Todas as cobranças" },
  "cobrancas-config": { groupLabel: "Cobranças", viewLabel: "Regras automáticas" },
  "cobrancas-simulador": { groupLabel: "Cobranças", viewLabel: "Simulador de vendas" },
  "cobrancas-chargebacks": { groupLabel: "Chargebacks", viewLabel: "Chargebacks" },
  "antecipacoes": { groupLabel: "Antecipação", viewLabel: "Antecipação" },
  "antecipacoes-lista": { groupLabel: "Antecipação", viewLabel: "Minhas antecipações" },
  "antecipacoes-solicitar": { groupLabel: "Antecipação", viewLabel: "Antecipar recebimento" },
  "antecipacoes-automatica": { groupLabel: "Antecipação", viewLabel: "Antecipação automática" },
  "antecipacoes-simulador": { groupLabel: "Antecipação", viewLabel: "Simulador" },
  "antecipacoes-historico": { groupLabel: "Antecipação", viewLabel: "Histórico" },
  "fiscal-dados": { groupLabel: "NFS-e", viewLabel: "Dados Fiscais" },
  "fiscal-nova": { groupLabel: "NFS-e", viewLabel: "Emitir nova nota fiscal" },
  "fiscal-lista": { groupLabel: "NFS-e", viewLabel: "Minhas Notas Fiscais" },
  "repasses-convenio": { groupLabel: "Repasses", viewLabel: "Convênios" },
  "repasses-profissional": { groupLabel: "Repasses", viewLabel: "Profissionais" },
  "repasses-salas": { groupLabel: "Repasses", viewLabel: "Salas" },
  "tarifas": { groupLabel: "Tarifas", viewLabel: "Custos e prazos" },
};

export const FinanceiroMainContent = (props: FinancialDashboardProps) => {
  const {
    isLoading,
    needsInitialOnboarding,
    needsVerification,
    isAccountMissing,
  } = useFinancialAccount();

  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<string | null>(null);

  useEffect(() => {
    const routeContext = FINANCE_ROUTE_LABELS[props.activeView] || {
      groupLabel: "NeuroFinance",
      viewLabel: "Conta e Saldo",
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
    if (needsInitialOnboarding) {
      // O onboarding inicial é tratado pelo componente pai DesktopFinanceiro.
      // Mantemos este fallback para cobrir mudanças de estado em tempo real.
      window.location.reload();
      return;
    }

    if (needsVerification) {
      setShowVerificationModal(true);
    }
  };

  const handleVerificationSuccess = () => {
    setShowVerificationModal(false);
    setSelectedRequirement(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-[32px]" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Skeleton className="h-40 rounded-[24px]" />
          <Skeleton className="h-40 rounded-[24px]" />
          <Skeleton className="h-40 rounded-[24px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {(needsInitialOnboarding || needsVerification || isAccountMissing) && (
        <OnboardingPendingNotice onRequestOnboarding={handleOpenOnboarding} />
      )}

      <FinancialDashboard {...props} />

      <NeuroFinanceVerificationModal
        open={showVerificationModal}
        onOpenChange={setShowVerificationModal}
        selectedRequirement={selectedRequirement}
        setSelectedRequirement={setSelectedRequirement}
        onSuccess={handleVerificationSuccess}
      />
    </div>
  );
};
