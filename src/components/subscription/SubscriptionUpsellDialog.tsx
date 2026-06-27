import { Button } from "@/components/ui/button";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Check, ChevronRight, CreditCard, Loader2, Lock, Sparkles } from "lucide-react";

type SubscriptionUpsellDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eyebrow: string;
  title: string;
  description: string;
  featureName?: string;
  planName?: string;
  planDescription?: string;
  priceLabel: string;
  features: string[];
  documentRequired?: boolean;
  cpfCnpj: string;
  onCpfCnpjChange: (value: string) => void;
  checkoutUrl?: string;
  checkoutLoading?: boolean;
  freeLoading?: boolean;
  canContinueFree?: boolean;
  onCheckout: () => void;
  onContinueFree?: () => void;
};

const splitPriceLabel = (value: string) => {
  const [price, period] = value.split("/");
  return {
    price: price?.trim() || value,
    period: period ? `/${period.trim()}` : "/mês",
  };
};

const ProgressBars = () => (
  <div className="mt-3 flex items-center justify-center gap-2">
    <span className="h-1.5 w-10 rounded-full bg-foreground" />
    <span className="h-1.5 w-7 rounded-full bg-foreground/20" />
    <span className="h-1.5 w-7 rounded-full bg-foreground/20" />
  </div>
);

