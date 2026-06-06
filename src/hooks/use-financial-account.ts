"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getAsaasAccountState } from "@/lib/asaas-account-status";

type FinancialUiStatus =
  | "not_started"
  | "pending"
  | "onboarding"
  | "pending_review"
  | "restricted"
  | "active"
  | "account_missing"
  | "disabled"
  | string;

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error || "Erro desconhecido");

const FINANCIAL_ACCOUNT_PUBLIC_FIELDS = [
  "id", "user_id", "status", "provider", "onboarding_started_at", "onboarding_completed_at",
  "charges_enabled", "payouts_enabled", "details_submitted", "default_currency",
  "bank_account_last4", "bank_name", "pix_enabled", "card_enabled",
  "platform_fee_percent", "platform_fee_fixed", "created_at", "updated_at",
  "asaas_account_id", "asaas_wallet_id", "requirements", "metadata", "asaas_onboarding_url",
  "asaas_environment", "last_asaas_event_type", "last_asaas_event_at",
  "last_balance_sync_at", "last_sync_error", "holder_name", "cpf_cnpj", "birth_date",
  "mobile_phone", "pep_status", "address_street", "address_number", "address_complement",
  "address_neighborhood", "address_city", "address_state", "address_postal_code",
  "company_type", "income_value", "business_url", "business_description", "business_mcc",
  "bank_code", "bank_agency", "bank_account", "bank_account_digit", "bank_account_type",
  "bank_holder_name", "bank_holder_cpf_cnpj", "document_front_id", "document_back_id",
  "tos_accepted_at", "onboarding_payload",
].join(",");

const invokeAsaasFunction = async (name: string, body?: unknown) => {
  const response = await supabase.functions.invoke(name, { body });

  if (response.error) {
    let detail = "";
    try {
      const context = (response.error as any)?.context;
      const payload = context?.json ? await context.json() : null;
      detail = payload?.error || payload?.message || "";
    } catch {
      // The generic Functions error remains the fallback.
    }
    throw new Error(detail || response.error.message);
  }
  if ((response.data as any)?.error) throw new Error((response.data as any).error);

  return response.data as any;
};

const extractRequirements = (account: any) =>
  account?.requirements || account?.account_status || account?.accountStatus || {};

export const useFinancialAccount = () => {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchAndSyncAccount = async () => {
    if (!userId) return null;

    const { data: localData, error: localError } = await supabase
      .from("financial_accounts")
      .select(FINANCIAL_ACCOUNT_PUBLIC_FIELDS)
      .eq("user_id", userId)
      .maybeSingle();

    if (localError) throw localError;

    try {
      const syncData = await invokeAsaasFunction("asaas-account-sync", {});

      const { data: freshData } = await supabase
        .from("financial_accounts")
        .select(FINANCIAL_ACCOUNT_PUBLIC_FIELDS)
        .eq("user_id", userId)
        .maybeSingle();

      return {
        ...(localData || {}),
        ...(freshData || {}),
        ...(syncData || {}),
        metadata: {
          ...((localData as any)?.metadata || {}),
          ...((freshData as any)?.metadata || {}),
          ...((syncData as any)?.metadata || {}),
        },
      };
    } catch (error) {
      console.error("[useFinancialAccount] Erro ao sincronizar com Asaas", error);
      return localData
        ? { ...localData, last_sync_error: getErrorMessage(error) }
        : { status: "not_started", last_sync_error: getErrorMessage(error) };
    }
  };

  const { data: account, isLoading, refetch } = useQuery({
    queryKey: ["financial-account", userId],
    queryFn: fetchAndSyncAccount,
    enabled: !!userId,
    staleTime: 1000 * 60,
    refetchInterval: userId ? 1000 * 45 : false,
  });

  const invalidateFinancialQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["financial-account"] });
    queryClient.invalidateQueries({ queryKey: ["NeuroFinance-balance"] });
    queryClient.invalidateQueries({ queryKey: ["asaas-balance-details"] });
    queryClient.invalidateQueries({ queryKey: ["dashboardAlerts"] });
  };

  const cacheAndInvalidateFinancialAccount = (data?: any) => {
    if (userId && data) {
      queryClient.setQueryData(["financial-account", userId], data);
    }
    invalidateFinancialQueries();
  };

  const syncAccount = useMutation({
    mutationFn: fetchAndSyncAccount,
    onSuccess: cacheAndInvalidateFinancialAccount,
  });

  const startOnboarding = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      invokeAsaasFunction("asaas-connect-onboarding", payload),
    onSuccess: invalidateFinancialQueries,
  });

  const updateAccount = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      invokeAsaasFunction("asaas-account-update", payload),
    onSuccess: () => {
      invalidateFinancialQueries();
      refetch();
    },
  });

  const uploadFile = useMutation({
    mutationFn: (payload: FormData) => invokeAsaasFunction("asaas-upload-file", payload),
    onSuccess: invalidateFinancialQueries,
  });

  const accountState = getAsaasAccountState(account);
  const requirements = extractRequirements(account);
  const uiStatus = accountState.uiStatus as FinancialUiStatus;
  const isAccountCreated = !!(account as any)?.asaas_account_id;
  const isApproved = accountState.isApproved;
  const isPending = ["pending", "onboarding", "pending_review"].includes(uiStatus);
  const isRestricted = ["restricted", "disabled"].includes(uiStatus);
  const isAwaitingApproval = uiStatus === "pending_review";
  const isAccountMissing = uiStatus === "account_missing";
  const isAwaitingDocuments = accountState.hasActionableStages && !isApproved;
  const hasActionableRequirements = isAwaitingDocuments || isRestricted || isAccountMissing;
  const needsVerification = isAccountCreated && accountState.hasOpenStages;
  const needsInitialOnboarding =
    !isAccountCreated || uiStatus === "account_missing";

  return {
    account,
    isLoading: isLoading || userId === undefined,
    refetch,
    syncAccount,
    startOnboarding,
    updateAccount,
    uploadFile,
    isConnected: isAccountCreated,
    hasAccount: isAccountCreated,
    isApproved,
    isPending,
    isRestricted,
    isAwaitingApproval,
    isAwaitingDocuments,
    isAccountCreated,
    isAccountMissing,
    needsInitialOnboarding,
    hasActionableRequirements,
    needsVerification,
    requirements,
    accountState,
    approvalStages: accountState.stages,
    openApprovalStages: accountState.openStages,
    actionableApprovalStages: accountState.actionableStages,
    uiStatus,
    lastSyncError: (account as any)?.last_sync_error || null,
    status: uiStatus,
  };
};
