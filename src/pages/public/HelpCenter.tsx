import { useState } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Starfield } from "@/components/ui/starfield";
import { FadeIn } from "@/components/animations/FadeIn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Search,
    Book,
    Shield,
    CreditCard,
    Settings,
    ChevronRight,
    LifeBuoy,
    FileText,
    Zap,
    ArrowRight,
    MessageSquare,
    Globe
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const CategoryCard = ({ icon: Icon, title, count, delay }: any) => (
    <FadeIn delay={delay}>
        <div className="group p-8 rounded-[40px] bg-card/40 backdrop-blur-3xl border border-border/30 hover:bg-card/60 hover:border-foreground/20 transition-all duration-700 h-full flex flex-col justify-between shadow-premium gpu-accelerated">
            <div className="premium-noise opacity-[0.02]" />
            <div>
                <div className="w-14 h-14 rounded-2xl bg-foreground/[0.03] flex items-center justify-center text-foreground/40 border border-border/30 mb-8 shadow-lg group-hover:text-foreground group-hover:border-foreground/20 group-hover:scale-110 transition-all duration-500">
                    <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2 tracking-tight transition-colors">{title}</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">{count} Artigos Técnicos</p>
            </div>
            <div className="mt-8 pt-8 border-t border-border/20 flex items-center justify-between opacity-30 group-hover:opacity-100 transition-opacity duration-500">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground">Explorar</span>
                <ChevronRight className="w-4 h-4 text-foreground/60" />
            </div>
        </div>
    </FadeIn>
);

