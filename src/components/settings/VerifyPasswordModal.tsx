import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, ArrowRight, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface VerifyPasswordModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onForgotPassword: () => void;
}

export const VerifyPasswordModal = ({ open, onOpenChange, onForgotPassword }: VerifyPasswordModalProps) => {
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!password) {
            toast.error("Por favor, digite sua senha atual.");
            return;
        }

        setIsLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user?.email) {
                throw new Error("Usuário não identificado.");
            }

            // Verify password by attempting to sign in
            const { error } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: password,
            });

            if (error) {
                toast.error("Senha incorreta. Tente novamente.");
                setIsLoading(false);
                return;
            }

            // Success - Redirect to Reset Password Page
            toast.success("Senha verificada! Redirecionando...");
            onOpenChange(false);
            navigate('/reset-password');

        } catch (error: any) {
            console.error("Verification error:", error);
            toast.error("Erro ao verificar senha.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden rounded-[32px] bg-[#0A0A0C]/95 backdrop-blur-2xl border border-white/10 shadow-2xl">
                {/* Background Atmosphere */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 blur-[50px] rounded-full pointer-events-none" />

                <div className="relative p-8 space-y-8">
                    <DialogHeader className="text-center space-y-4">
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center shadow-inner group">
                            <ShieldCheck className="h-8 w-8 text-white/80 group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div className="space-y-2">
                            <DialogTitle className="text-xl font-bold text-white tracking-tight">
                                Confirmação de Segurança
                            </DialogTitle>
                            <DialogDescription className="text-gray-500 text-sm">
                                Para sua segurança, confirme sua senha atual antes de prosseguir com a alteração.
                            </DialogDescription>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleVerify} className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Senha Atual</Label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onOpenChange(false);
                                        onForgotPassword();
                                    }}
                                    className="text-[10px] font-medium text-emerald-500 hover:text-emerald-400 transition-colors uppercase tracking-wider"
                                >
                                    Esqueci a senha
                                </button>
                            </div>

                            <div className="relative group">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Digite sua senha atual"
                                    className="h-14 bg-white/[0.03] border-white/10 rounded-xl text-white px-5 focus:bg-white/[0.05] focus:border-white/20 transition-all pr-12 text-sm placeholder:text-white/20"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 rounded-xl bg-white text-black hover:bg-gray-200 font-bold uppercase tracking-widest text-xs shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] transition-all active:scale-[0.98]"
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <span className="flex items-center gap-2">
                                    Verificar e Continuar <ArrowRight className="w-3.5 h-3.5" />
                                </span>
                            )}
                        </Button>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
};
