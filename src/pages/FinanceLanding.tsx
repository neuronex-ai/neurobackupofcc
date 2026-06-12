"use client";

import { motion, Variants } from "framer-motion";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/landing/Navbar";
import { LandingMobileNav } from "@/components/landing/LandingMobileNav";
import { Footer } from "@/components/landing/Footer";
import { AsaasRegulatoryFooter } from "@/components/financeiro/AsaasRegulatoryFooter";
import {
    ArrowUpRight,
    Shield,
    Lock,
    Zap,
    BarChart3,
    Receipt,
    CreditCard,
    QrCode,
    Repeat,
    FileText,
    ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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

const FinanceLanding = () => {

    const features = [
        {
            icon: QrCode,
            title: "Cobrança Integrada",
            description: "Gere links de pagamento e PIX direto do prontuário do seu paciente, com envio automático de lembretes.",
        },
        {
            icon: CreditCard,
            title: "Cartão de Crédito",
            description: "Ofereça mais flexibilidade e garanta as sessões do mês com pagamentos à vista ou parcelados.",
        },
        {
            icon: Receipt,
            title: "Recebimento Garantido",
            description: "O paciente paga e o valor cai na sua conta sem confusão de comprovantes por WhatsApp.",
        },
        {
            icon: FileText,
            title: "Nota Fiscal Automática",
            description: "Assim que o pagamento for confirmado, emitimos a NFS-e automaticamente na prefeitura para o CPF do paciente.",
        },
        {
            icon: Repeat,
            title: "Planos Recorrentes",
            description: "Configure uma cobrança mensal para pacientes de longo prazo e esqueça a cobrança manual.",
        },
        {
            icon: BarChart3,
            title: "Visão Clínica e Financeira",
            description: "Os pagamentos conversam com os agendamentos. Saiba exatamente quando a sessão foi paga.",
        },
    ];

    const steps = [
        {
            num: "01",
            title: "Você atende seu paciente",
            description: "Realize sua sessão normalmente através da nossa plataforma ou presencialmente.",
        },
        {
            num: "02",
            title: "Nós enviamos a cobrança",
            description: "Com um clique, o link via PIX ou Cartão vai para o WhatsApp ou e-mail do paciente.",
        },
        {
            num: "03",
            title: "Tudo se resolve sozinho",
            description: "O paciente paga, o recibo é gerado, a NFS-e é emitida e o dinheiro entra na sua conta.",
        },
    ];

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
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-foreground/[0.02] rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-foreground/[0.01] rounded-full blur-[120px]" />
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
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-[pulse_2s_infinite]" />
                        <span className="text-[11px] uppercase tracking-[0.2em] font-medium text-foreground/60">NeuroFinance | Beta</span>
                    </motion.div>

                    <motion.h1
                        variants={fadeInUp}
                        className="text-[2.8rem] sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95] mb-8 text-foreground"
                    >
                        Você atende.
                        <br />
                        Nós cuidamos <span className="text-foreground/20 italic font-serif">da burocracia.</span>
                    </motion.h1>

                    <motion.p
                        variants={fadeInUp}
                        className="text-base md:text-xl text-foreground/50 max-w-2xl mx-auto mb-14 leading-relaxed font-light tracking-tight px-2"
                    >
                        Cobrança enviada, paciente paga, você recebe e a nota fiscal é gerada no automático. Um sistema criado para devolver seu tempo focando no que realmente importa: a clínica.
                    </motion.p>

                    <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                        <Link to="/auth">
                            <Button className="bg-foreground text-background hover:opacity-90 rounded-full px-10 h-16 text-base font-semibold group transition-all duration-500 hover:scale-[1.02] active:scale-95 shadow-premium">
                                Quero acesso antecipado
                                <ArrowUpRight className="w-5 h-5 ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-500" />
                            </Button>
                        </Link>
                        <Link to="/funcionalidades" className="text-foreground/50 hover:text-foreground transition-all duration-500 text-sm font-medium tracking-widest uppercase flex items-center gap-2 group">
                            Como funciona?
                            <div className="w-10 h-[1px] bg-border group-hover:w-16 group-hover:bg-foreground transition-all duration-700" />
                        </Link>
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
            {/* FUNCIONALIDADES */}
            {/* ═══════════════════════════════════════════════════════════ */}
            <section className="relative py-16 md:py-40 px-6">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        className="mb-12 md:mb-24 text-center md:text-left"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeInUp}
                    >
                        <span className="text-[11px] uppercase tracking-[0.2em] text-foreground/30 font-bold mb-4 block">Ciclo completo</span>
                        <h2 className="text-[2.2rem] md:text-7xl font-light tracking-tight leading-[1.1]">
                            O financeiro <span className="text-foreground/30 italic">invisível.</span>
                        </h2>
                    </motion.div>

                    <motion.div
                        className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-50px" }}
                        variants={staggerChildren}
                    >
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                variants={fadeInUp}
                                whileHover={{ y: -5 }}
                                className="group relative overflow-hidden bg-card border border-border/10 rounded-[2rem] p-10 transition-all duration-700 hover:border-foreground/20"
                            >
                                <div className="w-12 h-12 bg-foreground/[0.03] rounded-xl flex items-center justify-center mb-8 border border-border/10 group-hover:bg-foreground group-hover:text-background transition-all duration-700">
                                    <feature.icon className="w-5 h-5" />
                                </div>
                                <h3 className="text-xl font-medium mb-3 tracking-tight text-foreground">{feature.title}</h3>
                                <p className="text-foreground/40 font-light leading-relaxed text-[15px]">{feature.description}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>


            {/* ═══════════════════════════════════════════════════════════ */}
            {/* COMO FUNCIONA */}
            {/* ═══════════════════════════════════════════════════════════ */}
            <section className="relative py-16 md:py-32 px-6 border-y border-border/10">
                <div className="max-w-5xl mx-auto">
                    <motion.div
                        className="mb-16 md:mb-24 text-center"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeInUp}
                    >
                        <span className="text-[11px] uppercase tracking-[0.2em] text-foreground/30 font-bold mb-4 block">Na Prática</span>
                        <h2 className="text-[2.2rem] md:text-6xl font-light tracking-tight leading-[1.1]">
                            1, 2, <span className="text-foreground/30 italic">Resolvido.</span>
                        </h2>
                    </motion.div>

                    <motion.div
                        className="grid md:grid-cols-3 gap-8 md:gap-12"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-50px" }}
                        variants={staggerChildren}
                    >
                        {steps.map((step, index) => (
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
                                {index < steps.length - 1 && (
                                    <div className="hidden md:block absolute top-12 -right-6 w-12 h-[1px] bg-border/30" />
                                )}
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>


            {/* ═══════════════════════════════════════════════════════════ */}
            {/* CTA SECTION */}
            {/* ═══════════════════════════════════════════════════════════ */}
            <section className="relative py-20 md:py-40 px-6">
                <div className="max-w-5xl mx-auto text-center relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-white/[0.015] blur-[150px] rounded-full pointer-events-none" />

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={staggerChildren}
                        className="relative z-10"
                    >
                        <motion.h2
                            variants={fadeInUp}
                            className="text-[2rem] md:text-7xl font-light tracking-tight leading-[0.9] mb-8 md:mb-12"
                        >
                            Saia das dezenas de 
                            <br />
                            <span className="text-foreground/20 italic">planilhas e aplicativos.</span>
                        </motion.h2>
                        <motion.p
                            variants={fadeInUp}
                            className="text-base md:text-xl text-foreground/40 mb-10 md:mb-16 font-light max-w-xl mx-auto px-2"
                        >
                            Com a NeuroNex, você centraliza gestão, agenda e finanças num ecossistema único focado no seu sucesso.
                        </motion.p>
                        <motion.div variants={fadeInUp} className="flex flex-col items-center gap-8">
                            <Link to="/auth">
                                <Button className="bg-foreground text-background hover:opacity-90 rounded-full px-12 h-20 text-xl font-bold group shadow-premium transition-all duration-700 hover:scale-105 active:scale-95">
                                    Participar do Beta
                                    <ArrowUpRight className="w-6 h-6 ml-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-700" />
                                </Button>
                            </Link>

                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* CONTATOS & SUPORTE */}
            {/* ═══════════════════════════════════════════════════════════ */}
            <div className="max-w-5xl mx-auto px-6 mb-8 pt-6">
                <div className="rounded-[2.5rem] bg-foreground text-background p-10 sm:p-12 mb-16 flex flex-col md:flex-row gap-12 md:gap-8 justify-between text-left">
                    {/* NeuroNex Contact */}
                    <div className="flex-1">
                        <h3 className="text-xl sm:text-2xl font-medium mb-4">Dúvidas sobre o sistema?</h3>
                        <p className="text-background/60 mb-6 max-w-sm text-sm sm:text-base leading-relaxed">
                            A equipe NeuroNex está pronta para ajudar com qualquer dúvida sobre o painel de gestão ou automação da sua clínica.
                        </p>
                        <p className="text-lg font-medium">suporte@neuronexai.com.br</p>
                        <p className="text-xs text-background/40 mt-4 leading-relaxed">NeuroNex AI LTDA</p>
                        <p className="text-xs text-background/40">CNPJ: 65.610.762/0001-55</p>
                    </div>

                    <div className="hidden md:block w-px bg-background/10"></div>
                    <div className="block md:hidden h-px w-full bg-background/10"></div>

                    {/* Asaas Contact */}
                    <div className="flex-1">
                        <h3 className="text-xl sm:text-2xl font-medium mb-4">Suporte Financeiro (Asaas)</h3>
                        <p className="text-background/60 mb-6 max-w-md text-sm sm:text-base leading-relaxed">
                            Sempre que utilizar operações financeiras de pagamentos processados pela plataforma, você pode acionar o Asaas para suporte relacionado a essas operações.
                        </p>
                        <div className="bg-background/5 rounded-2xl p-6">
                            <h4 className="text-sm font-semibold mb-4 text-background/80">Canais de suporte Asaas</h4>
                            <ul className="space-y-4 text-sm sm:text-base">
                                <li className="flex items-center gap-3 text-background/90">
                                    <span className="w-1.5 h-1.5 rounded-full bg-background/40 shrink-0"></span>
                                    <span>0800 009 0037 <span className="text-background/50 ml-1 text-sm">(somente Pessoa Jurídica)</span></span>
                                </li>
                                <li className="flex items-center gap-3 text-background/90">
                                    <span className="w-1.5 h-1.5 rounded-full bg-background/40 shrink-0"></span>
                                    <span>0800 009 0037 <span className="text-background/50 ml-1 text-sm">(somente mensagens)</span></span>
                                </li>
                                <li className="flex items-center gap-3 text-background/90">
                                    <span className="w-1.5 h-1.5 rounded-full bg-background/40 shrink-0"></span>
                                    <span>contato@asaas.com.br</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════ */}
                {/* REGULATORY FOOTER E TRANSPARÊNCIA */}
                {/* ═══════════════════════════════════════════════════════════ */}
                <div className="flex flex-col items-center gap-6 text-center max-w-2xl mx-auto">
                    <p className="text-[11px] text-foreground/40 font-medium px-4 leading-relaxed">
                        A NeuroNex é uma plataforma de tecnologia e automação para gestão de clínicas. Não somos uma instituição financeira, tampouco operamos financiamentos ou empréstimos.
                    </p>
                    {/* Security badges */}
                    <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 mt-2 opacity-60">
                        {[
                            { icon: Shield, label: "Compliance Garantido" },
                            { icon: Lock, label: "Contas Individuais" },
                            { icon: Zap, label: "API Oficial" },
                        ].map((badge, i) => (
                            <div key={i} className="flex items-center gap-2 text-[10px] uppercase tracking-[0.1em] font-bold">
                                <badge.icon className="w-3.5 h-3.5" />
                                {badge.label}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="mt-8">
                    <AsaasRegulatoryFooter />
                </div>
            </div>

            {/* Global Footer */}
            <Footer />
        </div>
    );
};

export default FinanceLanding;