const HelpCenter = () => {
    const [searchQuery, setSearchQuery] = useState("");

    return (
        <div className="min-h-screen bg-background text-foreground relative overflow-x-hidden font-sans selection:bg-primary/10">
            <Navbar />
            <div className="fixed inset-0 pointer-events-none opacity-40 dark:opacity-20">
                <Starfield />
            </div>

            {/* --- Hero Search --- */}
            <section className="pt-64 pb-32 px-6 relative z-10 text-center overflow-hidden">
                <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[700px] bg-foreground/[0.03] rounded-full blur-[180px] pointer-events-none z-0 mix-blend-overlay" />

                <div className="max-w-4xl mx-auto relative z-10 space-y-12">
                    <FadeIn>
                        <div className="inline-flex items-center justify-center gap-3 px-5 py-2 rounded-full border border-border/40 bg-foreground/[0.03] text-foreground/40 uppercase tracking-[0.3em] text-[10px] font-black backdrop-blur-2xl shadow-premium">
                            <LifeBuoy className="w-4 h-4 text-foreground/50" />
                            Central de Sucesso
                        </div>
                    </FadeIn>

                    <FadeIn delay={0.1}>
                        <h1 className="text-6xl md:text-8xl font-bold tracking-[-0.05em] text-foreground leading-[0.85] select-none">
                            Como podemos <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-b from-foreground via-foreground/80 to-foreground/30 italic pr-4">
                                alavancar sua prática?
                            </span>
                        </h1>
                    </FadeIn>

                    <FadeIn delay={0.2} className="pt-4">
                        <div className="relative group max-w-2xl mx-auto">
                            <div className="absolute inset-0 bg-foreground/10 blur-3xl rounded-full opacity-0 group-focus-within:opacity-40 transition-opacity duration-700" />
                            <div className="relative flex items-center bg-card/60 backdrop-blur-[40px] border border-border/40 rounded-full p-2.5 shadow-[0_48px_96px_-24px_rgba(0,0,0,0.2)] transition-all duration-700 group-focus-within:border-foreground/30 group-focus-within:scale-[1.02]">
                                <Search className="w-6 h-6 text-muted-foreground/40 ml-6" />
                                <Input
                                    placeholder="Faturamento, IA, Segurança, Integrações..."
                                    className="border-none bg-transparent focus-visible:ring-0 h-14 text-lg font-medium placeholder:text-muted-foreground/30 px-6 text-foreground"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <Button className="rounded-full px-10 h-14 bg-foreground text-background hover:opacity-90 font-black text-[11px] uppercase tracking-[0.25em] transition-all active:scale-95 shadow-xl">
                                    Pesquisar
                                </Button>
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* --- Categories Grid --- */}
            <section className="px-6 pb-40 relative z-10">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-40">
                        <CategoryCard icon={Book} title="Primeiros Passos" count={14} delay={0.3} />
                        <CategoryCard icon={CreditCard} title="Financeiro & Split" count={9} delay={0.4} />
                        <CategoryCard icon={Shield} title="Privacidade (LGPD)" count={6} delay={0.5} />
                        <CategoryCard icon={Settings} title="Infra & Domínios" count={12} delay={0.6} />
                    </div>

                    {/* --- FAQ Section --- */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-24 py-32 border-t border-border/20">
                        <div className="lg:col-span-1 space-y-8">
                            <FadeIn delay={0.4}>
                                <h2 className="text-5xl font-bold text-foreground tracking-[-0.04em] leading-[0.9]">Dúvidas <br /><span className="text-muted-foreground/30">Frequentes</span></h2>
                                <p className="text-xl text-muted-foreground/70 font-medium leading-tight tracking-tight mt-6">
                                    Respostas rápidas projetadas para profissionais de alto rendimento.
                                </p>
                                <div className="pt-8">
                                    <Button variant="outline" className="h-14 rounded-full px-10 border-border/40 hover:bg-foreground/5 text-[10px] font-black uppercase tracking-[0.3em] transition-all">
                                        Base de Conhecimento
                                    </Button>
                                </div>
                            </FadeIn>
                        </div>

                        <div className="lg:col-span-2">
                            <FadeIn delay={0.5}>
                                <Accordion type="single" collapsible className="space-y-6">
                                    {[
                                        { q: "Como ocorre a exportação soberana de prontuários?", a: "Você possui controle absoluto sobre seus dados. A exportação pode ser realizada em massa ou individualmente nos formatos PDF (para leitura física) ou JSON (para portabilidade sistêmica), garantindo soberania total." },
                                        { q: "O NeuroNex OS opera em modo offline?", a: "A agenda e dados essenciais de pacientes são cacheados localmente através de Service Workers de última geração, permitindo consulta imediata sem conectividade. Recursos de IA e sincronização em nuvem exigem conexão ativa para integridade dos dados." },
                                        { q: "Qual a infraestrutura por trás da segurança LGPD?", a: "Utilizamos criptografia de ponta (AES-256) com chaves de acesso que nunca tocam nossos servidores em formato legível. Nossa infraestrutura é auditada periodicamente seguindo padrões HIPAA e LGPD." },
                                        { q: "Como funciona o Split de Pagamentos do NeuroBank?", a: "O Split permite automatizar a divisão de honorários entre clínica e profissionais instantaneamente no ato do pagamento, via Stripe Connect, reduzindo custos tributários e burocracia contábil." }
                                    ].map((item, i) => (
                                        <AccordionItem key={i} value={`item-${i}`} className="border border-border/30 bg-card/40 backdrop-blur-3xl px-8 rounded-[32px] transition-all data-[state=open]:bg-card/60 data-[state=open]:border-foreground/20 shadow-premium">
                                            <AccordionTrigger className="text-lg font-bold text-foreground py-7 hover:no-underline hover:text-foreground/80 transition-all text-left">
                                                {item.q}
                                            </AccordionTrigger>
                                            <AccordionContent className="text-muted-foreground/80 font-medium text-base leading-relaxed pb-8 max-w-2xl">
                                                {item.a}
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </FadeIn>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- Resources Section --- */}
            <section className="py-32 bg-foreground/[0.01] border-t border-border/30 px-6 relative overflow-hidden">
                <div className="premium-noise opacity-[0.015]" />
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 relative z-10">
                    <FadeIn delay={0.6} className="col-span-1 p-12 rounded-[48px] bg-card/40 backdrop-blur-3xl border border-border/40 flex flex-col items-center text-center shadow-premium group transition-all duration-700 hover:border-foreground/20">
                        <div className="w-16 h-16 rounded-full bg-foreground/[0.03] border border-border/30 flex items-center justify-center text-foreground/40 mb-8 transition-all group-hover:scale-110 group-hover:text-foreground">
                            <Zap className="w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-3 tracking-tight">Status da Rede</h3>
                        <p className="text-base text-muted-foreground mb-8 font-medium">Sistemas globais operando em performance total.</p>
                        <div className="flex items-center gap-2 text-[10px] font-black text-foreground uppercase tracking-[0.2em] bg-foreground/[0.03] px-5 py-2 rounded-full border border-border/40">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse" /> Global Operational
                        </div>
                    </FadeIn>

                    <FadeIn delay={0.7} className="col-span-1 p-12 rounded-[48px] bg-card/40 backdrop-blur-3xl border border-border/40 flex flex-col items-center text-center shadow-premium group transition-all duration-700 hover:border-foreground/20">
                        <div className="w-16 h-16 rounded-full bg-foreground/[0.03] border border-border/30 flex items-center justify-center text-foreground/40 mb-8 transition-all group-hover:scale-110 group-hover:text-foreground">
                            <FileText className="w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-3 tracking-tight">Canais API</h3>
                        <p className="text-base text-muted-foreground mb-8 font-medium">Documentação técnica para integrações personalizadas de elite.</p>
                        <Button variant="link" className="text-foreground hover:opacity-70 p-0 h-auto text-[10px] uppercase font-black tracking-[0.3em]">
                            Docs Técnicos <ArrowRight className="w-3.5 h-3.5 ml-2" />
                        </Button>
                    </FadeIn>

                    <FadeIn delay={0.8} className="col-span-1 p-12 rounded-[48px] bg-card/40 backdrop-blur-3xl border border-border/40 flex flex-col items-center text-center shadow-premium group transition-all duration-700 hover:border-foreground/20">
                        <div className="w-16 h-16 rounded-full bg-foreground/[0.03] border border-border/30 flex items-center justify-center text-foreground/40 mb-8 transition-all group-hover:scale-110 group-hover:text-foreground">
                            <MessageSquare className="w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-3 tracking-tight">White Glove Support</h3>
                        <p className="text-base text-muted-foreground mb-8 font-medium">Especialistas prontos para otimizar sua transição digital.</p>
                        <Button variant="link" className="text-foreground hover:opacity-70 p-0 h-auto text-[10px] uppercase font-black tracking-[0.3em]">
                            Falar com Expert <ArrowRight className="w-3.5 h-3.5 ml-2" />
                        </Button>
                    </FadeIn>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default HelpCenter;