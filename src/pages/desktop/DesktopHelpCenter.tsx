import { useState } from "react";
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
    Zap,
    ArrowRight,
    MessageSquare,
    Keyboard,
    Monitor,
    RefreshCw,
    HelpCircle,
} from "lucide-react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { getElectronAppVersion } from "@/lib/electron";

const CategoryCard = ({
    icon: Icon,
    title,
    count,
    delay,
}: {
    icon: any;
    title: string;
    count: number;
    delay: number;
}) => (
    <FadeIn delay={delay}>
        <div className="desktop-tactile desktop-apple-surface group flex h-full flex-col justify-between rounded-[22px] p-6 hover:border-foreground/15">
            <div>
                <div className="w-12 h-12 rounded-xl bg-foreground/[0.03] flex items-center justify-center text-foreground/40 border border-border/30 mb-6 group-hover:text-foreground group-hover:border-foreground/20 group-hover:scale-110 transition-all duration-500">
                    <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1 tracking-tight">
                    {title}
                </h3>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">
                    {count} Artigos
                </p>
            </div>
            <div className="mt-6 pt-6 border-t border-border/20 flex items-center justify-between opacity-30 group-hover:opacity-100 transition-opacity duration-500">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground">
                    Explorar
                </span>
                <ChevronRight className="w-4 h-4 text-foreground/60" />
            </div>
        </div>
    </FadeIn>
);

