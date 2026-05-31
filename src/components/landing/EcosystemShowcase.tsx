"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";
import {
  LayoutDashboard, Sparkles, Wallet, Zap, FileText, ArrowRight, Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DashboardVisual,
  AIBrainVisual,
  NeuroFinanceCardVisual,
  ConnectivityOrbVisual,
  PatientsVisual,
  NeuroSystemsVisual,
} from "./Feature3DVisuals";
import { FadeIn } from "@/components/animations/FadeIn";
import { Link } from "react-router-dom";
import { LightBeam } from "@/components/landing/LightBeam";

type ItemType = {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: any;
  color: string;
  bg: string;
  border: string;
  visual: any;
  accent: string;
  link?: string;
};

const items: ItemType[] = [
  {
    id: 1,
    title: "NeuroNex AI",
    subtitle: "Inteligência Clínica",
    description: "Transcreve sessões, gera insights e resume prontuários instantaneamente. Deixe a IA cuidar da burocracia enquanto você foca no paciente.",
    icon: Sparkles,
    color: "text-foreground",
    bg: "bg-foreground/5",
    border: "border-border/30",
    visual: <AIBrainVisual />,
    accent: "from-foreground/10 via-transparent to-transparent",
    link: "/neurofinance"
  },
  {
    id: 2,
    title: "NeuroFinance",
    subtitle: "Gestão Financeira Integrada",
    description: "Gestão financeira integrada com cobranças, pagamentos e previsão de fluxo de caixa em tempo real. Serviços financeiros por Asaas.",
    icon: Wallet,
    color: "text-foreground",
    bg: "bg-foreground/5",
    border: "border-border/30",
    visual: <NeuroFinanceCardVisual />,
    accent: "from-foreground/10 via-transparent to-transparent",
    link: "/synapse"
  },
  {
    id: 3,
    title: "Integrações",
    subtitle: "Conecte Tudo",
    description: "Integração nativa com Ecossistema Google e NeuroFinance. Seu consultório conectado ao que há de melhor, sem intermediários desnecessários.",
    icon: Zap,
    color: "text-foreground",
    bg: "bg-foreground/5",
    border: "border-border/30",
    visual: <ConnectivityOrbVisual />,
    accent: "from-foreground/10 via-transparent to-transparent"
  },
  {
    id: 4,
    title: "Central de Notas",
    subtitle: "NeuroView",
    description: "Visualize conexões neurais entre pacientes e notas em um ambiente imersivo. Uma visão sistêmica completa da evolução clínica.",
    icon: Eye,
    color: "text-foreground",
    bg: "bg-foreground/5",
    border: "border-border/30",
    visual: <NeuroSystemsVisual />,
    accent: "from-foreground/10 via-transparent to-transparent"
  }
];

const secondaryItems = [
  {
    id: 5,
    title: "Torre de Controle",
    subtitle: "Visão Total",
    description: "Centralize agenda, financeiro e alertas em tempo real. Tome decisões baseadas em dados com clareza absoluta.",
    icon: LayoutDashboard,
    visual: <DashboardVisual />,
  },
  {
    id: 6,
    title: "Prontuário Vivo",
    subtitle: "Histórico Fluido",
    description: "Acesse a linha do tempo completa do paciente e evolução com segurança de nível bancário e criptografia de ponta.",
    icon: FileText,
    visual: <PatientsVisual />,
  }
];

