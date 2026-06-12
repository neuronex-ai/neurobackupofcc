"use client";

import { FadeIn } from "@/components/animations/FadeIn";
import { Footer } from "@/components/landing/Footer";
import { LandingMobileNav } from "@/components/landing/LandingMobileNav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BrainCircuit,
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardList,
  CreditCard,
  FileCheck2,
  FileText,
  Fingerprint,
  Layers,
  LockKeyhole,
  MessageCircle,
  Mic2,
  MonitorPlay,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { useMemo, useState, type ElementType, type ReactNode } from "react";
import { Link } from "react-router-dom";

const MobileBadge = ({ children, icon: Icon = Sparkles, inverted = false }: { children: ReactNode; icon?: ElementType<{ className?: string }>; inverted?: boolean }) => (
  <div
    className={cn(
      "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[8px] font-black uppercase tracking-[0.22em] backdrop-blur-sm",
      inverted
        ? "border-background/15 bg-background/[0.08] text-background/62 dark:border-zinc-950/10 dark:bg-zinc-950/[0.055] dark:text-zinc-950/60"
        : "border-border/40 bg-foreground/[0.035] text-muted-foreground dark:border-white/10 dark:bg-white/[0.045] dark:text-white/48"
    )}
  >
    <Icon className="h-3.5 w-3.5" />
    {children}
  </div>
);

const MobileSectionHeader = ({ eyebrow, title, description, inverted = false }: { eyebrow: string; title: ReactNode; description?: string; inverted?: boolean }) => (
  <div className="mx-auto max-w-sm text-center">
    <FadeIn>
      <MobileBadge inverted={inverted}>{eyebrow}</MobileBadge>
    </FadeIn>
    <FadeIn delay={0.1}>
      <h2 className={cn("mt-6 text-[2.55rem] font-black leading-[0.88] tracking-[-0.065em]", inverted ? "text-background dark:text-zinc-950" : "text-foreground")}>{title}</h2>
    </FadeIn>
    {description ? (
      <FadeIn delay={0.18}>
        <p className={cn("mx-auto mt-5 max-w-[21rem] text-[0.92rem] font-medium leading-relaxed", inverted ? "text-background/60 dark:text-zinc-950/62" : "text-muted-foreground/70")}>{description}</p>
      </FadeIn>
    ) : null}
  </div>
);

const painPoints = [
  { icon: CalendarDays, title: "Ferramentas soltas", text: "Agenda, prontuário, cobrança e paciente em lugares diferentes." },
  { icon: WalletCards, title: "Financeiro manual", text: "Pix, boletos, repasses e inadimplência fora da operação clínica." },
  { icon: ReceiptText, title: "Fiscal repetitivo", text: "NFS-e, recibos e Receita Saúde viram tarefas extras no fim do dia." },
  { icon: MessageCircle, title: "Paciente sem continuidade", text: "Diário, humor e vínculo entre sessões raramente entram no fluxo." },
];

const diffRows = [
  { title: "Atendimento", old: "Registro manual e histórico disperso.", neo: "Prontuário vivo com evolução, contexto e resumos." },
  { title: "Paciente", old: "Acompanhamento para na sessão.", neo: "Portal com diário, rastreio de humor e continuidade." },
  { title: "Teleconsulta", old: "Vídeo sem documentação estruturada.", neo: "Sala HD com transcrição e resumo por IA." },
  { title: "Financeiro", old: "Pix, boleto e planilha separados.", neo: "NeuroFinance com cobranças, extrato e saques." },
  { title: "Fiscal", old: "NFS-e e recibos fora do fluxo.", neo: "Rotinas fiscais conectadas à cobrança." },
  { title: "IA", old: "Chat genérico, sem contexto.", neo: "Synapse com texto, voz, WhatsApp e NeuroBox." },
];

