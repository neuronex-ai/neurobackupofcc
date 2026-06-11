"use client";

import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { NeuroFinanceWelcomeWizard } from "@/components/financeiro/NeuroFinanceWelcomeWizard";
import { useFinancialAccount } from "@/hooks/use-financial-account";
import { useFinancialPinStatus } from "@/hooks/use-financial-pin-status";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";

export function NeuroFinancePostOnboardingGate() {
  const location = useLocation();
  const isMobile = useIsMobile();
  const isNeuroFinanceRoute = location.pathname.startsWith("/financeiro/neurofinance");
  const { account, isConnected, isLoading, needsInitialOnboarding, refetch } = useFinancialAccount();
  const pinStatus = useFinancialPinStatus(Boolean(isNeuroFinanceRoute && isConnected));
  const postOnboarding = account?.metadata?.neurofinance_post_onboarding;
  const isCompletedInAccount = Boolean(postOnboarding?.completed || postOnboarding?.completed_at);

  useEffect(() => {
    if (!isNeuroFinanceRoute || !account?.id || isCompletedInAccount || !pinStatus.data?.isConfigured) return;

    supabase.functions
      .invoke("neurofinance-post-onboarding", { body: { action: "complete" } })
      .then(() => refetch())
      .catch((error) => {
        console.warn("[NeuroFinancePostOnboardingGate] Não foi possível registrar conclusão automática.", error);
      });
  }, [account?.id, isCompletedInAccount, isNeuroFinanceRoute, pinStatus.data?.isConfigured, refetch]);

  const shouldOpen = Boolean(
    !isMobile &&
    isNeuroFinanceRoute &&
    !isLoading &&
    !pinStatus.isLoading &&
    isConnected &&
    !needsInitialOnboarding &&
    account?.id &&
    !isCompletedInAccount &&
    !pinStatus.data?.isConfigured
  );

  const handleComplete = async () => {
    await Promise.allSettled([refetch(), pinStatus.refetch?.()]);
  };

  return (
    <NeuroFinanceWelcomeWizard
      open={shouldOpen}
      pinAlreadyConfigured={Boolean(pinStatus.data?.isConfigured)}
      onComplete={handleComplete}
    />
  );
}
