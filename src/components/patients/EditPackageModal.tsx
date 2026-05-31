import { useState } from "react";
import { Edit } from "lucide-react";
import { PatientPackage } from "@/types";
import { EditPackageForm } from "./EditPackageForm";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";

interface EditPackageModalProps {
  pkg: PatientPackage;
  children: React.ReactNode;
}

export const EditPackageModal = ({ pkg, children }: EditPackageModalProps) => {
  const [open, setOpen] = useState(false);

  const Header = () => (
    <div className="space-y-2 text-center mb-6">
      <div className="flex items-center justify-center gap-2">
        <Edit className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold tracking-tight text-white">Editar Pacote</h2>
      </div>
      <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
        {pkg.description}
      </p>
    </div>
  );

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={setOpen}
      trigger={children}
      className="sm:max-w-[425px] p-0 border border-white/10 bg-[#0A0A0B] shadow-2xl gap-0 overflow-hidden rounded-[32px]"
      drawerClassName="bg-[#0A0A0B] border-t border-white/10"
    >
      <div className="p-6 md:p-8">
        <Header />
        <EditPackageForm pkg={pkg} onSuccess={() => setOpen(false)} />
      </div>
    </ResponsiveModal>
  );
};