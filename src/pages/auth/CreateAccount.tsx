"use client";

import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, Variants } from "framer-motion";
import { Sparkles, Shield, Zap, BarChart3, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WaitlistModal } from "@/components/landing/WaitlistModal";
import { AsaasStamp } from "@/components/financeiro/AsaasStamp";

const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1] as const
        }
    },
};

const staggerChildren: Variants = { visible: { transition: { staggerChildren: 0.1 } } };

const CreateAccount = () => {
    const [showWaitlist, setShowWaitlist] = useState(false);

    const features = [
        { icon: Sparkles, title: "NeuroNex IA", desc: "Inteligência sintética clínica" },
        { icon: Shield, title: "Zero-Knowledge", desc: "Soberania criptográfica total" },
        { icon: Zap, title: "Fluxo Contábil", desc: "Automação fiscal integrada" },
        { icon: BarChart3, title: "Data Insights", desc: "Analytics de alta precisão" },
    ];

    return (
        <div className="min-h-screen grid lg:grid-cols-2 bg-background font-sans selection:bg-foreground/10 overflow-hidden">
            <WaitlistModal open={showWaitlist} onOpenChange={setShowWaitlist} />
            <div className="premium-noise opacity-[0.015] fixed inset-0 pointer-events-none z-50" />

            {/* Left Column - Visual/Marketing */}
            <div className="hidden lg:flex relative flex-col justify-between p-20 bg-foreground/[0.01] border-r border-border/30 overflow-hidden">
                <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-foreground/[0.02] rounded-full blur-[180px] pointer-events-none" />

                {/* Logo */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                    <Link to="/" className="flex items-center gap-2 relative z-10 w-fit group">
                        <span className="text-foreground text-xl font-bold tracking-tight group-hover:opacity-80 transition-opacity">NeuroNex</span>
                    </Link>
                </motion.div>

                {/* Content */}
                <motion.div className="relative z-10 max-w-xl space-y-20" initial="hidden" animate="visible" variants={staggerChildren}>
                    <motion.div variants={fadeInUp} className="space-y-8">
                        <h1 className="text-6xl xl:text-7xl font-bold tracking-[-0.05em] text-foreground leading-[0.9]">
                            Gestão clínica <br /><span className="text-muted-foreground/30 italic">elevada à ciência.</span>
                        </h1>
                        <p className="text-xl text-muted-foreground/60 font-medium leading-tight tracking-tight">
                            Junte-se à elite clínica que opera no NeuroNex. Performance operacional sem precedentes.
                        </p>
                    </motion.div>

                    {/* Feature Grid */}
                    <motion.div variants={fadeInUp} className="grid grid-cols-2 gap-6">
                        {features.map((item, i) => (
                            <div key={i} className="group bg-card/40 backdrop-blur-3xl border border-border/30 rounded-[32px] p-8 hover:border-foreground/20 transition-all duration-700 shadow-premium">
                                <div className="w-12 h-12 rounded-2xl bg-foreground/[0.03] flex items-center justify-center mb-6 group-hover:bg-foreground group-hover:text-background transition-all duration-700">
                                    <item.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-bold text-foreground mb-2 tracking-tight">{item.title}</h3>
                                <p className="text-sm text-muted-foreground/40 font-medium tracking-tight">{item.desc}</p>
                            </div>
                        ))}
                    </motion.div>

                    {/* Manifesto / Invitation */}
                    <motion.div variants={fadeInUp} className="bg-foreground/[0.01] border border-border/40 rounded-[40px] p-10 relative overflow-hidden backdrop-blur-sm">
                        <div className="premium-noise opacity-[0.01]" />
                        <p className="text-lg text-muted-foreground/80 font-medium italic leading-relaxed mb-6 tracking-tight">
                            "Nós não somos empresários oferecendo só mais uma ferramenta. Somos pacientes e psicólogos que criaram aquilo que ainda não existia no mercado."
                        </p>
                        <p className="text-base text-foreground font-medium leading-relaxed tracking-tight">
                            Este é um convite para você fazer parte desse movimento.
                        </p>
                    </motion.div>
                </motion.div>

                {/* Footer */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="relative z-10 flex flex-col gap-4">
                    <div className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">
                        2026 © NEURONEX AI LTDA. TODOS OS DIREITOS RESERVADOS
                    </div>
                    <AsaasStamp />
                </motion.div>
            </div>

            {/* Right Column - Replaced form with waitlist notice */}
            <div className="flex items-center justify-center p-8 lg:p-20 relative bg-background">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] bg-foreground/[0.02] blur-[150px] rounded-full pointer-events-none" />

                <motion.div className="w-full max-w-[480px] space-y-10 relative z-10 text-center lg:text-left" initial="hidden" animate="visible" variants={staggerChildren}>
                    <motion.div variants={fadeInUp} className="lg:hidden flex justify-center mb-12">
                        <Link to="/" className="text-foreground font-bold text-2xl tracking-tight">
                            NeuroNex
                        </Link>
                    </motion.div>

                    <motion.div variants={fadeInUp} className="space-y-6">
                        <h2 className="text-5xl md:text-6xl font-black text-foreground tracking-[-0.05em] leading-[0.9]">
                            Acesso <br /><span className="text-muted-foreground/30 italic font-medium">Temporariamente Restrito.</span>
                        </h2>
                        <p className="text-xl text-muted-foreground/60 font-medium tracking-tight leading-relaxed">
                            Estamos refinando a experiência NeuroNex para garantir a máxima performance clínica aos nossos parceiros pioneiros.
                        </p>
                    </motion.div>

                    <motion.div variants={fadeInUp} className="space-y-8 pt-4">
                        <div className="p-8 rounded-[32px] bg-foreground/[0.02] border border-border/40 backdrop-blur-sm space-y-6">
                            <p className="text-sm text-foreground/80 font-medium leading-relaxed">
                                Novas vagas para profissionais serão liberadas em breve através do nosso protocolo de onboarding controlado.
                            </p>
                            <Button
                                onClick={() => setShowWaitlist(true)}
                                className="w-full h-16 rounded-2xl bg-foreground text-background hover:opacity-90 font-black uppercase text-[11px] tracking-[0.3em] shadow-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                            >
                                Entrar na Lista de Espera <ArrowRight className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 py-4">
                            Já tem uma conta? <Link to="/auth?role=pro" className="text-foreground hover:opacity-70 transition-colors uppercase tracking-widest ml-1">Entrar no Terminal</Link>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

export default CreateAccount;
