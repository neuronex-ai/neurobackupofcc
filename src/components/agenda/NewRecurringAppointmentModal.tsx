import { Button } from "@/components/ui/button";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { Repeat } from "lucide-react";
import { useState } from "react";
import { NewRecurringAppointmentForm } from "./NewRecurringAppointmentForm";

interface NewRecurringAppointmentModalProps {
  initialDate?: Date;
  children?: React.ReactNode;
}

export const NewRecurringAppointmentModal = ({ initialDate, children }: NewRecurringAppointmentModalProps) => {
  const [open, setOpen] = useState(false);

  const TriggerButton = children || (
    <Button size="sm" variant="outline" className="gap-2">
      <Repeat className="h-4 w-4" />
      <span className="hidden sm:inline">Recorrência</span>
    </Button>
  );

  const Header = () => (
    <div className="text-center space-y-1 mb-2">
      <div className="text-xl font-bold tracking-tight text-white flex items-center justify-center gap-3">
        <div className="p-2 rounded-xl bg-white/5 border border-white/10">
          <Repeat className="h-5 w-5 text-white" />
        </div>
        Agendar Recorrência
      </div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium pt-1">
        Crie sessões periódicas automaticamente
      </p>
    </div>
  );

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={setOpen}
      trigger={TriggerButton}
      className="sm:max-w-[500px] bg-[#0A0A0B] border-white/10 backdrop-blur-xl shadow-2xl p-0 overflow-hidden rounded-[32px] gap-0 outline-none"
      drawerClassName="bg-[#0A0A0B] border-t border-white/10"
    >
      <div className="p-8 pb-4 border-b border-white/5 bg-white/[0.02]">
        <Header />
      </div>
      <div className="max-h-[80vh] overflow-y-auto custom-scrollbar p-8 pt-6">
        <NewRecurringAppointmentForm onSuccess={() => setOpen(false)} initialDate={initialDate} />
      </div>
    </ResponsiveModal>
  );
};