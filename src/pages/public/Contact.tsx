import { useState } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Starfield } from "@/components/ui/starfield";
import { FadeIn } from "@/components/animations/FadeIn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, Phone, Send, MessageSquare, CheckCircle2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const ContactInfo = ({ icon: Icon, label, value, delay }: any) => (
    <FadeIn delay={delay}>
        <div className="flex items-start gap-6 group cursor-default">
            <div className="w-14 h-14 rounded-2xl bg-foreground/[0.03] border border-border/30 backdrop-blur-xl flex items-center justify-center text-foreground/40 group-hover:text-foreground group-hover:border-foreground/20 group-hover:scale-110 transition-all duration-700 shadow-premium">
                <Icon className="w-6 h-6 transition-colors" />
            </div>
            <div className="pt-1.5">
                <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] mb-1.5">{label}</p>
                <p className="text-lg text-foreground font-bold tracking-tight group-hover:text-foreground/80 transition-colors">{value}</p>
            </div>
        </div>
    </FadeIn>
);

const Contact = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsSubmitting(false);
        setIsSent(true);
        toast.success("Mensagem interceptada com sucesso!");
    };

    return (
        <div className="min-h-screen bg-background text-foreground relative overflow-x-hidden font-sans selection:bg-primary/10">
            <Navbar />
            <div className="fixed inset-0 pointer-events-none opacity-40 dark:opacity-20">
                <Starfield />
            </div>

            <main className="pt-64 pb-32 px-6 relative z-10">
                <div className="premium-noise opacity-[0.01]" />
                {/* Monochromatic Beams */}
                <div className="fixed top-[-10%] left-[-10%] w-[900px] h-[700px] bg-foreground/[0.03] rounded-full blur-[180px] pointer-events-none z-0 mix-blend-overlay" />
                <div className="fixed bottom-[-10%] right-[-10%] w-[900px] h-[700px] bg-foreground/[0.02] rounded-full blur-[180px] pointer-events-none z-0" />

                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-32 lg:gap-48 items-start">

                    {/* Left Column: Info */}
                    <div className="space-y-24 order-2 lg:order-1 relative z-10">
                        <div className="space-y-12">
                            <FadeIn>
                                <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full border border-border/40 bg-foreground/[0.03] text-foreground/40 uppercase tracking-[0.4em] text-[11px] font-black backdrop-blur-2xl shadow-premium">
                                    <MessageSquare className="w-4 h-4 text-foreground/50" />
                                    Canais Operativos
                                </div>
                            </FadeIn>

                            <FadeIn delay={0.1}>
                                <h1 className="text-7xl md:text-8xl lg:text-9xl font-bold tracking-[-0.06em] text-foreground leading-[0.8] select-none">
                                    Conecte <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-b from-foreground via-foreground/60 to-transparent italic pr-4">
                                        seu NeuroNex.
                                    </span>
                                </h1>
                            </FadeIn>

                            <FadeIn delay={0.2}>
                                <p className="text-xl md:text-2xl text-muted-foreground/50 font-medium leading-relaxed tracking-tight max-w-xl">
                                    A evolução clínica começa com um diálogo sério. Nossa engenharia de suporte está pronta para dimensionar sua infraestrutura.
                                </p>
                            </FadeIn>
                        </div>

                        <div className="space-y-12 pl-4 border-l border-border/20">
                            <ContactInfo icon={Mail} label="E-mail" value="suporte@neuronexai.com.br" delay={0.3} />
                            <ContactInfo icon={Phone} label="Telefone" value="(41) 9788-0145" delay={0.4} />
                            <ContactInfo icon={MapPin} label="Escritório" value="R. Pais Leme, 215, Conj 1713 • Pinheiros • São Paulo / SP" delay={0.5} />
                        </div>

                        {/* Monochromatic Abstract Grid Visual */}
                        <FadeIn delay={0.6}>
                            <div className="h-72 rounded-[56px] border border-border/30 bg-card/40 backdrop-blur-3xl overflow-hidden relative group shadow-premium gpu-accelerated transition-all duration-1000 hover:border-foreground/30">
                                <div className="premium-noise opacity-[0.03]" />
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-foreground/[0.03] via-transparent to-transparent opacity-50" />

                                {/* Digital Pulse Map Integration */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-full h-full opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
                                    <motion.div
                                        className="absolute w-[200px] h-[200px] bg-foreground/[0.02] border border-foreground/5 rounded-full"
                                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
                                        transition={{ duration: 4, repeat: Infinity }}
                                    />
                                    <motion.div
                                        className="absolute w-3 h-3 bg-foreground rounded-full shadow-[0_0_40px_rgba(255,255,255,0.5)]"
                                        animate={{ opacity: [0.4, 1, 0.4] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    />
                                </div>

                                <div className="absolute bottom-10 left-12 z-10 space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">Escritório NeuroNex AI</p>
                                    <p className="text-xl font-bold text-foreground tracking-tighter">São Paulo, SP - Brasil</p>
                                </div>
                            </div>
                        </FadeIn>
                    </div>

                    {/* Right Column: Form */}
                    <div className="order-1 lg:order-2 relative z-20 top-[-20px] lg:top-[-40px]">
                        <FadeIn delay={0.3} direction="up" distance={60}>
                            <div className="relative p-[1px] rounded-[64px] bg-gradient-to-b from-white/20 via-border/40 to-transparent group transition-all duration-1000 hover:shadow-[0_80px_160px_-40px_rgba(0,0,0,0.4)]">
                                <div className="bg-zinc-950/80 backdrop-blur-[60px] rounded-[63px] p-12 md:p-16 border border-white/5 relative overflow-hidden shadow-2xl">
                                    <div className="premium-noise opacity-[0.04]" />

                                    <AnimatePresence mode="wait">
                                        {isSent ? (
                                            <motion.div
                                                key="success"
                                                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                className="py-20 text-center flex flex-col items-center justify-center min-h-[550px]"
                                            >
                                                <div className="relative w-32 h-32 mb-12">
                                                    <motion.div
                                                        animate={{ scale: [1, 1.1, 1], rotate: 360 }}
                                                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                                                        className="absolute inset-0 border border-foreground/10 rounded-full border-dashed"
                                                    />
                                                    <div className="absolute inset-4 rounded-full bg-foreground/[0.03] border border-border/40 flex items-center justify-center text-foreground/80 shadow-2xl">
                                                        <CheckCircle2 className="w-10 h-10" />
                                                    </div>
                                                </div>
                                                <h3 className="text-5xl font-bold text-white mb-6 tracking-tight">Sinal Recebido</h3>
                                                <p className="text-xl text-zinc-500 font-medium max-w-xs mx-auto tracking-tight mb-16 leading-relaxed">
                                                    Sua solicitação está sendo processada pela arquitetura de suporte.
                                                </p>
                                                <Button
                                                    variant="outline"
                                                    className="h-16 px-12 rounded-full border-white/10 hover:bg-white/5 text-[11px] font-black uppercase tracking-[0.4em] transition-all hover:scale-105 active:scale-95"
                                                    onClick={() => setIsSent(false)}
                                                >
                                                    Nova Transmissão
                                                </Button>
                                            </motion.div>
                                        ) : (
                                            <form onSubmit={handleSubmit} className="space-y-12">
                                                <div className="space-y-5">
                                                    <h3 className="text-4xl font-bold text-white tracking-tighter">Entrada de Sinal</h3>
                                                    <p className="text-xl text-zinc-500 font-medium tracking-tight">Vincule sua prática ao ecossistema global.</p>
                                                </div>

                                                <div className="grid grid-cols-2 gap-10">
                                                    <div className="space-y-4">
                                                        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 ml-2">Cognome</label>
                                                        <Input placeholder="Primeiro Nome" className="bg-white/[0.02] border-border/20 h-16 rounded-2xl focus-visible:ring-white/10 text-white font-medium transition-all px-6 hover:bg-white/[0.04]" required />
                                                    </div>
                                                    <div className="space-y-4">
                                                        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 ml-2">Suplemento</label>
                                                        <Input placeholder="Sobrenome" className="bg-white/[0.02] border-border/20 h-16 rounded-2xl focus-visible:ring-white/10 text-white font-medium transition-all px-6 hover:bg-white/[0.04]" />
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 ml-2">Ponto de Contato</label>
                                                    <Input type="email" placeholder="nome@corporativo.com" className="bg-white/[0.02] border-border/20 h-16 rounded-2xl focus-visible:ring-white/10 text-white font-medium transition-all px-6 hover:bg-white/[0.04]" required />
                                                </div>

                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 ml-2">Contexto Clínico</label>
                                                    <Textarea
                                                        placeholder="Descreva as necessidades da sua operação..."
                                                        className="bg-white/[0.02] border-border/20 min-h-[180px] rounded-[32px] focus-visible:ring-white/10 text-white font-medium resize-none p-8 transition-all hover:bg-white/[0.04]"
                                                        required
                                                    />
                                                </div>

                                                <div className="pt-6">
                                                    <Button
                                                        type="submit"
                                                        disabled={isSubmitting}
                                                        className="w-full h-20 rounded-[32px] bg-white text-black hover:bg-zinc-200 font-black text-xs uppercase tracking-[0.4em] shadow-[0_20px_40px_-10px_rgba(255,255,255,0.2)] transition-all hover:scale-[1.02] active:scale-95 group"
                                                    >
                                                        {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : <span className="flex items-center gap-4 text-sm">Transmitir Pulso <Send className="w-5 h-5 group-hover:translate-x-3 group-hover:-translate-y-2 transition-transform duration-700" /></span>}
                                                    </Button>
                                                </div>

                                                <div className="flex items-center justify-center gap-4 text-zinc-700">
                                                    <div className="h-px flex-1 bg-zinc-900" />
                                                    <span className="text-[9px] font-black uppercase tracking-[0.5em]">NeuroNex Protected</span>
                                                    <div className="h-px flex-1 bg-zinc-900" />
                                                </div>
                                            </form>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Contact;