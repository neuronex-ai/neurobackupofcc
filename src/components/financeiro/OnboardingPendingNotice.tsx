"use client";

import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ShieldAlert,
  Clock,
  RefreshCw,
  AlertCircle,
  Unplug,
} from "lucide-react";
import { useFinancialAccount } from "@/hooks/use-financial-account";

interface OnboardingPendingNoticeProps {
  onRequestOnboarding?: () => void;
  onRecreateAccount?: () => void;
}

const requirementTranslations: Record<string, string> = {
  "individual.dob.day": "Dia de nascimento",
  "individual.dob.month": "Mês de nascimento",
  "individual.dob.year": "Ano de nascimento",
  "individual.address.city": "Cidade",
  "individual.address.line1": "Endereço",
  "individual.address.postal_code": "CEP",
  "individual.address.state": "Estado",
  "individual.email": "E-mail",
  "individual.first_name": "Nome",
  "individual.last_name": "Sobrenome",
  "individual.phone": "Telefone",
  "individual.id_number": "CPF",
  "individual.verification.document": "Documento de identidade",
  "individual.verification.additional_document": "Documento adicional",
  "business_profile.url": "Site / rede social",
  "business_profile.mcc": "Categoria do negócio",
  "external_account": "Conta bancária de repasse",
  "tos_acceptance.date": "Aceite dos termos",
};

