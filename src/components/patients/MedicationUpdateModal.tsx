import { Pill } from "lucide-react";
import { useState } from "react";
import { Patient } from "@/types";
import { MedicationUpdateForm } from "./MedicationUpdateForm";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";

interface MedicationUpdateModalProps {
    patient: Patient;
    children?: React.ReactNode;
}

export const MedicationUpdateModal = ({ patient, children }: MedicationUpdateModalProps) => {
    const [open, setOpen] = useState(false);

    return (
        <ResponsiveModal
            open={open}
            onOpenChange={setOpen}
            trigger={children}
            className="bg-background border-border/20 sm:max-w-[500px] p-0 overflow-hidden rounded-[32px]"
            drawerClassName="bg-background border-t border-border/10"
        >
            <div className="p-6 md:p-8">
                <div className="p-6 border-b border-border/10 bg-secondary/10 rounded-2xl mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
                            <Pill className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-foreground">Medicação em Uso</h2>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Farmacoterapia</p>
                        </div>
                    </div>
                </div>
                <MedicationUpdateForm patient={patient} onSuccess={() => setOpen(false)} />
            </div>
        </ResponsiveModal>
    );
};
