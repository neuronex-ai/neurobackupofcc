import { useEffect, useState } from "react";
import { LockKeyhole, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";

export function MobileFinancialPinSheet({
  open,
  onOpenChange,
  title = "Confirme com seu PIN",
  description = "Digite o PIN financeiro de 6 dígitos para autorizar esta operação.",
  busy = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  busy?: boolean;
  onConfirm: (pin: string) => Promise<void> | void;
}) {
  const [pin, setPin] = useState("");

  useEffect(() => {
    if (!open) setPin("");
  }, [open]);

  const submit = async () => {
    if (!/^\d{6}$/.test(pin)) return;
    await onConfirm(pin);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="border-border/40 bg-background px-5 pb-[calc(24px+env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto h-1 w-10 rounded-full bg-foreground/15" />
        <div className="mx-auto mt-7 flex h-12 w-12 items-center justify-center rounded-[18px] border border-border/40 bg-card">
          <LockKeyhole className="h-5 w-5" strokeWidth={1.6} />
        </div>
        <div className="mx-auto mt-5 max-w-sm text-center">
          <h2 className="text-xl font-semibold tracking-[-0.03em]">{title}</h2>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">{description}</p>
        </div>
        <div className="mx-auto mt-7 w-full max-w-sm">
          <Input
            autoFocus
            value={pin}
            onChange={(event) =>
              setPin(event.target.value.replace(/\D/g, "").slice(0, 6))
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") void submit();
            }}
            inputMode="numeric"
            type="password"
            maxLength={6}
            placeholder="••••••"
            aria-label="PIN financeiro"
            className="h-16 rounded-[20px] border-border/50 bg-card text-center text-2xl tracking-[0.5em]"
          />
          <Button
            type="button"
            disabled={!/^\d{6}$/.test(pin) || busy}
            onClick={() => void submit()}
            className="mt-4 h-14 w-full rounded-[20px] text-xs font-semibold uppercase tracking-[0.16em]"
          >
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Autorizar operação
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
