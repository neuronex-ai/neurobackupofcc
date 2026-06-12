"use client";

import { useEffect, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { useFinancialAccount } from "@/hooks/use-financial-account";
import { FinancialDashboard, FinancialDashboardProps, FinanceView } from "./FinancialDashboard";
import { NeuroFinanceVerificationModal } from "./NeuroFinanceVerificationModal";
import { OnboardingPendingNotice } from "./OnboardingPendingNotice";

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
  "fluxo-caixa": { groupLabel: "NeuroFinance", viewLabel: "Fluxo de caixa" },
  "receitas": { groupLabel: "NeuroFinance", viewLabel: "Entradas Confirmadas" },
  "despesas": { groupLabel: "NeuroFinance", viewLabel: "Saídas Confirmadas" },
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
    if (needsInitialOnboarding) return;
    if (needsVerification) setShowVerificationModal(true);
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
