import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Starfield } from "@/components/ui/starfield";
import { FadeIn } from "@/components/animations/FadeIn";
import { Cookie, CheckCircle2, XCircle } from "lucide-react";

const ConfiguracoesDeCookies = () => {
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
                        <div className="w-20 h-20 mx-auto rounded-[22%] bg-foreground/[0.02] border border-foreground/5 text-foreground/40 flex items-center justify-center mb-8">
                            <Cookie className="h-10 w-10" strokeWidth={1.5} />
                        </div>
                    </FadeIn>

                    <FadeIn delay={0.1}>
                        <h1 className="text-5xl md:text-7xl font-medium tracking-tight text-foreground leading-[1] select-none">
                            Política de Cookies
                        </h1>
                    </FadeIn>

                    <FadeIn delay={0.2}>
                        <p className="text-lg md:text-xl text-foreground/50 font-normal max-w-2xl mx-auto leading-relaxed">
                            Saiba como utilizamos cookies para melhorar sua experiência na plataforma NeuroNex.
                            <br />
                            <span className="text-foreground/30 text-sm mt-4 block font-medium">Última atualização: 08 de Fevereiro de 2026</span>
                        </p>
                    </FadeIn>
                </div>
            </section>

            <div className="max-w-4xl mx-auto px-6 pb-40 relative z-10 space-y-20">
                <FadeIn>
                    <div className="space-y-16">
                        {/* What are Cookies */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground/30 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-foreground/30" />
                                O que são Cookies?
                            </h3>
                            <div className="p-8 rounded-3xl bg-foreground/[0.02] border border-foreground/[0.05]">
                                <p className="text-foreground/60 leading-relaxed text-lg">
                                    Cookies são pequenos arquivos de texto armazenados em seu dispositivo quando você visita nosso site.
                                    Eles nos ajudam a lembrar suas preferências, manter você conectado e entender como você usa nossa plataforma.
                                </p>
                            </div>
                        </div>

                        {/* Types of Cookies */}
                        <div className="space-y-8">
                            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground/30 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-foreground/30" />
                                Tipos de Cookies que Utilizamos
                            </h3>
                            <div className="grid sm:grid-cols-3 gap-6">
                                {[
                                    {
                                        title: "Essenciais",
                                        desc: "Necessários para login, segurança e manter sua sessão ativa. Sem eles, a plataforma não funciona corretamente.",
                                        required: true
                                    },
                                    {
                                        title: "Funcionais",
                                        desc: "Lembram suas preferências de tema, idioma e configurações de interface para melhor experiência.",
                                        required: false
                                    },
                                    {
                                        title: "Analíticos",
                                        desc: "Nos ajudam a entender como você usa o app para melhorarmos o design e funcionalidades.",
                                        required: false
                                    }
                                ].map((item, i) => (
                                    <div key={i} className="p-8 rounded-[2rem] bg-white dark:bg-foreground/[0.02] border border-foreground/[0.05] hover:border-foreground/20 transition-all duration-500">
                                        <div className="flex items-center gap-2 mb-3">
                                            <h4 className="font-semibold text-foreground">{item.title}</h4>
                                            {item.required ? (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-foreground/10 text-foreground/60">Obrigatório</span>
                                            ) : (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-foreground/5 text-foreground/40">Opcional</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-foreground/40 leading-relaxed">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Cookie Details Table */}
                        <div className="space-y-8">
                            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground/30 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-foreground/30" />
                                Detalhes dos Cookies
                            </h3>
                            <div className="overflow-hidden rounded-[2rem] border border-foreground/[0.05]">
                                <table className="w-full">
                                    <thead className="bg-foreground/[0.02]">
                                        <tr>
                                            <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-foreground/40">Cookie</th>
                                            <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-foreground/40">Finalidade</th>
                                            <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-foreground/40">Duração</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-foreground/[0.05]">
                                        {[
                                            { name: "sb-auth-token", purpose: "Autenticação e sessão do usuário", duration: "7 dias" },
                                            { name: "theme", purpose: "Preferência de tema (claro/escuro)", duration: "1 ano" },
                                            { name: "cookie-consent", purpose: "Registro do consentimento de cookies", duration: "1 ano" },
                                            { name: "_ga", purpose: "Google Analytics - identificação de visitantes", duration: "2 anos" }
                                        ].map((cookie, i) => (
                                            <tr key={i} className="bg-white dark:bg-transparent">
                                                <td className="p-4 text-sm font-mono text-foreground">{cookie.name}</td>
                                                <td className="p-4 text-sm text-foreground/60">{cookie.purpose}</td>
                                                <td className="p-4 text-sm text-foreground/40">{cookie.duration}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* How to Manage */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground/30 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-foreground/30" />
                                Como Gerenciar seus Cookies
                            </h3>
                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="p-8 rounded-[2rem] bg-foreground/[0.02] border border-foreground/[0.05]">
                                    <div className="flex items-center gap-3 mb-4">
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                        <h4 className="font-semibold text-foreground">Aceitar Cookies</h4>
                                    </div>
                                    <p className="text-sm text-foreground/40 leading-relaxed">
                                        Ao continuar navegando em nosso site, você concorda com o uso de cookies conforme descrito nesta política.
                                    </p>
                                </div>
                                <div className="p-8 rounded-[2rem] bg-foreground/[0.02] border border-foreground/[0.05]">
                                    <div className="flex items-center gap-3 mb-4">
                                        <XCircle className="w-5 h-5 text-foreground/40" />
                                        <h4 className="font-semibold text-foreground">Recusar ou Gerenciar</h4>
                                    </div>
                                    <p className="text-sm text-foreground/40 leading-relaxed">
                                        Você pode configurar seu navegador para bloquear ou alertar sobre cookies. Note que isso pode afetar a funcionalidade do site.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Contact */}
                        <div className="rounded-[2.5rem] bg-foreground text-background p-12 text-center">
                            <h3 className="text-2xl font-medium mb-4">Dúvidas sobre Cookies?</h3>
                            <p className="text-background/60 mb-6">Entre em contato com nossa equipe.</p>
                            <p className="text-lg font-medium">suporte@neuronexai.com.br</p>
                            <p className="text-sm text-background/40 mt-4">CNPJ: 65.610.762/0001-55</p>
                        </div>
                    </div>
                </FadeIn>
            </div>

            <Footer />
        </div>
    );
};

export default ConfiguracoesDeCookies;
