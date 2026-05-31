"use client";

import {
    Layers,
    Clock,
} from "lucide-react";
import { FadeIn } from "@/components/animations/FadeIn";

const PlatformCard = ({ name, status, delay, logoKey }: { name: string, status: string, delay: number, logoKey: string }) => {
    return (
        <FadeIn
            delay={delay}
            className="flex flex-col items-center gap-8 p-10 rounded-[40px] bg-foreground/[0.02] border border-foreground/[0.05] group/card transition-all duration-700 hover:bg-foreground/[0.04] hover:border-foreground/10 relative overflow-hidden"
        >
            {/* Subtle card glow on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-foreground/[0.05] to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-700" />

            <div className="relative w-20 h-20 flex items-center justify-center z-10">
                {/* Monochromatic Logo (Default) - Refined to preserve details */}
                <img
                    src={`/assets/logos/landing/mono/${logoKey}.png`}
                    alt={`${name} Mono`}
                    className="absolute inset-0 w-full h-full object-contain transition-all duration-700 group-hover/card:opacity-0 group-hover/card:scale-110 grayscale contrast-[1.1] brightness-[0.8] opacity-50 mix-blend-luminosity"
                />
                {/* Colored Logo (Hover) */}
                <img
                    src={`/assets/logos/landing/color/${logoKey}.png`}
                    alt={`${name} Color`}
                    className="absolute inset-0 w-full h-full object-contain transition-all duration-1000 opacity-0 group-hover/card:opacity-100 group-hover/card:scale-110 drop-shadow-[0_10px_40px_rgba(0,0,0,0.6)]"
                />
            </div>
            <div className="space-y-2 text-center relative z-10">
                <h4 className="font-black text-xs uppercase tracking-widest text-foreground/60 group-hover/card:text-foreground transition-colors duration-500">
                    {name}
                </h4>
                <p className="text-[10px] text-muted-foreground/30 font-bold uppercase tracking-tighter group-hover/card:text-foreground/50 transition-colors duration-500">
                    {status}
                </p>
            </div>
        </FadeIn>
    );
};

export const DesktopAppCTA = () => {
    return (
        <section id="downloads" className="relative py-24 md:py-40 px-6 bg-background overflow-hidden">
            {/* Ultra-Premium Textures & Atmospheric Elements */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Deep texture layers */}
                <div className="absolute inset-0 premium-noise opacity-[0.04] mix-blend-overlay" />
                <div className="absolute inset-0 opacity-[0.02] mix-blend-soft-light bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

                {/* Cinematic Blurs */}
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-foreground/[0.03] blur-[180px] rounded-full animate-float-slow" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-foreground/[0.02] blur-[150px] rounded-full animate-pulse-slow" />

                {/* Subtle scanline effect for tech feel */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.05)_50%),linear-gradient(90deg,rgba(255,0,0,0.01),rgba(0,255,0,0.005),rgba(0,0,255,0.01))] bg-[length:100%_2px,3px_100%] pointer-events-none opacity-[0.2]" />
            </div>

            <div className="max-w-[1240px] mx-auto relative z-10 text-center">
                <div className="relative rounded-[64px] overflow-hidden border border-border/40 bg-card/5 backdrop-blur-3xl p-12 md:p-32 flex flex-col items-center text-center shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)]">
                    {/* Inner texture overlay */}
                    <div className="absolute inset-0 premium-noise opacity-[0.02] pointer-events-none" />

                    {/* Badge */}
                    <FadeIn delay={0.1}>
                        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-border/20 bg-foreground/[0.03] backdrop-blur-md mb-12 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/[0.05] to-transparent -translate-x-full group-hover:animate-shimmer" />
                            <Clock className="w-3.5 h-3.5 text-foreground/40" />
                            <span className="text-[10px] uppercase tracking-[0.3em] font-black text-foreground/40">
                                Multiexperiência Nativa
                            </span>
                        </div>
                    </FadeIn>

                    <FadeIn delay={0.2}>
                        <h2 className="text-5xl md:text-8xl font-bold text-foreground tracking-[-0.05em] leading-[0.85] mb-12 max-w-5xl mx-auto">
                            Fluidez Total em <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-b from-foreground via-foreground/90 to-foreground/30">
                                Qualquer Tela.
                            </span>
                        </h2>
                    </FadeIn>

                    <FadeIn delay={0.3}>
                        <p className="text-xl md:text-2xl text-muted-foreground/50 font-medium max-w-2xl mx-auto mb-20 leading-tight tracking-tight">
                            Estamos polindo as versões nativas para entregar a experiência definitiva. Em breve, o NeuroNex estará disponível para download direto em todos os seus dispositivos.
                        </p>
                    </FadeIn>

                    {/* Platforms Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full max-w-5xl mx-auto">
                        <PlatformCard
                            name="Windows"
                            status="Finalizando v1.0"
                            delay={0.4}
                            logoKey="win"
                        />
                        <PlatformCard
                            name="MacOS"
                            status="Em homologação"
                            delay={0.5}
                            logoKey="mac"
                        />
                        <PlatformCard
                            name="App Store"
                            status="Review Apple"
                            delay={0.6}
                            logoKey="apple"
                        />
                        <PlatformCard
                            name="Play Store"
                            status="Build Android"
                            delay={0.7}
                            logoKey="play"
                        />
                    </div>

                    <FadeIn delay={0.8} className="mt-20">
                        <div className="inline-flex items-center gap-4 px-8 py-4 rounded-full border border-foreground/10 bg-foreground text-background shadow-premium group cursor-pointer hover:scale-105 transition-transform duration-500">
                            <Layers className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                            <span className="text-[11px] font-black uppercase tracking-[0.2em]">Sua clínica, no seu bolso.</span>
                        </div>
                    </FadeIn>
                </div>
            </div>
        </section>
    );
};