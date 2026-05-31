import { useState } from "react";
import { UserCog } from "lucide-react";
import { Patient } from "@/types";
import { EditPatientForm } from "./EditPatientForm";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface EditPatientModalProps {
  patient: Patient;
  children: React.ReactNode;
}

export const EditPatientModal = ({ patient, children }: EditPatientModalProps) => {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={setOpen}
      trigger={children}
      className="sm:max-w-[550px] border border-border/20 bg-popover/80 dark:bg-popover/40 backdrop-blur-[40px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] dark:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9)] rounded-[48px] overflow-hidden p-0"
      drawerClassName="bg-white dark:bg-[#080809]"
    >
      <div className={cn(
        "relative overflow-hidden flex-1 flex flex-col",
        isMobile ? "p-6 pt-1 pb-10" : "p-8 md:p-10"
      )}>
        {/* Gradiente mantido apenas para desktop ou ajustado para não conflitar no mobile */}
        {!isMobile && <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none opacity-50" />}
        <div className="relative z-10 flex flex-col flex-1">
          <div className={cn("space-y-4 text-center", isMobile ? "mb-6" : "mb-8")}>
            <div className="flex flex-col items-center justify-center gap-3">
              <div className={cn(
                "bg-secondary/30 rounded-full border border-border/20 shadow-inner flex items-center justify-center",
                isMobile ? "p-3" : "p-4"
              )}>
                <UserCog className={cn("text-foreground/80", isMobile ? "h-5 w-5" : "h-6 w-6")} strokeWidth={1.5} />
              </div>
              <h2 className={cn("font-bold tracking-tight text-foreground", isMobile ? "text-xl" : "text-2xl")}>
                Editar Prontuário
              </h2>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-[9px] text-zinc-500 uppercase tracking-[0.3em] font-black opacity-60">
                Identificação do Paciente
              </span>
              <span className="text-[11px] text-primary font-black uppercase tracking-widest bg-primary/5 px-4 py-1.5 rounded-full border border-primary/10 shadow-sm">
                {patient.name}
              </span>
            </div>
          </div>
          
          <div className={cn("flex-1", isMobile ? "px-1" : "")}>
            <EditPatientForm patient={patient} onSuccess={() => setOpen(false)} />
          </div>
        </div>
      </div>
    </ResponsiveModal>
  );
};