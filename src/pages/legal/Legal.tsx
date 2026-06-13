import { useEffect, useState } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Starfield } from "@/components/ui/starfield";
import { FadeIn } from "@/components/animations/FadeIn";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Scale, Mail, Lock, Cookie, Database, Globe, CheckCircle2, ChevronRight, Info } from "lucide-react";
import { useLocation } from "react-router-dom";

const LegalPage = () => {
    const { hash } = useLocation();
    const [activeSection, setActiveSection] = useState<string>("privacy");

    useEffect(() => {
        if (hash) {
            const sectionId = hash.replace('#', '');
            setActiveSection(sectionId);
            const element = document.querySelector(hash);
            if (element) {
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            }
        }
    }, [hash]);

    const sections = [
        { id: "privacy", label: "Privacidade", icon: ShieldCheck },
        { id: "terms", label: "Termos", icon: Scale },
        { id: "data", label: "Dados", icon: Database },
        { id: "cookies", label: "Cookies", icon: Cookie },
        { id: "contact", label: "Contato", icon: Mail },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground relative overflow-x-hidden font-sans selection:bg-foreground/10">
            <Navbar />

            <div className="fixed inset-0 pointer-events-none opacity-20 dark:opacity-10">
                <Starfield />
            </div>

            {/* --- Hero --- */}
            <section className="relative pt-44 pb-20 px-6 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,rgba(0,0,0,0.03),transparent)] dark:bg-[radial-gradient(circle_at_50%_-20%,rgba(255,255,255,0.03),transparent)] pointer-events-none" />

                <div className="max-w-4xl mx-auto text-center relative z-10 space-y-10">
                    <FadeIn>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-foreground/5 bg-foreground/[0.02] text-foreground/40 uppercase tracking-[0.2em] text-[10px] font-semibold backdrop-blur-sm">
                            <Lock className="w-3 h-3" />
                            Security & Compliance
                        </div>
                    </FadeIn>

                    <FadeIn delay={0.1}>
                        <h1 className="text-6xl md:text-8xl font-medium tracking-tight text-foreground leading-[1] select-none">
                            Legal.
                        </h1>
                    </FadeIn>

                    <FadeIn delay={0.2}>
                        <p className="text-lg md:text-xl text-foreground/50 font-normal max-w-2xl mx-auto leading-relaxed">
                            Transparência total em conformidade com as diretrizes do Google e LGPD. <br />
                            <span className="text-foreground/30 text-sm mt-4 block font-medium">Última atualização: 07 de Fevereiro de 2026</span>
                        </p>
                    </FadeIn>

                    {/* Navigation Pills - Apple Style */}
                    <FadeIn delay={0.3}>
                        <div className="flex flex-wrap justify-center gap-3 pt-4">
                            {sections.map((section) => (
                                <a
                                    key={section.id}
                                    href={`#${section.id}`}
                                    onClick={() => setActiveSection(section.id)}
                                    className={`group inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-500 border ${activeSection === section.id
                                        ? "bg-foreground text-background border-foreground shadow-[0_10px_30px_-10px_rgba(0,0,0,0.2)] dark:shadow-[0_10px_30px_-10px_rgba(255,255,255,0.1)] scale-105"
                                        : "bg-transparent text-foreground/60 border-foreground/10 hover:border-foreground/30 hover:text-foreground"
                                        }`}
                                >
                                    <section.icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                                    {section.label}
                                </a>
                            ))}
                        </div>
                    </FadeIn>
                </div>
            </section>

            <div className="max-w-4xl mx-auto px-6 pb-40 relative z-10 space-y-40">

                {/* ============================================= */}
                {/* SECTION: PRIVACY POLICY */}
                {/* ============================================= */}
                <section id="privacy" className="scroll-mt-32">
                    <FadeIn>
                        <div className="space-y-16">
                            <div className="flex flex-col gap-8">
                                <div className="space-y-6">
                                    <div className="w-16 h-16 rounded-[22%] bg-foreground text-background flex items-center justify-center shadow-2xl">
                                        <ShieldCheck className="h-8 w-8" strokeWidth={1.5} />
                                    </div>
                                    <h2 className="text-4xl md:text-6xl font-medium text-foreground tracking-tight leading-tight">
                                        Política de <br /> Privacidade.
                                    </h2>
                                    <p className="text-xl text-foreground/40 max-w-2xl font-normal leading-relaxed">
                                        Este documento detalha como a NeuroNex acessa, usa, armazena e protege seus dados, incluindo informações de serviços do Google.
                                    </p>
                                </div>
                                <div className="h-[1px] w-full bg-foreground/10" />
                            </div>

                            <div className="grid grid-cols-1 gap-16">
                                {/* 1. Introduction */}
                                <div className="space-y-6">
                                    <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground/30 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-foreground/30" />
                                        01 / Introdução
                                    </h3>
                                    <div className="space-y-6 text-lg text-foreground/60 leading-relaxed font-normal">
                                        <p>
                                            A <strong className="text-foreground font-semibold">NeuroNex AI</strong> ("NeuroNex", "Nós")
                                            está comprometida com a proteção da sua privacidade. Operamos em conformidade com a <strong>LGPD (Lei nº 13.709/2018)</strong>
                                            e as políticas de dados de serviços de API do Google.
                                        </p>
                                        <p>
                                            Esta política divulga de forma abrangente como nossa aplicação acessa, processa e protege os dados do usuário para fornecer a melhor experiência clínica possível.
                                        </p>
                                    </div>
                                </div>

                                {/* 2. Google Data Disclosure */}
                                <div className="space-y-8 p-10 rounded-[2.5rem] bg-foreground/[0.02] border border-foreground/[0.05]">
                                    <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground/30 flex items-center gap-2">
                                        <Globe className="w-4 h-4" />
                                        02 / Divulgação de Dados do Google
                                    </h3>
                                    <div className="space-y-8">
                                        <div>
                                            <h4 className="text-xl font-medium text-foreground mb-4">Dados Acessados via Google APIs</h4>
                                            <p className="text-foreground/60 mb-6">Ao utilizar o login ou integrações do Google, acessamos os seguintes escopos autorizados por você:</p>
                                            <ul className="grid sm:grid-cols-2 gap-4">
                                                {[
                                                    { label: "Perfil Básico", detail: "Nome completo e foto de perfil para personalização." },
                                                    { label: "Endereço de E-mail", detail: "Para autenticação segura e comunicações críticas." },
                                                    { label: "Google Calendar", detail: "Leitura e escrita para sincronização de sessões clínicas." },
                                                    { label: "Identificadores Únicos", detail: "Para vincular sua conta Google ao perfil NeuroNex." }
                                                ].map((item, i) => (
                                                    <li key={i} className="flex flex-col gap-1 p-4 rounded-2xl bg-white dark:bg-foreground/[0.03] border border-foreground/[0.05]">
                                                        <span className="font-semibold text-foreground">{item.label}</span>
                                                        <span className="text-xs text-foreground/40">{item.detail}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div>
                                            <h4 className="text-xl font-medium text-foreground mb-4">Uso e Processamento dos Dados</h4>
                                            <p className="text-foreground/60 leading-relaxed mb-4">
                                                Utilizamos seus dados do Google estritamente para:
                                            </p>
                                            <div className="space-y-3">
                                                <div className="flex gap-4 p-4 rounded-2xl bg-foreground/[0.02]">
                                                    <CheckCircle2 className="w-5 h-5 text-foreground/40 shrink-0" />
                                                    <p className="text-sm text-foreground/60"><strong className="text-foreground">Sincronização de Agenda:</strong> Permitir que agendamentos feitos na NeuroNex apareçam automaticamente no seu Google Calendar e vice-versa.</p>
                                                </div>
                                                <div className="flex gap-4 p-4 rounded-2xl bg-foreground/[0.02]">
                                                    <CheckCircle2 className="w-5 h-5 text-foreground/40 shrink-0" />
                                                    <p className="text-sm text-foreground/60"><strong className="text-foreground">Autenticação:</strong> Simplificar seu acesso através do Google Sign-In com máxima segurança.</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-6 rounded-2xl bg-foreground/5 border border-foreground/5">
                                            <div className="flex gap-3 items-start">
                                                <Info className="w-5 h-5 text-foreground/40 mt-0.5" />
                                                <p className="text-xs text-foreground/50 leading-relaxed">
                                                    O uso de informações recebidas das APIs do Google pela NeuroNex está em conformidade com a
                                                    <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="mx-1 underline text-foreground/70 hover:text-foreground transition-colors">Política de Dados do Usuário dos Serviços de API do Google</a>,
                                                    incluindo os requisitos de Uso Limitado.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. AI/ML Disclosure */}
                                <div className="space-y-6">
                                    <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground/30 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-foreground/30" />
                                        03 / IA e Modelos de Linguagem
                                    </h3>
                                    <div className="p-8 rounded-3xl bg-zinc-950 text-white relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-8 opacity-10">
                                            <Database className="w-24 h-24" />
                                        </div>
                                        <h4 className="text-2xl font-medium mb-4 relative z-10">Política de Treinamento de IA</h4>
                                        <p className="text-white/60 leading-relaxed relative z-10 text-lg">
                                            Garantimos de forma absoluta que seus dados provenientes do Google Workspace (e-mails, calendários)
                                            <strong className="text-white underline decoration-white/30 ml-1">NÃO são utilizados para treinar, melhorar ou ajustar modelos de Inteligência Artificial</strong>
                                            ou algoritmos de aprendizado de máquina. Nossas integrações de IA são processadas em contextos isolados e efêmeros.
                                        </p>
                                    </div>
                                </div>

                                {/* 4. Data Sharing and Storage */}
                                <div className="space-y-8">
                                    <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground/30 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-foreground/30" />
                                        04 / Armazenamento e Compartilhamento
                                    </h3>
                                    <div className="grid sm:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <h4 className="font-semibold text-foreground">Retenção e Exclusão</h4>
                                            <p className="text-sm text-foreground/60 leading-relaxed">
                                                Armazenamos seus tokens de acesso de forma criptografada (AES-256) em servidores seguros da Supabase/AWS.
                                                Você pode revogar o acesso a qualquer momento através das configurações do Google ou deletando sua conta na NeuroNex, o que resultará na exclusão imediata de todos os tokens e dados sincronizados.
                                            </p>
                                        </div>
                                        <div className="space-y-4">
                                            <h4 className="font-semibold text-foreground">Compartilhamento com Terceiros</h4>
                                            <p className="text-sm text-foreground/60 leading-relaxed">
                                                <strong className="text-foreground">Não compartilhamos seus dados do Google com terceiros</strong>, exceto quando estritamente necessário para a funcionalidade do app (ex: provedor de infraestrutura de banco de dados Supabase) e sob rigorosos contratos de confidencialidade.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </FadeIn>
                </section>

                {/* ============================================= */}
                {/* SECTION: TERMS OF SERVICE */}
                {/* ============================================= */}
                <section id="terms" className="scroll-mt-32">
                    <FadeIn>
                        <div className="space-y-16">
                            <div className="flex flex-col gap-8">
                                <div className="space-y-6">
                                    <div className="w-16 h-16 rounded-[22%] border border-foreground/10 bg-transparent text-foreground flex items-center justify-center">
                                        <Scale className="h-8 w-8" strokeWidth={1.5} />
                                    </div>
                                    <h2 className="text-4xl md:text-6xl font-medium text-foreground tracking-tight leading-tight">
                                        Termos de <br /> Serviço.
                                    </h2>
                                    <p className="text-xl text-foreground/40 max-w-2xl font-normal leading-relaxed">
                                        Condições de uso da plataforma NeuroNex OS para profissionais de saúde mental.
                                    </p>
                                </div>
                                <div className="h-[1px] w-full bg-foreground/10" />
                            </div>

                            <div className="grid gap-12">
                                <div className="p-10 rounded-[2.5rem] bg-foreground text-background shadow-3xl relative overflow-hidden">
                                    <h4 className="text-2xl font-medium mb-4 relative z-10 tracking-tight">Elegibilidade e Cadastro</h4>
                                    <p className="text-background/60 leading-relaxed relative z-10 text-lg">
                                        Ao utilizar o NeuroNex, você declara ser um profissional devidamente habilitado por seu respectivo conselho de classe.
                                        O uso indevido da plataforma por não-profissionais poderá resultar em cancelamento imediato sem aviso prévio.
                                    </p>
                                </div>

                                <div className="grid gap-8">
                                    {[
                                        { title: "Escopo de Dados do Google", content: "Nosso serviço integra com APIs do Google para otimizar sua agenda. Ao aceitar estes termos, você concorda que o processamento desses dados segue nossa Política de Privacidade rigorosa." },
                                        { title: "Serviços Financeiros (NeuroFinance)", content: "Os serviços financeiros de pagamento disponibilizados na plataforma NeuroNex ('NeuroFinance') são prestados por Asaas Gestão Financeira S.A. (CNPJ 19.540.550/0001-21), instituição de pagamento regulada pelo Banco Central do Brasil. A NeuroNex atua exclusivamente como plataforma de gestão e integração tecnológica, não sendo uma instituição financeira." },
                                        { title: "Soberania Clínica", content: "A NeuroNex fornece ferramentas de gestão e suporte por IA. A responsabilidade por qualquer diagnóstico, prescrição ou conduta clínica é exclusivamente sua." },
                                        { title: "Cancelamento e Reembolso", content: "Assinaturas na NeuroNex podem ser canceladas a qualquer momento. O acesso permanece ativo até o fim do ciclo de faturamento atual." }
                                    ].map((item, i) => (
                                        <div key={i} className="flex gap-8 group">
                                            <span className="text-foreground/20 font-medium tabular-nums pt-1">{String(i + 1).padStart(2, '0')}</span>
                                            <div className="space-y-3">
                                                <h4 className="text-xl font-medium text-foreground tracking-tight group-hover:translate-x-1 transition-transform">{item.title}</h4>
                                                <p className="text-foreground/40 leading-relaxed">{item.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </FadeIn>
                </section>

                {/* ============================================= */}
                {/* SECTION: COOKIE POLICY */}
                {/* ============================================= */}
                <section id="cookies" className="scroll-mt-32">
                    <FadeIn>
                        <div className="space-y-16">
                            <div className="flex flex-col gap-8">
                                <div className="space-y-6">
                                    <div className="w-16 h-16 rounded-[22%] bg-foreground/[0.02] border border-foreground/5 text-foreground/40 flex items-center justify-center">
                                        <Cookie className="h-8 w-8" strokeWidth={1.5} />
                                    </div>
                                    <h2 className="text-4xl md:text-6xl font-medium text-foreground tracking-tight leading-tight">
                                        Política de <br /> Cookies.
                                    </h2>
                                </div>
                                <div className="h-[1px] w-full bg-foreground/10" />
                            </div>

                            <div className="grid sm:grid-cols-3 gap-6">
                                {[
                                    { title: "Essenciais", desc: "Necessários para login, segurança e manter sua sessão ativa." },
                                    { title: "Funcionais", desc: "Lembram suas preferências de tema e configurações de interface." },
                                    { title: "Analíticos", desc: "Nos ajudam a entender como você usa o app para melhorarmos o design." }
                                ].map((item, i) => (
                                    <div key={i} className="p-8 rounded-[2rem] bg-white dark:bg-foreground/[0.02] border border-foreground/[0.05] hover:border-foreground/20 transition-all duration-500">
                                        <h4 className="font-semibold text-foreground mb-3">{item.title}</h4>
                                        <p className="text-xs text-foreground/40 leading-relaxed">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </FadeIn>
                </section>

                {/* ============================================= */}
                {/* SECTION: CONTACT & BUSINESS INFO */}
                {/* ============================================= */}
                <section id="contact" className="scroll-mt-32">
                    <FadeIn>
                        <div className="rounded-[3.5rem] bg-foreground text-background p-16 md:p-24 text-center relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_100%,rgba(255,255,255,0.05),transparent)] pointer-events-none" />

                            <div className="relative z-10 space-y-12">
                                <div className="space-y-6">
                                    <h2 className="text-5xl md:text-7xl font-medium tracking-tight">Compliance.</h2>
                                    <p className="text-xl text-background/50 max-w-xl mx-auto font-normal">
                                        Nossa equipe jurídica e de segurança está à disposição para auditorias e dúvidas.
                                    </p>
                                </div>

                                <div className="grid md:grid-cols-2 gap-8 pt-8 text-center md:text-left">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-background/30">E-mail</p>
                                        <p className="text-lg font-medium">suporte@neuronexai.com.br</p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-background/30">Telefone</p>
                                        <p className="text-lg font-medium">(41) 9788-0145</p>
                                    </div>
                                </div>
                                <div className="grid md:grid-cols-2 gap-8 pt-4 text-center md:text-left">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-background/30">CNPJ</p>
                                        <p className="text-lg font-medium">65.610.762/0001-55</p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-background/30">Escritório</p>
                                        <p className="text-lg font-medium">São Paulo, SP - Brasil</p>
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-background/10">
                                    <p className="text-xs text-background/40 max-w-2xl mx-auto leading-relaxed">
                                        R. Pais Leme, 215, Conj 1713 • Pinheiros • São Paulo / SP • CEP 05.424-150
                                    </p>
                                </div>

                                <div className="pt-10">
                                    <Button asChild className="h-16 px-12 rounded-full bg-background text-foreground hover:bg-background/90 text-lg font-medium shadow-2xl transition-all hover:scale-105 active:scale-95">
                                        <a href="mailto:suporte@neuronexai.com.br">
                                            Canal de Ética
                                            <ChevronRight className="w-5 h-5 ml-2" />
                                        </a>
                                    </Button>
                                </div>

                                <div className="pt-20 opacity-30 text-[10px] font-bold uppercase tracking-[0.3em]">
                                    NeuroNex AI
                                </div>
                            </div>
                        </div>
                    </FadeIn>
                </section>

            </div>

            <Footer />
        </div>
    );
};

export default LegalPage;