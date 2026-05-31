import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { FadeIn } from "@/components/animations/FadeIn";
import { TextReveal } from "@/components/animations/TextReveal";

export const VideoHero = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "center center"]
    });

    // Efeito de emergência do vídeo
    const scale = useTransform(scrollYProgress, [0.3, 1], [0.9, 1]);
    const opacity = useTransform(scrollYProgress, [0.3, 0.8], [0, 1]);
    const rotateX = useTransform(scrollYProgress, [0.3, 1], [10, 0]);
    
    // Brilho que corre pela borda (Tópico 3: Reflexos Dinâmicos)
    const shineX = useTransform(scrollYProgress, [0, 1], ["-100%", "200%"]);

    const logos = [
        { name: "MedTech", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg" },
        { name: "HealthAI", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original-wordmark.svg" },
        { name: "NeuroData", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/apple/apple-original.svg" },
        { name: "ClinicOS", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/microsoft/microsoft-original.svg" },
        { name: "PsychCloud", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/digitalocean/digitalocean-original.svg" }
    ];

    return (
        <section ref={containerRef} className="w-full py-24 md:py-32 flex flex-col items-center justify-center overflow-hidden">
            <div className="container max-w-6xl px-4 mb-16 text-center">
                <FadeIn delay={0.2}>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-4 block">Manifesto</span>
                </FadeIn>
                
                <div className="mb-6">
                    <TextReveal 
                        stagger={0.05} 
                        className="text-3xl md:text-5xl font-bold tracking-tight text-foreground leading-tight"
                    >
                        A Nova Fronteira do Cuidado.
                    </TextReveal>
                </div>

                <FadeIn delay={0.6}>
                    <p className="text-base md:text-lg text-muted-foreground/70 max-w-2xl mx-auto leading-relaxed font-medium">
                        Assista e descubra como a simbiose entre inteligência artificial e neurociência 
                        está redefinindo o padrão de excelência para psicólogos de elite.
                    </p>
                </FadeIn>
            </div>

            <div className="w-full max-w-6xl mx-auto px-4 perspective-[2000px] mb-20">
                <motion.div
                    style={{
                        scale,
                        opacity,
                        rotateX,
                    }}
                    className="relative group"
                >
                    {/* Borda Liquid Glass com Brilho Dinâmico */}
                    <div className="absolute -inset-[1px] bg-gradient-to-tr from-primary/30 via-primary/5 to-primary/30 rounded-[2.5rem] blur-[0.5px] opacity-40 overflow-hidden">
                         <motion.div 
                            style={{ x: shineX }}
                            className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                         />
                    </div>
                    
                    <div className="relative rounded-[2.5rem] overflow-hidden bg-black/40 backdrop-blur-3xl border border-white/10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] aspect-video">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none z-10" />
                        
                        <iframe
                            src="https://www.youtube.com/embed/vk6cw0bkut8?autoplay=0&controls=1&rel=0&modestbranding=1&showinfo=0&mute=0"
                            title="NeuroNex Presentation"
                            className="w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                        />
                    </div>

                    <motion.div 
                        style={{ opacity: scrollYProgress }}
                        className="absolute -inset-10 bg-primary/5 blur-[120px] -z-10 rounded-full" 
                    />
                </motion.div>
            </div>

            {/* Tópico 5: Seção de Marcas/Trust */}
            <FadeIn delay={1} className="w-full max-w-4xl px-4 mt-8 opacity-30 grayscale hover:opacity-100 transition-all duration-700">
                <div className="flex flex-wrap items-center justify-center gap-12 md:gap-20">
                    {logos.map((logo, i) => (
                        <div key={i} className="flex items-center gap-2 group cursor-default">
                             <img src={logo.icon} alt={logo.name} className="h-6 w-auto opacity-50 group-hover:opacity-100 transition-opacity" />
                             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 group-hover:text-foreground transition-colors">{logo.name}</span>
                        </div>
                    ))}
                </div>
            </FadeIn>
        </section>
    );
};
