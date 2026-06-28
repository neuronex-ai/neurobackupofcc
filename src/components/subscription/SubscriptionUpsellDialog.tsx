import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Loader2,
  Lock,
  Phone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

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
  cpfCnpj: string;
  onCpfCnpjChange: (value: string) => void;
  phone: string;
  onPhoneChange: (value: string) => void;
  checkoutUrl?: string;
  checkoutLoading?: boolean;
  freeLoading?: boolean;
  canContinueFree?: boolean;
  onCheckout: () => void;
  onContinueFree?: () => void;
};

const TOTAL_STEPS = 3;

const onlyDigits = (value: string) => value.replace(/\D/g, "");

const formatCpfCnpj = (value: string) => {
  const digits = onlyDigits(value).slice(0, 14);

  if (digits.length <= 11) {
    return digits
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
  }

  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, "$1.$2.$3/$4-$5");
};

const normalizeBrazilianPhone = (value: string) => {
  const digits = onlyDigits(value).slice(0, 13);
  return digits.startsWith("55") && digits.length > 11 ? digits.slice(2) : digits;
};

const formatBrazilianPhone = (value: string) => {
  const local = normalizeBrazilianPhone(value).slice(0, 11);
  if (!local) return "+55 ";

  if (local.length <= 10) {
    return `+55 ${local}`
      .replace(/^\+55 (\d{2})(\d)/, "+55 ($1) $2")
      .replace(/^\+55 \((\d{2})\) (\d{4})(\d)/, "+55 ($1) $2-$3");
  }

  return `+55 ${local}`
    .replace(/^\+55 (\d{2})(\d)/, "+55 ($1) $2")
    .replace(/^\+55 \((\d{2})\) (\d{5})(\d)/, "+55 ($1) $2-$3");
};

const isValidCpfCnpj = (value: string) => {
  const digits = onlyDigits(value);
  return (digits.length === 11 || digits.length === 14) && !/^0+$/.test(digits);
};

const isValidPhone = (value: string) => {
  const digits = normalizeBrazilianPhone(value);
  return (digits.length === 10 || digits.length === 11) && !/^0+$/.test(digits);
};

const splitPriceLabel = (value: string) => {
  const [price, period] = value.split("/");
  return {
    price: price?.trim() || value,
    period: period ? `/${period.trim()}` : "/mês",
  };
};

const StepBars = ({ step }: { step: number }) => (
  <div className="mt-4 flex items-center justify-center gap-2" aria-label={`Etapa ${step} de ${TOTAL_STEPS}`}>
    {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
      <span
        key={index}
        className={cn(
          "h-1.5 rounded-full transition-all duration-200",
          index + 1 <= step ? "w-10 bg-foreground" : "w-7 bg-foreground/18",
        )}
      />
    ))}
  </div>
);