const productModules = [
  { key: "agenda", label: "Agenda", title: "Agenda Inteligente", icon: CalendarDays, text: "Horários, confirmações e visão operacional do dia em um fluxo único.", bullets: ["Visão diária", "Confirmações", "Base para receita"] },
  { key: "prontuario", label: "Prontuário", title: "Prontuário Vivo", icon: ClipboardList, text: "Histórico clínico, evolução, documentos e resumos em uma experiência segura.", bullets: ["Linha do tempo", "Resumo por IA", "Documentos"] },
  { key: "teleconsulta", label: "Teleconsulta", title: "Teleconsulta HD", icon: MonitorPlay, text: "Atendimento online com transcrição e resumo para reduzir retrabalho.", bullets: ["Sala online", "Transcrição", "Resumo clínico"] },
  { key: "portal", label: "Portal", title: "Portal do Paciente", icon: Users, text: "Diário, rastreio de humor e vínculo entre sessões para o paciente.", bullets: ["Diário", "Humor", "Mobile"] },
  { key: "financeiro", label: "Financeiro", title: "NeuroFinance", icon: CreditCard, text: "Cobranças, Pix, boletos, saques, extrato e saúde da conta no mesmo painel.", bullets: ["Pix e QR Code", "Boletos", "Extrato"] },
  { key: "fiscal", label: "Fiscal", title: "NFS-e e Receita Saúde", icon: FileCheck2, text: "Rotinas fiscais pensadas para acompanhar o fluxo real da clínica.", bullets: ["NFS-e", "Recibos", "Dados conectados"] },
];

const operatingCards = [
  { icon: Stethoscope, title: "Gestão clínica", text: "Agenda, pacientes, prontuário, documentos e teleconsulta." },
  { icon: BrainCircuit, title: "IA contextual", text: "Synapse, voz, texto, NeuroBox e apoio operacional." },
  { icon: MessageCircle, title: "Comunicação", text: "Portal do Paciente, WhatsApp, lembretes e continuidade." },
  { icon: CreditCard, title: "Financeiro", text: "Cobranças, Pix, boletos, QR Code, extrato e saques." },
  { icon: FileCheck2, title: "Fiscal", text: "NFS-e, Receita Saúde e rotinas fiscais conectadas." },
  { icon: BarChart3, title: "Relatórios", text: "Visão clínica, financeira e operacional para decisão." },
];

const synapseFeatures = [
  { icon: FileText, title: "Texto", text: "Apoio para escrita, resumos, registros e documentação." },
  { icon: Mic2, title: "Voz", text: "Comandos naturais para acelerar tarefas repetitivas." },
  { icon: MessageCircle, title: "WhatsApp", text: "Comunicação e automações com limites profissionais." },
  { icon: BrainCircuit, title: "NeuroBox", text: "IAs especializadas para tarefas clínicas e administrativas." },
];

const plans = [
  {
    name: "Essential",
    eyebrow: "Founder incluso",
    price: "R$ 0",
    period: "/mês",
    featured: false,
    href: "/create-account?plan=essential",
    cta: "Criar grátis",
    features: [
      "Selo Founder + benefícios VIP",
      "Gestão do consultório completa",
      "Synapse texto com acesso limitado",
      "Teleconsulta HD com transcrição e resumo por IA",
      "Portal do Paciente + diário e rastreio de humor",
      "Relatórios completos essenciais",
    ],
  },
  {
    name: "Profissional",
    eyebrow: "7 dias grátis",
    price: "R$ 140,00",
    period: "/mês",
    featured: true,
    href: "/create-account?plan=professional",
    cta: "Testar grátis",
    features: [
      "Tudo do Essential",
      "Synapse texto e voz com limites maiores",
      "Synapse no WhatsApp incluso",
      "NeuroBox com IAs NeuroNex",
      "Gestão Financeira + NeuroFinance",
      "NFS-e no automático e cobranças",
    ],
  },
  {
    name: "Enterprise",
    eyebrow: "Sob medida",
    price: "Personalizado",
    period: "",
    featured: false,
    href: "/help",
    cta: "Contatar suporte",
    features: [
      "Implantação personalizada",
      "Multi-profissionais e permissões",
      "Relatórios consolidados",
      "Treinamento e configuração assistida",
      "Condições comerciais por volume",
    ],
  },
];

