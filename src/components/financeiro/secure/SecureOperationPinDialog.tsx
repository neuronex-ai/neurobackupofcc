import { useEffect, useState } from "react";
import { Loader2, LockKeyhole, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { cn, formatCurrency } from "@/lib/utils";

interface SecureOperationPinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (pin: string) => Promise<void>;
  recipient?: string | null;
  value: number;
  actionLabel?: string;
  isLoading: boolean;
  errorMessage?: string | null;
}

export function SecureOperationPinDialog({
  open,
  onOpenChange,
  onConfirm,
  recipient,
  value,
  actionLabel = "o pagamento",
  isLoading,
  errorMessage,
}: SecureOperationPinDialogProps) {
  const [pin, setPin] = useState("");

  useEffect(() => {
    if (open || errorMessage) setPin("");
  }, [open, errorMessage]);

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isLoading && onOpenChange(nextOpen)}>
      <DialogContent className="max-h-[92dvh] w-[calc(100vw-1rem)] max-w-md overflow-y-auto rounded-[28px] border-white/10 bg-[#060608] p-0 text-white shadow-[0_40px_120px_-30px_rgba(0,0,0,0.8)] sm:rounded-[32px]">
        <div className="relative p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:p-8">
          <div className="pointer-events-none absolute left-1/2 top-0 h-56 w-56 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[90px]" />
          <div className="relative">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] border border-white/10 bg-white/[0.04] shadow-2xl sm:h-20 sm:w-20 sm:rounded-[28px]">
              {isLoading ? <Loader2 className="h-7 w-7 animate-spin" /> : <LockKeyhole className="h-7 w-7" />}
            </div>
            <div className="mt-5 text-center">
              <DialogTitle className="text-xl font-black tracking-tight">Assinatura digital</DialogTitle>
              <DialogDescription className="mt-2 text-xs leading-relaxed text-zinc-400">
                Digite seu PIN de 6 dígitos para autorizar {actionLabel} de <strong className="text-white">{formatCurrency(value)}</strong> para <strong className="text-white">{recipient || "o destino revisado"}</strong>.
              </DialogDescription>
            </div>
            <div className={cn("mt-6 flex justify-center rounded-[22px] border bg-white/[0.025] px-2 py-5 transition-colors sm:px-4", errorMessage ? "border-red-500/30" : "border-white/[0.07]")}>
              <InputOTP maxLength={6} value={pin} onChange={setPin} disabled={isLoading} autoFocus>
                <InputOTPGroup className="gap-1.5 sm:gap-2">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <InputOTPSlot key={index} index={index} className={cn("h-11 w-9 rounded-[12px] border border-white/10 bg-white/[0.04] text-lg font-black text-white first:rounded-[12px] first:border last:rounded-[12px] sm:h-12 sm:w-10", errorMessage && "border-red-500/30 text-red-300")} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            <div className="mt-3 min-h-5 text-center">
              {errorMessage ? <p className="text-[10px] font-bold text-red-300">{errorMessage}</p> : <p className="flex items-center justify-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-white/30"><ShieldCheck className="h-3 w-3" /> Ambiente protegido</p>}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Button type="button" variant="ghost" disabled={isLoading} onClick={() => onOpenChange(false)} className="h-12 rounded-[17px] text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:bg-white/5 hover:text-white">Voltar</Button>
              <Button type="button" disabled={isLoading || pin.length !== 6} onClick={() => onConfirm(pin)} className="h-12 rounded-[17px] bg-white text-[9px] font-black uppercase tracking-widest text-zinc-950 hover:bg-zinc-200">{isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Autorizar"}</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