export const SubscriptionUpsellDialog = ({
  open,
  onOpenChange,
  eyebrow,
  title,
  description,
  featureName,
  planName = "Professional",
  planDescription = "Para consultórios em crescimento",
  priceLabel,
  features,
  documentRequired = false,
  cpfCnpj,
  onCpfCnpjChange,
  checkoutUrl,
  checkoutLoading = false,
  freeLoading = false,
  canContinueFree = false,
  onCheckout,
  onContinueFree,
}: SubscriptionUpsellDialogProps) => {
  const isMobile = useIsMobile();
  const price = splitPriceLabel(priceLabel);

  const actionLabel = checkoutUrl ? "Retomar checkout" : "Fazer upgrade agora";
  const visibleFeatures = features.slice(0, isMobile ? 3 : 4);

  const paymentNotice = (
    <div className={cn(
      "flex w-full items-start gap-3 rounded-2xl border p-3 text-left",
      isMobile
        ? "border-border/60 bg-muted/35"
        : "border-border/60 bg-muted/35 dark:border-white/[0.08] dark:bg-white/[0.035]",
    )}>
      <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <p className="text-[11px] font-medium leading-relaxed text-muted-foreground">
        A assinatura recorrente mensal é concluída no checkout da Asaas por cartão de crédito.
      </p>
    </div>
  );

  const documentField = documentRequired ? (
    <div className="w-full space-y-2 text-left">
      <Label htmlFor="subscription-cpf-cnpj" className="ml-1 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
        CPF ou CNPJ
      </Label>
      <Input
        id="subscription-cpf-cnpj"
        inputMode="numeric"
        autoComplete="off"
        value={cpfCnpj}
        onChange={(event) => onCpfCnpjChange(event.target.value)}
        placeholder="Digite somente números"
        className="h-12 rounded-2xl border-border/60 bg-muted/35 px-4 font-semibold text-foreground shadow-inner focus-visible:ring-0"
      />
      <p className="px-1 text-[11px] font-medium leading-relaxed text-muted-foreground">
        Usamos esse dado apenas para criar seu cliente na Asaas pela conta mestra da NeuroNex.
      </p>
    </div>
  ) : null;

  const primaryButton = (
    <Button
      type="button"
      onClick={onCheckout}
      disabled={checkoutLoading || freeLoading}
      className={cn(
        "w-full rounded-[18px] bg-foreground font-black uppercase tracking-[0.18em] text-background shadow-sm hover:bg-foreground/90 active:scale-[0.99]",
        isMobile ? "h-12 text-[10px]" : "h-14 text-[11px]",
      )}
    >
      {checkoutLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          {actionLabel}
          <ChevronRight className="ml-2 h-4 w-4" />
        </>
      )}
    </Button>
  );

  const secondaryButton = canContinueFree && onContinueFree ? (
    <Button
      type="button"
      variant="ghost"
      onClick={onContinueFree}
      disabled={checkoutLoading || freeLoading}
      className="h-11 w-full rounded-[16px] text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      {freeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continuar no plano gratuito"}
    </Button>
  ) : (
    <Button
      type="button"
      variant="ghost"
      onClick={() => onOpenChange(false)}
      disabled={checkoutLoading}
      className="h-11 w-full rounded-[16px] text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      Continuar no plano atual
    </Button>
  );

  if (isMobile) {
    return (
      <ResponsiveModal
        open={open}
        onOpenChange={onOpenChange}
        drawerClassName="h-[min(92dvh,46rem)] border-t border-border/60 bg-background"
      >
        <div className="flex min-h-0 flex-1 flex-col items-center text-center">
          <div className="w-full shrink-0 border-b border-border/55 px-6 pb-4 pt-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[18px] border border-border/60 bg-muted/45">
              <Lock className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="mt-4 text-[9px] font-black uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</p>
            <DialogTitle className="mt-2 text-2xl font-black leading-tight tracking-normal text-foreground">
              {title}
            </DialogTitle>
            <DialogDescription className="mt-3 text-sm font-medium leading-relaxed text-muted-foreground">
              {description}
            </DialogDescription>
            <ProgressBars />
          </div>

          <div className="flex w-full min-h-0 flex-1 flex-col items-center overflow-y-auto px-5 py-5 custom-scrollbar">
            <section className="w-full max-w-[24rem] rounded-[26px] border border-border/60 bg-card/85 p-4 shadow-sm">
              <div className="flex items-center justify-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/60 bg-muted/45">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-black leading-none">{planName}</h3>
                  <p className="mt-1 text-xs font-semibold text-muted-foreground">{planDescription}</p>
                </div>
              </div>

              <div className="mt-4 text-center">
                <span className="text-3xl font-black tracking-tight">{price.price}</span>
                <span className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{price.period}</span>
              </div>

              <div className="mt-5 space-y-2">
                {visibleFeatures.map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl bg-muted/35 px-3 py-2 text-left">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    <span className="text-sm font-semibold text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-4">
                {documentField}
                {paymentNotice}
              </div>
            </section>
          </div>

          <div className="w-full shrink-0 border-t border-border/55 bg-background/95 px-5 py-4">
            <div className="mx-auto grid max-w-[24rem] gap-2">
              {primaryButton}
              {secondaryButton}
            </div>
          </div>
        </div>
      </ResponsiveModal>
    );
  }

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      className="w-[min(96vw,42rem)] max-h-[min(92dvh,46rem)] overflow-hidden rounded-[28px] border border-border/60 bg-background/95 p-0 text-foreground shadow-2xl backdrop-blur-2xl dark:border-white/[0.08] dark:bg-[#09090b]/95"
    >
      <div className="flex max-h-[min(92dvh,46rem)] min-h-0 flex-col items-center text-center">
        <div className="w-full shrink-0 border-b border-border/55 px-8 py-6 dark:border-white/[0.08]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[22px] border border-border/60 bg-muted/40">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="mt-4 text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</p>
          <DialogTitle className="mt-2 text-2xl font-black leading-tight tracking-normal text-foreground">
            {title}
          </DialogTitle>
          <DialogDescription className="mx-auto mt-3 max-w-[31rem] text-sm font-medium leading-relaxed text-muted-foreground">
            {featureName ? (
              <>
                <span className="font-bold text-foreground">{featureName}</span> está disponível no plano{" "}
                <span className="font-bold text-foreground">{planName}</span>. {description}
              </>
            ) : (
              description
            )}
          </DialogDescription>
          <ProgressBars />
        </div>

        <div className="min-h-0 w-full flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
          <section className="mx-auto w-full max-w-[31rem] rounded-[26px] border border-border/60 bg-card/80 p-6 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.025]">
            <div className="flex items-center gap-4 text-left">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-muted/45">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xl font-black leading-none">{planName}</h3>
                <p className="mt-1 text-xs font-semibold text-muted-foreground">{planDescription}</p>
              </div>
              <div className="ml-auto text-right">
                <div className="rounded-full bg-foreground px-3 py-1 text-[8px] font-black uppercase tracking-[0.16em] text-background">
                  Recomendado
                </div>
                <p className="mt-2 text-2xl font-black tracking-tight">{price.price}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{price.period}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {visibleFeatures.map((item) => (
                <div key={item} className="flex items-center gap-3 text-left">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  <span className="text-sm font-semibold text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>

            <div className="mx-auto mt-6 max-w-[25rem] space-y-4">
              {documentField}
              {paymentNotice}
            </div>
          </section>
        </div>

        <div className="w-full shrink-0 border-t border-border/55 bg-muted/20 px-8 py-5 backdrop-blur-xl dark:border-white/[0.08]">
          <div className="mx-auto grid max-w-[31rem] grid-cols-[1fr_1.25fr] gap-3">
            {secondaryButton}
            {primaryButton}
          </div>
        </div>
      </div>
    </ResponsiveModal>
  );
};
