"use client";

import { useState } from "react";
import { Sparkles, Star, ArrowRight, Zap, Heart } from "lucide-react";
import { FadeIn } from "@/components/animations/FadeIn";
import { Button } from "@/components/ui/button";
import { WaitlistModal } from "./WaitlistModal";

export const WaitlistSection = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <section id="waitlist" className="py-24 md:py-40 px-6 relative overflow-hidden bg-background">
            {/* Ultra-Premium Textures & Layers */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Granular Texture Layers */}
                <div className="absolute inset-0 premium-noise opacity-[0.04] mix-blend-overlay" />
                <div className="absolute inset-0 opacity-[0.02] mix-blend-soft-light bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

                {/* Cinematic Light Pools */}
                <div className="absolute top-[10%] left-[15%] w-[800px] h-[600px] bg-foreground/[0.04] blur-[180px] rounded-full animate-float-slow mix-blend-soft-light" />
                <div className="absolute bottom-[10%] right-[15%] w-[600px] h-[500px] bg-foreground/[0.03] blur-[150px] rounded-full animate-pulse-slow mix-blend-soft-light" />

                {/* Gradient Depth */}
                <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
            </div>

            <div className="max-w-[1240px] mx-auto relative z-10">
                <div className="flex flex-col items-center justify-center text-center">
                    {/* Badge */}
                    <FadeIn delay={0.1}>
                        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-border/20 bg-foreground/[0.03] backdrop-blur-md mb-10 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/[0.05] to-transparent -translate-x-full group-hover:animate-shimmer" />
                            <Sparkles className="w-3.5 h-3.5 text-foreground/40" />
                            <span className="text-[10px] uppercase tracking-[0.25em] font-black text-foreground/40">
                                Lançamento Exclusivo 2026
                            </span>
                        </div>
                    </FadeIn>

                    <FadeIn delay={0.2}>
                        <h2 className="text-5xl md:text-8xl font-bold tracking-[-0.05em] leading-[0.85] mb-12">
                            A Nova Era da <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-b from-foreground via-foreground/90 to-foreground/30">
                                Neuropsicologia.
                            </span>
                        </h2>
                    </FadeIn>

                    <FadeIn delay={0.3}>
                        <p className="text-xl md:text-2xl text-muted-foreground/50 font-medium max-w-3xl mx-auto mb-16 leading-tight tracking-tight">
                            Estamos refinando a experiência final. As vagas para os <span className="text-foreground">Primeiros Parceiros</span> são limitadas e garantem benefícios vitalícios na plataforma.
                        </p>
                    </FadeIn>

                    <FadeIn delay={0.4}>
                        <div className="flex flex-col items-center gap-8">
                            <Button
                                onClick={() => setIsModalOpen(true)}
                                className="group relative h-20 px-12 rounded-full bg-foreground text-background hover:bg-foreground/90 transition-all duration-700 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] hover:-translate-y-1 active:scale-95 text-base font-black uppercase tracking-[0.25em]"
                            >
                                <span className="relative z-10 flex items-center gap-4">
                                    Entrar na Lista de Espera
                                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                                </span>
                                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                <div className="absolute inset-0 rounded-full border border-white/10 pointer-events-none" />
                            </Button>

                            {/* Trust Elements with Refined Textures */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-8 md:mt-24">
                                <div className="flex flex-col items-center gap-6 group">
                                    <div className="w-16 h-16 rounded-[24px] bg-foreground/[0.03] border border-border/10 flex items-center justify-center transition-all duration-500 group-hover:bg-foreground group-hover:text-background border-t-white/10 shadow-premium group-hover:scale-110">
                                        <Star className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-foreground/80">Selo Fundador</h4>
                                        <p className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-tighter max-w-[180px] leading-relaxed">Badge exclusivo de Primeiros Parceiros no perfil.</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center gap-6 group">
                                    <div className="w-16 h-16 rounded-[24px] bg-foreground/[0.03] border border-border/10 flex items-center justify-center transition-all duration-500 group-hover:bg-foreground group-hover:text-background border-t-white/10 shadow-premium group-hover:scale-110">
                                        <Zap className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-foreground/80">Acesso Beta</h4>
                                        <p className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-tighter max-w-[180px] leading-relaxed">Privilégio de testar novas IAs antes do mercado.</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center gap-6 group">
                                    <div className="w-16 h-16 rounded-[24px] bg-foreground/[0.03] border border-border/10 flex items-center justify-center transition-all duration-500 group-hover:bg-foreground group-hover:text-background border-t-white/10 shadow-premium group-hover:scale-110">
                                        <Heart className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-foreground/80">Condições Alpha</h4>
                                        <p className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-tighter max-w-[180px] leading-relaxed">Descontos permanentes em todos os módulos futuros.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </div>

            <WaitlistModal open={isModalOpen} onOpenChange={setIsModalOpen} />
        </section>
    );
};