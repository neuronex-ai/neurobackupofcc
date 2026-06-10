import { useEffect, useState } from "react";
import { Loader2, LockKeyhole, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { cn, formatCurrency } from "@/lib/utils";
import type { BillPaymentMode } from "@/hooks/use-neurofinance-bill-payments";

interface BillPaymentPinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (pin: string) => Promise<void>;
  beneficiaryName?: string | null;
  value: number;
  paymentMode?: BillPaymentMode | null;
  isLoading: boolean;
  errorMessage?: string | null;
}

export function BillPaymentPinDialog({
  open,
  onOpenChange,
  onConfirm,
  beneficiaryName,
  value,
  paymentMode,
  isLoading,
  errorMessage,
}: BillPaymentPinDialogProps) {
  const [pin, setPin] = useState("");

  useEffect(() => {
    if (open) setPin("");
  }, [open]);

  useEffect(() => {
    if (errorMessage) setPin("");
  }, [errorMessage]);

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isLoading && onOpenChange(nextOpen)}>
      <DialogContent className="max-w-md overflow-hidden rounded-[32px] border-white/10 bg-[#060608] p-0 text-white shadow-[0_40px_120px_-30px_rgba(0,0,0,0.8)]">
        <div className="relative p-7 md:p-8">
          <div className="pointer-events-none absolute left-1/2 top-0 h-56 w-56 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[90px]" />
          <div className="relative">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] border border-white/10 bg-white/[0.04] shadow-2xl">
              {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : <LockKeyhole className="h-8 w-8" />}
            </div>

            <div className="mt-6 text-center">
              <DialogTitle className="text-xl font-black tracking-tight">Assinatura digital</DialogTitle>
              <DialogDescription className="mt-2 text-xs leading-relaxed text-zinc-400">
                Digite seu PIN de 6 dígitos para autorizar {paymentMode === "scheduled" ? "o agendamento" : "o pagamento"} de{" "}
                <strong className="text-white">{formatCurrency(value)}</strong> para{" "}
                <strong className="text-white">{beneficiaryName || "o recebedor informado pela instituição"}</strong>.
              </DialogDescription>
            </div>

            <div className={cn(
              "mt-8 flex justify-center rounded-[24px] border bg-white/[0.025] px-4 py-6 transition-colors",
              errorMessage ? "border-red-500/30" : "border-white/[0.07]",
            )}>
              <InputOTP
                maxLength={6}
                value={pin}
                onChange={setPin}
                disabled={isLoading}
                autoFocus
              >
                <InputOTPGroup className="gap-2">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <InputOTPSlot
                      key={index}
                      index={index}
                      className={cn(
                        "h-12 w-10 rounded-[13px] border border-white/10 bg-white/[0.04] text-lg font-black text-white first:rounded-[13px] first:border last:rounded-[13px]",
                        errorMessage && "border-red-500/30 text-red-300",
                      )}
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            <div className="mt-3 min-h-5 text-center">
              {errorMessage ? (
                <p className="text-[10px] font-bold text-red-300">{errorMessage}</p>
              ) : (
                <p className="flex items-center justify-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-white/30">
                  <ShieldCheck className="h-3 w-3" /> Ambiente protegido
                </p>
              )}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="ghost"
                disabled={isLoading}
                onClick={() => onOpenChange(false)}
                className="h-12 rounded-[17px] text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:bg-white/5 hover:text-white"
              >
                Voltar
              </Button>
              <Button
                type="button"
                disabled={isLoading || pin.length !== 6}
                onClick={() => onConfirm(pin)}
                className="h-12 rounded-[17px] bg-white text-[9px] font-black uppercase tracking-widest text-zinc-950 hover:bg-zinc-200"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Autorizar"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
