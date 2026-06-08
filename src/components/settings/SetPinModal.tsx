import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { SetPinForm } from "./SetPinForm";
import { KeyRound } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface SetPinModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export const SetPinModal = ({ open, onOpenChange, onSuccess }: SetPinModalProps) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="gap-0 overflow-hidden rounded-[32px] border border-white/10 bg-[#0A0A0B] p-0 shadow-2xl sm:max-w-[400px]">
                <VisuallyHidden>
                    <DialogTitle>Configurar PIN</DialogTitle>
                    <DialogDescription>Defina sua senha de segurança</DialogDescription>
                </VisuallyHidden>

                <div className="relative flex flex-col items-center bg-[url('/noise.png')] bg-opacity-5 px-6 pb-8 pt-10">
                    <div className="pointer-events-none absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-[50px]" />

                    <div className="relative z-10 mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-[#151518] shadow-xl">
                        <KeyRound className="h-8 w-8 text-white" />
                    </div>

                    <SetPinForm onSuccess={() => { onSuccess(); onOpenChange(false); }} />
                </div>
            </DialogContent>
        </Dialog>
    );
};
