"use client";

import { motion, Variants } from "framer-motion";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/landing/Navbar";
import { LandingMobileNav } from "@/components/landing/LandingMobileNav";
import { Footer } from "@/components/landing/Footer";
import {
    ArrowUpRight,
    MessageSquare,
    Mic,
    Sparkles,
    ChevronDown,
    X,
    Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { VoiceSpiral } from "@/components/ai-chat/VoiceSpiral";

// Animation variants
const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 40, filter: "blur(10px)" },
    visible: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] as const }
    },
};

const staggerChildren: Variants = {
    visible: { transition: { staggerChildren: 0.12 } },
};

const faqs = [
    {
        question: "A IA realmente consegue marcar na minha agenda?",
        answer: "Sim. O Synapse AI tem acesso em tempo real à sua agenda da NeuroNex. Ele verifica seus horários livres e confirma agendamentos automaticamente como uma secretária real faria."
    },
    {
        question: "E se o paciente fizer uma pergunta complexa?",
        answer: "O Synapse AI é treinado para o contexto clínico. Se uma pergunta médica for muito complexa, ele saberá agir de forma ética, informando que essas dúvidas serão diretamente tratadas com você na consulta."
    },
    {
        question: "Preciso baixar algum aplicativo?",
        answer: "Não. A inteligência artificial integra-se diretamente na sua página de agendamento ou canais como WhatsApp, respondendo naturalmente as dúvidas de quem te procura."
    },
    {
        question: "O paciente vai saber que é um robô?",
        answer: "Sim, preservamos a transparência. Porém, a experiência é tão próxima da humana, com pausas, respiração nas falas e tom acolhedor, que reduz a frustração dos clássicos chatbots de 'digite 1 ou 2'."
    }
];

