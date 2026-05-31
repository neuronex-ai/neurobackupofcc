import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useTwilioSms } from "@/hooks/use-twilio-sms";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Loader2, Mail, RotateCcw, Shield, Smartphone } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface TwoFactorModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    phone: string;
    email?: string;
    onSuccess: () => void;
    mode?: "login" | "enable" | "verify";
}

export const TwoFactorModal = ({
    open,
    onOpenChange,
    phone,
    email,
    onSuccess,
    mode = "login"
}: TwoFactorModalProps) => {
    const [code, setCode] = useState(["", "", "", "", "", ""]);
    const [channel, setChannel] = useState<"sms" | "email">("sms");
    const [isVerifying, setIsVerifying] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [error, setError] = useState("");

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const { sendVerificationCode, verifyCode, isLoading: _isLoading } = useTwilioSms();

    // Send code on open
    useEffect(() => {
        if (open && phone) {
            handleSendCode();
        }
    }, [open]);

    // Countdown timer
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleSendCode = async () => {
        if (countdown > 0) return;

        setIsSending(true);
        setError("");

        const success = await sendVerificationCode(phone);

        if (success) {
            setCountdown(60);
        }

        setIsSending(false);
    };

    const handleCodeChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newCode = [...code];
        newCode[index] = value.slice(-1);
        setCode(newCode);
        setError("");

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when complete
        if (value && index === 5 && newCode.every(c => c)) {
            handleVerify(newCode.join(""));
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        const newCode = [...code];

        pastedData.split("").forEach((char, i) => {
            if (i < 6) newCode[i] = char;
        });

        setCode(newCode);

        if (pastedData.length === 6) {
            handleVerify(pastedData);
        }
    };

    const handleVerify = async (codeString?: string) => {
        const fullCode = codeString || code.join("");

        if (fullCode.length !== 6) {
            setError("Digite o código completo");
            return;
        }

        setIsVerifying(true);
        setError("");

        const success = await verifyCode(phone, fullCode);

        if (success) {
            onSuccess();
            onOpenChange(false);
            setCode(["", "", "", "", "", ""]);
        } else {
            setError("Código inválido ou expirado");
            setCode(["", "", "", "", "", ""]);
            inputRefs.current[0]?.focus();
        }

        setIsVerifying(false);
    };

    const handleClose = () => {
        setCode(["", "", "", "", "", ""]);
        setError("");
        onOpenChange(false);
    };

    const maskedPhone = phone ? `****${phone.slice(-4)}` : "";

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden rounded-[32px] bg-card/95 dark:bg-[#0A0A0C]/98 backdrop-blur-3xl border border-border/50 dark:border-white/[0.06] shadow-2xl">
                {/* Textures */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] dark:opacity-[0.03] pointer-events-none" />

                {/* Shimmer */}
                <div className="absolute inset-0 overflow-hidden rounded-[32px]">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent w-[200%] animate-[shimmer_4s_infinite] -translate-x-full" />
                </div>

                <div className="relative p-8 space-y-6">
                    {/* Header */}
                    <div className="text-center space-y-4">
                        <motion.div
                            initial={{ scale: 0.8, rotate: -10 }}
                            animate={{ scale: 1, rotate: 0 }}
                            className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 dark:from-white/10 to-transparent border border-border/50 dark:border-white/10 flex items-center justify-center shadow-xl"
                        >
                            <Shield className="w-8 h-8 text-foreground dark:text-white" />
                        </motion.div>

                        <div>
                            <h2 className="text-xl font-bold text-foreground dark:text-white tracking-tight">
                                Verificação em Duas Etapas
                            </h2>
                            <p className="text-sm text-muted-foreground dark:text-white/50 mt-1">
                                {mode === "login" && "Digite o código enviado para seu telefone"}
                                {mode === "enable" && "Confirme seu telefone para ativar 2FA"}
                                {mode === "verify" && "Verifique seu número de telefone"}
                            </p>
                        </div>
                    </div>

                    {/* Channel Selector */}
                    {email && (
                        <div className="flex gap-2 p-1 rounded-xl bg-muted/50 dark:bg-white/5">
                            <button
                                onClick={() => setChannel("sms")}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all",
                                    channel === "sms"
                                        ? "bg-background dark:bg-white/10 text-foreground dark:text-white shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Smartphone className="w-3.5 h-3.5" />
                                SMS
                            </button>
                            <button
                                onClick={() => setChannel("email")}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all",
                                    channel === "email"
                                        ? "bg-background dark:bg-white/10 text-foreground dark:text-white shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Mail className="w-3.5 h-3.5" />
                                Email
                            </button>
                        </div>
                    )}

                    {/* Code Info */}
                    <div className="text-center">
                        <p className="text-xs text-muted-foreground dark:text-white/40">
                            Código enviado para{" "}
                            <span className="font-medium text-foreground dark:text-white">
                                {channel === "sms" ? maskedPhone : email}
                            </span>
                        </p>
                    </div>

                    {/* Code Input */}
                    <div className="flex justify-center gap-2" onPaste={handlePaste}>
                        {code.map((digit, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Input
                                    ref={(el) => (inputRefs.current[index] = el)}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleCodeChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    className={cn(
                                        "w-12 h-14 text-center text-xl font-bold rounded-xl bg-muted/50 dark:bg-white/5 border-2 transition-all",
                                        digit
                                            ? "border-foreground/30 dark:border-white/30"
                                            : "border-border/50 dark:border-white/10",
                                        error && "border-destructive/50"
                                    )}
                                    autoFocus={index === 0}
                                />
                            </motion.div>
                        ))}
                    </div>

                    {/* Error */}
                    <AnimatePresence>
                        {error && (
                            <motion.p
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="text-center text-sm text-destructive"
                            >
                                {error}
                            </motion.p>
                        )}
                    </AnimatePresence>

                    {/* Actions */}
                    <div className="space-y-3">
                        <Button
                            onClick={() => handleVerify()}
                            disabled={isVerifying || code.some(c => !c)}
                            className="w-full h-12 rounded-xl bg-foreground dark:bg-white text-background dark:text-black hover:bg-foreground/90 dark:hover:bg-white/90 font-bold uppercase tracking-wider shadow-lg transition-all active:scale-95"
                        >
                            {isVerifying ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <span className="flex items-center gap-2">
                                    Verificar <ArrowRight className="w-4 h-4" />
                                </span>
                            )}
                        </Button>

                        <button
                            onClick={handleSendCode}
                            disabled={countdown > 0 || isSending}
                            className={cn(
                                "w-full flex items-center justify-center gap-2 py-2 text-sm transition-all",
                                countdown > 0
                                    ? "text-muted-foreground cursor-not-allowed"
                                    : "text-foreground/60 dark:text-white/60 hover:text-foreground dark:hover:text-white"
                            )}
                        >
                            <RotateCcw className={cn("w-3.5 h-3.5", isSending && "animate-spin")} />
                            {countdown > 0 ? `Reenviar em ${countdown}s` : "Reenviar código"}
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