const Card = ({ i, progress, range, targetScale, item }: { i: number; progress: MotionValue<number>; range: number[]; targetScale: number; item: ItemType; }) => {
  const container = useRef(null);
  const { scrollYProgress: _scrollYProgress } = useScroll({ target: container, offset: ['start end', 'start start'] });

  const scale = useTransform(progress, range, [1, targetScale]);
  const opacity = useTransform(progress, range, [1, 0.4]);
  const blur = useTransform(progress, range, ["0px", "10px"]);

  return (
    <div ref={container} className="h-screen flex items-center justify-center sticky top-0 px-4 md:px-0 pointer-events-none">
      <motion.div
        style={{
          scale,
          opacity,
          filter: `blur(${blur})`,
          top: `calc(12vh + ${i * 20}px)`,
          willChange: "transform, opacity, filter"
        }}
        className="relative flex flex-col w-full max-w-[1050px] h-[66vh] rounded-[48px] border border-border/40 overflow-hidden bg-card/60 backdrop-blur-[40px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] origin-top group pointer-events-auto gpu-accelerated"
      >
        <div className="brand-neutral-gradient opacity-10" />

        {/* Liquid Glass Edge */}
        <div className="absolute inset-0 border-[0.5px] border-white/20 dark:border-white/10 rounded-[48px] pointer-events-none z-30" />

        <div className="flex flex-col lg:flex-row h-full relative z-10">
          <div className="flex-1 p-10 lg:p-16 flex flex-col justify-center relative">
            <div className="space-y-8">
              <div className="space-y-5">
                <FadeIn delay={0.1}>
                  <div className={cn("inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-[0.3em] bg-foreground/5 backdrop-blur-md text-foreground/50 border-border/30")}>
                    <item.icon className="w-3 h-3" />
                    {item.subtitle}
                  </div>
                </FadeIn>
                <FadeIn delay={0.2}>
                  <h2 className="text-5xl lg:text-6xl font-bold text-foreground tracking-[-0.04em] leading-[0.9]">
                    {item.title}
                  </h2>
                </FadeIn>
              </div>

              <FadeIn delay={0.3}>
                <p className="text-lg text-muted-foreground/80 font-medium leading-relaxed max-w-lg mb-6 tracking-tight">
                  {item.description}
                </p>
              </FadeIn>
            </div>

            <FadeIn delay={0.4} className="mt-10">
              <motion.div
                whileHover={{ x: 5 }}
                className="inline-flex items-center gap-4 cursor-pointer"
              >
                <Link to={item.link || "/auth"} className="h-14 px-8 rounded-full border border-border/20 bg-foreground/5 hover:bg-foreground hover:text-background transition-all duration-500 flex items-center gap-4 active:scale-95 shadow-sm">
                  <span className="text-[11px] font-black uppercase tracking-[0.25em]">Acesse o Módulo</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </FadeIn>
          </div>

          {/* REDESIGNED VISUAL CONTAINER */}
          <div className="flex-1 relative overflow-hidden bg-foreground/[0.01] border-t lg:border-t-0 lg:border-l border-border/30">
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
                className={cn(
                  "w-full h-full flex items-center justify-center",
                  item.title === "Central de Notas" ? "p-0" : "p-12 lg:p-16"
                )}
              >
                <div className="relative w-full h-full flex items-center justify-center">
                  {/* Minimal depth cues */}
                  <div className="absolute inset-0 bg-radial-gradient from-foreground/[0.02] to-transparent rounded-full opacity-40 blur-3xl scale-75" />
                  <div className="relative z-10 w-full h-full flex items-center justify-center transition-transform duration-1000">
                    {item.visual}
                  </div>
                </div>
              </motion.div>
            </div>
            {/* Liquid Glass Overlay Effect */}
            <div className="absolute inset-0 pointer-events-none z-20 shadow-[inset_0_0_100px_rgba(0,0,0,0.02)]" />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export const EcosystemShowcase = () => {
  const container = useRef(null);
  const { scrollYProgress } = useScroll({ target: container, offset: ['start start', 'end end'] });

  return (
    <section ref={container} id="ecosystem" className="relative bg-background pt-32 pb-48 overflow-hidden">
      {/* Monochromatic Beams */}
      <div className="absolute inset-x-0 top-0 h-full pointer-events-none overflow-hidden z-0 opacity-10">
        <LightBeam className="left-[10%] opacity-20" color="var(--foreground)" delay="0.5s" />
        <LightBeam className="left-[90%] opacity-20" color="var(--foreground)" delay="2.5s" />
      </div>

      <div className="max-w-[1400px] mx-auto px-6 mb-40 relative z-10 text-center">
        <FadeIn>
          <h2 className="text-5xl md:text-8xl font-bold tracking-[-0.05em] leading-[0.85] text-foreground mb-10">
            A Psicologia <br />
            <span className="text-muted-foreground/30">não aceita barreiras.</span>
          </h2>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p className="text-xl md:text-2xl text-muted-foreground/60 font-medium max-w-4xl mx-auto leading-tight tracking-tight">
            O Ecossistema NeuroNex redefine a prática clínica. <br className="hidden md:block" />
            <span className="text-foreground/80 font-black">Design invisível, impacto sistêmico.</span>
          </p>
        </FadeIn>
      </div>

      {/* Stacked Cards Container */}
      <div className="relative z-10 mb-40">
        {items.map((item, i) => {
          const targetScale = 1 - ((items.length - i) * 0.035);
          return (
            <Card
              key={item.id}
              i={i}
              item={item}
              progress={scrollYProgress}
              range={[i * 0.22, 1]}
              targetScale={targetScale}
            />
          );
        })}
      </div>

      {/* Secondary Features Grid */}
      <div className="max-w-[1240px] mx-auto px-6 grid md:grid-cols-2 gap-8 relative z-10">
        {secondaryItems.map((item, i) => (
          <FadeIn key={item.id} delay={i * 0.1}>
            <div className="group relative min-h-[500px] md:h-[580px] rounded-[48px] bg-card/40 backdrop-blur-3xl border border-border/30 overflow-hidden flex flex-col p-10 lg:p-14 transition-all duration-700 hover:border-foreground/20 shadow-premium gpu-accelerated">
              <div className="brand-neutral-gradient opacity-10" />
              {/* Liquid Border */}
              <div className="absolute inset-0 border-[0.5px] border-white/10 dark:border-white/5 rounded-[48px] pointer-events-none z-30" />

              <div className="mb-10 space-y-5 relative z-10 mt-2">
                <div className={cn("inline-flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-foreground/[0.03] border border-border/20 text-foreground/40")}>
                  <item.icon className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-[0.25em]">{item.subtitle}</span>
                </div>
                <h3 className="text-3xl lg:text-4xl font-bold text-foreground tracking-[-0.03em]">{item.title}</h3>
                <p className="text-lg text-muted-foreground/70 font-medium leading-relaxed max-w-sm tracking-tight">
                  {item.description}
                </p>
              </div>

              <div className="flex-1 relative flex items-center justify-center -mb-24 scale-95 group-hover:scale-100 transition-transform duration-1000 ease-out">
                {item.visual}
              </div>
            </div>
          </FadeIn>
        ))}
      </div>

      <div className="flex justify-center mt-40 relative z-10">
        <FadeIn delay={0.3}>
          <Link to="/auth" className="group">
            <div className="relative h-18 px-14 py-5 rounded-full border border-border/20 bg-card/50 hover:bg-foreground hover:text-background transition-all duration-700 flex items-center gap-6 shadow-premium backdrop-blur-3xl active:scale-95">
              <span className="text-[12px] font-black uppercase tracking-[0.4em] mb-px">Ecossistema Completo</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-3 transition-transform duration-700" />
            </div>
          </Link>
        </FadeIn>
      </div>
    </section>
  );
};