import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";
import { FadeIn } from "@/components/animations/FadeIn";
import { TextReveal } from "@/components/animations/TextReveal";

export const VideoHero = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "center center"]
    });

    // Mantém a mesma entrada do vídeo, mas suaviza a interpolação para evitar stutter no scroll.
    const scaleRaw = useTransform(scrollYProgress, [0.18, 1], [0.92, 1]);
    const opacityRaw = useTransform(scrollYProgress, [0.16, 0.72], [0, 1]);
    const rotateXRaw = useTransform(scrollYProgress, [0.18, 1], [8, 0]);
    const shineXRaw = useTransform(scrollYProgress, [0, 1], ["-100%", "200%"]);

    const scale = useSpring(scaleRaw, { stiffness: 110, damping: 28, mass: 0.35 });
    const opacity = useSpring(opacityRaw, { stiffness: 120, damping: 30, mass: 0.35 });
    const rotateX = useSpring(rotateXRaw, { stiffness: 110, damping: 28, mass: 0.35 });
    const shineX = useSpring(shineXRaw, { stiffness: 90, damping: 26, mass: 0.4 });

    return (
        <section ref={containerRef} className="flex w-full flex-col items-center justify-center overflow-hidden px-4 py-20 md:py-24">
            <div className="container mb-10 max-w-6xl text-center md:mb-12">
                <FadeIn delay={0.2}>
                    <span className="mb-4 block text-[10px] font-black uppercase tracking-[0.4em] text-primary">Manifesto</span>
                </FadeIn>
                
                <div className="mb-6">
                    <TextReveal 
                        stagger={0.05} 
                        className="text-3xl font-bold leading-tight tracking-tight text-foreground md:text-5xl"
                    >
                        A Nova Fronteira do Cuidado.
                    </TextReveal>
                </div>

                <FadeIn delay={0.6}>
                    <p className="mx-auto max-w-2xl text-base font-medium leading-relaxed text-muted-foreground/70 md:text-lg">
                        Assista e descubra como a simbiose entre inteligência artificial e neurociência 
                        está redefinindo o padrão de excelência para psicólogos de elite.
                    </p>
                </FadeIn>
            </div>

            <div className="mx-auto mb-6 w-full max-w-6xl perspective-[2000px] md:mb-10">
                <motion.div
                    style={{
                        scale,
                        opacity,
                        rotateX,
                        transformStyle: "preserve-3d",
                        willChange: "transform, opacity",
                    }}
                    className="relative transform-gpu group"
                >
                    {/* Borda Liquid Glass com Brilho Dinâmico */}
                    <div className="absolute -inset-[1px] overflow-hidden rounded-[2rem] bg-gradient-to-tr from-primary/30 via-primary/5 to-primary/30 opacity-35 blur-[0.5px] md:rounded-[2.5rem]">
                         <motion.div 
                            style={{ x: shineX, willChange: "transform" }}
                            className="absolute inset-0 h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                         />
                    </div>
                    
                    <div className="relative aspect-video overflow-hidden rounded-[2rem] border border-white/10 bg-black/40 shadow-[0_34px_90px_-34px_rgba(0,0,0,0.6)] md:rounded-[2.5rem]">
                        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-br from-white/5 via-transparent to-transparent" />
                        
                        <iframe
                            src="https://www.youtube.com/embed/vk6cw0bkut8?autoplay=0&controls=1&rel=0&modestbranding=1&showinfo=0&mute=0"
                            title="NeuroNex Presentation"
                            className="h-full w-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                        />
                    </div>

                    <motion.div 
                        style={{ opacity }}
                        className="absolute -inset-8 -z-10 rounded-full bg-primary/5 blur-[90px]" 
                    />
                </motion.div>
            </div>
        </section>
    );
};
