import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { getUserFacingErrorMessage } from "@/lib/user-facing-error";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Lock, ShieldCheck, Unlock } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

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
    const navigate = useNavigate();

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
            const { data, error: invokeError } = await supabase.functions.invoke("financial-pin", {
                body: { action: "verify", pin: value },
            });

            if (invokeError) throw invokeError;
            if (data?.error || !data?.isValid) throw new Error(data?.error || "PIN incorreto.");

            setIsSuccess(true);
            setTimeout(() => onSuccess(), 600);
        } catch (e: any) {
            console.error("[PinModal] Falha na verificação do PIN", e);
            const message = String(e?.message || "").toLowerCase().includes("pin")
                ? "PIN incorreto. Confira os números e tente novamente."
                : getUserFacingErrorMessage(e, "generic");
            toast.error(message, { position: "bottom-center" });
            setError(true);
            setPin("");
        } finally {
            setIsLoading(false);
        }
    };

    const shakeVariants = {
        shake: {
            x: [0, -15, 15, -15, 15, 0],
            transition: { duration: 0.4 },
        },
        idle: { x: 0 },
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[200] flex animate-in flex-col items-center justify-center bg-[#020204]/90 p-6 backdrop-blur-[50px] duration-300 fade-in">
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px] animate-pulse-slow" />

            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="absolute left-8 top-8 z-50"
            >
                <Button
                    variant="ghost"
                    onClick={() => { onOpenChange(false); navigate("/financeiro/neurofinance"); }}
                    className="h-10 gap-2 rounded-full border border-white/5 bg-white/5 px-4 text-white/70 transition-all hover:bg-white/10 hover:text-white"
                >
                    <ArrowLeft className="h-4 w-4" /> Voltar
                </Button>
            </motion.div>

            <div className="relative z-10 flex w-full max-w-md flex-col items-center">
                <motion.div
                    animate={isSuccess ? { scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] } : {}}
                    transition={{ duration: 0.5 }}
                    className={cn(
                        "relative mb-8 flex h-24 w-24 items-center justify-center rounded-[32px] border shadow-2xl transition-all duration-500",
                        isSuccess
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)]"
                            : error
                                ? "border-rose-500/30 bg-rose-500/10 text-rose-400 shadow-[0_0_40px_-10px_rgba(244,63,94,0.3)]"
                                : "border-white/10 bg-white/[0.03] text-white shadow-glow"
                    )}
                >
                    <AnimatePresence mode="wait">
                        {isSuccess ? (
                            <motion.div key="unlocked" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}>
                                <Unlock className="h-10 w-10 fill-current" />
                            </motion.div>
                        ) : (
                            <motion.div key="locked" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}>
                                <Lock className="h-10 w-10 fill-current" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                    {isLoading && <div className="absolute inset-0 animate-spin rounded-[32px] border-2 border-primary/30 border-t-primary" />}
                </motion.div>

                <motion.div key={error ? "error" : "idle"} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-10 space-y-2 text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-white">
                        {isSuccess ? "Acesso permitido" : "Cofre Financeiro"}
                    </h1>
                    <p className={cn("text-sm transition-colors", error ? "text-rose-400" : "text-muted-foreground")}>
                        {error ? "PIN incorreto. Tente novamente." : isSuccess ? "Desbloqueando ambiente seguro..." : "Digite seu PIN de segurança."}
                    </p>
                </motion.div>

                <motion.div animate={error ? "shake" : "idle"} variants={shakeVariants}>
                    <InputOTP
                        maxLength={6}
                        value={pin}
                        onChange={(val) => {
                            setPin(val);
                            if (val.length === 6) handleVerify(val);
                        }}
                        disabled={isLoading || isSuccess}
                    >
                        <InputOTPGroup className="gap-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <InputOTPSlot
                                    key={i}
                                    index={i}
                                    className={cn(
                                        "h-16 w-12 rounded-2xl border-white/10 bg-white/[0.03] text-2xl font-bold shadow-inner transition-all duration-300 data-[active=true]:scale-110 data-[active=true]:border-primary/50 data-[active=true]:bg-white/[0.08] sm:w-14",
                                        error && "border-rose-500/50 text-rose-400",
                                        isSuccess && "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                                    )}
                                />
                            ))}
                        </InputOTPGroup>
                    </InputOTP>
                </motion.div>

                <div className="mt-12 flex flex-col items-center gap-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/30">
                        <ShieldCheck className="h-3 w-3" />
                        Proteção reforçada
                    </div>
                </div>
            </div>
        </div>
    );
};
