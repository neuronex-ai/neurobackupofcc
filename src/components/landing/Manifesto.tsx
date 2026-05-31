import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Shield, BrainCircuit, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

const VisionGlassCard = ({ children, className, hoverEffect = true }: { children: React.ReactNode, className?: string, hoverEffect?: boolean }) => (
    <div className={cn(
        "relative overflow-hidden rounded-[32px] border border-white/[0.08] bg-[#0A0A0B]/40 backdrop-blur-2xl shadow-2xl transition-all duration-500",
        hoverEffect && "hover:bg-[#0A0A0B]/60 hover:border-white/[0.12] hover:shadow-[0_20px_80px_-20px_rgba(139,92,246,0.15)]",
        className
    )}>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-overlay pointer-events-none" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />
        {children}
    </div>
);

export const Manifesto = () => {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
    const opacity = useTransform(scrollYProgress, [0.2, 0.5, 0.8], [0, 1, 0]);
    const y = useTransform(scrollYProgress, [0.1, 0.6], [100, -100]);

    return (
        <section ref={ref} id="vision" className="py-48 px-6 flex justify-center relative z-20 bg-[#020204]">
            <motion.div style={{ opacity, y }} className="max-w-5xl text-center space-y-12">
                <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.02] backdrop-blur-md shadow-inner">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <p className="text-[10px] font-bold text-white/60 uppercase tracking-[0.3em]">Manifesto</p>
                </div>
                
                <h2 className="text-4xl md:text-6xl lg:text-7xl font-medium text-white leading-[1.1] tracking-tighter">
                    A psicologia moderna não cabe em planilhas. <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-b from-primary to-white/40">
                        O sistema operacional da mente.
                    </span>
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 text-left">
                    {[
                        { title: "Privacidade Absoluta", icon: Shield, desc: "Criptografia de ponta a ponta, excedendo LGPD e HIPAA." },
                        { title: "Inteligência Auxiliar", icon: BrainCircuit, desc: "Potencializamos sua análise com ferramentas de IA, sem substituir." },
                        { title: "Design Invisível", icon: LayoutDashboard, desc: "Menos cliques, menos burocracia, foco total no paciente." }
                    ].map((item, i) => (
                        <VisionGlassCard key={i} className="p-8">
                            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center mb-6">
                                <item.icon className="w-6 h-6 text-white/60" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                        </VisionGlassCard>
                    ))}
                </div>
            </motion.div>
        </section>
    );
};