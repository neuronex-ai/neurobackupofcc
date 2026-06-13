import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Starfield } from "@/components/ui/starfield";
import { FadeIn } from "@/components/animations/FadeIn";
import { Scale, Globe, ShieldCheck, CheckCircle2, Info, Eye, FileText, Share2, Lock, Trash2, Server } from "lucide-react";
import { Link } from "react-router-dom";

const TermosDeUso = () => {
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
                        <div className="w-20 h-20 mx-auto rounded-[22%] border border-foreground/10 bg-transparent text-foreground flex items-center justify-center mb-8">
                            <Scale className="h-10 w-10" strokeWidth={1.5} />
                        </div>
                    </FadeIn>

                    <FadeIn delay={0.1}>
                        <h1 className="text-5xl md:text-7xl font-medium tracking-tight text-foreground leading-[1] select-none">
                            Termos de Uso
                        </h1>
                    </FadeIn>

                    <FadeIn delay={0.2}>
                        <p className="text-lg md:text-xl text-foreground/50 font-normal max-w-2xl mx-auto leading-relaxed">
                            Condições de uso da plataforma NeuroNex para profissionais de saúde mental, incluindo uso de dados e integrações com serviços do Google.
                            <br />
                            <span className="text-foreground/30 text-sm mt-4 block font-medium">Última atualização: 13 de Fevereiro de 2026</span>
                        </p>
                    </FadeIn>
                </div>
            </section>

            <div className="max-w-4xl mx-auto px-6 pb-40 relative z-10 space-y-20">
                <FadeIn>
                    <div className="grid gap-12">
                        {/* Eligibility */}
                        <div className="p-10 rounded-[2.5rem] bg-foreground text-background shadow-3xl relative overflow-hidden">
                            <h4 className="text-2xl font-medium mb-4 relative z-10 tracking-tight">Elegibilidade e Cadastro</h4>
                            <p className="text-background/60 leading-relaxed relative z-10 text-lg">
                                Ao utilizar o NeuroNex, você declara ser um profissional devidamente habilitado por seu respectivo conselho de classe.
                                O uso indevido da plataforma por não-profissionais poderá resultar em cancelamento imediato sem aviso prévio.
                            </p>
                        </div>

                        {/* General Terms */}
                        <div className="grid gap-8">
                            {[
                                { title: "Aceitação dos Termos", content: "Ao acessar e utilizar a plataforma NeuroNex, você concorda com estes Termos de Uso, nossa Política de Privacidade e a Política de Cookies. Caso não concorde com alguma disposição, você deve cessar o uso da plataforma imediatamente." },
                                { title: "Serviços Financeiros (NeuroFinance)", content: "A infraestrutura tecnológica de pagamentos e liquidação disponibilizada na plataforma NeuroNex ('NeuroFinance') é operada pelo Asaas Gestão Financeira S.A. (CNPJ 19.540.550/0001-21), instituição de pagamento regulada pelo Banco Central do Brasil. A NeuroNex atua exclusivamente como software de gestão e automação, enquanto o Asaas funciona como parceiro de integração para os serviços financeiros." },
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

                        {/* ===== SEÇçO: INTEGRAÇçO COM GOOGLE E DADOS ===== */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground/30 flex items-center gap-2">
                                <Globe className="w-4 h-4" />
                                Uso de Dados do Google
                            </h3>
                            <div className="p-8 rounded-3xl bg-foreground/[0.02] border border-foreground/[0.05] space-y-5">
                                <p className="text-foreground/60 leading-relaxed">
                                    A NeuroNex integra com serviços do Google (Google Sign-In e Google Calendar) para fornecer funcionalidades essenciais. Ao aceitar estes termos e utilizar as integrações do Google, você concorda que:
                                </p>
                                <div className="space-y-3">
                                    {[
                                        "Os dados da sua conta Google (nome, e-mail, foto de perfil, identificador único) são acessados exclusivamente para autenticação e personalização da plataforma.",
                                        "Os dados do Google Calendar (eventos) são acessados para sincronização bidirecional de sessões clínicas, permitindo que agendamentos apareçam em ambas as plataformas.",
                                        "O processamento e uso dos seus dados do Google seguem rigorosamente nossa Política de Privacidade e a Política de Dados do Usuário dos Serviços de API do Google, incluindo os requisitos de Uso Limitado.",
                                        "Seus dados do Google NÃO são utilizados para treinar modelos de IA, veicular anúncios ou comercializados com terceiros.",
                                        "Você pode revogar o acesso da NeuroNex aos seus dados do Google a qualquer momento nas configurações de segurança da sua conta Google."
                                    ].map((item, i) => (
                                        <div key={i} className="flex gap-3 items-start">
                                            <CheckCircle2 className="w-4 h-4 text-foreground/30 shrink-0 mt-1" />
                                            <p className="text-sm text-foreground/50 leading-relaxed">{item}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-2">
                                    <p className="text-xs text-foreground/40 leading-relaxed">
                                        Para informações detalhadas sobre coleta, armazenamento, compartilhamento e exclusão de dados, consulte nossa{" "}
                                        <Link to="/politica-de-privacidade" className="underline text-foreground/60 hover:text-foreground transition-colors">Política de Privacidade</Link> completa.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* ===== DADOS ACESSADOS ===== */}
                        <div className="space-y-8 p-10 rounded-[2.5rem] bg-foreground/[0.02] border border-foreground/[0.05]">
                            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground/30 flex items-center gap-2">
                                <Eye className="w-4 h-4" />
                                Dados Acessados
                            </h3>
                            <div className="space-y-6">
                                <p className="text-foreground/60 leading-relaxed">
                                    Ao utilizar a NeuroNex com login do Google, os seguintes dados específicos de usuários do Google são acessados mediante seu consentimento explícito via fluxo OAuth:
                                </p>
                                <ul className="grid sm:grid-cols-2 gap-4">
                                    {[
                                        { label: "Perfil Básico (openid, profile)", detail: "Nome completo e foto de perfil para identificação e personalização da interface." },
                                        { label: "Endereço de E-mail (email)", detail: "Para autenticação segura, login e envio de notificações transacionais do serviço." },
                                        { label: "Google Calendar (calendar.events)", detail: "Leitura e escrita de eventos para sincronização bidirecional de sessões clínicas." },
                                        { label: "Identificador Único (sub)", detail: "ID interno do Google para vincular de forma segura a conta ao perfil NeuroNex." }
                                    ].map((item, i) => (
                                        <li key={i} className="flex flex-col gap-2 p-5 rounded-2xl bg-white dark:bg-foreground/[0.03] border border-foreground/[0.05]">
                                            <span className="font-semibold text-foreground text-sm">{item.label}</span>
                                            <span className="text-xs text-foreground/40 leading-relaxed">{item.detail}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* ===== UTILIZAÇçO DE DADOS ===== */}
                        <div className="space-y-8 p-10 rounded-[2.5rem] bg-foreground/[0.02] border border-foreground/[0.05]">
                            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground/30 flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Utilização de Dados
                            </h3>
                            <div className="space-y-4">
                                <p className="text-foreground/60 leading-relaxed">
                                    Os dados acessados do Google são utilizados, processados e gerenciados exclusivamente para:
                                </p>
                                {[
                                    { title: "Autenticação e Login", desc: "Criação e manutenção de sessões seguras via Google Sign-In (OAuth 2.0), sem necessidade de senhas separadas." },
                                    { title: "Personalização da Interface", desc: "Exibição de nome e foto de perfil na navegação e perfil do profissional." },
                                    { title: "Sincronização de Agenda", desc: "Criação e leitura de eventos no Google Calendar para refletir sessões clínicas agendadas na NeuroNex." },
                                    { title: "Comunicações do Serviço", desc: "Envio de notificações transacionais essenciais (confirmações de agendamento, alertas de sessão)." }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-4 p-4 rounded-2xl bg-foreground/[0.02]">
                                        <CheckCircle2 className="w-5 h-5 text-foreground/40 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-semibold text-foreground mb-1">{item.title}</p>
                                            <p className="text-xs text-foreground/50 leading-relaxed">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ===== COMPARTILHAMENTO DE DADOS ===== */}
                        <div className="space-y-8 p-10 rounded-[2.5rem] bg-foreground/[0.02] border border-foreground/[0.05]">
                            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground/30 flex items-center gap-2">
                                <Share2 className="w-4 h-4" />
                                Compartilhamento de Dados
                            </h3>
                            <div className="space-y-4">
                                <p className="text-foreground/60 leading-relaxed">
                                    A NeuroNex <strong className="text-foreground">não vende, aluga ou comercializa</strong> dados de usuários do Google. O compartilhamento ocorre apenas quando estritamente necessário:
                                </p>
                                <div className="space-y-3">
                                    <div className="p-5 rounded-2xl bg-white dark:bg-foreground/[0.03] border border-foreground/[0.05] space-y-2">
                                        <h4 className="font-semibold text-foreground text-sm">Supabase (AWS)</h4>
                                        <p className="text-xs text-foreground/50 leading-relaxed">Provedor de banco de dados e autenticação. Opera sob contratos de processamento de dados (DPA) e conformidade SOC 2 Type II.</p>
                                    </div>
                                    <div className="p-5 rounded-2xl bg-white dark:bg-foreground/[0.03] border border-foreground/[0.05] space-y-2">
                                        <h4 className="font-semibold text-foreground text-sm">APIs do Google</h4>
                                        <p className="text-xs text-foreground/50 leading-relaxed">Dados transmitidos de volta ao Google apenas para operações do Calendar (criação/atualização de eventos), via APIs oficiais e criptografia TLS.</p>
                                    </div>
                                    <div className="p-5 rounded-2xl bg-white dark:bg-foreground/[0.03] border border-foreground/[0.05] space-y-2">
                                        <h4 className="font-semibold text-foreground text-sm">Obrigações Legais</h4>
                                        <p className="text-xs text-foreground/50 leading-relaxed">Quando exigido por lei, ordem judicial ou processo legal válido, com notificação ao usuário quando permitido.</p>
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl bg-foreground/5 border border-foreground/5">
                                    <div className="flex gap-3 items-start">
                                        <Info className="w-5 h-5 text-foreground/40 mt-0.5 shrink-0" />
                                        <p className="text-xs text-foreground/50 leading-relaxed">
                                            Não compartilhamos dados com redes de publicidade, corretores de dados, revendedores de dados ou quaisquer entidades que não sejam estritamente necessárias para a operação do serviço.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ===== ARMAZENAMENTO E PROTEÇçO ===== */}
                        <div className="space-y-8 p-10 rounded-[2.5rem] bg-foreground/[0.02] border border-foreground/[0.05]">
                            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground/30 flex items-center gap-2">
                                <Lock className="w-4 h-4" />
                                Armazenamento e Proteção de Dados
                            </h3>
                            <div className="space-y-4">
                                <p className="text-foreground/60 leading-relaxed">
                                    Práticas de segurança adotadas para proteger os dados dos usuários do Google:
                                </p>
                                <div className="grid sm:grid-cols-2 gap-3">
                                    {[
                                        { title: "Criptografia em Repouso", desc: "Tokens e dados sensíveis criptografados com AES-256." },
                                        { title: "Criptografia em Trnsito", desc: "Todas as comunicações via HTTPS/TLS 1.2+." },
                                        { title: "Infraestrutura AWS", desc: "Conformidade SOC 2 Type II e ISO 27001." },
                                        { title: "Row Level Security", desc: "Cada usuário acessa apenas seus próprios dados." },
                                        { title: "OAuth 2.0 Seguro", desc: "Tokens armazenados no servidor, nunca expostos ao cliente." },
                                        { title: "Monitoramento 24/7", desc: "Logs de auditoria e alertas automáticos de segurança." }
                                    ].map((item, i) => (
                                        <div key={i} className="p-4 rounded-2xl bg-white dark:bg-foreground/[0.03] border border-foreground/[0.05] space-y-1">
                                            <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
                                                <Server className="w-3.5 h-3.5 text-foreground/40" />
                                                {item.title}
                                            </h4>
                                            <p className="text-xs text-foreground/40 leading-relaxed">{item.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* ===== RETENÇÃO E EXCLUSÃO ===== */}
                        <div className="space-y-8 p-10 rounded-[2.5rem] bg-foreground/[0.02] border border-foreground/[0.05]">
                            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground/30 flex items-center gap-2">
                                <Trash2 className="w-4 h-4" />
                                Retenção e Exclusão de Dados
                            </h3>
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <h4 className="text-lg font-medium text-foreground">Períodos de Retenção</h4>
                                    {[
                                        { data: "Dados de Perfil (nome, e-mail, foto)", period: "Retidos enquanto a conta estiver ativa." },
                                        { data: "Tokens de Acesso ao Google", period: "Retidos enquanto a integração com o Calendar estiver ativa." },
                                        { data: "Dados de Sincronização do Calendar", period: "Retidos enquanto o agendamento existir. Dados temporários eliminados após processamento." }
                                    ].map((item, i) => (
                                        <div key={i} className="flex gap-4 p-4 rounded-2xl bg-foreground/[0.02]">
                                            <CheckCircle2 className="w-5 h-5 text-foreground/40 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">{item.data}</p>
                                                <p className="text-xs text-foreground/50">{item.period}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-lg font-medium text-foreground">Mecanismos de Exclusão</h4>
                                    <p className="text-sm text-foreground/60 leading-relaxed">
                                        Você tem o direito de solicitar a exclusão de todos os seus dados a qualquer momento através de:
                                    </p>
                                    {[
                                        { step: "1", title: "Exclusão pela Plataforma", desc: "Acesse Configurações > Excluir Conta. Todos os dados, incluindo dados do Google, serão apagados em até 30 dias." },
                                        { step: "2", title: "Solicitação por E-mail", desc: "Envie um e-mail para suporte@neuronexai.com.br com o assunto \"Solicitação de Exclusão de Dados\". Prazo de resposta: 5 dias úteis." },
                                        { step: "3", title: "Revogação pelo Google", desc: "Acesse myaccount.google.com/permissions para revogar o acesso da NeuroNex. Tokens invalidados imediatamente, dados excluídos em até 30 dias." }
                                    ].map((item, i) => (
                                        <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white dark:bg-foreground/[0.03] border border-foreground/[0.05]">
                                            <div className="w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold shrink-0">{item.step}</div>
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                                                <p className="text-xs text-foreground/50 leading-relaxed">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* ===== CONFORMIDADE COM O GOOGLE ===== */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground/30 flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4" />
                                Conformidade com Políticas do Google
                            </h3>
                            <div className="p-8 rounded-3xl bg-zinc-950 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    <ShieldCheck className="w-24 h-24" />
                                </div>
                                <h4 className="text-xl font-medium mb-4 relative z-10">Uso Limitado (Limited Use)</h4>
                                <div className="space-y-4 relative z-10">
                                    <p className="text-white/60 leading-relaxed text-sm">
                                        O uso de informações recebidas das APIs do Google pela NeuroNex está em total conformidade com a{" "}
                                        <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="underline text-white/80 hover:text-white transition-colors">Política de Dados do Usuário dos Serviços de API do Google</a> e
                                        os <a href="https://developers.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline text-white/80 hover:text-white transition-colors">Termos de Serviço das APIs do Google</a>, incluindo os requisitos de Uso Limitado:
                                    </p>
                                    <ul className="space-y-2">
                                        {[
                                            "Usamos dados do Google apenas para fornecer e melhorar recursos voltados ao usuário, proeminentes na interface do aplicativo.",
                                            "Não transferimos dados para terceiros, exceto conforme necessário para fornecer o serviço, em conformidade legal, ou em fusão/aquisição com proteções adequadas.",
                                            "Não usamos dados do Google para veicular anúncios, retargeting ou publicidade personalizada.",
                                            "Não usamos dados do Google para treinar modelos de Inteligência Artificial ou Machine Learning.",
                                            "Não permitimos que humanos leiam dados dos usuários, exceto com consentimento explícito, para segurança, conformidade legal ou quando agregados e anonimizados."
                                        ].map((item, i) => (
                                            <li key={i} className="flex gap-3 items-start">
                                                <CheckCircle2 className="w-4 h-4 text-white/40 shrink-0 mt-0.5" />
                                                <p className="text-xs text-white/50 leading-relaxed">{item}</p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Intellectual Property */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground/30 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-foreground/30" />
                                Propriedade Intelectual
                            </h3>
                            <div className="p-8 rounded-3xl bg-foreground/[0.02] border border-foreground/[0.05]">
                                <p className="text-foreground/60 leading-relaxed">
                                    Todo o conteúdo da plataforma NeuroNex, incluindo mas não limitado a logotipos, marcas, software, design de interface, textos e gráficos,
                                    são de propriedade exclusiva da NeuroNex AI LTDA e estão protegidos pelas leis de propriedade intelectual brasileiras e internacionais.
                                </p>
                            </div>
                        </div>

                        {/* Limitation of Liability */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground/30 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-foreground/30" />
                                Limitação de Responsabilidade
                            </h3>
                            <div className="p-8 rounded-3xl bg-foreground/[0.02] border border-foreground/[0.05]">
                                <p className="text-foreground/60 leading-relaxed">
                                    A NeuroNex não se responsabiliza por danos diretos, indiretos, incidentais ou consequentes resultantes do uso ou incapacidade de uso da plataforma.
                                    Nossos serviços são fornecidos "como estão" e "conforme disponíveis", sem garantias de qualquer tipo, expressas ou implícitas.
                                </p>
                            </div>
                        </div>

                        {/* Contact */}
                        <div className="rounded-[2.5rem] bg-foreground text-background p-12 text-center">
                            <h3 className="text-2xl font-medium mb-4">Dúvidas sobre os Termos?</h3>
                            <p className="text-background/60 mb-6 max-w-lg mx-auto">
                                Se você tiver alguma dúvida sobre estes termos, sobre como seus dados são tratados, ou quiser exercer seus direitos, entre em contato conosco.
                            </p>
                            <p className="text-lg font-medium">suporte@neuronexai.com.br</p>
                            <p className="text-sm text-background/40 mt-4">NeuroNex AI LTDA</p>
                            <p className="text-sm text-background/40">CNPJ: 65.610.762/0001-55</p>
                        </div>
                    </div>
                </FadeIn>
            </div>

            <Footer />
        </div>
    );
};

export default TermosDeUso;

