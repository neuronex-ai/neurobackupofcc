import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, KeyRound } from "lucide-react";

const ResetPasswordPage = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const next = new URLSearchParams(window.location.search).get("next");

    // Ensure we have a session (handled by Supabase auto-login on link click)
    useEffect(() => {
        const checkSession = async () => {
            // First check if we have an active session
            const { data: { session } } = await supabase.auth.getSession();

            if (session) return;

            // If no session, check for error in URL hash (Supabase puts errors there)
            const hash = window.location.hash;
            if (hash && hash.includes("error_description")) {
                const params = new URLSearchParams(hash.substring(1)); // remove #
                const errorDescription = params.get("error_description");
                toast.error(`Erro: ${decodeURIComponent(errorDescription || "Link inválido")}`);
                // navigate('/auth'); // Optional: redirect if desired
            } else if (hash && hash.includes("access_token")) {
                // If we have an access token, Supabase client should auto-detect it, 
                // but sometimes we need to wait a tick.
                // It's handled by onAuthStateChange generally.
            } else {
                // No session and no obvious token - might be just loading or invalid
            }
        };
        checkSession();
    }, [navigate]);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password.length < 6) {
            toast.error("A senha deve ter no mínimo 6 caracteres.");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("As senhas não coincidem.");
            return;
        }

        setIsLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            toast.success("Senha redefinida com sucesso!");

            if (next === "portal") {
                window.localStorage.removeItem("neuronex_patient_portal_invite_token");
                navigate("/portal", { replace: true });
                return;
            }

            const { data: authData } = await supabase.auth.getUser();
            const userId = authData.user?.id;

            if (!userId) {
                navigate('/auth', { replace: true });
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('setup_completed')
                .eq('id', userId)
                .maybeSingle();

            navigate(profile?.setup_completed ? '/dashboard' : '/initial-settings', { replace: true });
        } catch (error: any) {
            toast.error(error.message || "Erro ao redefinir senha.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-emerald-500/[0.03] blur-[150px] rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 w-full max-w-md"
            >
                <div className="bg-[#0A0A0C]/90 backdrop-blur-2xl border border-white/10 rounded-[40px] p-10 shadow-2xl space-y-8">
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <KeyRound className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">Redefinir Senha</h1>
                        <p className="text-gray-400">
                            Crie uma nova senha segura para sua conta.
                        </p>
                    </div>

                    <form onSubmit={handleReset} className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Nova Senha</Label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="h-14 rounded-2xl bg-white/5 border-white/10 text-white px-6 focus:ring-0 focus:border-white/20 transition-all pr-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Confirmar Senha</Label>
                            <Input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className="h-14 rounded-2xl bg-white/5 border-white/10 text-white px-6 focus:ring-0 focus:border-white/20 transition-all"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-14 rounded-2xl bg-white text-black hover:bg-gray-200 font-bold uppercase tracking-widest text-xs shadow-xl transition-all active:scale-95"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                "Salvar Nova Senha"
                            )}
                        </Button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default ResetPasswordPage;
