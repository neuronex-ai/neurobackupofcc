"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, Settings, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const GoogleConnectionSuccess = () => {
    const navigate = useNavigate();
    const [countdown, setCountdown] = useState(5);
    const params = new URLSearchParams(window.location.search);
    const rawReturnTo = params.get("returnTo") || "/ajustes?status=success&service=google";
    const returnTo = rawReturnTo.startsWith("/") && !rawReturnTo.startsWith("//")
        ? rawReturnTo
        : "/ajustes?status=success&service=google";

    const successTarget = returnTo.includes("status=success")
        ? returnTo
        : `${returnTo}${returnTo.includes("?") ? "&" : "?"}status=success&service=google`;

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    navigate(successTarget, { replace: true });
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [navigate, successTarget]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-8 relative overflow-hidden font-sans">
            <div className="premium-noise opacity-[0.015] fixed inset-0 pointer-events-none z-50" />
            <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-emerald-500/[0.03] rounded-full blur-[180px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-foreground/[0.02] rounded-full blur-[180px] pointer-events-none" />

            <motion.div
                className="w-full max-w-[500px] relative z-10 text-center"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
                {/* Success Icon */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="w-24 h-24 mx-auto mb-10 rounded-[32px] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_60px_-15px_rgba(16,185,129,0.4)]"
                >
                    <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                </motion.div>

                {/* Title */}
                <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-4xl md:text-5xl font-bold text-foreground tracking-[-0.04em] mb-4"
                >
                    Conexão Estabelecida!
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-lg text-muted-foreground/60 mb-10 max-w-[380px] mx-auto"
                >
                    Sua conta do Google Workspace foi conectada com sucesso ao NeuroNex.
                </motion.p>

                {/* Features Connected */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-card/10 backdrop-blur-xl border border-border/30 rounded-[24px] p-6 mb-10"
                >
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 mb-4">
                        Funcionalidades Ativadas
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-left">
                        {[
                            "Envio de Lembretes",
                            "Sincronização de Agenda",
                            "Relatórios por Email",
                            "Notificações Automáticas"
                        ].map((feature, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-foreground/80">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                {feature}
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Redirect Info */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="space-y-6"
                >
                    <div className="flex items-center justify-center gap-3 text-muted-foreground/40">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">
                            Redirecionando em <span className="text-foreground font-bold">{countdown}</span> segundos...
                        </span>
                    </div>

                    <Button
                        onClick={() => navigate(successTarget, { replace: true })}
                        className="bg-foreground text-background hover:opacity-90 h-14 px-8 rounded-full font-bold uppercase tracking-widest text-[11px]"
                    >
                        <Settings className="w-4 h-4 mr-3" />
                        Ir para Ajustes
                        <ArrowRight className="w-4 h-4 ml-3" />
                    </Button>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default GoogleConnectionSuccess;
