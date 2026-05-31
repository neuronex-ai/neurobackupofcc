import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { NewPatientForm } from "./NewPatientForm";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface NewPatientModalProps {
  children?: React.ReactNode;
}

export const NewPatientModal = ({ children }: NewPatientModalProps) => {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const triggerButton = children || (
    <Button
      size="sm"
      className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 rounded-full transition-all hover:scale-105 font-medium active:scale-95 shadow-lg shadow-primary/10"
    >
      <UserPlus className="h-4 w-4" />
      <span className="hidden sm:inline">Novo Paciente</span>
    </Button>
  );

  const HeaderContent = () => (
    <div className={cn("space-y-4 text-center", isMobile ? "mb-6" : "mb-10")}>
      <div className="flex flex-col items-center justify-center gap-6">
        <div className="p-5 bg-zinc-900 dark:bg-white rounded-[24px] shadow-2xl transition-transform hover:scale-110 duration-700">
          <UserPlus className="h-8 w-8 text-white dark:text-zinc-900" strokeWidth={2} />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase tracking-widest">Novo Prontuário</h2>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.35em] font-black">Cadastro Digital de Paciente</p>
        </div>
      </div>
    </div>
  );

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={setOpen}
      trigger={triggerButton}
      className="sm:max-w-[600px] p-0 border border-zinc-200 dark:border-white/10 bg-white/95 dark:bg-[#080809]/95 backdrop-blur-3xl shadow-[0_64px_128px_-32px_rgba(0,0,0,0.5)] gap-0 overflow-hidden rounded-[48px] ring-1 ring-black/5 dark:ring-white/5"
      drawerClassName="bg-white dark:bg-[#080809]"
    >
      <div className={cn(
        "relative overflow-hidden flex flex-col items-center flex-1",
        isMobile ? "p-6 pt-2 pb-12" : "p-10 md:p-14"
      )}>
        {/* Removemos o gradiente absoluto no mobile para evitar divergência com o fundo do drawer */}
        {!isMobile && <div className="absolute top-0 inset-x-0 bottom-0 bg-gradient-to-b from-zinc-500/[0.03] dark:from-white/[0.02] to-transparent pointer-events-none" />}
        <div className="relative z-10 w-full flex flex-col h-full">
          <HeaderContent />
          <div className="w-full flex-1">
            <NewPatientForm onSuccess={() => setOpen(false)} />
          </div>
        </div>
      </div>
    </ResponsiveModal>
  );
};