const comparisonFeatures = [
  ["Agenda e pacientes", "Essencial", "Completo", "Completo"],
  ["Prontuário", "Completo", "Completo", "Completo"],
  ["Portal do Paciente", "Incluído", "Incluído", "Incluído"],
  ["Teleconsulta HD", "Limite inicial", "Limites maiores", "Sob medida"],
  ["Synapse texto", "Limitado", "Maior limite", "Dedicado"],
  ["Synapse voz", "—", "Incluído", "Dedicado"],
  ["WhatsApp", "—", "Incluído", "Sob medida"],
  ["NeuroFinance", "Básico", "Completo", "Operação"],
  ["NFS-e", "—", "Incluído", "Sob medida"],
  ["Suporte", "Comunidade", "Prioritário", "Dedicado"],
];

const faqs = [
  { q: "O NeuroNex substitui meu sistema atual?", a: "A proposta é centralizar a rotina clínica. Agenda, pacientes, prontuário, teleconsulta, portal, financeiro e IA passam a conversar no mesmo fluxo." },
  { q: "O Synapse toma decisões clínicas?", a: "Não. O Synapse apoia documentação, organização e operação. A decisão clínica continua sempre com o psicólogo." },
  { q: "O NeuroFinance movimenta dinheiro real?", a: "Sim, quando a conta financeira é criada e aprovada. Pix, cobranças, boletos e saques operam dentro do fluxo financeiro." },
  { q: "O Profissional tem teste grátis?", a: "Sim. A condição de pré-lançamento prevê 7 dias grátis e benefícios Founder." },
];

