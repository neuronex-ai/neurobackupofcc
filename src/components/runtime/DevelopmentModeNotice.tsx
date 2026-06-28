import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShieldAlert } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

type DevelopmentModeNoticeProps = {
  user: User | null;
};

export function DevelopmentModeNotice({ user }: DevelopmentModeNoticeProps) {
  const [open, setOpen] = useState(false);
  const [shownForUserId, setShownForUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setOpen(false);
      setShownForUserId(null);
      return;
    }

    if (shownForUserId === user.id) return;

    setShownForUserId(user.id);
    setOpen(true);
  }, [shownForUserId, user?.id]);

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-[28rem] rounded-[28px] border border-amber-500/20 bg-background p-0 text-foreground shadow-2xl">
        <div className="p-6 sm:p-7">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/12 text-amber-600 dark:text-amber-300">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight">
              Modo de desenvolvimento
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm font-medium leading-relaxed text-muted-foreground">
              o sistema está em modo de desenvolvimento, e atualmente é exclusivo para desenvolvimento. Não movimente dados reais, esta conta é para desenvolvimento.
            </DialogDescription>
          </DialogHeader>
          <Button
            type="button"
            className="mt-6 h-12 w-full rounded-2xl text-xs font-black uppercase tracking-[0.14em]"
            onClick={() => setOpen(false)}
          >
            Entendi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
