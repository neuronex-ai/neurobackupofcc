"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check, Loader2, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/context/SubscriptionContext";
import { PROFESSIONAL_PLAN_PRICE_LABEL, PROFESSIONAL_TRIAL_DAYS } from "@/lib/subscription-plans";
import { toast } from "sonner";

export const TrialExpiredUpsell = () => {
  const { isLoading, isDevAccount, isTrialExpired, refreshSubscription } = useSubscription();
  const [open, setOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [freeLoading, setFreeLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && !isDevAccount && isTrialExpired) {
      setOpen(true);
    }
  }, [isDevAccount, isLoading, isTrialExpired]);

  const startCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: { planId: "Professional" },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      toast.error("Não conseguimos abrir o checkout agora.");
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

  if (isLoading || isDevAccount || !isTrialExpired) return null;

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
                Teste grátis encerrado
              </p>
              <DialogTitle className="mt-2 text-2xl font-black leading-[1.02] tracking-normal">
                Continue com o plano Profissional.
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="mt-4 text-sm font-medium leading-relaxed text-muted-foreground">
            Seu teste de {PROFESSIONAL_TRIAL_DAYS} dias terminou. Assine o Profissional por {PROFESSIONAL_PLAN_PRICE_LABEL} ou permaneça no Essential gratuito.
          </DialogDescription>
        </div>

        <div className="space-y-5 px-5 py-5 sm:px-7 sm:py-6">
          <div className="grid gap-3 text-sm font-semibold text-muted-foreground">
            {[
              "Synapse texto e voz com limites maiores",
              "NeuroFinance, cobranças e rotinas financeiras",
              "NFS-e automática e automações operacionais",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="grid gap-3">
            <Button
              type="button"
              onClick={startCheckout}
              disabled={checkoutLoading || freeLoading}
              className="h-13 rounded-[18px] bg-foreground text-[10px] font-black uppercase tracking-[0.18em] text-background hover:bg-foreground/90"
            >
              {checkoutLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Assinar Profissional <ArrowRight className="ml-2 h-4 w-4" /></>}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={continueFree}
              disabled={checkoutLoading || freeLoading}
              className="h-13 rounded-[18px] text-[10px] font-black uppercase tracking-[0.18em]"
            >
              {freeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continuar no plano gratuito"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TrialExpiredUpsell;