const HeroMobile = () => (
  <section className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-5 pb-10 pt-28 text-center">
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-foreground/[0.05] blur-[110px] dark:bg-white/[0.06]" />
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-background to-transparent" />
    </div>

    <div className="relative z-10 mx-auto flex max-w-sm flex-col items-center">
      <FadeIn>
        <MobileBadge>Sistema operacional para psicólogos</MobileBadge>
      </FadeIn>
      <FadeIn delay={0.1}>
        <h1 className="mt-7 text-[3.65rem] font-black leading-[0.86] tracking-[-0.075em] text-foreground">
          Sua clínica inteira, organizada por IA.
        </h1>
      </FadeIn>
      <FadeIn delay={0.2}>
        <p className="mt-6 max-w-[21rem] text-base font-medium leading-relaxed text-muted-foreground/72">
          Prontuário, agenda, teleconsulta, financeiro, NFS-e, portal do paciente e Synapse em uma única experiência.
        </p>
      </FadeIn>
      <FadeIn delay={0.3} className="mt-9 w-full">
        <div className="grid gap-3">
          <Link to="/create-account" className="w-full">
            <Button className="h-14 w-full rounded-2xl bg-foreground text-[10px] font-black uppercase tracking-[0.22em] text-background shadow-premium active:scale-[0.98]">
              Começar grátis <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <button type="button" onClick={() => document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" })} className="w-full">
            <Button variant="ghost" className="h-14 w-full rounded-2xl border border-border/35 bg-foreground/[0.035] text-[10px] font-black uppercase tracking-[0.22em] text-foreground/75 active:scale-[0.98] dark:border-white/10 dark:bg-white/[0.045]">
              Ver planos
            </Button>
          </button>
        </div>
      </FadeIn>
    </div>

    <FadeIn delay={0.55}>
      <motion.div animate={{ y: [0, 7, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }} className="relative z-10 mt-12 flex flex-col items-center gap-2 text-foreground/28">
        <span className="text-[8px] font-black uppercase tracking-[0.38em]">Scroll</span>
        <ChevronDown className="h-4 w-4" />
      </motion.div>
    </FadeIn>
  </section>
);

const ProblemMobile = () => (
  <section id="problem" className="relative overflow-hidden bg-background px-5 py-16">
    <MobileSectionHeader
      eyebrow="O problema real"
      title={<>O que consome tempo é o operacional.</>}
      description="A clínica cresce, mas as ferramentas ficam espalhadas. O NeuroNex conecta tudo em um único fluxo."
    />
    <div className="mt-10 grid gap-3">
      {painPoints.map((item, index) => (
        <FadeIn key={item.title} delay={index * 0.04}>
          <article className="rounded-[28px] border border-border/40 bg-card/70 p-5 dark:border-white/10 dark:bg-white/[0.035]">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-foreground text-background">
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black tracking-[-0.03em] text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm font-medium leading-relaxed text-muted-foreground/70">{item.text}</p>
              </div>
            </div>
          </article>
        </FadeIn>
      ))}
    </div>
  </section>
);

const DifferentiatorMobile = () => (
  <section id="diferenciais" className="relative overflow-hidden bg-background px-5 py-16">
    <MobileSectionHeader
      eyebrow="O diferencial"
      title={<>Do jeito comum ao jeito NeuroNex.</>}
      description="A mesma rotina, mas sem fragmentação, retrabalho e decisões sem dados."
    />
    <div className="mt-10 space-y-4">
      {diffRows.map((row, index) => (
        <FadeIn key={row.title} delay={index * 0.04}>
          <article className="overflow-hidden rounded-[30px] border border-border/40 bg-card dark:border-white/10 dark:bg-[#0b0b0d]">
            <div className="border-b border-border/40 bg-foreground/[0.04] p-5 dark:border-white/10 dark:bg-white/[0.035]">
              <p className="text-[9px] font-black uppercase tracking-[0.24em] text-muted-foreground">{String(index + 1).padStart(2, "0")}</p>
              <h3 className="mt-2 text-xl font-black tracking-[-0.04em] text-foreground">{row.title}</h3>
            </div>
            <div className="grid divide-y divide-border/40 dark:divide-white/10">
              <div className="flex items-start gap-3 p-5">
                <X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground">Jeito comum</p>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-muted-foreground/75">{row.old}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-foreground p-5 text-background dark:bg-white dark:text-zinc-950">
                <Check className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] opacity-55">Jeito NeuroNex</p>
                  <p className="mt-2 text-sm font-semibold leading-relaxed opacity-82">{row.neo}</p>
                </div>
              </div>
            </div>
          </article>
        </FadeIn>
      ))}
    </div>
  </section>
);

const ProductPreviewMobile = ({ active }: { active: typeof productModules[number] }) => {
  const rows = useMemo(() => ["Paciente atualizado", "Resumo pendente", "Cobrança enviada"], []);

  return (
    <div className="relative overflow-hidden rounded-[34px] border border-border/40 bg-card/80 p-4 shadow-premium dark:border-white/10 dark:bg-[#09090b]">
      <div className="flex items-center gap-3 rounded-[24px] border border-border/40 bg-background/80 p-4 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-foreground text-background">
          <active.icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.22em] text-muted-foreground">NeuroNex</p>
          <h3 className="text-sm font-black uppercase tracking-[0.12em] text-foreground">{active.title}</h3>
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={active.key} initial={{ opacity: 0, y: 14, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -10, filter: "blur(8px)" }} transition={{ duration: 0.28 }} className="mt-4">
          <div className="rounded-[26px] border border-border/40 bg-background/70 p-5 dark:border-white/10 dark:bg-white/[0.035]">
            <p className="text-[9px] font-black uppercase tracking-[0.24em] text-muted-foreground">Módulo</p>
            <h4 className="mt-3 text-3xl font-black leading-[0.9] tracking-[-0.06em] text-foreground">{active.title}</h4>
            <p className="mt-4 text-sm font-medium leading-relaxed text-muted-foreground/72">{active.text}</p>
            <div className="mt-6 space-y-2">
              {active.bullets.map((bullet) => (
                <div key={bullet} className="flex items-center gap-3 rounded-2xl border border-border/35 bg-foreground/[0.025] px-4 py-3 text-[10px] font-black uppercase tracking-[0.13em] text-foreground/70 dark:border-white/10 dark:bg-white/[0.035]">
                  <Check className="h-4 w-4" />
                  {bullet}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 rounded-[26px] bg-foreground p-5 text-background dark:bg-white dark:text-zinc-950">
            <p className="text-[9px] font-black uppercase tracking-[0.22em] opacity-55">Preview</p>
            <div className="mt-4 space-y-2">
              {rows.map((row) => (
                <div key={row} className="rounded-2xl border border-background/10 bg-background/[0.08] px-4 py-3 text-xs font-bold opacity-78 dark:border-zinc-950/10 dark:bg-zinc-950/[0.045]">{row}</div>
              ))}
            </div>
            <p className="mt-4 text-xs font-medium leading-relaxed opacity-55">Aqui entram os prints reais do Drive na próxima rodada.</p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const ProductMobile = () => {
  const [activeKey, setActiveKey] = useState(productModules[0].key);
  const active = productModules.find((item) => item.key === activeKey) || productModules[0];

  return (
    <section id="produto" className="relative overflow-hidden bg-background px-5 py-16">
      <MobileSectionHeader
        eyebrow="Por dentro"
        title={<>Um produto real para operar a clínica.</>}
        description="A estrutura mobile já está pronta para receber os prints reais das abas internas."
      />
      <div className="-mx-5 mt-9 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max gap-2">
          {productModules.map((module) => (
            <button key={module.key} type="button" onClick={() => setActiveKey(module.key)} className={cn("flex items-center gap-2 rounded-2xl px-4 py-3 text-[9px] font-black uppercase tracking-[0.16em] transition-all", activeKey === module.key ? "bg-foreground text-background" : "border border-border/40 bg-card text-muted-foreground dark:border-white/10 dark:bg-white/[0.035]") }>
              <module.icon className="h-4 w-4" />
              {module.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-5">
        <ProductPreviewMobile active={active} />
      </div>
    </section>
  );
};

const OperatingSystemMobile = () => (
  <section id="sistema" className="relative overflow-hidden bg-foreground px-5 py-16 text-background dark:bg-white dark:text-zinc-950">
    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.12),transparent_38%,rgba(255,255,255,0.04))] dark:bg-[linear-gradient(135deg,rgba(0,0,0,0.06),transparent_38%,rgba(0,0,0,0.02))]" />
    <div className="relative z-10">
      <MobileSectionHeader
        eyebrow="Sistema operacional"
        title={<>Um único sistema para a clínica inteira.</>}
        description="Não é só agenda, prontuário ou financeiro. É uma camada operacional conectada."
        inverted
      />
      <div className="mt-10 grid gap-3">
        {operatingCards.map((card, index) => (
          <FadeIn key={card.title} delay={index * 0.04}>
            <article className="rounded-[26px] border border-background/10 bg-background/[0.07] p-5 dark:border-zinc-950/10 dark:bg-zinc-950/[0.045]">
              <card.icon className="h-5 w-5 opacity-58" />
              <h3 className="mt-6 text-lg font-black tracking-[-0.03em]">{card.title}</h3>
              <p className="mt-2 text-sm font-medium leading-relaxed opacity-62">{card.text}</p>
            </article>
          </FadeIn>
        ))}
      </div>
    </div>
  </section>
);

const SynapseMobile = () => (
  <section id="synapse" className="relative overflow-hidden bg-background px-5 py-16">
    <MobileSectionHeader
      eyebrow="Synapse AI"
      title={<>Não é um chat. É inteligência operacional.</>}
      description="Apoio para documentação, organização, comunicação e rotina. A decisão clínica continua com o psicólogo."
    />
    <FadeIn delay={0.15}>
      <div className="mt-10 rounded-[34px] border border-border/40 bg-card/80 p-4 dark:border-white/10 dark:bg-white/[0.035]">
        <div className="rounded-[28px] bg-foreground p-6 text-background dark:bg-white dark:text-zinc-950">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background text-foreground dark:bg-zinc-950 dark:text-white"><Sparkles className="h-5 w-5" /></div>
            <span className="text-[9px] font-black uppercase tracking-[0.22em] opacity-50">contexto ativo</span>
          </div>
          <p className="mt-10 text-3xl font-black leading-[0.92] tracking-[-0.06em]">Agenda, prontuário, paciente e financeiro no mesmo raciocínio.</p>
        </div>
      </div>
    </FadeIn>
    <div className="mt-4 grid gap-3">
      {synapseFeatures.map((feature, index) => (
        <FadeIn key={feature.title} delay={index * 0.04}>
          <article className="rounded-[26px] border border-border/40 bg-card/70 p-5 dark:border-white/10 dark:bg-white/[0.035]">
            <feature.icon className="h-5 w-5 text-muted-foreground" />
            <h3 className="mt-6 text-lg font-black tracking-[-0.03em] text-foreground">{feature.title}</h3>
            <p className="mt-2 text-sm font-medium leading-relaxed text-muted-foreground/70">{feature.text}</p>
          </article>
        </FadeIn>
      ))}
    </div>
  </section>
);

const FinanceFiscalMobile = () => (
  <section id="financeiro" className="relative overflow-hidden bg-background px-5 py-16">
    <div className="grid gap-4">
      <FadeIn>
        <article className="rounded-[36px] border border-border/40 bg-card/80 p-6 dark:border-white/10 dark:bg-white/[0.035]">
          <WalletCards className="h-7 w-7 text-muted-foreground" />
          <h2 className="mt-8 text-[2.45rem] font-black leading-[0.88] tracking-[-0.065em] text-foreground">NeuroFinance para receber, cobrar e decidir.</h2>
          <p className="mt-5 text-sm font-medium leading-relaxed text-muted-foreground/70">Pix, QR Code, boletos, cobranças, saques e extrato em um painel financeiro feito para consultórios.</p>
          <div className="mt-7 grid gap-2">
            {["Pix e QR Code", "Boletos e cobranças", "Extrato e repasses", "Saúde da conta"].map((item) => <div key={item} className="rounded-2xl border border-border/40 bg-foreground/[0.035] px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-foreground/70 dark:border-white/10 dark:bg-white/[0.045]">{item}</div>)}
          </div>
        </article>
      </FadeIn>
      <FadeIn delay={0.08}>
        <article className="rounded-[36px] bg-foreground p-6 text-background shadow-premium dark:bg-white dark:text-zinc-950">
          <FileCheck2 className="h-7 w-7 opacity-60" />
          <h2 className="mt-8 text-[2.45rem] font-black leading-[0.88] tracking-[-0.065em]">Fiscal no automático, sem sair da operação.</h2>
          <p className="mt-5 text-sm font-medium leading-relaxed opacity-62">NFS-e, Receita Saúde, recibos e cobranças precisam conversar com paciente, agenda e financeiro.</p>
          <div className="mt-7 grid gap-2">
            {["NFS-e", "Receita Saúde", "Recibos", "Dados conectados"].map((item) => <div key={item} className="rounded-2xl border border-background/10 bg-background/[0.08] px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] opacity-72 dark:border-zinc-950/10 dark:bg-zinc-950/[0.045]">{item}</div>)}
          </div>
        </article>
      </FadeIn>
    </div>
  </section>
);

const PlansMobile = () => (
  <section id="waitlist" className="relative overflow-hidden bg-background px-5 py-16">
    <MobileSectionHeader
      eyebrow="Planos NeuroNex"
      title={<>Escolha o plano ideal para a sua clínica.</>}
      description="Comece com o Essential, evolua para o Profissional ou fale com suporte para uma estrutura personalizada."
    />
    <div className="mt-10 space-y-4">
      {plans.map((plan, index) => (
        <FadeIn key={plan.name} delay={index * 0.05}>
          <article className={cn("relative overflow-hidden rounded-[34px] border p-6 shadow-premium", plan.featured ? "border-foreground/20 bg-foreground text-background dark:bg-white dark:text-zinc-950" : "border-border/40 bg-card/80 dark:border-white/10 dark:bg-white/[0.035]") }>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className={cn("text-[9px] font-black uppercase tracking-[0.22em]", plan.featured ? "opacity-55" : "text-muted-foreground")}>{plan.eyebrow}</p>
                <h3 className={cn("mt-3 text-3xl font-black tracking-[-0.055em]", !plan.featured && "text-foreground")}>{plan.name}</h3>
              </div>
              {plan.featured ? <BadgeCheck className="h-6 w-6 opacity-72" /> : <Sparkles className="h-6 w-6 text-muted-foreground" />}
            </div>
            <div className="mt-5 flex items-end gap-2">
              <span className="text-4xl font-black tracking-[-0.06em]">{plan.price}</span>
              {plan.period ? <span className={cn("pb-1 text-xs font-bold", plan.featured ? "opacity-45" : "text-muted-foreground/60")}>{plan.period}</span> : null}
            </div>
            <div className="mt-7 space-y-3">
              {plan.features.map((feature) => (
                <div key={feature} className={cn("flex items-start gap-3 text-sm font-semibold leading-relaxed", plan.featured ? "opacity-75" : "text-muted-foreground/76") }>
                  <Check className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
            <Button asChild className={cn("mt-8 h-14 w-full rounded-2xl text-[10px] font-black uppercase tracking-[0.2em]", plan.featured ? "bg-background text-foreground hover:bg-background/90 dark:bg-zinc-950 dark:text-white" : "bg-foreground text-background hover:bg-foreground/90") }>
              <Link to={plan.href}>{plan.cta} <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </article>
        </FadeIn>
      ))}
    </div>
  </section>
);

const ComparisonMobile = () => (
  <section id="comparativo" className="relative overflow-hidden bg-background px-5 py-16">
    <MobileSectionHeader
      eyebrow="Comparativo"
      title={<>Veja o que muda em cada plano.</>}
      description="O Profissional é o plano principal para operar a clínica com IA, financeiro e automações."
    />
    <FadeIn delay={0.15}>
      <div className="mt-10 overflow-hidden rounded-[30px] border border-border/40 bg-card dark:border-white/10 dark:bg-[#0b0b0d]">
        <div className="grid grid-cols-[1.05fr_0.85fr_0.9fr] border-b border-border/40 text-[8px] font-black uppercase tracking-[0.14em] text-muted-foreground dark:border-white/10">
          <div className="p-4">Recurso</div>
          <div className="p-4 text-center">Essential</div>
          <div className="bg-foreground p-4 text-center text-background dark:bg-white dark:text-zinc-950">Pro</div>
        </div>
        {comparisonFeatures.slice(0, 10).map((row) => (
          <div key={row[0]} className="grid grid-cols-[1.05fr_0.85fr_0.9fr] border-b border-border/35 last:border-b-0 dark:border-white/10">
            <div className="p-4 text-xs font-bold text-foreground">{row[0]}</div>
            <div className="p-4 text-center text-[11px] font-semibold text-muted-foreground/75">{row[1]}</div>
            <div className="bg-foreground p-4 text-center text-[11px] font-semibold text-background dark:bg-white dark:text-zinc-950">{row[2]}</div>
          </div>
        ))}
      </div>
    </FadeIn>
  </section>
);

const TrustFAQMobile = () => {
  const [open, setOpen] = useState(0);

  return (
    <section id="seguranca" className="relative overflow-hidden bg-background px-5 py-16">
      <FadeIn>
        <article className="rounded-[36px] border border-border/40 bg-card/80 p-6 dark:border-white/10 dark:bg-white/[0.035]">
          <ShieldCheck className="h-7 w-7 text-muted-foreground" />
          <h2 className="mt-8 text-[2.45rem] font-black leading-[0.88] tracking-[-0.065em] text-foreground">Construído para uma rotina sensível.</h2>
          <p className="mt-5 text-sm font-medium leading-relaxed text-muted-foreground/70">Psicologia exige responsabilidade. Segurança, controle de acesso, rastreabilidade e uso cuidadoso de IA precisam estar no centro.</p>
          <div className="mt-7 space-y-2">
            {["LGPD e controle de acesso", "IA como apoio, não substituição", "Rastreabilidade de dados sensíveis"].map((item) => <div key={item} className="flex items-center gap-3 rounded-2xl border border-border/40 bg-foreground/[0.035] px-4 py-3 text-xs font-bold text-foreground/75 dark:border-white/10 dark:bg-white/[0.04]"><LockKeyhole className="h-4 w-4" />{item}</div>)}
          </div>
        </article>
      </FadeIn>
      <div className="mt-4 overflow-hidden rounded-[30px] border border-border/40 bg-card/80 dark:border-white/10 dark:bg-white/[0.035]">
        {faqs.map((faq, index) => (
          <button key={faq.q} type="button" onClick={() => setOpen(open === index ? -1 : index)} className="block w-full border-b border-border/35 px-5 py-5 text-left last:border-b-0 dark:border-white/10">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-sm font-black tracking-[-0.02em] text-foreground">{faq.q}</h3>
              <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open === index && "rotate-180")} />
            </div>
            <AnimatePresence initial={false}>
              {open === index && (
                <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden pt-4 text-sm font-medium leading-relaxed text-muted-foreground/70">
                  {faq.a}
                </motion.p>
              )}
            </AnimatePresence>
          </button>
        ))}
      </div>
    </section>
  );
};

const NativeExperienceMobile = () => (
  <section id="downloads" className="relative overflow-hidden bg-background px-5 py-16">
    <div className="rounded-[38px] border border-border/40 bg-card/70 p-6 text-center shadow-premium dark:border-white/10 dark:bg-white/[0.035]">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground text-background">
        <Layers className="h-6 w-6" />
      </div>
      <h2 className="mt-8 text-[2.35rem] font-black leading-[0.9] tracking-[-0.06em] text-foreground">Fluidez em qualquer tela.</h2>
      <p className="mx-auto mt-5 max-w-xs text-sm font-medium leading-relaxed text-muted-foreground/66">Experiência web, desktop e mobile pensada para acompanhar a rotina da clínica onde ela acontecer.</p>
      <div className="mt-7 grid grid-cols-2 gap-2">
        {['Windows/Mac', 'iOS/Android'].map((item) => <div key={item} className="rounded-2xl border border-border/40 bg-foreground/[0.035] px-4 py-3 text-[9px] font-black uppercase tracking-[0.16em] text-muted-foreground dark:border-white/10 dark:bg-white/[0.045]">{item}</div>)}
      </div>
    </div>
  </section>
);

const FinalCTAMobile = () => (
  <section id="cta-final" className="relative overflow-hidden bg-background px-5 py-16">
    <div className="overflow-hidden rounded-[40px] bg-foreground p-8 text-center text-background shadow-premium dark:bg-white dark:text-zinc-950">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-background text-foreground dark:bg-zinc-950 dark:text-white">
        <Fingerprint className="h-6 w-6" />
      </div>
      <h2 className="mt-8 text-[2.65rem] font-black leading-[0.86] tracking-[-0.07em]">A próxima versão da sua clínica começa aqui.</h2>
      <p className="mt-6 text-sm font-medium leading-relaxed opacity-62">Entre agora, garanta benefícios Founder e evolua sua operação com IA, financeiro e gestão em um único lugar.</p>
      <div className="mt-8 grid gap-3">
        <Button asChild className="h-14 rounded-2xl bg-background text-[10px] font-black uppercase tracking-[0.22em] text-foreground hover:bg-background/90 dark:bg-zinc-950 dark:text-white">
          <Link to="/create-account">Começar grátis <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
        <Button asChild variant="outline" className="h-14 rounded-2xl border-background/20 bg-background/5 text-[10px] font-black uppercase tracking-[0.22em] text-background hover:bg-background/10 dark:border-zinc-950/20 dark:text-zinc-950">
          <Link to="/help">Falar com suporte</Link>
        </Button>
      </div>
    </div>
  </section>
);

export const MobileIndex = () => {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background font-sans text-foreground selection:bg-primary/30">
      <main>
        <HeroMobile />
        <ProblemMobile />
        <DifferentiatorMobile />
        <ProductMobile />
        <OperatingSystemMobile />
        <SynapseMobile />
        <FinanceFiscalMobile />
        <PlansMobile />
        <ComparisonMobile />
        <TrustFAQMobile />
        <NativeExperienceMobile />
        <FinalCTAMobile />
      </main>
      <Footer />
      <LandingMobileNav />
    </div>
  );
};