export const OnboardingPendingNotice = ({
  onRequestOnboarding,
  onRecreateAccount,
}: OnboardingPendingNoticeProps) => {
  const {
    isApproved,
    requirements,
    syncAccount,
    hasActionableRequirements,
    needsInitialOnboarding,
    isRestricted,
    isAwaitingApproval,
    isAccountCreated,
    isAccountMissing,
    uiStatus,
    lastSyncError,
  } = useFinancialAccount();

  if (isApproved) return null;

  const isUnderReview =
    uiStatus === "pending_review" ||
    (isAwaitingApproval && !hasActionableRequirements && isAccountCreated);

  const hasPendingDocs = !!requirements?.currently_due?.some((r: string) =>
    r.includes("document")
  );

  const currentRequirements = requirements?.currently_due || [];

  const icon = isAccountMissing ? (
    <Unplug className="h-5 w-5 md:h-6 md:w-6 text-red-500" />
  ) : isUnderReview ? (
    <Clock className="h-5 w-5 md:h-6 md:w-6 text-amber-500" />
  ) : isRestricted ? (
    <AlertCircle className="h-5 w-5 md:h-6 md:w-6 text-red-500" />
  ) : (
    <ShieldAlert className="h-5 w-5 md:h-6 md:w-6 text-orange-500" />
  );

  const title = isAccountMissing
    ? "Conta não encontrada"
    : needsInitialOnboarding
      ? "Configuração necessária"
      : isUnderReview
        ? "Conta em análise"
        : isRestricted
          ? "Conta restrita"
          : "Ação necessária";

  const description = isAccountMissing
    ? "A conta financeira local não foi localizada no Asaas. Refaça a criação da conta para continuar usando o NeuroFinance."
    : needsInitialOnboarding
      ? "Para começar a receber pagamentos e emitir notas fiscais, você precisa completar a configuração do seu perfil financeiro."
      : isUnderReview
        ? "Sua documentação foi enviada e está em análise. Este processo pode levar algum tempo."
        : isRestricted
          ? "Sua conta sofreu restrições temporárias. Verifique as pendências abaixo para restaurar o acesso total."
          : hasPendingDocs
            ? "Para sua segurança e conformidade, precisamos que você envie ou atualize alguns documentos."
            : "Sua conta requer a atualização de algumas informações para continuar operando normalmente.";

  const primaryLabel = isAccountMissing
    ? "Refazer criação da conta"
    : needsInitialOnboarding
      ? "Iniciar configuração"
      : isRestricted
        ? "Regularizar conta"
        : "Completar cadastro";

  const handlePrimaryAction = () => {
    if (isAccountMissing) {
      onRecreateAccount?.();
      return;
    }
    onRequestOnboarding?.();
  };

  return (
    <div className="relative mb-8 w-full overflow-hidden rounded-[32px] border border-zinc-200/50 bg-gradient-to-br from-white to-zinc-50 p-6 shadow-[0_12px_24px_-8px_rgba(0,0,0,0.05)] dark:border-white/5 dark:from-[#0A0A0C] dark:to-zinc-900 dark:shadow-[0_12px_24px_-8px_rgba(0,0,0,0.4)] md:p-8">
      <div className="absolute right-0 top-0 rounded-full bg-zinc-900/5 p-32 blur-[80px] dark:bg-white/5" />

      <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between md:gap-8">
        <div className="flex w-full items-start gap-4 md:max-w-2xl md:gap-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border border-zinc-200 bg-white text-zinc-900 shadow-xl dark:border-white/10 dark:bg-zinc-950 dark:text-white md:h-14 md:w-14 md:rounded-[20px]">
            {icon}
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-black uppercase leading-none tracking-tighter text-zinc-900 dark:text-white md:text-xl">
                {title}
              </h3>

              <button
                onClick={() => syncAccount.mutate()}
                disabled={syncAccount.isPending}
                className="text-zinc-400 transition-colors hover:text-zinc-600 disabled:opacity-50 dark:hover:text-zinc-300"
                title="Sincronizar status"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${syncAccount.isPending ? "animate-spin" : ""
                    }`}
                />
              </button>
            </div>

            <p className="text-xs font-medium leading-relaxed text-zinc-500 dark:text-zinc-400 md:text-sm">
              {description}
            </p>

            {!!lastSyncError && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                {lastSyncError}
              </div>
            )}

            {!isUnderReview && !isAccountMissing && currentRequirements.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {currentRequirements.slice(0, 3).map((req: string, idx: number) => {
                  const formatted =
                    requirementTranslations[req] ||
                    req.split(".").pop()?.replace(/_/g, " ") ||
                    req;

                  return (
                    <div
                      key={idx}
                      className="rounded-[10px] border border-orange-200 bg-orange-50 px-2.5 py-1 text-[8.5px] font-black uppercase leading-none tracking-widest text-orange-600 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-400"
                    >
                      Pendente: {formatted}
                    </div>
                  );
                })}

                {currentRequirements.length > 3 && (
                  <div className="rounded-[10px] border border-zinc-200 bg-zinc-100 px-2.5 py-1 text-[8.5px] font-black uppercase leading-none tracking-widest text-zinc-500 dark:border-white/10 dark:bg-white/5">
                    + {currentRequirements.length - 3} itens
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {!isUnderReview && (
          <div className="relative z-10 mt-2 w-full shrink-0 md:mt-0 md:w-auto">
            <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
              <Button
                variant="outline"
                onClick={() => syncAccount.mutate()}
                disabled={syncAccount.isPending}
                className="h-12 rounded-[16px] border-zinc-300 bg-white/70 px-6 font-black uppercase tracking-[0.18em] text-[10px] dark:border-white/10 dark:bg-white/[0.03] md:h-14 md:rounded-[20px]"
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${syncAccount.isPending ? "animate-spin" : ""
                    }`}
                />
                Sincronizar
              </Button>

              {(onRequestOnboarding || onRecreateAccount) && (
                <Button
                  onClick={handlePrimaryAction}
                  className="h-12 rounded-[16px] bg-zinc-900 px-8 text-[9px] font-black uppercase tracking-[0.2em] text-white shadow-[0_12px_24px_-8px_rgba(0,0,0,0.2)] transition-all hover:scale-105 active:scale-95 dark:bg-white dark:text-black md:h-14 md:rounded-[20px] md:text-[10px]"
                >
                  <span className="flex items-center gap-3">
                    {primaryLabel}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};