const FieldError = ({ show, children }: { show: boolean; children: string }) => (
  <p className={cn("min-h-[1rem] px-1 text-[11px] font-semibold text-destructive", !show && "invisible")}>
    {children}
  </p>
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
  cpfCnpj,
  onCpfCnpjChange,
  phone,
  onPhoneChange,
  checkoutUrl,
  checkoutLoading = false,
  freeLoading = false,
  canContinueFree = false,
  onCheckout,
  onContinueFree,
}: SubscriptionUpsellDialogProps) => {
  const isMobile = useIsMobile();
  const [step, setStep] = useState(1);
  const [detailsTouched, setDetailsTouched] = useState(false);
  const price = splitPriceLabel(priceLabel);

  useEffect(() => {
    if (open) {
      setStep(1);
      setDetailsTouched(false);
    }
  }, [open]);

  const visibleFeatures = useMemo(() => features.slice(0, isMobile ? 4 : 5), [features, isMobile]);
  const cpfValid = isValidCpfCnpj(cpfCnpj);
  const phoneValid = isValidPhone(phone);
  const canProceedFromDetails = Boolean(checkoutUrl) || (cpfValid && phoneValid);
  const actionLabel = checkoutUrl ? "Retomar checkout" : "Ir para checkout";
  const bodyMaxWidth = isMobile ? "max-w-[25rem]" : "max-w-[32rem]";
  const effectiveDescription = featureName
    ? `${featureName} está disponível no plano ${planName}. ${description}`
    : description;

  const handleNext = () => {
    if (step === 2 && !canProceedFromDetails) {
      setDetailsTouched(true);
      return;
    }
    setStep((current) => Math.min(TOTAL_STEPS, current + 1));
  };

  const handleCheckout = () => {
    if (!canProceedFromDetails) {
      setDetailsTouched(true);
      setStep(2);
      return;
    }
    onCheckout();
  };

  const secondaryButton = step > 1 ? (
    <Button
      type="button"
      variant="ghost"
      onClick={() => setStep((current) => Math.max(1, current - 1))}
      disabled={checkoutLoading || freeLoading}
      className="h-12 w-full rounded-2xl text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      <ChevronLeft className="mr-2 h-4 w-4" />
      Voltar
    </Button>
  ) : canContinueFree && onContinueFree ? (
    <Button
      type="button"
      variant="ghost"
      onClick={onContinueFree}
      disabled={checkoutLoading || freeLoading}
      className="h-12 w-full rounded-2xl text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      {freeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continuar no plano gratuito"}
    </Button>
  ) : (
    <Button
      type="button"
      variant="ghost"
      onClick={() => onOpenChange(false)}
      disabled={checkoutLoading}
      className="h-12 w-full rounded-2xl text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      Continuar no plano atual
    </Button>
  );

  const primaryButton = (
    <Button
      type="button"
      onClick={step === TOTAL_STEPS ? handleCheckout : handleNext}
      disabled={checkoutLoading || freeLoading}
      className={cn(
        "h-12 w-full rounded-2xl bg-foreground text-[10px] font-black uppercase tracking-[0.16em] text-background shadow-sm transition-transform hover:bg-foreground/90 active:scale-[0.99] md:h-14 md:text-[11px]",
        step === 2 && !canProceedFromDetails && detailsTouched && "ring-2 ring-destructive/25",
      )}
    >
      {checkoutLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          {step === TOTAL_STEPS ? actionLabel : "Continuar"}
          <ChevronRight className="ml-2 h-4 w-4" />
        </>
      )}
    </Button>
  );

  const planCard = (
    <div className="w-full rounded-[26px] border border-border/65 bg-card/85 p-5 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.035] md:p-6">
      <div className="flex items-start gap-4 text-left">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-muted/50">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-black leading-none text-foreground">{planName}</h3>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-muted-foreground">{planDescription}</p>
        </div>
        <div className="text-right">
          <span className="rounded-full bg-foreground px-3 py-1 text-[8px] font-black uppercase tracking-[0.16em] text-background">
            Recomendado
          </span>
          <p className="mt-3 text-2xl font-black tracking-tight text-foreground">{price.price}</p>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{price.period}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        {visibleFeatures.map((item) => (
          <div key={item} className="flex items-center gap-3 text-left">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
            <span className="text-sm font-semibold leading-snug text-muted-foreground">{item}</span>
          </div>
        ))}
      </div>

      <div className="mt-6 flex w-full items-start gap-3 rounded-2xl border border-border/60 bg-muted/35 p-3 text-left dark:border-white/[0.08] dark:bg-white/[0.04]">
        <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="text-[11px] font-medium leading-relaxed text-muted-foreground">
          A assinatura recorrente mensal é concluída no checkout seguro da Asaas por cartão de crédito.
        </p>
      </div>
    </div>
  );

  const stepContent = (
    <div className={cn("mx-auto w-full", bodyMaxWidth)}>
      {step === 1 ? (
        <div className="space-y-5 text-center">
          {planCard}
          <p className="mx-auto max-w-[28rem] text-sm font-medium leading-relaxed text-muted-foreground">
            No próximo passo, confirme os dados mínimos exigidos pela Asaas para criar o cliente pagador na conta mestra da NeuroNex.
          </p>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-5 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[22px] border border-border/70 bg-muted/45">
            <Phone className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-2xl font-black tracking-tight text-foreground">Dados para cobrança</h3>
            <p className="mx-auto mt-2 max-w-[28rem] text-sm font-medium leading-relaxed text-muted-foreground">
              Esses dados são enviados apenas ao checkout da Asaas para validar o cliente da assinatura NeuroNex.
            </p>
          </div>

          <div className="grid gap-4 text-left">
            <div className="space-y-2">
              <Label htmlFor="subscription-cpf-cnpj" className="ml-1 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                CPF ou CNPJ
              </Label>
              <Input
                id="subscription-cpf-cnpj"
                inputMode="numeric"
                autoComplete="off"
                value={cpfCnpj}
                onChange={(event) => onCpfCnpjChange(formatCpfCnpj(event.target.value))}
                placeholder="000.000.000-00"
                className="h-12 rounded-2xl border-border/65 bg-muted/35 px-4 font-semibold text-foreground shadow-inner focus-visible:ring-1 focus-visible:ring-foreground/20"
              />
              <FieldError show={detailsTouched && !cpfValid}>Informe um CPF ou CNPJ válido.</FieldError>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subscription-phone" className="ml-1 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                Celular ou telefone
              </Label>
              <Input
                id="subscription-phone"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(event) => onPhoneChange(formatBrazilianPhone(event.target.value))}
                placeholder="+55 (00) 00000-0000"
                className="h-12 rounded-2xl border-border/65 bg-muted/35 px-4 font-semibold text-foreground shadow-inner focus-visible:ring-1 focus-visible:ring-foreground/20"
              />
              <FieldError show={detailsTouched && !phoneValid}>Informe um telefone brasileiro válido com DDD.</FieldError>
            </div>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-5 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[22px] border border-border/70 bg-muted/45">
            <ShieldCheck className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-2xl font-black tracking-tight text-foreground">Tudo pronto para o checkout</h3>
            <p className="mx-auto mt-2 max-w-[28rem] text-sm font-medium leading-relaxed text-muted-foreground">
              Você será redirecionado para a Asaas. O acesso pago só será liberado após confirmação confiável do pagamento.
            </p>
          </div>

          <div className="grid gap-3 text-left">
            <div className="rounded-2xl border border-border/65 bg-muted/30 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Plano</p>
              <p className="mt-1 text-sm font-bold text-foreground">{planName} · {priceLabel}</p>
            </div>
            <div className="rounded-2xl border border-border/65 bg-muted/30 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Dados validados</p>
              <p className="mt-1 text-sm font-bold text-foreground">CPF/CNPJ e telefone confirmados</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );

  const header = (
    <div className="w-full shrink-0 border-b border-border/55 px-6 py-5 text-center dark:border-white/[0.08] md:px-8 md:py-6">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[22px] border border-border/70 bg-muted/40">
        <Lock className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="mt-4 text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</p>
      <DialogTitle className="mt-2 text-2xl font-black leading-tight tracking-normal text-foreground md:text-3xl">
        {title}
      </DialogTitle>
      <DialogDescription className="mx-auto mt-3 max-w-[33rem] text-sm font-medium leading-relaxed text-muted-foreground md:text-[15px]">
        {effectiveDescription}
      </DialogDescription>
      <StepBars step={step} />
    </div>
  );

  const footer = (
    <div className="w-full shrink-0 border-t border-border/55 bg-background/95 px-5 py-4 backdrop-blur-xl dark:border-white/[0.08] md:bg-muted/20 md:px-8 md:py-5">
      <div className={cn("mx-auto grid gap-3", bodyMaxWidth, isMobile ? "grid-cols-1" : "grid-cols-[1fr_1.25fr]")}>
        {secondaryButton}
        {primaryButton}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <ResponsiveModal
        open={open}
        onOpenChange={onOpenChange}
        drawerClassName="h-[min(94dvh,48rem)] border-t border-border/60 bg-background text-foreground"
      >
        <div className="flex min-h-0 flex-1 flex-col items-center">
          {header}
          <div className="min-h-0 w-full flex-1 overflow-y-auto px-5 py-5 custom-scrollbar">
            {stepContent}
          </div>
          {footer}
        </div>
      </ResponsiveModal>
    );
  }

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      className="w-[min(94vw,44rem)] max-h-[min(92dvh,48rem)] overflow-hidden rounded-[30px] border border-border/65 bg-background/96 p-0 text-foreground shadow-2xl backdrop-blur-2xl dark:border-white/[0.08] dark:bg-[#09090b]/96"
    >
      <div className="flex max-h-[min(92dvh,48rem)] min-h-0 flex-col items-center">
        {header}
        <div className="min-h-0 w-full flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
          {stepContent}
        </div>
        {footer}
      </div>
    </ResponsiveModal>
  );
};
