import { useState } from "react";
import { PackagePlus } from "lucide-react";
import { NewPackageForm } from "./NewPackageForm";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";

interface NewPackageModalProps {
  patientId: string;
  children?: React.ReactNode;
}

export const NewPackageModal = ({ patientId, children }: NewPackageModalProps) => {
  const [open, setOpen] = useState(false);

  const Header = () => (
    <div className="space-y-2 text-center mb-6">
      <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-white/10 mb-6" />
      <div className="flex items-center justify-center gap-2">
        <div className="p-2 bg-white/5 rounded-full border border-white/10">
          <PackagePlus className="h-5 w-5 text-white" />
        </div>
        <h2 className="text-lg font-semibold tracking-tight text-white">Novo Pacote</h2>
      </div>
      <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
        Registre um pacote de sessões para o paciente.
      </p>
    </div>
  );

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={setOpen}
      trigger={children}
      className="sm:max-w-[450px] p-0 border border-white/10 bg-[#0A0A0B] shadow-2xl gap-0 overflow-hidden rounded-[32px]"
      drawerClassName="bg-[#0A0A0B] border-t border-white/10"
    >
      <div className="p-6 md:p-8">
        <Header />
        <NewPackageForm patientId={patientId} onSuccess={() => setOpen(false)} />
      </div>
    </ResponsiveModal>
  );
};