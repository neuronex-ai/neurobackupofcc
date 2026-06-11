"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

import { NeuroFinancePostOnboardingWizard } from "@/components/financeiro/NeuroFinancePostOnboardingWizard";
import { useFinancialAccount } from "@/hooks/use-financial-account";
import { useFinancialPinStatus } from "@/hooks/use-financial-pin-status";
import { useIsMobile } from "@/hooks/use-mobile";

function getCompletionKey(accountId?: string | null) {
  return accountId ? `neurofinance-post-onboarding-completed:${accountId}` : null;
}

export function NeuroFinancePostOnboardingGate() {
  const location = useLocation();
  const isMobile = useIsMobile();
  const isNeuroFinanceRoute = location.pathname.startsWith("/financeiro/neurofinance");
  const { account, isConnected, isLoading, needsInitialOnboarding } = useFinancialAccount();
  const pinStatus = useFinancialPinStatus(Boolean(isNeuroFinanceRoute && isConnected));
  const completionKey = useMemo(() => getCompletionKey(account?.id), [account?.id]);
  const [isCompleted, setIsCompleted] = useState(true);

  useEffect(() => {
    if (!completionKey) {
      setIsCompleted(true);
      return;
    }

    try {
      setIsCompleted(window.localStorage.getItem(completionKey) === "true");
    } catch {
      setIsCompleted(false);
    }
  }, [completionKey]);

  const shouldOpen = Boolean(
    !isMobile &&
    isNeuroFinanceRoute &&
    !isLoading &&
    isConnected &&
    !needsInitialOnboarding &&
    account?.id &&
    !isCompleted
  );

  const handleComplete = () => {
    if (completionKey) {
      try {
        window.localStorage.setItem(completionKey, "true");
      } catch {
        // Ignore storage errors and keep the session unblocked.
      }
    }
    setIsCompleted(true);
    pinStatus.refetch?.();
  };

  return (
    <NeuroFinancePostOnboardingWizard
      open={shouldOpen}
      pinAlreadyConfigured={Boolean(pinStatus.data?.isConfigured)}
      onComplete={handleComplete}
    />
  );
}
