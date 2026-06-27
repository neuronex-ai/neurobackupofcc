"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check, Loader2, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/context/SubscriptionContext";
import { PROFESSIONAL_PLAN_PRICE_LABEL } from "@/lib/subscription-plans";
import { toast } from "sonner";
import {
  isValidCpfCnpjLength,
  normalizeCpfCnpj,
  startSubscriptionCheckout,
} from "@/lib/subscription-checkout";

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
    ? "Finalize sua assinatura."
    : status === "past_due" || status === "grace_period"
      ? "Regularize sua assinatura."
      : "Continue com o plano Professional.";
  const eyebrow = status === "trial_expired" ? "Teste gratis encerrado" : "Assinatura pendente";
  const description = message || `Assine o Professional por ${PROFESSIONAL_PLAN_PRICE_LABEL} ou permaneca no Essential gratuito.`;

  const startCheckout = async () => {
    if (checkoutUrl) {
      window.location.href = checkoutUrl;
      return;
    }

    if (documentRequired && !isValidCpfCnpjLength(cpfCnpj)) {
      toast.error("Informe um CPF ou CNPJ valido para continuar.");
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
        toast.info("Seu teste gratis ainda esta ativo.");
        return;
      }
      toast.error(result.error || "Nao conseguimos abrir o checkout agora.");
    } catch (error) {
      console.error("trial-expired-checkout:error", error);
      toast.error("Nao conseguimos iniciar a assinatura. Tente novamente.");
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
      toast.success("Voce continuou no plano gratuito.");
    } catch (error) {
      console.error("trial-expired-continue-free:error", error);
      toast.error("Nao conseguimos atualizar seu plano agora.");
    } finally {
      setFreeLoading(false);
    }
  };

  if (isLoading || isDevAccount || !requiresUpsell) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="z-[10040] w-[calc(100vw-1rem)] max-w-[31rem] overflow-hidden rounded-[28px] border border-border/60 bg-background p-0 text-foreground shadow-2xl dark:border-white/10 dark:bg-[#08080a] sm:rounded-[34px]">
        <div className="border-b border-border/60 px-5 py-5 dark:border-white/10 sm:px-7 sm:py-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-foreground text-background">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-muted-foreground">
                {eyebrow}
              </p>
              <DialogTitle className="mt-2 text-2xl font-black leading-[1.02] tracking-normal">
                {title}
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="mt-4 text-sm font-medium leading-relaxed text-muted-foreground">
            {description}
          </DialogDescription>
        </div>

        <div className="space-y-5 px-5 py-5 sm:px-7 sm:py-6">
          <div className="grid gap-3 text-sm font-semibold text-muted-foreground">
            {[
              "Synapse texto e voz com limites maiores",
              "NeuroFinance, cobrancas e rotinas financeiras",
              "NFS-e automatica e automacoes operacionais",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>

          {documentRequired && (
            <div className="space-y-2">
              <Label htmlFor="trial-cpf-cnpj" className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                CPF ou CNPJ
              </Label>
              <Input
                id="trial-cpf-cnpj"
                inputMode="numeric"
                autoComplete="off"
                value={cpfCnpj}
                onChange={(event) => setCpfCnpj(event.target.value)}
                placeholder="Digite somente numeros"
              />
              <p className="text-[11px] font-medium leading-relaxed text-muted-foreground">
                Necessario para criar seu cliente na Asaas pela conta mestra da NeuroNex.
              </p>
            </div>
          )}

          <div className="grid gap-3">
            <Button
              type="button"
              onClick={startCheckout}
              disabled={checkoutLoading || freeLoading}
              className="h-13 rounded-[18px] bg-foreground text-[10px] font-black uppercase tracking-[0.18em] text-background hover:bg-foreground/90"
            >
              {checkoutLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {checkoutUrl ? "Retomar checkout" : "Assinar Professional"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
            {canContinueFree && (
              <Button
                type="button"
                variant="outline"
                onClick={continueFree}
                disabled={checkoutLoading || freeLoading}
                className="h-13 rounded-[18px] text-[10px] font-black uppercase tracking-[0.18em]"
              >
                {freeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continuar no plano gratuito"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TrialExpiredUpsell;
