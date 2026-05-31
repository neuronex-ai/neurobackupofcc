import { useState } from "react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/SessionContextProvider";
import { cn } from "@/lib/utils";

const SET_PIN_URL = "https://krewdaklcyzqfxkkgvqr.supabase.co/functions/v1/set-financial-pin";

interface SetPinFormProps {
    onSuccess: () => void;
}

export const SetPinForm = ({ onSuccess }: SetPinFormProps) => {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [isLoading, setIsLoading] = useState(false);
  const { session } = useAuth();

  const handlePinComplete = (val: string) => {
      if (val.length === 6) {
          setTimeout(() => {
              setStep('confirm');
          }, 400);
      }
  };

  const handleConfirmComplete = (val: string) => {
      if (val.length === 6) {
          handleSetPin(val);
      }
  };

  const handleSetPin = async (finalPin: string) => {
    if (pin !== finalPin) {
      toast.error("Os PINs não coincidem.");
      setConfirmPin("");
      setPin("");
      setStep('create');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(SET_PIN_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: finalPin })
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Falha ao definir PIN.");
      
      toast.success("Segurança configurada!");
      onSuccess();
    } catch (e: any) {
      toast.error(e.message);
      setConfirmPin("");
      setPin("");
      setStep('create');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center space-y-8 relative z-10">
      <div className="text-center space-y-2 animate-fade-in">
          <h3 className="text-xl font-bold text-white tracking-tight">
              {step === 'create' ? "Configurar PIN do Cofre" : "Confirme seu PIN"}
          </h3>
          <p className="text-xs text-zinc-500 max-w-[200px] mx-auto leading-relaxed">
              {step === 'create' 
                ? "Este PIN de 6 dígitos será sua chave mestra para acessar dados financeiros." 
                : "Digite novamente para confirmar a segurança."}
          </p>
      </div>

      <div className="relative">
          {step === 'create' ? (
             <InputOTP 
                maxLength={6} 
                value={pin} 
                onChange={(val) => { setPin(val); handlePinComplete(val); }} 
                autoFocus
                containerClassName="justify-center"
             >
                <InputOTPGroup className="gap-2">
                    {[...Array(6)].map((_, i) => (
                        <InputOTPSlot 
                            key={i} 
                            index={i} 
                            className="h-12 w-10 text-lg rounded-xl bg-[#151518] border-white/10 shadow-inner focus:border-white/30 focus:bg-[#1A1A1D] transition-all" 
                        />
                    ))}
                </InputOTPGroup>
             </InputOTP>
          ) : (
             <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                 <InputOTP 
                    maxLength={6} 
                    value={confirmPin} 
                    onChange={(val) => { setConfirmPin(val); handleConfirmComplete(val); }} 
                    autoFocus 
                    disabled={isLoading}
                    containerClassName="justify-center"
                 >
                    <InputOTPGroup className="gap-2">
                        {[...Array(6)].map((_, i) => (
                            <InputOTPSlot 
                                key={i} 
                                index={i} 
                                className="h-12 w-10 text-lg rounded-xl bg-[#151518] border-white/10 shadow-inner focus:border-white/30 focus:bg-[#1A1A1D] transition-all" 
                            />
                        ))}
                    </InputOTPGroup>
                 </InputOTP>
             </div>
          )}
          
          {isLoading && (
              <div className="absolute inset-0 bg-[#0A0A0B]/80 backdrop-blur-sm flex items-center justify-center rounded-xl z-20">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
              </div>
          )}
      </div>

      <div className="flex gap-3">
          <div className={cn("w-2 h-2 rounded-full transition-all duration-300", step === 'create' ? "bg-white scale-125" : "bg-white/20")} />
          <div className={cn("w-2 h-2 rounded-full transition-all duration-300", step === 'confirm' ? "bg-white scale-125" : "bg-white/20")} />
      </div>
    </div>
  );
};