"use client";

import { FadeIn } from "@/components/animations/FadeIn";
import { WaitlistModal } from "@/components/landing/WaitlistModal";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, ChevronDown, ChevronRight, Eye, Layers, Sparkles, Star, Wallet, Zap, Shield, BrainCircuit, LayoutDashboard, Clock
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { LandingMobileNav } from "@/components/landing/LandingMobileNav";
import { Footer } from "@/components/landing/Footer";
import { motion } from "framer-motion";
import { LandingSynapseSDR } from "@/components/landing/LandingSynapseSDR";
import { useLandingSynapse } from "@/hooks/use-landing-synapse";

// --- Components ---

const HeroMobile = () => {
  return (
    <section className="relative pt-44 pb-12 px-6 flex flex-col items-center text-center overflow-hidden min-h-[95vh] justify-center">
      <div className="absolute inset-0 premium-noise opacity-[0.03] pointer-events-none" />
      
      {/* Atmospheric Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-primary/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-[-20%] w-[300px] h-[300px] bg-primary/5 blur-[100px] rounded-full pointer-events-none" />

      <FadeIn>
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-foreground/[0.03] border border-border/30 backdrop-blur-md mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/60">NeuroNex | Beta 2026</span>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <h1 className="text-[3.8rem] font-bold tracking-[-0.06em] text-foreground leading-[0.85] mb-8">
          Sua clínica, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-foreground via-foreground/80 to-foreground/40 italic">elevada.</span>
        </h1>
      </FadeIn>

      <FadeIn delay={0.2}>
        <p className="text-lg text-muted-foreground dark:text-muted-foreground/70 font-medium leading-tight tracking-tight mb-12 max-w-[300px]">
          O sistema operacional definitivo para psicólogos de elite. Prontuário, agenda e IA em perfeita simbiose.
        </p>
      </FadeIn>

      <FadeIn delay={0.3} className="w-full">
        <div className="flex flex-col gap-4 w-full px-4 mb-12">
          <Link to="/auth">
            <Button className="w-full h-18 rounded-full bg-foreground text-background font-black uppercase tracking-[0.2em] text-[11px] shadow-premium active:scale-95 transition-all">
              Iniciar Jornada <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link to="/auth">
            <Button variant="ghost" className="w-full h-18 rounded-full border border-border/20 text-foreground/80 dark:text-foreground/60 font-black uppercase tracking-[0.2em] text-[11px] active:scale-95 transition-all bg-foreground/[0.02] backdrop-blur-sm">
              Explorar Ecossistema
            </Button>
          </Link>
        </div>
      </FadeIn>

      <FadeIn delay={0.5}>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2 opacity-30 mt-4"
        >
          <span className="text-[8px] font-black uppercase tracking-[0.4em]">Deslize</span>
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </FadeIn>
    </section>
  );
};

const EcosystemMobile = () => {
  const items = [
    {
      title: "NeuroNex AI",
      subtitle: "Inteligência Clínica",
      desc: "Transcreve sessões, gera insights e resume prontuários instantaneamente.",
      icon: Sparkles,
    },
    {
      title: "NeuroFinance",
      subtitle: "Conta Digital Premium",
      desc: "Gestão financeira completa com conta digital integrada e split automatizado.",
      icon: Wallet,
    },
    {
      title: "Central de Notas",
      subtitle: "NeuroView",
      desc: "Uma visão sistêmica completa da evolução clínica em ambiente imersivo.",
      icon: Eye,
    },
    {
      title: "Torre de Controle",
      subtitle: "Visão Total",
      desc: "Centralize agenda, financeiro e alertas em tempo real. Decisões baseadas em dados.",
      icon: LayoutDashboard,
    },
    {
      title: "Prontuário Vivo",
      subtitle: "Histórico Fluido",
      desc: "Acesse a linha do tempo completa do paciente com segurança de nível bancário.",
      icon: Shield,
    }
  ];

  return (
    <section id="ecosystem" className="py-20 px-6 relative bg-background">
      <div className="absolute inset-0 premium-noise opacity-[0.02] pointer-events-none" />

      <FadeIn>
        <div className="text-center mb-16 px-2">
            <h2 className="text-[2.8rem] font-black tracking-[-0.05em] leading-[0.9] text-foreground mb-6">
            A Psicologia <br />
            <span className="text-muted-foreground/30 italic">sem barreiras.</span>
            </h2>
            <p className="text-sm text-muted-foreground/60 font-medium uppercase tracking-[0.1em]">Design invisível, impacto sistêmico.</p>
        </div>
      </FadeIn>

      <div className="space-y-6">
        {items.map((item, i) => (
          <FadeIn key={i} delay={i * 0.1}>
            <div className="p-8 rounded-[40px] bg-card/40 backdrop-blur-3xl border border-border/20 dark:border-white/10 relative overflow-hidden group">
              <div className="absolute inset-0 premium-noise opacity-[0.03] pointer-events-none" />
              <div className="inline-flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-foreground/[0.03] border border-border/20 text-foreground/50 dark:text-foreground/40 mb-6 font-black uppercase tracking-[0.2em] text-[8px]">
                <item.icon className="w-3.5 h-3.5" />
                {item.subtitle}
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">{item.title}</h3>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground/80 leading-relaxed font-medium mb-8">{item.desc}</p>
              <Link to="/auth">
                <Button variant="ghost" className="h-12 w-full rounded-full border border-border/20 text-[9px] font-black uppercase tracking-[0.2em] group-hover:bg-foreground group-hover:text-background transition-all">
                  Acessar Módulo <ArrowRight className="w-3.5 h-3.5 ml-2" />
                </Button>
              </Link>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
};

const VideoMobile = () => {
    return (
        <section className="py-20 px-6 relative overflow-hidden">
            <div className="absolute inset-0 premium-noise opacity-[0.03] pointer-events-none" />
            <FadeIn>
                <div className="text-center mb-12">
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-primary mb-4 block">Manifesto</span>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground leading-tight px-4">
                        A Nova Fronteira do Cuidado.
                    </h2>
                </div>
            </FadeIn>

            <FadeIn delay={0.2}>
                <div className="relative rounded-[32px] overflow-hidden bg-black/40 backdrop-blur-3xl border border-white/10 shadow-premium aspect-video mx-auto max-w-sm">
                    <iframe
                        src="https://www.youtube.com/embed/vk6cw0bkut8?autoplay=0&controls=1&rel=0&modestbranding=1&showinfo=0&mute=0"
                        title="NeuroNex Presentation"
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                    />
                </div>
            </FadeIn>
            
            <FadeIn delay={0.4}>
                <p className="mt-8 text-sm text-center text-muted-foreground/60 font-medium px-6 leading-relaxed">
                    Descubra como a simbiose entre IA e neurociência redefine a excelência.
                </p>
            </FadeIn>
        </section>
    );
};

const ManifestoMobile = () => {
    return (
        <section className="py-24 px-6 relative bg-zinc-950/50">
            <div className="absolute inset-0 premium-noise opacity-[0.04] pointer-events-none" />
            <FadeIn>
                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.02] backdrop-blur-md mb-8">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        <p className="text-[10px] font-bold text-white/60 uppercase tracking-[0.3em]">Visão Sistêmica</p>
                    </div>
                    <h2 className="text-[2.2rem] font-bold text-white leading-[1.1] tracking-tighter px-2">
                        O sistema operacional <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-b from-primary to-white/40 italic font-medium">da mente.</span>
                    </h2>
                </div>
            </FadeIn>

            <div className="space-y-4">
                {[
                    { title: "Privacidade Absoluta", icon: Shield, desc: "Criptografia de ponta a ponta, excedendo LGPD." },
                    { title: "Inteligência Auxiliar", icon: BrainCircuit, desc: "Potencializamos sua análise com ferramentas de IA." },
                    { title: "Design Invisível", icon: LayoutDashboard, desc: "Menos cliques, foco total no paciente." }
                ].map((item, i) => (
                    <FadeIn key={i} delay={i * 0.1}>
                        <div className="p-8 rounded-[32px] border border-white/[0.08] bg-[#0A0A0B]/60 backdrop-blur-3xl shadow-xl">
                            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center mb-6">
                                <item.icon className="w-6 h-6 text-white/60" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                            <p className="text-sm text-white/40 leading-relaxed font-medium">{item.desc}</p>
                        </div>
                    </FadeIn>
                ))}
            </div>
        </section>
    );
};

const WaitlistMobile = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <section id="waitlist" className="py-24 px-6 text-center relative overflow-hidden bg-background">
      <div className="absolute inset-0 premium-noise opacity-[0.04] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none" />

      <FadeIn>
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-border/20 bg-foreground/[0.03] backdrop-blur-md mb-8">
          <Sparkles className="w-3.5 h-3.5 text-foreground/40" />
          <span className="text-[9px] uppercase tracking-[0.25em] font-black text-foreground/60">Lista Exclusiva 2026</span>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <h2 className="text-[3.2rem] font-bold tracking-[-0.05em] leading-[0.85] mb-8">
          A Nova Era da <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-foreground via-foreground/80 to-foreground/30 italic">Neuropsicologia.</span>
        </h2>
      </FadeIn>

      <FadeIn delay={0.2}>
        <p className="text-base text-muted-foreground dark:text-muted-foreground/60 font-medium px-4 mb-12 leading-relaxed">
          Estamos refinando a experiência final. As vagas para parceiros fundadores são limitadas.
        </p>
      </FadeIn>

      <FadeIn delay={0.3}>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="w-full h-20 rounded-full bg-foreground text-background font-black uppercase tracking-[0.2em] text-xs shadow-premium active:scale-95 transition-all"
        >
          Entrar na Lista de Espera <ArrowRight className="w-4 h-4 ml-3" />
        </Button>
      </FadeIn>

      <div className="grid grid-cols-1 gap-4 mt-14">
        {[
            { icon: Star, title: "Selo Fundador" },
            { icon: Zap, title: "Acesso Beta" },
            { icon: Shield, title: "Condições Alpha" }
        ].map((item, i) => (
            <div key={i} className="p-6 rounded-[32px] bg-foreground/[0.02] border border-border/10 flex items-center gap-4 text-left">
                <item.icon className="w-5 h-5 text-foreground/40" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/80">{item.title}</h4>
            </div>
        ))}
      </div>

      <WaitlistModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </section>
  );
};

const DesktopCTA_Mobile = () => {
  return (
    <section className="py-24 px-6">
      <div className="relative rounded-[56px] overflow-hidden border border-border/40 bg-card/5 backdrop-blur-3xl p-10 flex flex-col items-center text-center shadow-premium">
        <div className="absolute inset-0 premium-noise opacity-[0.03] pointer-events-none" />

        <FadeIn>
          <div className="w-16 h-16 rounded-[24px] bg-foreground/[0.03] border border-border/10 flex items-center justify-center mb-8">
            <Layers className="w-6 h-6 text-foreground/60" />
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/20 bg-foreground/[0.02] mb-6">
                <Clock className="w-3 h-3 text-muted-foreground/60" />
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Em desenvolvimento</span>
            </div>
          <h2 className="text-[2.5rem] font-black tracking-[-0.04em] leading-[0.9] mb-8">
            Fluidez total em <br />
            <span className="text-muted-foreground/40 italic">Qualquer Tela.</span>
          </h2>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p className="text-sm text-muted-foreground/50 font-medium leading-relaxed mb-12">
            Polindo versões nativas para Windows, MacOS, iOS e Android para simbiose perfeita.
          </p>
        </FadeIn>

        <div className="grid grid-cols-2 gap-4 w-full">
          <div className="p-6 rounded-[28px] bg-foreground/[0.02] border border-border/10 text-center">
            <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">Windows/Mac</p>
          </div>
          <div className="p-6 rounded-[28px] bg-foreground/[0.02] border border-border/10 text-center">
            <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">iOS/Android</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export const MobileIndex = () => {
  const sdr = useLandingSynapse();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 relative">
      <LandingMobileNav />
      <main>
        <HeroMobile />
        <EcosystemMobile />
        <VideoMobile />
        <ManifestoMobile />
        <WaitlistMobile />
        <DesktopCTA_Mobile />
      </main>
      <Footer />
      <LandingSynapseSDR sdr={sdr} />
    </div>
  );
};