"use client";

import { useState } from "react";
import { useFinancialAccount } from "@/hooks/use-financial-account";
import { OnboardingPendingNotice } from "./OnboardingPendingNotice";
import { NeuroBankVerificationModal } from "./NeuroBankVerificationModal";
import { FinancialDashboard, FinancialDashboardProps, FinanceView } from "./FinancialDashboard";
import { Skeleton } from "@/components/ui/skeleton";

export type { FinanceView };

export const FinanceiroMainContent = (props: FinancialDashboardProps) => {
  const {
    isLoading,
    needsInitialOnboarding,
    needsVerification,
    isAccountCreated
  } = useFinancialAccount();

  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<string | null>(null);

  const handleOpenOnboarding = () => {
    if (needsInitialOnboarding) {
      // O onboarding inicial é tratado pelo componente pai DesktopFinanceiro
      // mas mantemos aqui por segurança caso o estado mude
      window.location.reload();
    } else if (needsVerification) {
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-40 rounded-[24px]" />
          <Skeleton className="h-40 rounded-[24px]" />
          <Skeleton className="h-40 rounded-[24px]" />
        </div>
      </div>
    );
  }



  return (
    <div className="space-y-6 animate-fade-in">
      {(needsInitialOnboarding || needsVerification) && (
        <OnboardingPendingNotice onRequestOnboarding={handleOpenOnboarding} />
      )}

      <FinancialDashboard {...props} />

      {/* Modais de Fluxo */}


      <NeuroBankVerificationModal
        open={showVerificationModal}
        onOpenChange={setShowVerificationModal}
        selectedRequirement={selectedRequirement}
        setSelectedRequirement={setSelectedRequirement}
        onSuccess={handleVerificationSuccess}
      />
    </div>
  );
};