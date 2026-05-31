import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Starfield } from "@/components/ui/starfield";
import { FadeIn } from "@/components/animations/FadeIn";
import { ShieldCheck, Globe, Database, CheckCircle2, Info, Lock, Share2, Trash2, Server, Eye, FileText } from "lucide-react";

const PoliticaDePrivacidade = () => {
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
                        <div className="w-20 h-20 mx-auto rounded-[22%] bg-foreground text-background flex items-center justify-center shadow-2xl mb-8">
                            <ShieldCheck className="h-10 w-10" strokeWidth={1.5} />
                        </div>
                    </FadeIn>

                    <FadeIn delay={0.1}>
                        <h1 className="text-5xl md:text-7xl font-medium tracking-tight text-foreground leading-[1] select-none">
                            Política de Privacidade
                        </h1>
                    </FadeIn>

                    <FadeIn delay={0.2}>
                        <p className="text-lg md:text-xl text-foreground/50 font-normal max-w-2xl mx-auto leading-relaxed">
                            Este documento detalha como a NeuroNex acessa, usa, armazena e protege seus dados, incluindo informações obtidas através de serviços e APIs do Google.
                            <br />
                            <span className="text-foreground/30 text-sm mt-4 block font-medium">Última atualização: 13 de Fevereiro de 2026</span>
                        </p>
                    </FadeIn>
                </div>
            </section>

            <div className="max-w-4xl mx-auto px-6 pb-40 relative z-10 space-y-20">
                <FadeIn>
                    <div className="grid grid-cols-1 gap-16">
                        {/* 1. Introdução */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground/30 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-foreground/30" />
                                01 / Introdução
                            </h3>
                            <div className="space-y-6 text-lg text-foreground/60 leading-relaxed font-normal">
                                <p>
                                    A <strong className="text-foreground font-semibold">NeuroNex AI</strong> ("NeuroNex", "Nós")
                                    está comprometida com a proteção da sua privacidade. Operamos em conformidade com a <strong>LGPD (Lei nº 13.709/2018)</strong>,
                                    a <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="underline text-foreground/70 hover:text-foreground transition-colors">Política de Dados do Usuário dos Serviços de API do Google</a> e
                                    os <a href="https://developers.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline text-foreground/70 hover:text-foreground transition-colors">Termos de Serviço das APIs do Google</a>.
                                </p>
                                <p>
                                    Esta política descreve de forma clara e abrangente como nossa aplicação acessa, usa, armazena, compartilha e protege os dados dos usuários do Google, bem como as práticas de retenção e exclusão desses dados.
                                </p>
                            </div>
                        </div>

                        {/* ===== SEÇÃO 2: DADOS ACESSADOS ===== */}
                        <div className="space-y-8 p-10 rounded-[2.5rem] bg-foreground/[0.02] border border-foreground/[0.05]">
                            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground/30 flex items-center gap-2">
                                <Eye className="w-4 h-4" />
                                02 / Dados Acessados
                            </h3>
                            <div className="space-y-6">
                                <p className="text-foreground/60 leading-relaxed">
                                    A NeuroNex acessa os seguintes tipos específicos de dados de usuários do Google, exclusivamente mediante autorização explícita do usuário durante o fluxo de consentimento OAuth:
                                </p>
                                <ul className="grid sm:grid-cols-2 gap-4">
                                    {[
                                        { label: "Perfil Básico (openid, profile)", detail: "Nome completo e foto de perfil da conta Google, utilizados para personalizar a interface e identificar o profissional dentro da plataforma." },
                                        { label: "Endereço de E-mail (email)", detail: "Endereço de e-mail principal da conta Google, utilizado como identificador único para autenticação, login e envio de notificações relacionadas ao serviço." },
                                        { label: "Google Calendar (calendar.events)", detail: "Permissão de leitura e escrita em eventos do Google Calendar para sincronização bidirecional de sessões clínicas agendadas na NeuroNex." },
                                        { label: "Identificador Único do Google (sub)", detail: "ID interno do Google utilizado exclusivamente para vincular de forma segura a conta Google ao perfil do profissional na NeuroNex." }
                                    ].map((item, i) => (
                                        <li key={i} className="flex flex-col gap-2 p-5 rounded-2xl bg-white dark:bg-foreground/[0.03] border border-foreground/[0.05]">
                                            <span className="font-semibold text-foreground text-sm">{item.label}</span>
                                            <span className="text-xs text-foreground/40 leading-relaxed">{item.detail}</span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="p-5 rounded-2xl bg-foreground/5 border border-foreground/5">
                                    <div className="flex gap-3 items-start">
                                        <Info className="w-5 h-5 text-foreground/40 mt-0.5 shrink-0" />
                                        <p className="text-xs text-foreground/50 leading-relaxed">
                                            <strong className="text-foreground/70">Importante:</strong> A NeuroNex solicita apenas os escopos de permissão estritamente necessários para o funcionamento do aplicativo. Nenhum dado adicional além dos listados acima é coletado ou acessado. O usuário pode revisar e revogar permissões a qualquer momento nas <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="underline text-foreground/70 hover:text-foreground transition-colors">configurações de segurança da conta Google</a>.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ===== SEÇÃO 3: UTILIZAÇÃO DE DADOS ===== */}
                        <div className="space-y-8 p-10 rounded-[2.5rem] bg-foreground/[0.02] border border-foreground/[0.05]">
                            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground/30 flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                03 / Utilização de Dados
                            </h3>
                            <div className="space-y-6">
                                <p className="text-foreground/60 leading-relaxed">
                                    Os dados de usuários do Google acessados pela NeuroNex são utilizados, processados e gerenciados exclusivamente para as seguintes finalidades:
                                </p>
                                <div className="space-y-3">
                                    {[
                                        {
                                            title: "Autenticação e Login",
                                            desc: "Utilizamos o nome, e-mail e identificador do Google para autenticar o usuário via Google Sign-In (OAuth 2.0), criando e mantendo sessões seguras na plataforma. Isso permite que o profissional acesse sua conta sem necessidade de criar uma senha separada."
                                        },
                                        {
                                            title: "Personalização da Experiência",
                                            desc: "O nome e a foto de perfil do Google são exibidos na interface da NeuroNex (barra de navegação, perfil do profissional) para proporcionar uma experiência personalizada e familiar ao usuário."
                                        },
                                        {
                                            title: "Sincronização de Agenda Clínica",
                                            desc: "Eventos do Google Calendar são lidos e criados para permitir que sessões clínicas agendadas na NeuroNex sejam automaticamente refletidas no calendário do Google do profissional, e vice-versa. Isso evita conflitos de horário e facilita o gerenciamento da agenda."
                                        },
                                        {
                                            title: "Comunicações Relacionadas ao Serviço",
                                            desc: "O endereço de e-mail é utilizado para envio de notificações transacionais (confirmações de agendamento, alertas de sessão, atualizações de segurança) que são essenciais para o funcionamento do serviço."
                                        }
                                    ].map((item, i) => (
                                        <div key={i} className="flex gap-4 p-5 rounded-2xl bg-foreground/[0.02]">
                                            <CheckCircle2 className="w-5 h-5 text-foreground/40 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-semibold text-foreground mb-1">{item.title}</p>
                                                <p className="text-xs text-foreground/50 leading-relaxed">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* AI/ML Disclosure dentro da seção de utilização */}
                                <div className="p-8 rounded-3xl bg-zinc-950 text-white relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-10">
                                        <Database className="w-24 h-24" />
                                    </div>
                                    <h4 className="text-xl font-medium mb-3 relative z-10">Política de IA e Machine Learning</h4>
                                    <p className="text-white/60 leading-relaxed relative z-10 text-sm">
                                        Garantimos de forma absoluta que os dados provenientes das APIs do Google
                                        <strong className="text-white underline decoration-white/30 mx-1">NÃO são utilizados para treinar, melhorar ou ajustar modelos de Inteligência Artificial</strong>
                                        ou algoritmos de aprendizado de máquina. A NeuroNex possui funcionalidades de IA (assistente Synapse), porém estas operam em contextos completamente isolados e efêmeros, sem acesso aos dados do Google do usuário. Os dados do Google são usados exclusivamente para as finalidades descritas acima.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* ===== SEÇÃO 4: COMPARTILHAMENTO DE DADOS ===== */}
                        <div className="space-y-8 p-10 rounded-[2.5rem] bg-foreground/[0.02] border border-foreground/[0.05]">
                            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground/30 flex items-center gap-2">
                                <Share2 className="w-4 h-4" />
                                04 / Compartilhamento de Dados
                            </h3>
                            <div className="space-y-6">
                                <p className="text-foreground/60 leading-relaxed">
                                    A NeuroNex <strong className="text-foreground">não vende, aluga ou comercializa</strong> dados de usuários do Google para terceiros, sob nenhuma circunstcia. O compartilhamento ocorre apenas nos seguintes casos estritamente necessários para o funcionamento do serviço:
                                </p>

                                <div className="space-y-4">
                                    <div className="p-5 rounded-2xl bg-white dark:bg-foreground/[0.03] border border-foreground/[0.05] space-y-2">
                                        <h4 className="font-semibold text-foreground text-sm">Provedores de Infraestrutura</h4>
                                        <p className="text-xs text-foreground/50 leading-relaxed">
                                            <strong className="text-foreground/70">Supabase (hospedado na AWS):</strong> Utilizado como banco de dados e sistema de autenticação. Os dados de perfil (nome, e-mail) e tokens de acesso criptografados são armazenados em servidores da Supabase. A Supabase opera sob rigorosos contratos de processamento de dados (DPA) e conformidade SOC 2 Type II.
                                        </p>
                                    </div>

                                    <div className="p-5 rounded-2xl bg-white dark:bg-foreground/[0.03] border border-foreground/[0.05] space-y-2">
                                        <h4 className="font-semibold text-foreground text-sm">Serviços do Google</h4>
                                        <p className="text-xs text-foreground/50 leading-relaxed">
                                            Os dados são transmitidos de volta ao Google exclusivamente quando o usuário realiza ações que envolvem o Google Calendar (criação/atualização de eventos de sessão clínica). Essa comunicação ocorre via APIs oficiais do Google com criptografia TLS em trnsito.
                                        </p>
                                    </div>

                                    <div className="p-5 rounded-2xl bg-white dark:bg-foreground/[0.03] border border-foreground/[0.05] space-y-2">
                                        <h4 className="font-semibold text-foreground text-sm">Obrigações Legais</h4>
                                        <p className="text-xs text-foreground/50 leading-relaxed">
                                            Podemos divulgar dados quando exigido por lei, ordem judicial ou processo legal válido, sempre notificando o usuário quando permitido por lei.
                                        </p>
                                    </div>
                                </div>

                                <div className="p-5 rounded-2xl bg-foreground/5 border border-foreground/5">
                                    <div className="flex gap-3 items-start">
                                        <Info className="w-5 h-5 text-foreground/40 mt-0.5 shrink-0" />
                                        <p className="text-xs text-foreground/50 leading-relaxed">
                                            <strong className="text-foreground/70">Não compartilhamos dados com:</strong> redes de publicidade, corretores de dados, provedores de informações, revendedores de dados ou quaisquer outras entidades que não sejam estritamente necessárias para a operação do serviço descrito nesta política.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ===== SEÇÃO 5: ARMAZENAMENTO E PROTEÇÃO DE DADOS ===== */}
                        <div className="space-y-8 p-10 rounded-[2.5rem] bg-foreground/[0.02] border border-foreground/[0.05]">
                            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground/30 flex items-center gap-2">
                                <Lock className="w-4 h-4" />
                                05 / Armazenamento e Proteção de Dados
                            </h3>
                            <div className="space-y-6">
                                <p className="text-foreground/60 leading-relaxed">
                                    A NeuroNex adota práticas robustas de segurança para armazenar e proteger os dados dos usuários do Google:
                                </p>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    {[
                                        {
                                            title: "Criptografia em Repouso",
                                            desc: "Todos os dados sensíveis, incluindo tokens de acesso e refresh tokens do Google, são criptografados utilizando AES-256 antes de serem armazenados no banco de dados."
                                        },
                                        {
                                            title: "Criptografia em Trnsito",
                                            desc: "Todas as comunicações entre o aplicativo NeuroNex, os servidores e as APIs do Google são realizadas via HTTPS/TLS 1.2+, garantindo que os dados não possam ser interceptados em trnsito."
                                        },
                                        {
                                            title: "Infraestrutura Segura",
                                            desc: "Os dados são armazenados em servidores da Supabase hospedados na infraestrutura AWS, que oferece conformidade SOC 2 Type II, ISO 27001 e criptografia de disco em repouso."
                                        },
                                        {
                                            title: "Controle de Acesso",
                                            desc: "O acesso ao banco de dados é restrito por Row Level Security (RLS) do PostgreSQL, garantindo que cada usuário só possa acessar seus próprios dados. Políticas de acesso baseadas em roles (RBAC) são aplicadas em toda a plataforma."
                                        },
                                        {
                                            title: "Autenticação Segura",
                                            desc: "Utilizamos OAuth 2.0 via Supabase Auth para autenticação com o Google. Tokens de acesso são armazenados de forma segura no servidor e nunca são expostos ao lado do cliente."
                                        },
                                        {
                                            title: "Monitoramento e Auditoria",
                                            desc: "Logs de acesso e modificações de dados são mantidos para fins de auditoria e detecção de acessos não autorizados. A infraestrutura é monitorada 24/7 com alertas automáticos."
                                        }
                                    ].map((item, i) => (
                                        <div key={i} className="p-5 rounded-2xl bg-white dark:bg-foreground/[0.03] border border-foreground/[0.05] space-y-2">
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

                        {/* ===== SEÇÃO 6: RETENÇÃO E EXCLUSÃO DE DADOS ===== */}
                        <div className="space-y-8 p-10 rounded-[2.5rem] bg-foreground/[0.02] border border-foreground/[0.05]">
                            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground/30 flex items-center gap-2">
                                <Trash2 className="w-4 h-4" />
                                06 / Retenção e Exclusão de Dados
                            </h3>
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <h4 className="text-xl font-medium text-foreground">Período de Retenção</h4>
                                    <div className="space-y-3">
                                        <div className="flex gap-4 p-5 rounded-2xl bg-foreground/[0.02]">
                                            <CheckCircle2 className="w-5 h-5 text-foreground/40 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-semibold text-foreground mb-1">Dados de Perfil (nome, e-mail, foto)</p>
                                                <p className="text-xs text-foreground/50 leading-relaxed">Retidos enquanto a conta do usuário estiver ativa na plataforma NeuroNex. Os dados são utilizados para manter o funcionamento contínuo do serviço.</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4 p-5 rounded-2xl bg-foreground/[0.02]">
                                            <CheckCircle2 className="w-5 h-5 text-foreground/40 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-semibold text-foreground mb-1">Tokens de Acesso ao Google</p>
                                                <p className="text-xs text-foreground/50 leading-relaxed">Retidos enquanto a integração com o Google Calendar estiver ativa. Os tokens são automaticamente invalidados pelo Google quando o usuário revoga o acesso.</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4 p-5 rounded-2xl bg-foreground/[0.02]">
                                            <CheckCircle2 className="w-5 h-5 text-foreground/40 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-semibold text-foreground mb-1">Dados de Sincronização do Calendar</p>
                                                <p className="text-xs text-foreground/50 leading-relaxed">Os eventos sincronizados são retidos enquanto o agendamento existir na plataforma. Dados de sincronização temporários são eliminados após o processamento.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-xl font-medium text-foreground">Como Solicitar a Exclusão dos Seus Dados</h4>
                                    <p className="text-foreground/60 leading-relaxed text-sm">
                                        O usuário tem o direito de solicitar a exclusão de todos os seus dados a qualquer momento. Oferecemos os seguintes mecanismos:
                                    </p>
                                    <div className="space-y-3">
                                        <div className="flex gap-4 p-5 rounded-2xl bg-white dark:bg-foreground/[0.03] border border-foreground/[0.05]">
                                            <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold shrink-0">1</div>
                                            <div>
                                                <p className="text-sm font-semibold text-foreground mb-1">Exclusão pela Plataforma</p>
                                                <p className="text-xs text-foreground/50 leading-relaxed">Acesse as configurações da sua conta na NeuroNex e selecione "Excluir Conta". Todos os seus dados, incluindo dados obtidos do Google, serão permanentemente apagados em até 30 dias.</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4 p-5 rounded-2xl bg-white dark:bg-foreground/[0.03] border border-foreground/[0.05]">
                                            <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold shrink-0">2</div>
                                            <div>
                                                <p className="text-sm font-semibold text-foreground mb-1">Solicitação por E-mail</p>
                                                <p className="text-xs text-foreground/50 leading-relaxed">Envie um e-mail para <strong className="text-foreground">suporte@neuronexai.com.br</strong> com o assunto "Solicitação de Exclusão de Dados". Responderemos em até 5 dias úteis e a exclusão completa será realizada em até 30 dias.</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4 p-5 rounded-2xl bg-white dark:bg-foreground/[0.03] border border-foreground/[0.05]">
                                            <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold shrink-0">3</div>
                                            <div>
                                                <p className="text-sm font-semibold text-foreground mb-1">Revogação de Acesso pelo Google</p>
                                                <p className="text-xs text-foreground/50 leading-relaxed">Você pode revogar o acesso da NeuroNex aos seus dados do Google a qualquer momento acessando <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="underline text-foreground/70 hover:text-foreground transition-colors">myaccount.google.com/permissions</a>. Ao revogar, os tokens serão invalidados imediatamente e os dados sincronizados serão excluídos dos nossos servidores em até 30 dias.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 rounded-2xl bg-foreground/5 border border-foreground/5">
                                    <div className="flex gap-3 items-start">
                                        <Info className="w-5 h-5 text-foreground/40 mt-0.5 shrink-0" />
                                        <p className="text-xs text-foreground/50 leading-relaxed">
                                            <strong className="text-foreground/70">Nota:</strong> Após a exclusão, os dados não poderão ser recuperados. Dados anonimizados e agregados para fins estatísticos podem ser retidos, pois não permitem a identificação individual do usuário. Dados que precisam ser retidos por obrigação legal (ex: registros fiscais) serão mantidos pelo período exigido por lei e então excluídos.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ===== SEÇÃO 7: CONFORMIDADE COM POLÍTICAS DO GOOGLE ===== */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground/30 flex items-center gap-2">
                                <Globe className="w-4 h-4" />
                                07 / Conformidade com Políticas do Google
                            </h3>
                            <div className="p-8 rounded-3xl bg-zinc-950 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    <ShieldCheck className="w-24 h-24" />
                                </div>
                                <h4 className="text-xl font-medium mb-4 relative z-10">Uso Limitado (Limited Use)</h4>
                                <div className="space-y-4 relative z-10">
                                    <p className="text-white/60 leading-relaxed text-sm">
                                        O uso de informações recebidas das APIs do Google pela NeuroNex está em total conformidade com a
                                        <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="mx-1 underline text-white/80 hover:text-white transition-colors">Política de Dados do Usuário dos Serviços de API do Google</a>,
                                        incluindo os requisitos de Uso Limitado. Especificamente:
                                    </p>
                                    <ul className="space-y-2">
                                        {[
                                            "Usamos os dados do Google apenas para fornecer e melhorar os recursos voltados ao usuário que são proeminentes na interface do aplicativo.",
                                            "Não transferimos dados do Google para terceiros, exceto conforme necessário para fornecer e melhorar os recursos do aplicativo, em conformidade com a lei, ou como parte de uma fusão/aquisição com proteções adequadas.",
                                            "Não usamos dados do Google para veicular anúncios, inclusive retargeting ou publicidade personalizada.",
                                            "Não permitimos que humanos leiam os dados dos usuários, exceto com consentimento explícito, para fins de segurança, para cumprir leis aplicáveis, ou quando os dados são agregados e anonimizados para operações internas."
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

                        {/* 8. Contact */}
                        <div className="rounded-[2.5rem] bg-foreground text-background p-12 text-center">
                            <h3 className="text-2xl font-medium mb-4">Dúvidas sobre Privacidade?</h3>
                            <p className="text-background/60 mb-6 max-w-lg mx-auto">
                                Se você tiver alguma dúvida sobre esta política, sobre como seus dados são tratados, ou quiser exercer seus direitos, entre em contato com nossa equipe de proteção de dados.
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

export default PoliticaDePrivacidade;