const DesktopHelpCenter = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const appVersion = getElectronAppVersion() || "1.0.0";

    return (
        <div className="desktop-page-canvas min-h-full font-sans text-foreground">
            {/* ─── Hero Search ───────────────────────────────────────── */}
            <section className="pt-12 pb-10 px-6 relative z-10">
                <div className="max-w-4xl mx-auto space-y-8">
                    <FadeIn>
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/40 bg-foreground/[0.03] text-foreground/40 uppercase tracking-[0.25em] text-[10px] font-bold backdrop-blur-xl">
                            <LifeBuoy className="w-3.5 h-3.5 text-foreground/50" />
                            Central de Ajuda
                        </div>
                    </FadeIn>

                    <FadeIn delay={0.1}>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-[-0.04em] text-foreground leading-[0.9]">
                            Como podemos{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-b from-foreground via-foreground/80 to-foreground/30">
                                ajudar?
                            </span>
                        </h1>
                    </FadeIn>

                    <FadeIn delay={0.2}>
                        <div className="relative group max-w-2xl">
                            <div className="desktop-apple-surface relative flex items-center rounded-[20px] p-2 transition-colors group-focus-within:border-foreground/30">
                                <Search className="w-5 h-5 text-muted-foreground/40 ml-4" />
                                <Input
                                    placeholder="Pesquisar artigos, guias, FAQ..."
                                    className="border-none bg-transparent focus-visible:ring-0 h-12 text-base font-medium placeholder:text-muted-foreground/30 px-4 text-foreground"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <Button className="rounded-xl px-8 h-12 bg-foreground text-background hover:opacity-90 font-bold text-[11px] uppercase tracking-[0.15em] transition-all active:scale-95">
                                    Pesquisar
                                </Button>
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* ─── Categories Grid ───────────────────────────────────── */}
            <section className="px-6 pb-12 relative z-10">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
                        <CategoryCard icon={Book} title="Primeiros Passos" count={14} delay={0.3} />
                        <CategoryCard icon={CreditCard} title="Financeiro & Split" count={9} delay={0.4} />
                        <CategoryCard icon={Shield} title="Privacidade (LGPD)" count={6} delay={0.5} />
                        <CategoryCard icon={Settings} title="Infra & Domínios" count={12} delay={0.6} />
                    </div>

                    {/* ─── Desktop-Specific Section ──────────────────────── */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16">
                        <FadeIn delay={0.35}>
                            <div className="desktop-tactile desktop-apple-surface group rounded-[22px] p-6 hover:border-foreground/15">
                                <div className="w-12 h-12 rounded-xl bg-foreground/[0.03] flex items-center justify-center text-foreground/40 border border-border/30 mb-4 group-hover:text-foreground group-hover:scale-110 transition-all duration-500">
                                    <Monitor className="w-5 h-5" />
                                </div>
                                <h3 className="text-base font-bold text-foreground mb-2 tracking-tight">
                                    Requisitos do Sistema
                                </h3>
                                <ul className="space-y-2 text-sm text-muted-foreground/70">
                                    <li className="flex items-start gap-2">
                                        <span className="text-foreground/30 mt-0.5">•</span>
                                        Windows 10/11 (64-bit)
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-foreground/30 mt-0.5">•</span>
                                        4GB RAM mínimo (8GB recomendado)
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-foreground/30 mt-0.5">•</span>
                                        200MB de espaço em disco
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-foreground/30 mt-0.5">•</span>
                                        Conexão com a internet ativa
                                    </li>
                                </ul>
                            </div>
                        </FadeIn>

                        <FadeIn delay={0.45}>
                            <div className="desktop-tactile desktop-apple-surface group rounded-[22px] p-6 hover:border-foreground/15">
                                <div className="w-12 h-12 rounded-xl bg-foreground/[0.03] flex items-center justify-center text-foreground/40 border border-border/30 mb-4 group-hover:text-foreground group-hover:scale-110 transition-all duration-500">
                                    <Keyboard className="w-5 h-5" />
                                </div>
                                <h3 className="text-base font-bold text-foreground mb-2 tracking-tight">
                                    Atalhos de Teclado
                                </h3>
                                <div className="space-y-2.5 text-sm">
                                    {[
                                        { keys: "Ctrl + R", desc: "Recarregar app" },
                                        { keys: "Ctrl + +", desc: "Aumentar zoom" },
                                        { keys: "Ctrl + -", desc: "Diminuir zoom" },
                                        { keys: "Ctrl + 0", desc: "Zoom padrão" },
                                        { keys: "F11", desc: "Tela cheia" },
                                        { keys: "Alt + F4", desc: "Fechar app" },
                                    ].map((shortcut) => (
                                        <div key={shortcut.keys} className="flex items-center justify-between">
                                            <span className="text-muted-foreground/70">{shortcut.desc}</span>
                                            <kbd className="px-2 py-0.5 rounded-md bg-foreground/[0.05] border border-border/40 text-[11px] font-mono text-foreground/60">
                                                {shortcut.keys}
                                            </kbd>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </FadeIn>

                        <FadeIn delay={0.55}>
                            <div className="desktop-tactile desktop-apple-surface group rounded-[22px] p-6 hover:border-foreground/15">
                                <div className="w-12 h-12 rounded-xl bg-foreground/[0.03] flex items-center justify-center text-foreground/40 border border-border/30 mb-4 group-hover:text-foreground group-hover:scale-110 transition-all duration-500">
                                    <RefreshCw className="w-5 h-5" />
                                </div>
                                <h3 className="text-base font-bold text-foreground mb-2 tracking-tight">
                                    Atualizações
                                </h3>
                                <p className="text-sm text-muted-foreground/70 mb-4">
                                    O NeuroNex Desktop é atualizado automaticamente. Em breve, notificações de novas versões serão exibidas diretamente no app.
                                </p>
                                <div className="flex items-center justify-between pt-3 border-t border-border/20">
                                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50">
                                        Versão Atual
                                    </span>
                                    <span className="text-sm font-mono text-foreground/70">
                                        v{appVersion}
                                    </span>
                                </div>
                            </div>
                        </FadeIn>
                    </div>

                    {/* ─── FAQ Section ───────────────────────────────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 py-12 border-t border-border/20">
                        <div className="lg:col-span-1 space-y-6">
                            <FadeIn delay={0.4}>
                                <h2 className="text-3xl font-bold text-foreground tracking-[-0.03em] leading-[0.9]">
                                    Dúvidas{" "}
                                    <span className="text-muted-foreground/30">Frequentes</span>
                                </h2>
                                <p className="text-base text-muted-foreground/70 font-medium leading-tight tracking-tight mt-4">
                                    Respostas rápidas para profissionais de alto rendimento.
                                </p>
                            </FadeIn>
                        </div>

                        <div className="lg:col-span-2">
                            <FadeIn delay={0.5}>
                                <Accordion type="single" collapsible className="space-y-4">
                                    {[
                                        {
                                            q: "Como exportar prontuários do app desktop?",
                                            a: "Você possui controle absoluto sobre seus dados. A exportação pode ser realizada em massa ou individualmente nos formatos PDF ou JSON, garantindo soberania total sobre suas informações clínicas.",
                                        },
                                        {
                                            q: "O NeuroNex Desktop funciona offline?",
                                            a: "Os dados essenciais de pacientes e agenda são armazenados localmente permitindo consulta imediata. Recursos de IA, sincronização em nuvem e teleconsulta exigem conexão ativa com a internet.",
                                        },
                                        {
                                            q: "Meus dados estão seguros no app desktop?",
                                            a: "Sim. Utilizamos criptografia de ponta (AES-256) e toda comunicação com nossos servidores é feita via HTTPS. O app desktop não armazena dados sensíveis localmente sem criptografia. Seguimos padrões LGPD.",
                                        },
                                        {
                                            q: "Como funciona o Split de Pagamentos?",
                                            a: "O Split permite automatizar a divisão de honorários entre clínica e profissionais instantaneamente no ato do pagamento, via NeuroFinance (serviços financeiros por Asaas), reduzindo custos tributários e burocracia contábil.",
                                        },
                                        {
                                            q: "Posso usar o app desktop e o web simultaneamente?",
                                            a: "Sim! Sua conta NeuroNex funciona em qualquer plataforma. Os dados são sincronizados em tempo real entre o app desktop, web e mobile. Use onde preferir.",
                                        },
                                    ].map((item, i) => (
                                        <AccordionItem
                                            key={i}
                                            value={`item-${i}`}
                                            className="desktop-apple-surface rounded-[20px] px-6 transition-colors data-[state=open]:border-foreground/20"
                                        >
                                            <AccordionTrigger className="text-base font-bold text-foreground py-5 hover:no-underline hover:text-foreground/80 transition-all text-left">
                                                {item.q}
                                            </AccordionTrigger>
                                            <AccordionContent className="text-muted-foreground/80 font-medium text-sm leading-relaxed pb-6 max-w-2xl">
                                                {item.a}
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </FadeIn>
                        </div>
                    </div>

                    {/* ─── Quick Links ─────────────────────────────────────── */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 py-12 border-t border-border/20">
                        <FadeIn delay={0.6}>
                            <div className="desktop-tactile desktop-apple-surface group flex flex-col items-center rounded-[22px] p-6 text-center hover:border-foreground/20">
                                <div className="w-12 h-12 rounded-full bg-foreground/[0.03] border border-border/30 flex items-center justify-center text-foreground/40 mb-4 group-hover:scale-110 group-hover:text-foreground transition-all duration-500">
                                    <Zap className="w-5 h-5" />
                                </div>
                                <h3 className="text-base font-bold text-foreground mb-2 tracking-tight">
                                    Status do Sistema
                                </h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Infraestrutura global em operação.
                                </p>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-foreground uppercase tracking-[0.15em] bg-foreground/[0.03] px-4 py-1.5 rounded-full border border-border/40">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
                                    Operacional
                                </div>
                            </div>
                        </FadeIn>

                        <FadeIn delay={0.7}>
                            <div className="desktop-tactile desktop-apple-surface group flex flex-col items-center rounded-[22px] p-6 text-center hover:border-foreground/20">
                                <div className="w-12 h-12 rounded-full bg-foreground/[0.03] border border-border/30 flex items-center justify-center text-foreground/40 mb-4 group-hover:scale-110 group-hover:text-foreground transition-all duration-500">
                                    <HelpCircle className="w-5 h-5" />
                                </div>
                                <h3 className="text-base font-bold text-foreground mb-2 tracking-tight">
                                    Documentação
                                </h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Guias técnicos e tutoriais completos.
                                </p>
                                <Button
                                    variant="link"
                                    className="text-foreground hover:opacity-70 p-0 h-auto text-[10px] uppercase font-bold tracking-[0.2em]"
                                    onClick={() => window.open("https://neuronex.site/help", "_blank")}
                                >
                                    Acessar Docs <ArrowRight className="w-3 h-3 ml-1.5" />
                                </Button>
                            </div>
                        </FadeIn>

                        <FadeIn delay={0.8}>
                            <div className="desktop-tactile desktop-apple-surface group flex flex-col items-center rounded-[22px] p-6 text-center hover:border-foreground/20">
                                <div className="w-12 h-12 rounded-full bg-foreground/[0.03] border border-border/30 flex items-center justify-center text-foreground/40 mb-4 group-hover:scale-110 group-hover:text-foreground transition-all duration-500">
                                    <MessageSquare className="w-5 h-5" />
                                </div>
                                <h3 className="text-base font-bold text-foreground mb-2 tracking-tight">
                                    Suporte Direto
                                </h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Especialistas prontos para ajudar.
                                </p>
                                <Button
                                    variant="link"
                                    className="text-foreground hover:opacity-70 p-0 h-auto text-[10px] uppercase font-bold tracking-[0.2em]"
                                    onClick={() => window.open("https://neuronex.site/contact", "_blank")}
                                >
                                    Falar com Suporte <ArrowRight className="w-3 h-3 ml-1.5" />
                                </Button>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default DesktopHelpCenter;
