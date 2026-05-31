"use client";

import { FadeIn } from "@/components/animations/FadeIn";
import { WaitlistModal } from "@/components/landing/WaitlistModal";
import { Button } from "@/components/ui/button";

import {
  ArrowRight, ChevronDown, ChevronRight, Eye, Layers, Sparkles, Star, Wallet, Zap
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { LandingMobileNav } from "@/components/landing/LandingMobileNav";
import { Footer } from "@/components/landing/Footer";
import { motion } from "framer-motion";

// --- Components ---

const HeroMobile = () => {
  return (
    <section className="relative pt-44 pb-12 px-6 flex flex-col items-center text-center overflow-hidden min-h-[90vh] justify-center">
      <div className="brand-neutral-gradient opacity-40" />
      <div className="brand-high-contrast-gradient opacity-15" />

      {/* Atmospheric Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

      <FadeIn>
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-foreground/[0.03] border border-border/30 backdrop-blur-md mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/60">NeuroNex | Beta</span>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <h1 className="text-[3.5rem] font-bold tracking-[-0.05em] text-foreground leading-[0.9] mb-8">
          Sua clínica, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-foreground via-foreground/80 to-foreground/40 italic">elevada.</span>
        </h1>
      </FadeIn>

      <FadeIn delay={0.2}>
        <p className="text-lg text-muted-foreground dark:text-muted-foreground/70 font-medium leading-tight tracking-tight mb-12 max-w-[280px]">
          O sistema operacional definitivo para psicólogos de elite.
        </p>
      </FadeIn>

      <FadeIn delay={0.3} className="w-full">
        <div className="flex flex-col gap-4 w-full px-4 mb-8">
          <Link to="/auth">
            <Button className="w-full h-16 rounded-full bg-foreground text-background font-black uppercase tracking-[0.2em] text-[11px] shadow-premium active:scale-95 transition-all">
              Iniciar Jornada <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link to="/funcionalidades">
            <Button variant="ghost" className="w-full h-16 rounded-full border border-border/20 text-foreground/80 dark:text-foreground/60 font-black uppercase tracking-[0.2em] text-[11px] active:scale-95 transition-all bg-foreground/[0.03]">
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
          <span className="text-[8px] font-black uppercase tracking-[0.4em]">Scroll</span>
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
    }
  ];

  return (
    <section id="ecosystem" className="py-14 px-6 relative bg-background">
      <div className="premium-noise opacity-[0.02] pointer-events-none" />

      <FadeIn>
        <h2 className="text-[2.5rem] font-black tracking-[-0.05em] leading-[0.9] text-foreground mb-12 px-2 text-center">
          A Psicologia <br />
          <span className="text-muted-foreground/30">não aceita barreiras.</span>
        </h2>
      </FadeIn>

      <div className="space-y-6">
        {items.map((item, i) => (
          <FadeIn key={i} delay={i * 0.1}>
            <div className="p-8 rounded-[40px] bg-card/60 dark:bg-card/40 backdrop-blur-3xl border border-border/30 dark:border-white/10 relative overflow-hidden group text-center">
              <div className="premium-noise opacity-[0.03] pointer-events-none" />
              <div className="inline-flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-foreground/[0.03] border border-border/20 text-foreground/50 dark:text-foreground/40 mb-6 font-black uppercase tracking-[0.2em] text-[8px]">
                <item.icon className="w-3.5 h-3.5" />
                {item.subtitle}
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">{item.title}</h3>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground/80 leading-relaxed font-medium mb-8">{item.desc}</p>
              <Link to="/auth">
                <Button variant="ghost" className="h-10 px-5 rounded-full border border-border/20 text-[9px] font-black uppercase tracking-[0.2em] group-hover:bg-foreground group-hover:text-background transition-all">
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

const WaitlistMobile = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <section id="waitlist" className="py-14 px-6 text-center relative overflow-hidden">
      <div className="absolute inset-0 premium-noise opacity-[0.04] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none" />

      <FadeIn>
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-border/20 bg-foreground/[0.03] backdrop-blur-md mb-8">
          <Sparkles className="w-3.5 h-3.5 text-foreground/40" />
          <span className="text-[9px] uppercase tracking-[0.25em] font-black text-foreground/60">Lista Exclusiva 2026</span>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <h2 className="text-[2.8rem] font-bold tracking-[-0.05em] leading-[0.9] mb-8">
          A Nova Era da <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-foreground via-foreground/80 to-foreground/30 italic">Neuropsicologia.</span>
        </h2>
      </FadeIn>

      <FadeIn delay={0.2}>
        <p className="text-base text-muted-foreground dark:text-muted-foreground/60 font-medium px-4 mb-12 leading-relaxed">
          Estamos refinando a experiência final. As vagas são limitadas.
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

      <div className="grid grid-cols-2 gap-4 mt-14 text-center">
        <div className="p-6 rounded-[32px] bg-foreground/[0.02] border border-border/10">
          <Star className="w-5 h-5 mb-4 text-foreground/40" />
          <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-foreground/80">Selo Fundador</h4>
        </div>
        <div className="p-6 rounded-[32px] bg-foreground/[0.02] border border-border/10">
          <Zap className="w-5 h-5 mb-4 text-foreground/40" />
          <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-foreground/80">Acesso Beta</h4>
        </div>
      </div>

      <WaitlistModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </section>
  );
};

const DesktopCTA_Mobile = () => {
  return (
    <section className="py-14 px-6">
      <div className="relative rounded-[48px] overflow-hidden border border-border/40 bg-card/5 backdrop-blur-3xl p-10 flex flex-col items-center text-center shadow-premium">
        <div className="premium-noise opacity-[0.03] pointer-events-none" />

        <FadeIn>
          <div className="w-16 h-16 rounded-3xl bg-foreground/[0.03] border border-border/10 flex items-center justify-center mb-8">
            <Layers className="w-6 h-6 text-foreground/60" />
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <h2 className="text-3xl font-black tracking-[-0.04em] leading-tight mb-6">
            Disponível em <br />
            <span className="text-muted-foreground/40">Qualquer Tela.</span>
          </h2>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p className="text-sm text-muted-foreground/50 font-medium leading-relaxed mb-10">
            Polindo versões nativas para Windows, MacOS, iOS e Android.
          </p>
        </FadeIn>

        <div className="grid grid-cols-2 gap-4 w-full">
          <div className="p-5 rounded-[24px] bg-foreground/[0.02] border border-border/10 text-center">
            <p className="text-[8px] font-black text-muted-foreground/30 uppercase tracking-widest">Windows/Mac</p>
          </div>
          <div className="p-5 rounded-[24px] bg-foreground/[0.02] border border-border/10 text-center">
            <p className="text-[8px] font-black text-muted-foreground/30 uppercase tracking-widest">iOS/Android</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export const MobileIndex = () => {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 relative">
      <main>
        <HeroMobile />
        <EcosystemMobile />
        <WaitlistMobile />
        <DesktopCTA_Mobile />
      </main>
      <Footer />
      <LandingMobileNav />
    </div>
  );
};