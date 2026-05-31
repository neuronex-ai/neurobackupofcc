import { useAuth } from "@/components/auth/SessionContextProvider";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Lock, ShieldCheck, Unlock } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const VERIFY_PIN_URL = "https://krewdaklcyzqfxkkgvqr.supabase.co/functions/v1/verify-financial-pin";

interface PinModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const PinModal = ({ open, onOpenChange, onSuccess }: PinModalProps) => {
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { session } = useAuth();
  const navigate = useNavigate();

  // Reset state when opening
  useEffect(() => {
    if (open) {
        setPin("");
        setError(false);
        setIsSuccess(false);
    }
  }, [open]);

  const handleVerify = async (value: string) => {
    if (value.length < 6) return;
    
    setIsLoading(true);
    setError(false);
    try {
      const res = await fetch(VERIFY_PIN_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: value })
      });
      
      const data = await res.json();
      
      if (!res.ok || !data.isValid) {
        throw new Error(data.error || "PIN incorreto.");
      }
      
      setIsSuccess(true);
      setTimeout(() => {
          onSuccess();
      }, 800); // Delay para mostrar animação de sucesso
      
    } catch (e: any) {
      toast.error(e.message, { position: 'bottom-center' });
      setError(true);
      setPin("");
    } finally {
      setIsLoading(false);
    }
  };

  const shakeVariants = {
    shake: {
      x: [0, -15, 15, -15, 15, 0],
      transition: { duration: 0.4 }
    },
    idle: { x: 0 }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-[#020204]/90 backdrop-blur-[50px] flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
        
        {/* Background Ambient Light */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />

        <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="absolute top-8 left-8 z-50"
        >
            <Button 
                variant="ghost" 
                onClick={() => { onOpenChange(false); navigate('/financeiro'); }} 
                className="h-10 px-4 rounded-full bg-white/5 text-white/70 hover:text-white gap-2 border border-white/5 hover:bg-white/10 transition-all"
            >
                <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>
        </motion.div>

        <div className="relative z-10 flex flex-col items-center w-full max-w-md">
            
            {/* Lock Icon Animation */}
            <motion.div 
                animate={isSuccess ? { scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] } : {}}
                transition={{ duration: 0.5 }}
                className={cn(
                    "w-24 h-24 rounded-[32px] flex items-center justify-center mb-8 border transition-all duration-500 shadow-2xl relative",
                    isSuccess 
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)]" 
                        : error 
                            ? "bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-[0_0_40px_-10px_rgba(244,63,94,0.3)]"
                            : "bg-white/[0.03] border-white/10 text-white shadow-glow"
                )}
            >
                <AnimatePresence mode="wait">
                    {isSuccess ? (
                        <motion.div
                            key="unlocked"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                        >
                            <Unlock className="h-10 w-10 fill-current" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="locked"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                        >
                            <Lock className="h-10 w-10 fill-current" />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Loading Ring */}
                {isLoading && (
                    <div className="absolute inset-0 rounded-[32px] border-2 border-primary/30 border-t-primary animate-spin" />
                )}
            </motion.div>

            <motion.div 
                key={error ? 'error' : 'idle'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-2 mb-10"
            >
                <h1 className="text-3xl font-bold text-white tracking-tight">
                    {isSuccess ? "Acesso Permitido" : "Cofre Financeiro"}
                </h1>
                <p className={cn("text-sm transition-colors", error ? "text-rose-400" : "text-muted-foreground")}>
                    {error ? "PIN incorreto. Tente novamente." : isSuccess ? "Desbloqueando ambiente seguro..." : "Digite seu PIN de segurança."}
                </p>
            </motion.div>

            <motion.div 
                animate={error ? "shake" : "idle"}
                variants={shakeVariants}
            >
                <InputOTP 
                    maxLength={6} 
                    value={pin} 
                    onChange={(val) => { setPin(val); if(val.length === 6) handleVerify(val); }}
                    disabled={isLoading || isSuccess}
                >
                    <InputOTPGroup className="gap-3">
                        {[...Array(6)].map((_, i) => (
                            <InputOTPSlot 
                                key={i} 
                                index={i} 
                                className={cn(
                                    "h-16 w-12 sm:w-14 text-2xl font-bold rounded-2xl border-white/10 bg-white/[0.03] transition-all duration-300 shadow-inner",
                                    "data-[active=true]:border-primary/50 data-[active=true]:bg-white/[0.08] data-[active=true]:scale-110",
                                    error && "border-rose-500/50 text-rose-400",
                                    isSuccess && "border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
                                )} 
                            />
                        ))}
                    </InputOTPGroup>
                </InputOTP>
            </motion.div>
            
            <div className="mt-12 flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 text-[10px] text-white/30 uppercase tracking-widest font-bold">
                    <ShieldCheck className="h-3 w-3" />
                    Criptografia Ponta-a-Ponta
                </div>
            </div>
        </div>
    </div>
  );
};