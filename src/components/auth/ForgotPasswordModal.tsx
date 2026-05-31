import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, ArrowRight, Check, Loader2 } from "lucide-react";

interface ForgotPasswordModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const ForgotPasswordModal = ({ open, onOpenChange }: ForgotPasswordModalProps) => {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim()) {
            toast.error("Digite seu email");
            return;
        }

        setIsLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) throw error;

            setIsSuccess(true);
            toast.success("Email de recuperação enviado!");
        } catch (error: any) {
            console.error("Reset password error:", error);
            toast.error("Erro ao enviar email. Verifique o endereço e tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setEmail("");
        setIsSuccess(false);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden rounded-[24px] bg-card/95 dark:bg-[#0A0A0C]/95 backdrop-blur-xl border border-border/50 dark:border-white/[0.06]">
                {/* Texture */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] dark:opacity-[0.03] pointer-events-none" />

                <div className="relative p-6 space-y-6">
                    {!isSuccess ? (
                        <>
                            <DialogHeader className="text-center">
                                <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-foreground/10 dark:from-white/10 to-transparent border border-border/50 dark:border-white/10 flex items-center justify-center shadow-lg mb-4">
                                    <Mail className="h-7 w-7 text-foreground dark:text-white" />
                                </div>
                                <DialogTitle className="text-xl font-bold text-foreground dark:text-white">
                                    Recuperar Senha
                                </DialogTitle>
                                <DialogDescription className="text-muted-foreground dark:text-white/50">
                                    Digite seu email e enviaremos um link para redefinir sua senha.
                                </DialogDescription>
                            </DialogHeader>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="reset-email" className="text-foreground dark:text-white/70">Email</Label>
                                    <Input
                                        id="reset-email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="seu@email.com"
                                        className="h-12 bg-muted/50 dark:bg-white/5 border-border/50 dark:border-white/10 rounded-xl text-foreground dark:text-white"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-12 rounded-xl bg-foreground dark:bg-white text-background dark:text-black hover:bg-foreground/90 dark:hover:bg-white/90 font-bold uppercase tracking-wider shadow-lg transition-all active:scale-95"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            Enviar Link <ArrowRight className="w-4 h-4" />
                                        </span>
                                    )}
                                </Button>
                            </form>
                        </>
                    ) : (
                        <div className="text-center py-6 space-y-4">
                            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                <Check className="h-8 w-8 text-emerald-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground dark:text-white">
                                    Email Enviado!
                                </h3>
                                <p className="text-sm text-muted-foreground dark:text-white/50 mt-2">
                                    Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
                                </p>
                            </div>
                            <Button
                                onClick={handleClose}
                                variant="outline"
                                className="mt-4"
                            >
                                Fechar
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
