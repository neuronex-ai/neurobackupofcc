"use client";

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/SessionContextProvider';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, HeartHandshake, Home, Stethoscope, ArrowRight, Lock, Loader2, Mail, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from "framer-motion";
import { TwoFactorModal } from '@/components/auth/TwoFactorModal';
import { ForgotPasswordModal } from '@/components/auth/ForgotPasswordModal';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/use-theme';
import { WaitlistModal } from '@/components/landing/WaitlistModal';
import { AsaasStamp } from '@/components/financeiro/AsaasStamp';

const AuthPage = () => {
    const { user, isLoading, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isRedirecting, setIsRedirecting] = useState(false);

    // Form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [rememberMe, setRememberMe] = useState(() => {
        return localStorage.getItem('neuronex_remember_me') === 'true';
    });

    const [show2FA, setShow2FA] = useState(false);
    const [userPhone, setUserPhone] = useState("");
    const [showForgot, setShowForgot] = useState(false);
    const [showWaitlist, setShowWaitlist] = useState(false);

    const searchParams = new URLSearchParams(location.search);
    const roleParam = searchParams.get('role');
    const [role, setRole] = useState<string | null>(roleParam);
    const isPatientLogin = role === 'patient';
    const { theme } = useTheme();

    const performRedirect = useCallback(async () => {
        if (!user) return;

        // Special admin/dev redirects
        if (user.email === 'vortexos.ai@gmail.com') { navigate('/portal'); return; }
        if (user.email === 'jotahub@gmail.com') { navigate('/dashboard'); return; }

        if (role === 'patient') {
            const { data: patient } = await supabase.from('patients').select('id').eq('email', user?.email).maybeSingle();
            if (patient) { navigate('/portal'); return; }
        }

        const { data: profile } = await supabase.from('profiles').select('setup_completed').eq('id', user.id).single();
        if (!profile?.setup_completed) { navigate('/initial-settings'); return; }
        navigate('/dashboard');
    }, [user, navigate, role]);

    const check2FAAndRedirect = useCallback(async () => {
        if (!user) return;
        setIsRedirecting(true);
        const { data: profile } = await supabase
            .from('profiles')
            .select('two_factor_enabled, phone, sms_notifications_enabled, setup_completed')
            .eq('id', user.id)
            .single();

        if (profile?.two_factor_enabled && profile?.phone) {
            setUserPhone(profile.phone);
            setShow2FA(true);
            setIsRedirecting(false);
            return;
        }

        if (profile?.sms_notifications_enabled && profile?.phone) {
            supabase.functions.invoke('twilio-sms', {
                body: {
                    action: 'send-notification',
                    phone: profile.phone,
                    templateKey: 'loginAlert'
                }
            });
        }
        performRedirect();
    }, [user, performRedirect]);

    useEffect(() => {
        if (!isLoading && user) {
            check2FAAndRedirect();
        }
    }, [user, isLoading, check2FAAndRedirect]);

    useEffect(() => {
        if (rememberMe) {
            const savedEmail = localStorage.getItem('neuronex_remembered_email');
            if (savedEmail) setEmail(savedEmail);
        }
    }, [rememberMe]);

    const handle2FASuccess = () => {
        toast.success("Identidade Verificada");
        setShow2FA(false);
        performRedirect();
    };

    const handle2FACancel = async () => {
        setShow2FA(false);
        await signOut();
        toast.info("Acesso Interrompido");
    };

    useEffect(() => { setRole(roleParam); }, [roleParam]);

    useEffect(() => {
        const verified = searchParams.get('verified');
        if (verified === 'true') {
            toast.success("Conta verificada com sucesso! 🎉");
            window.history.replaceState({}, '', '/auth?role=pro');
        }
    }, [location.search]);

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            toast.error("Preencha todos os campos");
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: email.trim().toLowerCase(),
                password
            });
            if (error) throw error;

            if (rememberMe) {
                localStorage.setItem('neuronex_remember_me', 'true');
                localStorage.setItem('neuronex_remembered_email', email.trim().toLowerCase());
            } else {
                localStorage.removeItem('neuronex_remember_me');
                localStorage.removeItem('neuronex_remembered_email');
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Erro ao fazer login");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isRedirecting) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 font-sans">
                <Loader2 className="w-12 h-12 text-muted-foreground/40 animate-spin" />
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">Sincronizando Identidade...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full relative bg-background selection:bg-foreground/10 font-sans flex items-center justify-center p-4 md:p-8 overflow-y-auto overflow-x-hidden">
            {/* Advanced Background Effects */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[1000px] h-[800px] bg-foreground/[0.03] blur-[220px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[600px] bg-foreground/[0.015] blur-[180px] rounded-full" />
            </div>

            <TwoFactorModal open={show2FA} onOpenChange={(open) => !open && handle2FACancel()} phone={userPhone} email={user?.email} onSuccess={handle2FASuccess} mode="login" />
            <WaitlistModal open={showWaitlist} onOpenChange={setShowWaitlist} />

            {/* Top Navigation */}
            <div className="absolute top-4 left-4 right-4 md:top-8 md:left-8 md:right-8 z-50 flex items-center justify-between pointer-events-none">
                <AnimatePresence>
                    {!role ? (
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="pointer-events-auto">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate('/')}
                                className="rounded-full w-10 h-10 md:w-auto md:px-6 md:h-12 flex items-center justify-center gap-3 hover:bg-secondary/50 border border-border/30 backdrop-blur-xl transition-all duration-300 ease-apple hover:scale-[1.02]"
                            >
                                <Home className="w-4 h-4 text-muted-foreground" />
                                <span className="hidden md:inline text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Sair do NeuroNex</span>
                            </Button>
                        </motion.div>
                    ) : (
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="pointer-events-auto">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setRole(null); navigate('/auth'); }}
                                className="rounded-full w-10 h-10 md:w-auto md:px-6 md:h-12 flex items-center justify-center gap-3 hover:bg-secondary/50 border border-border/30 backdrop-blur-xl transition-all duration-300 ease-apple hover:scale-[1.02]"
                            >
                                <ArrowLeft className="w-4 h-4 text-muted-foreground" />
                                <span className="hidden md:inline text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Alternar Protocolo</span>
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence mode="wait">
                {!role ? (
                    <motion.div key="selection" initial={{ opacity: 0, scale: 0.98, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} className="relative z-10 w-full max-w-5xl flex flex-col items-center py-20 md:py-0">
                        <div className="text-center mb-8 md:mb-16 space-y-4 md:space-y-6">
                            <h1 className="text-3xl md:text-7xl font-bold text-foreground tracking-[-0.05em] leading-tight">
                                Bem-vindo ao <span className="text-foreground/30 italic font-medium">NeuroNex.</span>
                            </h1>
                            <p className="text-sm md:text-xl text-muted-foreground font-medium max-w-lg mx-auto tracking-tight">
                                Escolha seu tipo de acesso para continuar.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 w-full max-w-4xl px-4 md:px-0">
                            {[
                                { id: 'pro', icon: Stethoscope, title: "Profissional", desc: "Para psicólogos e psiquiatras.", role: 'pro' },
                                { id: 'patient', icon: HeartHandshake, title: "Paciente", desc: "Acesso à sua jornada de saúde.", role: 'patient' }
                            ].map((p, i) => (
                                <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} onClick={() => { setRole(p.role); navigate(`?role=${p.role}`); }} className="group cursor-pointer">
                                    <div className="relative h-auto md:h-[380px] bg-card/80 backdrop-blur-[40px] border border-border/20 rounded-[32px] md:rounded-[48px] p-8 md:p-10 flex flex-col items-center text-center transition-all duration-500 ease-apple group-hover:bg-card group-hover:border-border/40 group-hover:-translate-y-1 shadow-2xl overflow-hidden group-active:scale-[0.98]">
                                        <div className="w-14 h-14 md:w-20 md:h-20 rounded-[20px] md:rounded-[28px] bg-secondary/50 border border-border/20 flex items-center justify-center mb-6 md:mb-10 transition-all duration-500 ease-apple group-hover:scale-110 group-hover:bg-foreground group-hover:text-background">
                                            <p.icon className="w-6 h-6 md:w-8 md:h-8" strokeWidth={1.5} />
                                        </div>
                                        <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3 md:mb-4 tracking-tighter">{p.title}</h3>
                                        <p className="text-sm md:text-base text-muted-foreground font-medium leading-relaxed max-w-[240px] mb-6 md:mb-8">
                                            {p.desc}
                                        </p>
                                        <div className="mt-auto flex items-center gap-2 md:gap-3 text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 group-hover:text-foreground transition-colors">
                                            <span>Entrar</span>
                                            <ArrowRight className="w-3 h-3 md:w-4 md:h-4 group-hover:translate-x-1.5 transition-transform" />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="login" initial={{ opacity: 0, scale: 0.98, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} className="relative z-10 w-full max-w-[480px] my-12 md:my-0">
                        <div className="bg-card/80 backdrop-blur-[40px] border border-border/20 rounded-[32px] md:rounded-[48px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] relative overflow-hidden">
                            {/* Premium Ambient Light */}
                            <div className="absolute -top-[20%] -left-[20%] w-[140%] h-[140%] bg-[radial-gradient(circle_at_30%_30%,rgba(128,128,128,0.03)_0%,transparent_50%)] pointer-events-none" />
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />

                            <div className="px-6 md:px-12 py-10 md:py-12 relative z-10 flex flex-col">
                                {/* Integrated Logo and Tabs */}
                                <div className="flex flex-col items-center mb-6">
                                    <div className="relative mb-6">
                                        <div className="absolute -inset-4 bg-foreground/10 blur-2xl rounded-full opacity-30" />
                                        <img
                                            src={theme === 'dark' ? "./favicon-S-FUNDO-BRANCA.ico" : "./favicon-S-FUNDO-PRETA.ico"}
                                            alt="NeuroNex Logo"
                                            className="w-12 h-12 md:w-16 md:h-16 relative z-10 object-contain"
                                        />
                                    </div>

                                    <div className="text-center mb-6">
                                        <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tighter mb-1 md:mb-2">
                                            {isPatientLogin ? "Área do Paciente" : "Acesso Restrito"}
                                        </h2>
                                        <p className="text-[9px] md:text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">
                                            {isPatientLogin ? "Identifique-se para continuar" : "Protocolo de Segurança Ativo"}
                                        </p>
                                    </div>

                                    {!isPatientLogin && (
                                        <div className="w-full flex bg-secondary/30 rounded-xl md:rounded-2xl p-1 border border-border/20 backdrop-blur-md">
                                            <button
                                                className="flex-1 py-2.5 md:py-3 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] bg-foreground text-background shadow-2xl scale-100"
                                            >
                                                Login Profissional
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Form Sections */}
                                <form onSubmit={handleEmailLogin} className="space-y-4 md:space-y-5">
                                    <div className="space-y-3 md:space-y-4">
                                        <div className="relative group">
                                            <Mail className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground/40 group-focus-within:text-foreground/60 transition-colors" />
                                            <Input
                                                type="email"
                                                placeholder="E-MAIL"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="h-12 md:h-14 bg-secondary/20 border-border/20 rounded-xl md:rounded-2xl pl-12 md:pl-14 text-foreground placeholder:text-muted-foreground/30 focus:border-border/50 focus:ring-0 focus:bg-secondary/30 transition-all text-[10px] md:text-xs font-bold tracking-widest"
                                            />
                                        </div>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground/40 group-focus-within:text-foreground/60 transition-colors" />
                                            <Input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="SENHA"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="h-12 md:h-14 bg-secondary/20 border-border/20 rounded-xl md:rounded-2xl pl-12 md:pl-14 pr-12 md:pr-14 text-foreground placeholder:text-muted-foreground/30 focus:border-border/50 focus:ring-0 focus:bg-secondary/30 transition-all text-[10px] md:text-xs font-bold tracking-widest"
                                            />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 md:right-5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground/60 transition-colors">
                                                {showPassword ? <EyeOff className="w-4 h-4 md:w-5 md:h-5" /> : <Eye className="w-4 h-4 md:w-5 md:h-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-4 md:gap-6 pt-2">
                                        <label className="flex items-center gap-3 md:gap-4 cursor-pointer group w-fit">
                                            <div className={cn(
                                                "relative w-9 h-5 md:w-11 md:h-6 rounded-full transition-all duration-500",
                                                rememberMe ? "bg-foreground" : "bg-secondary"
                                            )}>
                                                <motion.div
                                                    className={cn("absolute w-3 h-3 md:w-4 md:h-4 rounded-full top-1", rememberMe ? "bg-background" : "bg-muted-foreground/40")}
                                                    animate={{ left: rememberMe ? (window.innerWidth < 768 ? 18 : 24) : 4 }}
                                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                                />
                                            </div>
                                            <input type="checkbox" className="sr-only" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                                            <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 group-hover:text-muted-foreground transition-colors">Manter Sincronizado</span>
                                        </label>

                                        <Button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full h-14 md:h-16 rounded-xl md:rounded-2xl bg-foreground text-background hover:bg-foreground/90 font-black uppercase text-[10px] md:text-[11px] tracking-[0.3em] shadow-lg transition-all active:scale-[0.98]"
                                        >
                                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Validar Acesso"}
                                        </Button>
                                    </div>
                                </form>

                                {/* Bottom Utilities */}
                                <div className="mt-8 flex flex-col items-center gap-4">
                                    <div className="flex flex-col items-center gap-4 w-full">
                                        {!isPatientLogin && (
                                            <button onClick={() => setShowWaitlist(true)} className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-foreground hover:opacity-70 transition-all py-2 flex items-center gap-2">
                                                Lista de Espera <ArrowRight className="w-3 h-3" />
                                            </button>
                                        )}
                                        <button onClick={() => setShowForgot(true)} className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 hover:text-muted-foreground transition-colors py-2">
                                            Recuperar Credenciais
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2 md:gap-3 text-[8px] md:text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.3em] bg-secondary/20 px-4 md:px-6 py-2 md:py-2.5 rounded-full border border-border/10">
                                        <ShieldCheck className="w-3 md:w-3.5 h-3 md:h-3.5" /> Terminal Criptografado
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                <ForgotPasswordModal open={showForgot} onOpenChange={setShowForgot} />
            </AnimatePresence>

            {/* Asaas Regulatory Badge - Bottom Right */}
            <div className="fixed bottom-4 right-4 md:bottom-6 md:right-8 z-50 flex flex-col items-end gap-1.5 opacity-[0.5] hover:opacity-100 transition-opacity duration-300">
                <div className="flex items-center justify-end gap-3 md:gap-4">
                    <div className="flex items-center gap-1 md:gap-1.5">
                        <img
                            src="/neuro-logo.png"
                            alt="NeuroNex"
                            className="h-3.5 md:h-4.5 w-auto brightness-0 dark:invert transition-all duration-300"
                        />
                        <span className="font-bold text-[8px] md:text-[10px] tracking-tight text-foreground uppercase">NeuroNex AI</span>
                    </div>
                    <span className="text-foreground/20 font-light text-xs md:text-base">|</span>
                    <AsaasStamp className="scale-[0.65] md:scale-[0.8] origin-right" />
                </div>
                <p className="text-[7px] md:text-[8.5px] text-muted-foreground font-medium tracking-wide text-right">
                    A infraestrutura de pagamentos é provida pelo Asaas IP S.A.
                </p>
            </div>
        </div>
    );
};

export default AuthPage;