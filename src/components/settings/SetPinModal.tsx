import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
      <DialogContent className="sm:max-w-[400px] bg-[#0A0A0B] border border-white/10 p-0 rounded-[32px] shadow-2xl overflow-hidden gap-0">
        <VisuallyHidden>
            <DialogTitle>Configurar PIN</DialogTitle>
            <DialogDescription>Defina sua senha de segurança</DialogDescription>
        </VisuallyHidden>
        
        <div className="flex flex-col items-center pt-10 pb-8 px-6 bg-[url('/noise.png')] bg-opacity-5 relative">
            {/* Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-white/5 blur-[50px] rounded-full pointer-events-none" />
            
            <div className="w-20 h-20 bg-[#151518] rounded-full flex items-center justify-center border border-white/10 shadow-xl mb-6 relative z-10">
                <KeyRound className="h-8 w-8 text-white" />
            </div>
            
            <SetPinForm onSuccess={() => { onSuccess(); onOpenChange(false); }} />
        </div>
      </DialogContent>
    </Dialog>
  );
};