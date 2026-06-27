"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/context/SubscriptionContext";
import { PROFESSIONAL_PLAN_PRICE_LABEL } from "@/lib/subscription-plans";
import {
  isValidCpfCnpjLength,
  normalizeCpfCnpj,
  startSubscriptionCheckout,
} from "@/lib/subscription-checkout";
import { SubscriptionUpsellDialog } from "@/components/subscription/SubscriptionUpsellDialog";

const PROFESSIONAL_FEATURES = [
  "Synapse texto e voz com limites maiores",
  "NeuroFinance, cobranças e rotinas financeiras",
  "NFS-e automática e automações operacionais",
  "Portal do Paciente e teleconsulta HD",
];

export const TrialExpiredUpsell = () => {
  const {
    isLoading,
    isDevAccount,
    requiresUpsell,
    status,
    checkoutUrl,
    message,
    refreshSubscription,
  } = useSubscription();
  const [open, setOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [freeLoading, setFreeLoading] = useState(false);
  const [documentRequired, setDocumentRequired] = useState(false);
  const [cpfCnpj, setCpfCnpj] = useState("");

  useEffect(() => {
    if (!isLoading && !isDevAccount && requiresUpsell) {
      setOpen(true);
    }
  }, [isDevAccount, isLoading, requiresUpsell]);

  const canContinueFree = ["trial_expired", "blocked", "canceled", "internal_error"].includes(status);
  const title = status === "payment_pending" || status === "checkout_pending"
    ? "Finalize sua assinatura"
    : status === "past_due" || status === "grace_period"
      ? "Regularize sua assinatura"
      : "Continue com o Professional";
  const eyebrow = status === "trial_expired" ? "Teste grátis encerrado" : "Assinatura pendente";
  const description = message || `Assine o Professional por ${PROFESSIONAL_PLAN_PRICE_LABEL} ou permaneça no Essential gratuito.`;

  const startCheckout = async () => {
    if (checkoutUrl) {
      window.location.href = checkoutUrl;
      return;
    }

    if (documentRequired && !isValidCpfCnpjLength(cpfCnpj)) {
      toast.error("Informe um CPF ou CNPJ válido para continuar.");
      return;
    }

    setCheckoutLoading(true);
    try {
      const result = await startSubscriptionCheckout({
        planId: "Professional",
        cpfCnpj: cpfCnpj ? normalizeCpfCnpj(cpfCnpj) : undefined,
      });
      if (result.url) {
        window.location.href = result.url;
        return;
      }
      if (
        result.requiresDocument ||
        result.code === "customer_document_required" ||
        /cpf|cnpj|documento/i.test(result.error || "")
      ) {
        setDocumentRequired(true);
        toast.error("Informe CPF/CNPJ para abrir o checkout.");
        return;
      }
      if (result.trialEndsAt) {
        toast.info("Seu teste grátis ainda está ativo.");
        return;
      }
      toast.error(result.error || "Não conseguimos abrir o checkout agora.");
    } catch (error) {
      console.error("trial-expired-checkout:error", error);
      toast.error("Não conseguimos iniciar a assinatura. Tente novamente.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const continueFree = async () => {
    setFreeLoading(true);
    try {
      const { error } = await supabase.functions.invoke("continue-free-plan", {
        body: {},
      });
      if (error) throw error;
      await refreshSubscription();
      setOpen(false);
      toast.success("Você continuou no plano gratuito.");
    } catch (error) {
      console.error("trial-expired-continue-free:error", error);
      toast.error("Não conseguimos atualizar seu plano agora.");
    } finally {
      setFreeLoading(false);
    }
  };

  if (isLoading || isDevAccount || !requiresUpsell) return null;

  return (
    <SubscriptionUpsellDialog
      open={open}
      onOpenChange={setOpen}
      eyebrow={eyebrow}
      title={title}
      description={description}
      planName="Professional"
      planDescription="Para consultórios em crescimento"
      priceLabel={PROFESSIONAL_PLAN_PRICE_LABEL}
      features={PROFESSIONAL_FEATURES}
      documentRequired={documentRequired}
      cpfCnpj={cpfCnpj}
      onCpfCnpjChange={setCpfCnpj}
      checkoutUrl={checkoutUrl}
      checkoutLoading={checkoutLoading}
      freeLoading={freeLoading}
      canContinueFree={canContinueFree}
      onCheckout={startCheckout}
      onContinueFree={continueFree}
    />
  );
};

export default TrialExpiredUpsell;