const SynapseLanding = () => {

    return (
        <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden relative selection:bg-primary/30">
            {/* Background Texture */}
            <div className="fixed inset-0 pointer-events-none z-[99] opacity-[0.03] mix-blend-overlay">
                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                    <filter id="noise">
                        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
                    </filter>
                    <rect width="100%" height="100%" filter="url(#noise)" />
                </svg>
            </div>

            {/* Background Gradients */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[10%] left-[20%] w-[40%] h-[40%] bg-primary/[0.03] rounded-full blur-[120px]" />
                <div className="absolute bottom-[10%] right-[10%] w-[50%] h-[50%] bg-indigo-500/[0.02] rounded-full blur-[120px]" />
            </div>

            <div className="hidden md:block">
                <Navbar />
            </div>
            <LandingMobileNav />

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* HERO SECTION */}
            {/* ═══════════════════════════════════════════════════════════ */}
            <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 pt-[16vh] md:pt-[20vh] lg:pt-[24vh] pb-24">
                <motion.div
                    className="text-center max-w-5xl mx-auto"
                    initial="hidden"
                    animate="visible"
                    variants={staggerChildren}
                >
                    <motion.div
                        variants={fadeInUp}
                        className="inline-flex items-center gap-2 bg-foreground/[0.03] border border-border/10 rounded-full px-5 py-1.5 mb-10 backdrop-blur-sm"
                    >
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-[pulse_2s_infinite]" />
                        <span className="text-[11px] uppercase tracking-[0.2em] font-medium text-foreground/60">Synapse AI</span>
                    </motion.div>

                    <motion.h1
                        variants={fadeInUp}
                        className="text-[2.8rem] sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95] mb-8 text-foreground"
                    >
                        A secretária que sua 
                        <br />
                        <span className="text-foreground/20 italic font-serif">clínica merece.</span>
                    </motion.h1>

                    <motion.p
                        variants={fadeInUp}
                        className="text-base md:text-xl text-foreground/50 max-w-2xl mx-auto mb-14 leading-relaxed font-light tracking-tight px-2"
                    >
                        Esqueça chatbots engessados. O Synapse AI conversa, atende e agenda pacientes utilizando áudio e texto de altíssima fidelidade. Atendimento 24/7 sem abrir mão da empatia.
                    </motion.p>

                    <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                        <a href="https://app.neuronexai.com.br/auth">
                            <Button className="bg-foreground text-background hover:opacity-90 rounded-full px-10 h-16 text-base font-semibold group transition-all duration-500 hover:scale-[1.02] active:scale-95 shadow-premium">
                                Experimentar Synapse AI
                                <ArrowUpRight className="w-5 h-5 ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-500" />
                            </Button>
                        </a>
                    </motion.div>
                </motion.div>

                <motion.div
                    className="absolute bottom-12 left-1/2 -translate-x-1/2 opacity-20"
                    animate={{ y: [0, 15, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                    <ChevronDown className="w-6 h-6" />
                </motion.div>
            </section>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* O QUE É */}
            {/* ═══════════════════════════════════════════════════════════ */}
            <section className="relative py-16 md:py-32 px-6 border-y border-border/10">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={staggerChildren}
                        >
                            <motion.span variants={fadeInUp} className="text-[11px] uppercase tracking-[0.2em] text-foreground/30 font-bold mb-4 block">
                                O Que é o Synapse AI?
                            </motion.span>
                            <motion.h2 variants={fadeInUp} className="text-[2.2rem] md:text-6xl font-light tracking-tight leading-[1.1] mb-6">
                                IA clínica de<br/>
                                <span className="text-foreground/30 italic">vanguarda.</span>
                            </motion.h2>
                            <motion.p variants={fadeInUp} className="text-foreground/40 font-light leading-relaxed text-lg max-w-lg mb-8">
                                Um agente autônomo projetado para o mercado da saúde. Ele entende a dor do paciente, apresenta o profissional, filtra objeções, encontra um horário livre na agenda e realiza a marcação. Tudo através de interações fluidas por voz e texto.
                            </motion.p>
                            
                            <motion.div variants={fadeInUp} className="flex items-center gap-4 text-sm font-medium">
                                <div className="bg-foreground/[0.03] border border-border/10 px-4 py-2 rounded-full flex items-center gap-2">
                                    <Mic className="w-4 h-4 text-indigo-400" /> Voz humanizada
                                </div>
                                <div className="bg-foreground/[0.03] border border-border/10 px-4 py-2 rounded-full flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-emerald-400" /> Bate-papo contextual
                                </div>
                            </motion.div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, filter: "blur(20px)" }}
                            whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                            viewport={{ once: true }}
                            transition={{ duration: 1 }}
                            className="relative"
                        >
                            <div className="aspect-square md:aspect-[4/3] rounded-[2rem] bg-card border border-border/10 p-8 flex flex-col justify-center items-center shadow-glass relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
                                <div className="w-40 h-40 mb-8 relative flex items-center justify-center">
                                    <VoiceSpiral isListening={true} className="w-full h-full scale-[1.2] opacity-80" />
                                </div>
                                <div className="bg-background/80 backdrop-blur-xl border border-border/30 rounded-2xl p-6 text-center max-w-sm shadow-xl relative z-10">
                                    <p className="text-sm text-foreground/80 font-medium">
                                        "Olá! Vejo que você procura agendar uma consulta presencial. Tenho um horário amanhã às 14:00, fica bom para você?"
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* COMO FUNCIONA */}
            {/* ═══════════════════════════════════════════════════════════ */}
            <section className="relative py-16 md:py-32 px-6">
                <div className="max-w-5xl mx-auto">
                    <motion.div
                        className="mb-16 md:mb-24 text-center"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeInUp}
                    >
                        <span className="text-[11px] uppercase tracking-[0.2em] text-foreground/30 font-bold mb-4 block">Processo</span>
                        <h2 className="text-[2.2rem] md:text-6xl font-light tracking-tight leading-[1.1]">
                            Como <span className="text-foreground/30 italic">funciona?</span>
                        </h2>
                    </motion.div>

                    <motion.div
                        className="grid md:grid-cols-3 gap-8 md:gap-12"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-50px" }}
                        variants={staggerChildren}
                    >
                        {[
                            {
                                num: "01",
                                title: "Configuração rápida",
                                description: "Personalize as regras da sua clínica e a persona do assistente em minutos.",
                            },
                            {
                                num: "02",
                                title: "Atendimento Autônomo",
                                description: "A IA atende o paciente compreendendo nuances de texto e intenções na fala.",
                            },
                            {
                                num: "03",
                                title: "Sessão Agendada",
                                description: "O horário é bloqueado na agenda do NeuroNex automaticamente, finalizando o processo.",
                            }
                        ].map((step, index, arr) => (
                            <motion.div
                                key={index}
                                variants={fadeInUp}
                                className="relative text-center md:text-left"
                            >
                                <div className="text-6xl md:text-8xl font-extralight text-foreground/[0.06] tracking-tighter mb-4 leading-none">
                                    {step.num}
                                </div>
                                <h3 className="text-xl font-semibold mb-3 tracking-tight text-foreground">{step.title}</h3>
                                <p className="text-foreground/40 font-light leading-relaxed">{step.description}</p>
                                {index < arr.length - 1 && (
                                    <div className="hidden md:block absolute top-12 -right-6 w-12 h-[1px] bg-border/30" />
                                )}
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* COMPARATIVO */}
            {/* ═══════════════════════════════════════════════════════════ */}
            <section className="relative py-16 md:py-32 px-6 border-y border-border/10 bg-card/30">
                <div className="max-w-5xl mx-auto">
                    <motion.div
                        className="mb-16 md:mb-24 text-center"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeInUp}
                    >
                        <h2 className="text-[2.2rem] md:text-6xl font-light tracking-tight leading-[1.1]">
                            O padrão vs. <span className="text-foreground/30 italic">NeuroNex</span>
                        </h2>
                    </motion.div>

                    <div className="grid md:grid-cols-2 gap-8 md:gap-12">
                        {/* Outros Sistemas */}
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeInUp}
                            className="bg-background border border-border/20 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden"
                        >
                            <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center mb-8">
                                <X className="w-6 h-6 text-red-500/50" />
                            </div>
                            <h3 className="text-2xl font-medium mb-8 text-foreground/50">Sistemas Inflexíveis</h3>
                            
                            <ul className="space-y-6">
                                {[
                                    "Menus númericos 'Digite 2 para agendar'",
                                    "Fluxos fechados com alta taxa de abandono",
                                    "Sem contexto clínico",
                                    "Sem comunicação por voz"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-4 text-foreground/40 font-light">
                                        <div className="mt-1 shrink-0"><X className="w-4 h-4 opacity-50" /></div>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>

                        {/* NeuroNex Synapse */}
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeInUp}
                            className="bg-card border border-primary/20 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden shadow-glass-premium"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] pointer-events-none rounded-full" />
                            
                            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-8">
                                <Check className="w-6 h-6 text-indigo-400" />
                            </div>
                            <h3 className="text-2xl font-medium mb-8 text-foreground">NeuroNex Synapse</h3>
                            
                            <ul className="space-y-6">
                                {[
                                    "Conversação livre e empática que aumenta conversão",
                                    "Entende objeções de valor e tempo do paciente",
                                    "Integração profunda com histórico NeuroNex",
                                    "Fluidez e alta fidelidade em voz"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-4 text-foreground/80 font-light">
                                        <div className="mt-1 shrink-0"><Sparkles className="w-4 h-4 text-indigo-400" /></div>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* FAQ */}
            {/* ═══════════════════════════════════════════════════════════ */}
            <section className="relative py-20 md:py-40 px-6">
                <div className="max-w-3xl mx-auto">
                    <motion.div
                        className="mb-16 md:mb-20 text-center"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeInUp}
                    >
                        <h2 className="text-[2rem] md:text-5xl font-light tracking-tight leading-[1.1]">
                            Perguntas <span className="text-foreground/30 italic">Frequentes.</span>
                        </h2>
                    </motion.div>

                    <div className="space-y-4">
                        {faqs.map((faq, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1, duration: 0.8 }}
                                className="bg-card/50 border border-border/10 rounded-3xl p-8"
                            >
                                <h3 className="text-lg font-medium mb-3 text-foreground">{faq.question}</h3>
                                <p className="text-foreground/50 font-light leading-relaxed">{faq.answer}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Global Footer */}
            <Footer />
        </div>
    );
};

export default SynapseLanding;
