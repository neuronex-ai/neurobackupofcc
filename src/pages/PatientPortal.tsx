import { Button } from "@/components/ui/button";
import { DesktopWorkspacePanel, DesktopWorkspaceShell } from "@/components/ui/desktop-workspace";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/components/auth/SessionContextProvider";
import {
  type PatientPortalAnamnesis,
  type PatientPortalAnamnesisItem,
  type PatientPortalAppointment,
  type PatientPortalBillingEntry,
  type PatientPortalDocument,
  type PatientPortalGoal,
  type PatientPortalHistoryItem,
  type PatientPortalInvoice,
  type PatientPortalMoodLog,
  type PatientPortalPackage,
  usePatientPortalAnamnesis,
  usePatientPortalAppointments,
  usePatientPortalBilling,
  usePatientPortalCurrent,
  usePatientPortalDocuments,
  usePatientPortalGoals,
  usePatientPortalHistory,
  usePatientPortalMood,
  usePatientPortalPackages,
  usePatientPortalProgress,
  useRequestPatientPortalAppointment,
  useSavePatientPortalAnamnesis,
  useTogglePatientPortalGoal,
} from "@/hooks/use-patient-portal";
import { cn } from "@/lib/utils";
import {
  Angry,
  ArrowRight,
  BrainCircuit,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  Circle,
  ClipboardList,
  CreditCard,
  Download,
  FileClock,
  FileText,
  Frown,
  Heart,
  HeartPulse,
  Home,
  Laugh,
  Loader2,
  Lock,
  LogOut,
  MapPin,
  Meh,
  MessageCircle,
  Package,
  ReceiptText,
  Route,
  ShieldCheck,
  Smile,
  Target,
  TrendingUp,
  UserRound,
  Video,
} from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dateTime = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});
const dateOnly = new Intl.DateTimeFormat("pt-BR");
const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "long" });
const dayOnly = new Intl.DateTimeFormat("pt-BR", { day: "2-digit" });
const monthOnly = new Intl.DateTimeFormat("pt-BR", { month: "short" });

const moodOptions = [
  { score: 1, label: "Pesado", icon: Angry, tone: "text-rose-600 border-rose-500/25 bg-rose-500/10" },
  { score: 2, label: "Difícil", icon: Frown, tone: "text-orange-600 border-orange-500/25 bg-orange-500/10" },
  { score: 3, label: "Neutro", icon: Meh, tone: "text-amber-600 border-amber-500/25 bg-amber-500/10" },
  { score: 4, label: "Bem", icon: Smile, tone: "text-emerald-600 border-emerald-500/25 bg-emerald-500/10" },
  { score: 5, label: "Leve", icon: Laugh, tone: "text-blue-600 border-blue-500/25 bg-blue-500/10" },
] as const;

const navItems = [
  { value: "home", label: "Início", path: "/portal", icon: Home },
  { value: "agenda", label: "Agenda", path: "/portal/agenda", icon: CalendarDays },
  { value: "anamneses", label: "Anamneses", path: "/portal/anamneses", icon: ClipboardList },
  { value: "historico", label: "Feed", path: "/portal/historico", icon: FileClock },
  { value: "documentos", label: "NeuroDrive", path: "/portal/documentos", icon: FileText },
  { value: "metas", label: "Missões", path: "/portal/metas", icon: Target },
  { value: "progresso", label: "Progresso", path: "/portal/progresso", icon: TrendingUp },
  { value: "financeiro", label: "NeuroFinance", path: "/portal/financeiro", icon: CreditCard },
  { value: "humor", label: "Humor", path: "/portal/humor", icon: HeartPulse },
  { value: "perfil", label: "Perfil", path: "/portal/perfil", icon: UserRound },
] as const;

type PortalView = (typeof navItems)[number]["value"];

const viewFromPath = (pathname: string): PortalView => {
  if (pathname.startsWith("/portal/pacotes")) return "financeiro";
  const match = navItems.find((item) => item.path !== "/portal" && pathname.startsWith(item.path));
  return match?.value || "home";
};

const toDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const fileSize = (bytes: number) => {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const mapsRouteUrl = (destination?: string | null) =>
  destination
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`
    : "";

const patientQuotes = [
  "Pequenos passos também desenham caminhos inteiros.",
  "Seu ritmo não precisa parecer com o de ninguém para ser válido.",
  "Cuidar de si é uma forma silenciosa de coragem.",
  "Hoje não precisa ser perfeito; precisa apenas ser possível.",
  "Quando a mente pesa, gentileza vira direção.",
  "Você não é um problema a resolver; é uma história em construção.",
  "Clareza também nasce em dias lentos.",
  "Avançar pode ser só perceber melhor o que você sente.",
  "Existe força em pedir pausa, ajuda e espaço.",
  "O futuro melhora quando o cuidado fica mais perto.",
];

const quoteOfTheDay = () => {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const day = Math.floor((Date.now() - start.getTime()) / 86400000);
  return patientQuotes[Math.abs(day) % patientQuotes.length];
};

const statusTone = (status?: string | null) => {
  const normalized = String(status || "").toLowerCase();
  if (["paid", "received", "confirmed", "attended", "submitted"].includes(normalized)) {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
  }
  if (["overdue", "expired", "absent"].includes(normalized)) {
    return "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400";
  }
  return "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400";
};

const Panel = ({ children, className }: { children: ReactNode; className?: string }) => (
  <section className={cn("dashboard-retina-card rounded-[28px] p-5", className)}>{children}</section>
);

const EmptyState = ({ icon: Icon = FileText, title, description }: { icon?: typeof Home; title: string; description: string }) => (
  <div className="dashboard-soft-fill rounded-[28px] border border-dashed border-foreground/[0.14] p-8 text-center dark:border-white/[0.12]">
    <div className="dashboard-retina-card mx-auto flex h-12 w-12 items-center justify-center rounded-[18px] text-muted-foreground">
      <Icon className="h-5 w-5" />
    </div>
    <p className="mt-4 text-sm font-semibold text-foreground">{title}</p>
    <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
  </div>
);

const MetricCard = ({
  title,
  value,
  icon: Icon,
  tone = "default",
}: {
  title: string;
  value: string;
  icon: typeof Home;
  tone?: "default" | "success" | "warning" | "info";
}) => (
  <Panel className="min-h-[132px]">
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-2xl border",
          tone === "success" && "border-emerald-500/20 bg-emerald-500/10 text-emerald-600",
          tone === "warning" && "border-amber-500/20 bg-amber-500/10 text-amber-600",
          tone === "info" && "border-blue-500/20 bg-blue-500/10 text-blue-600",
          tone === "default" && "dashboard-soft-fill text-foreground",
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
    </div>
    <p className="mt-5 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
  </Panel>
);

const SectionHeader = ({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) => (
  <div className="mb-4 flex items-start justify-between gap-4">
    <div className="min-w-0">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
      {description && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>}
    </div>
    {action}
  </div>
);

const LoadingCard = () => (
  <div className="dashboard-retina-card flex min-h-64 items-center justify-center rounded-[30px]">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
);

const LockedPortalState = ({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) => (
  <div className="flex min-h-screen items-center justify-center bg-background px-5 py-12">
    <section className="w-full max-w-[560px] rounded-[28px] border border-border/65 bg-card/90 p-6 shadow-2xl shadow-black/5 sm:p-8">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground text-background">
        <Lock className="h-6 w-6" />
      </div>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </section>
  </div>
);

const getFirstName = (name: string) => name.trim().split(/\s+/)[0] || name;

const PortalModuleRail = ({
  activeView,
  onNavigate,
}: {
  activeView: PortalView;
  onNavigate: (path: string) => void;
}) => (
  <DesktopWorkspacePanel className="p-2.5">
    <div className="flex gap-1.5 overflow-x-auto no-scrollbar lg:grid lg:grid-cols-10 lg:overflow-visible">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = activeView === item.value;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onNavigate(item.path)}
            className={cn(
              "group flex h-[82px] min-w-[104px] flex-col items-center justify-center gap-2 rounded-[22px] px-2 text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 lg:min-w-0",
              active
                ? "bg-foreground text-background shadow-sm dark:bg-white dark:text-zinc-950"
                : "text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground dark:hover:bg-white/[0.07]",
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100" />
            <span className="max-w-full truncate text-[9px] font-black uppercase leading-tight tracking-[0.12em]">
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  </DesktopWorkspacePanel>
);

const PortalHeroStat = ({
  label,
  value,
  detail,
  tone = "default",
}: {
  label: string;
  value: string | number;
  detail?: string;
  tone?: "default" | "success" | "warning";
}) => (
  <div
    className={cn(
      "rounded-[22px] border border-background/18 bg-background/[0.08] p-4 shadow-sm dark:border-zinc-950/12 dark:bg-zinc-950/[0.05]",
      tone === "success" && "border-emerald-400/28 bg-emerald-400/[0.10] dark:border-emerald-700/20 dark:bg-emerald-700/[0.08]",
      tone === "warning" && "border-amber-400/32 bg-amber-400/[0.12] dark:border-amber-700/22 dark:bg-amber-700/[0.08]",
    )}
  >
    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-background/58 dark:text-zinc-950/55">{label}</p>
    <p className="mt-2 truncate text-2xl font-black leading-none tracking-tight text-background tabular-nums dark:text-zinc-950">{value}</p>
    {detail ? <p className="mt-2 line-clamp-2 text-xs font-medium leading-relaxed text-background/62 dark:text-zinc-950/62">{detail}</p> : null}
  </div>
);

const PortalHero = ({
  patientName,
  professionalName,
  activeLabel,
  nextAppointment,
  pendingAmount,
  documentsCount,
  activeGoals,
  onSignOut,
  loggingOut,
}: {
  patientName: string;
  professionalName: string;
  activeLabel: string;
  nextAppointment?: PatientPortalAppointment;
  pendingAmount: number;
  documentsCount: number;
  activeGoals: number;
  onSignOut: () => void;
  loggingOut: boolean;
}) => (
  <DesktopWorkspacePanel highContrast className="p-0">
    <div className="grid gap-5 p-5 sm:p-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)]">
      <div className="flex min-h-[238px] flex-col justify-between gap-8">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-background/18 bg-background/[0.08] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-background/62 dark:border-zinc-950/12 dark:bg-zinc-950/[0.05] dark:text-zinc-950/58">
                NeuroDiver
              </span>
              <span className="rounded-full border border-background/18 bg-background/[0.08] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-background/62 dark:border-zinc-950/12 dark:bg-zinc-950/[0.05] dark:text-zinc-950/58">
                {activeLabel}
              </span>
            </div>
            <Button
              onClick={onSignOut}
              disabled={loggingOut}
              variant="ghost"
              size="icon"
              className="h-11 w-11 rounded-[18px] border border-background/18 bg-background/[0.08] text-background/66 hover:bg-background/[0.14] hover:text-background dark:border-zinc-950/12 dark:bg-zinc-950/[0.05] dark:text-zinc-950/62 dark:hover:text-zinc-950"
              aria-label="Sair"
            >
              {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            </Button>
          </div>
          <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[0.96] tracking-tight text-background dark:text-zinc-950 sm:text-5xl xl:text-6xl">
            Oi, {getFirstName(patientName)}.
          </h1>
          <p className="mt-4 max-w-2xl text-sm font-medium leading-relaxed text-background/64 dark:text-zinc-950/62 sm:text-base">
            {professionalName}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-background/18 bg-background/[0.08] px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-background/66 dark:border-zinc-950/12 dark:bg-zinc-950/[0.05] dark:text-zinc-950/62">
            Portal do paciente
          </span>
          <span className="rounded-full border border-background/18 bg-background/[0.08] px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-background/66 dark:border-zinc-950/12 dark:bg-zinc-950/[0.05] dark:text-zinc-950/62">
            Desktop
          </span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <PortalHeroStat
          label="Próxima sessão"
          value={nextAppointment ? dateTime.format(new Date(nextAppointment.start_time)) : "Sem horário"}
          detail={nextAppointment?.type || "Agenda"}
        />
        <PortalHeroStat
          label="NeuroFinance"
          value={pendingAmount ? money.format(pendingAmount) : "Tudo em dia"}
          detail={pendingAmount ? "Pagamento disponível" : "Sem pagamentos disponíveis"}
          tone={pendingAmount ? "warning" : "success"}
        />
        <PortalHeroStat
          label="NeuroDrive"
          value={documentsCount}
          detail="Compartilhados"
        />
        <PortalHeroStat
          label="Missões"
          value={activeGoals}
          detail="Em acompanhamento"
        />
      </div>
    </div>
  </DesktopWorkspacePanel>
);

const AppointmentRequestDialog = () => {
  const tomorrow = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date;
  }, []);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(toDateInputValue(tomorrow));
  const [time, setTime] = useState("09:00");
  const [type, setType] = useState<"online" | "presencial">("online");
  const requestAppointment = useRequestPatientPortalAppointment();

  const handleSubmit = () => {
    const start = new Date(`${date}T${time}:00`);
    if (!date || !time || !Number.isFinite(start.getTime()) || start.getTime() <= Date.now()) {
      toast.error("Escolha um horário futuro.");
      return;
    }

    requestAppointment.mutate(
      { startTime: start.toISOString(), type },
      {
        onSuccess: () => {
          toast.success("Pedido enviado para confirmação.");
          setOpen(false);
        },
        onError: (error) => toast.error(error instanceof Error ? error.message : "Não foi possível solicitar o horário."),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-11 rounded-2xl bg-zinc-950 px-4 text-xs font-bold uppercase tracking-[0.14em] text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100">
          <CalendarPlus className="mr-2 h-4 w-4" />
          Solicitar horário
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[520px] rounded-[28px] border border-border/70 bg-card p-0 shadow-2xl">
        <div className="border-b border-border/60 p-6">
          <DialogTitle className="text-xl font-semibold tracking-tight">Solicitar agendamento</DialogTitle>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Seu pedido fica pendente até o profissional confirmar na agenda.
          </p>
        </div>
        <div className="space-y-5 p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Data</span>
              <input
                type="date"
                min={toDateInputValue(new Date())}
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-foreground outline-none transition-colors focus:border-foreground/40"
              />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Horário</span>
              <input
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
                className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-foreground outline-none transition-colors focus:border-foreground/40"
              />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { value: "online" as const, label: "Online", icon: Video },
              { value: "presencial" as const, label: "Presencial", icon: MapPin },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setType(option.value)}
                className={cn(
                  "flex h-14 items-center justify-center gap-3 rounded-2xl border px-4 text-sm font-semibold transition-colors",
                  type === option.value
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-muted-foreground hover:text-foreground",
                )}
              >
                <option.icon className="h-4 w-4" />
                {option.label}
              </button>
            ))}
          </div>
          <Button
            onClick={handleSubmit}
            disabled={requestAppointment.isPending}
            className="h-12 w-full rounded-2xl bg-zinc-950 text-xs font-bold uppercase tracking-[0.16em] text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
          >
            {requestAppointment.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
            Enviar pedido
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const AppointmentCard = ({ appointment }: { appointment: PatientPortalAppointment }) => {
  const start = new Date(appointment.start_time);
  const isPast = start.getTime() < Date.now();
  const isRequest = appointment.metadata?.origin === "patient_portal" && appointment.metadata?.syncStatus === "pending";

  return (
    <article className="rounded-[24px] border border-border/60 bg-card/82 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-4">
          <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl border border-border bg-background">
            <span className="text-base font-bold text-foreground">{dayOnly.format(start)}</span>
            <span className="text-[9px] font-bold uppercase text-muted-foreground">{monthOnly.format(start)}</span>
          </div>
          <div className="min-w-0">
            <p className="text-base font-semibold capitalize text-foreground">{weekday.format(start)}</p>
            <p className="mt-1 text-sm text-muted-foreground">{dateTime.format(start)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className={cn("inline-flex rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em]", statusTone(isRequest ? "pending" : appointment.status))}>
                {isRequest ? "Aguardando confirmação" : isPast ? "Realizada/passada" : appointment.status || "Agendada"}
              </span>
              <span className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                {appointment.type === "online" ? <Video className="mr-1.5 h-3 w-3" /> : <MapPin className="mr-1.5 h-3 w-3" />}
                {appointment.type || "Sessão"}
              </span>
            </div>
          </div>
        </div>
        {appointment.google_meet_link && appointment.type === "online" && !isPast && (
          <Button asChild size="sm" className="shrink-0 rounded-xl">
            <a href={appointment.google_meet_link} target="_blank" rel="noreferrer">
              Entrar
            </a>
          </Button>
        )}
      </div>
    </article>
  );
};

const AppointmentsView = ({ appointments }: { appointments?: PatientPortalAppointment[] }) => {
  const rows = appointments || [];
  const upcoming = rows.filter((appointment) => new Date(appointment.start_time).getTime() >= Date.now());
  const past = rows.filter((appointment) => new Date(appointment.start_time).getTime() < Date.now()).reverse();

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Agenda compartilhada"
        description="Consultas confirmadas e pedidos enviados por você ficam agrupados aqui."
        action={<AppointmentRequestDialog />}
      />
      {rows.length ? (
        <>
          <div className="space-y-3">
            <p className="px-1 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Próximas consultas</p>
            {upcoming.length ? upcoming.map((appointment) => <AppointmentCard key={appointment.id} appointment={appointment} />) : (
              <EmptyState icon={CalendarDays} title="Nenhuma consulta futura" description="Solicite um horário para o profissional confirmar." />
            )}
          </div>
          {past.length > 0 && (
            <div className="space-y-3">
              <p className="px-1 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Histórico de consultas</p>
              {past.slice(0, 10).map((appointment) => <AppointmentCard key={appointment.id} appointment={appointment} />)}
            </div>
          )}
        </>
      ) : (
        <EmptyState icon={CalendarDays} title="Nenhuma consulta compartilhada" description="Quando houver agenda confirmada ou pedidos pendentes, ela aparece aqui." />
      )}
    </div>
  );
};

const DocumentsView = ({ documents }: { documents?: PatientPortalDocument[] }) => {
  const rows = documents || [];

  return (
    <div className="space-y-5">
      <SectionHeader title="NeuroDrive" description="Documentos compartilhados e espaços preparados para leitura, notas e tarefas." />
      <div className="grid gap-3 md:grid-cols-4">
        {[
          { title: "Arquivos", value: String(rows.length), icon: FileText },
          { title: "NeuroView", value: "Em breve", icon: BrainCircuit },
          { title: "Notas", value: "Preparado", icon: ClipboardList },
          { title: "Tarefas + Notion", value: "Próximo", icon: Target },
        ].map((item) => (
          <Panel key={item.title} className="min-h-[126px]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-muted-foreground">{item.title}</p>
                <p className="mt-4 text-2xl font-black tracking-tight text-foreground">{item.value}</p>
              </div>
              <div className="dashboard-soft-fill flex h-10 w-10 items-center justify-center rounded-2xl text-muted-foreground">
                <item.icon className="h-4 w-4" />
              </div>
            </div>
          </Panel>
        ))}
      </div>
      {rows.length ? (
        <div className="space-y-3">
          <p className="px-1 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
            {rows.length} arquivo{rows.length === 1 ? "" : "s"} disponível{rows.length === 1 ? "" : "is"}
          </p>
          {rows.map((document) => (
            <article key={document.id} className="rounded-[24px] border border-border/60 bg-card/82 p-4 shadow-sm transition-colors hover:border-foreground/15">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-background text-muted-foreground">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-foreground">{document.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {fileSize(document.sizeBytes)} {document.sharedAt ? `- ${dateOnly.format(new Date(document.sharedAt))}` : ""}
                    </p>
                  </div>
                </div>
                <Button
                  disabled={!document.signedUrl}
                  size="icon"
                  variant="outline"
                  className="h-10 w-10 shrink-0 rounded-xl"
                  onClick={() => document.signedUrl && window.open(document.signedUrl, "_blank", "noopener,noreferrer")}
                  aria-label={`Abrir ${document.name}`}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="Nenhum documento compartilhado" description="Apenas arquivos liberados pelo profissional aparecem aqui, com links R2 temporários." />
      )}
    </div>
  );
};

const GoalsView = ({ goals }: { goals?: PatientPortalGoal[] }) => {
  const rows = goals || [];
  const toggleGoal = useTogglePatientPortalGoal();
  const completedCount = rows.filter((goal) => goal.is_completed).length;
  const progress = rows.length ? Math.round((completedCount / rows.length) * 100) : 0;

  if (!rows.length) {
    return <EmptyState icon={Target} title="Nenhuma missão ativa" description="Missões compartilhadas pelo profissional aparecem aqui para acompanhamento." />;
  }

  return (
    <div className="space-y-5">
      <Panel>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Plano de missões</p>
            <p className="mt-1 text-sm text-muted-foreground">{completedCount} de {rows.length} concluídas</p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-background text-lg font-semibold text-foreground">
            {progress}%
          </div>
        </div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </Panel>
      <div className="space-y-3">
        {rows.map((goal) => (
          <button
            key={goal.id}
            type="button"
            onClick={() =>
              toggleGoal.mutate(
                { goalId: goal.id, isCompleted: !goal.is_completed },
                {
                  onSuccess: () => toast.success(goal.is_completed ? "Missão reaberta." : "Missão concluída."),
                  onError: (error) => toast.error(error instanceof Error ? error.message : "Não foi possível atualizar a missão."),
                },
              )
            }
            className={cn(
              "flex w-full items-start gap-4 rounded-[24px] border p-4 text-left transition-colors",
              goal.is_completed
                ? "border-emerald-500/20 bg-emerald-500/10"
                : "border-border/60 bg-card/82 hover:border-foreground/15",
            )}
          >
            {goal.is_completed ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-500" /> : <Circle className="mt-0.5 h-5 w-5 text-muted-foreground" />}
            <span className="min-w-0 flex-1">
              <span className={cn("block text-sm font-semibold text-foreground", goal.is_completed && "text-muted-foreground line-through")}>
                {goal.description}
              </span>
              {goal.due_date && <span className="mt-1 block text-xs font-medium text-muted-foreground">Até {dateOnly.format(new Date(`${goal.due_date}T00:00:00`))}</span>}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

const BillingView = ({
  entries,
  invoices,
  packages,
}: {
  entries?: PatientPortalBillingEntry[];
  invoices?: PatientPortalInvoice[];
  packages?: PatientPortalPackage[];
}) => {
  const entryRows = entries || [];
  const invoiceRows = invoices || [];
  const packageRows = packages || [];
  const pendingAmount = entryRows
    .filter((entry) => !["paid", "received", "confirmed"].includes(String(entry.status || "").toLowerCase()))
    .reduce((total, entry) => total + Number(entry.amount || 0), 0);

  if (!entryRows.length && !invoiceRows.length && !packageRows.length) {
    return <EmptyState icon={ReceiptText} title="Nenhuma movimentação compartilhada" description="Cobranças, recibos, pagamentos e pacotes aparecem aqui pelo NeuroFinance." />;
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard title="Pagamentos" value={pendingAmount ? "Disponível" : "Tudo em dia"} icon={CreditCard} tone={pendingAmount ? "warning" : "success"} />
        <MetricCard title="Cobranças" value={String(entryRows.length)} icon={ReceiptText} tone="info" />
        <MetricCard title="Documentos" value={String(invoiceRows.length)} icon={FileText} />
      </div>
      {packageRows.length > 0 && (
        <div className="space-y-3">
          <p className="px-1 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Pacotes e sessões</p>
          <div className="grid gap-4 xl:grid-cols-2">
            {packageRows.map((pkg) => <PackageCard key={pkg.id} pkg={pkg} />)}
          </div>
        </div>
      )}
      <div className="space-y-3">
        <p className="px-1 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Cobranças NeuroFinance</p>
        {entryRows.map((entry) => (
          <article key={entry.id} className="rounded-[24px] border border-border/60 bg-card/82 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-base font-semibold text-foreground">{entry.title || entry.description || "Cobrança"}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {entry.due_date ? `Vence em ${dateOnly.format(new Date(`${entry.due_date}T00:00:00`))}` : "Sem vencimento"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-base font-semibold">{money.format(Number(entry.amount || 0))}</p>
                <span className={cn("mt-2 inline-flex rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em]", statusTone(entry.status))}>
                  {entry.status}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
      {invoiceRows.length > 0 && (
        <div className="space-y-3">
          <p className="px-1 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Recibos e documentos</p>
          {invoiceRows.map((invoice) => {
            const url = invoice.invoice_url || invoice.bank_slip_url || invoice.receipt_url || "";
            return (
              <article key={invoice.id} className="rounded-[24px] border border-border/60 bg-card/82 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold text-foreground">{invoice.invoice_number || "Documento financeiro"}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {money.format(Number(invoice.amount || 0))} {invoice.due_date ? `- ${dateOnly.format(new Date(`${invoice.due_date}T00:00:00`))}` : ""}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" disabled={!url} className="rounded-xl" onClick={() => url && window.open(url, "_blank", "noopener,noreferrer")}>
                    Abrir
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

const PackageCard = ({ pkg }: { pkg: PatientPortalPackage }) => {
  const used = Number(pkg.sessions_used || 0);
  const total = Math.max(Number(pkg.total_sessions || 0), 0);
  const remaining = Math.max(total - used, 0);
  const progress = total ? Math.min(100, Math.round((used / total) * 100)) : 0;
  const expired = pkg.end_date ? new Date(`${pkg.end_date}T23:59:59`).getTime() < Date.now() : false;
  const complete = total > 0 && remaining <= 0;

  return (
    <Panel>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-background text-muted-foreground">
            <Package className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-semibold text-foreground">{pkg.description || "Pacote terapêutico"}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Início {dateOnly.format(new Date(`${pkg.start_date}T00:00:00`))}
              {pkg.end_date ? ` - vence ${dateOnly.format(new Date(`${pkg.end_date}T00:00:00`))}` : ""}
            </p>
          </div>
        </div>
        <span className={cn("shrink-0 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em]", statusTone(complete ? "submitted" : expired ? "expired" : "pending"))}>
          {complete ? "Concluído" : expired ? "Expirado" : "Ativo"}
        </span>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-background/70 p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Usadas</p>
          <p className="mt-2 text-xl font-semibold">{used}/{total || 0}</p>
        </div>
        <div className="rounded-2xl border border-border bg-background/70 p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Restantes</p>
          <p className="mt-2 text-xl font-semibold">{remaining}</p>
        </div>
        <div className="rounded-2xl border border-border bg-background/70 p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Investimento</p>
          <p className="mt-2 text-xl font-semibold">{pkg.price ? money.format(pkg.price) : "N/A"}</p>
        </div>
      </div>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} />
      </div>
    </Panel>
  );
};

const PackagesView = ({ packages }: { packages?: PatientPortalPackage[] }) => {
  const rows = packages || [];
  if (!rows.length) {
    return <EmptyState icon={Package} title="Nenhum pacote compartilhado" description="Pacotes contratados ou em acompanhamento ficam visíveis aqui quando estiverem cadastrados." />;
  }
  return (
    <div className="space-y-4">
      <SectionHeader title="Pacotes" description="Acompanhe sessões usadas, restantes e histórico de planos." />
      <div className="grid gap-4 xl:grid-cols-2">
        {rows.map((pkg) => <PackageCard key={pkg.id} pkg={pkg} />)}
      </div>
    </div>
  );
};

const HistoryView = ({ items }: { items?: PatientPortalHistoryItem[] }) => {
  const rows = items || [];
  const iconByType: Record<PatientPortalHistoryItem["type"], typeof Home> = {
    appointment: CalendarDays,
    document: FileText,
    goal: Target,
    mood: HeartPulse,
    billing: ReceiptText,
    anamnesis: ClipboardList,
  };

  if (!rows.length) {
    return <EmptyState icon={FileClock} title="Feed ainda vazio" description="Eventos compartilhados do seu cuidado aparecem aqui quando estiverem disponíveis." />;
  }

  return (
    <div className="space-y-4">
      <SectionHeader title="Feed" description="Postagens do seu processo, com apenas informações compartilhadas com você." />
      <div className="space-y-3">
        {rows.map((item) => {
          const Icon = iconByType[item.type] || FileClock;
          return (
            <article key={item.id} className="dashboard-retina-card rounded-[30px] p-5">
              <div className="flex gap-4">
                <div className="dashboard-soft-fill flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] text-muted-foreground">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="text-xs font-medium text-muted-foreground">{dateTime.format(new Date(item.occurredAt))}</p>
                  </div>
                  {item.description && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.description}</p>}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="inline-flex h-9 items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 text-xs font-semibold text-muted-foreground">
                      <Heart className="h-3.5 w-3.5" />
                      Acolhido pelo profissional
                    </span>
                    <span className="inline-flex h-9 items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 text-xs font-semibold text-muted-foreground">
                      <MessageCircle className="h-3.5 w-3.5" />
                      Comentário em breve
                    </span>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};

const AnamnesisEditor = ({ record }: { record: PatientPortalAnamnesis }) => {
  const [draft, setDraft] = useState<PatientPortalAnamnesisItem[]>(record.content || []);
  const saveAnamnesis = useSavePatientPortalAnamnesis();

  useEffect(() => {
    setDraft(record.content || []);
  }, [record.id, record.content]);

  const updateAnswer = (index: number, value: string) => {
    setDraft((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, answer: value } : item)));
  };

  const save = () => {
    saveAnamnesis.mutate(
      { anamnesisId: record.id, content: draft },
      {
        onSuccess: () => toast.success("Anamnese salva."),
        onError: (error) => toast.error(error instanceof Error ? error.message : "Não foi possível salvar a anamnese."),
      },
    );
  };

  return (
    <Panel className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-base font-semibold text-foreground">{record.type || "Ficha de anamnese"}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {record.status === "submitted" ? "Enviada" : record.status === "expired" ? "Expirada" : "Pendente"} - {record.progress}% preenchida
          </p>
        </div>
        <span className={cn("rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em]", statusTone(record.status))}>
          {record.status === "submitted" ? "Leitura" : record.status === "expired" ? "Expirada" : "Editável"}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${record.progress}%` }} />
      </div>
      {draft.length ? (
        <div className="space-y-4">
          {draft.map((item, index) => (
            item.isSection ? (
              <div key={`${item.question}-${index}`} className="rounded-2xl border border-border bg-muted/30 px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                {item.question}
              </div>
            ) : (
              <label key={`${item.question}-${index}`} className="block rounded-2xl border border-border bg-background/65 p-4">
                <span className="text-sm font-semibold text-foreground">{item.question}</span>
                <Textarea
                  value={item.answer || ""}
                  readOnly={!record.canEdit}
                  onChange={(event) => updateAnswer(index, event.target.value)}
                  className="mt-3 min-h-28 rounded-2xl border-border bg-card"
                  placeholder={record.canEdit ? "Digite sua resposta" : "Sem resposta"}
                />
              </label>
            )
          ))}
          {record.canEdit && (
            <Button onClick={save} disabled={saveAnamnesis.isPending} className="h-11 rounded-2xl bg-zinc-950 px-5 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100">
              {saveAnamnesis.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar anamnese
            </Button>
          )}
        </div>
      ) : (
        <EmptyState icon={ClipboardList} title="Ficha sem perguntas" description="Esta anamnese ainda não tem conteúdo estruturado para exibir." />
      )}
    </Panel>
  );
};

const AnamnesisView = ({ anamneses }: { anamneses?: PatientPortalAnamnesis[] }) => {
  const rows = anamneses || [];
  if (!rows.length) {
    return <EmptyState icon={ClipboardList} title="Nenhuma anamnese disponível" description="Fichas enviadas pelo profissional aparecem aqui para preencher ou consultar." />;
  }
  return (
    <div className="space-y-5">
      <SectionHeader title="Anamneses" description="Continue fichas pendentes e consulte respostas enviadas em modo leitura." />
      {rows.map((record) => <AnamnesisEditor key={record.id} record={record} />)}
    </div>
  );
};

const ProgressView = ({
  progress,
  goals,
}: {
  progress?: {
    attendedSessions: number;
    sessionsTotal: number;
    completedGoals: number;
    goalsTotal: number;
    sharedDocuments: number;
    moodLogs: number;
    activePackages: number;
    lastMood: any;
    nextSteps: PatientPortalGoal[];
  };
  goals?: PatientPortalGoal[];
}) => {
  const lastMood = progress?.lastMood;
  const moodMeta = moodOptions.find((option) => option.score === lastMood?.mood_score);
  const MoodIcon = moodMeta?.icon || HeartPulse;
  const openGoals = progress?.nextSteps || (goals || []).filter((goal) => !goal.is_completed).slice(0, 5);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard title="Sessões registradas" value={`${progress?.attendedSessions || 0}/${progress?.sessionsTotal || 0}`} icon={CalendarDays} />
        <MetricCard title="Missões concluídas" value={`${progress?.completedGoals || 0}/${progress?.goalsTotal || 0}`} icon={Target} tone={(progress?.completedGoals || 0) ? "success" : "default"} />
        <MetricCard title="Documentos" value={String(progress?.sharedDocuments || 0)} icon={FileText} tone="info" />
        <MetricCard title="Pacotes ativos" value={String(progress?.activePackages || 0)} icon={Package} />
      </div>
      <Panel>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-background text-muted-foreground">
            <BrainCircuit className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold text-foreground">Direção atual</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Este painel usa apenas sinais compartilhados: agenda, missões, humor, documentos e pacotes. Notas clínicas privadas não aparecem aqui.
            </p>
            <div className="mt-4 grid gap-2">
              {openGoals.length ? openGoals.map((goal) => (
                <div key={goal.id} className="rounded-2xl border border-border bg-background/70 p-3 text-sm text-muted-foreground">
                  {goal.description}
                </div>
              )) : <p className="text-sm text-muted-foreground">Nenhuma meta aberta no momento.</p>}
            </div>
          </div>
        </div>
      </Panel>
      <Panel>
        <div className="flex items-start gap-4">
          <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border", moodMeta?.tone || "border-border bg-background text-muted-foreground")}>
            <MoodIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">Registro emocional recente</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {lastMood
                ? `${moodMeta?.label || "Registro"} em ${dateTime.format(new Date(lastMood.created_at))}${lastMood.notes ? `: ${lastMood.notes}` : "."}`
                : "Nenhum diário preenchido ainda."}
            </p>
          </div>
        </div>
      </Panel>
    </div>
  );
};

const MoodTrendChart = ({ logs }: { logs: PatientPortalMoodLog[] }) => {
  const rows = [...logs]
    .sort((left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime())
    .slice(-14);

  if (rows.length < 2) {
    return <EmptyState icon={TrendingUp} title="Gráfico em formação" description="Com dois registros ou mais, seu histórico emocional começa a desenhar uma linha do tempo." />;
  }

  const width = 640;
  const height = 180;
  const padding = 22;
  const points = rows.map((log, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(rows.length - 1, 1);
    const y = padding + ((5 - log.mood_score) * (height - padding * 2)) / 4;
    return { x, y, log };
  });
  const path = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <Panel>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-foreground">Linha do humor</p>
          <p className="mt-1 text-sm text-muted-foreground">Últimos registros compartilhados no seu diário.</p>
        </div>
        <TrendingUp className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="overflow-hidden rounded-[24px] border border-border/60 bg-background/70 p-3">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-[180px] w-full" role="img" aria-label="Gráfico temporal de humor">
          {[1, 2, 3, 4, 5].map((score) => {
            const y = padding + ((5 - score) * (height - padding * 2)) / 4;
            return <line key={score} x1={padding} x2={width - padding} y1={y} y2={y} className="stroke-border/60" strokeWidth="1" />;
          })}
          <polyline points={path} fill="none" className="stroke-foreground" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          {points.map((point) => (
            <circle key={point.log.id} cx={point.x} cy={point.y} r="6" className="fill-background stroke-foreground" strokeWidth="3" />
          ))}
        </svg>
      </div>
    </Panel>
  );
};

const DiaryView = ({ mood }: { mood: ReturnType<typeof usePatientPortalMood> }) => {
  const [moodScore, setMoodScore] = useState(mood.data?.today?.mood_score || 4);
  const [notes, setNotes] = useState(mood.data?.today?.notes || "");
  const logs = mood.data?.logs || [];

  useEffect(() => {
    if (mood.data?.today) {
      setMoodScore(mood.data.today.mood_score);
      setNotes(mood.data.today.notes || "");
    }
  }, [mood.data?.today]);

  const saveMood = () => {
    mood.saveMood.mutate(
      { moodScore, notes },
      { onSuccess: () => toast.success("Registro salvo no diário.") },
    );
  };

  return (
    <div className="space-y-5">
      <MoodTrendChart logs={logs} />
      <Panel>
        <p className="text-lg font-semibold text-foreground">Como você está hoje?</p>
        <div className="mt-5 grid grid-cols-5 gap-2">
          {moodOptions.map((option) => (
            <button
              key={option.score}
              type="button"
              onClick={() => setMoodScore(option.score)}
              className={cn(
                "flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border px-2 text-xs font-semibold transition-colors",
                moodScore === option.score ? option.tone : "border-border bg-background text-muted-foreground hover:text-foreground",
              )}
            >
              <option.icon className="h-5 w-5" />
              <span className="max-w-full truncate">{option.label}</span>
            </button>
          ))}
        </div>
        <Textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Escreva uma nota breve para acompanhar seu processo."
          className="mt-4 min-h-28 rounded-2xl border-border bg-background"
          maxLength={1200}
        />
        <Button onClick={saveMood} disabled={mood.saveMood.isPending} className="mt-4 h-11 rounded-2xl bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100">
          {mood.saveMood.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar registro
        </Button>
      </Panel>
      <section className="space-y-3">
        <p className="px-1 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Registros recentes</p>
        {logs.length ? logs.map((log) => (
          <article key={log.id} className="rounded-[24px] border border-border/60 bg-card/82 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-foreground">{dateTime.format(new Date(log.created_at))}</p>
                {log.notes && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{log.notes}</p>}
              </div>
              <span className={cn("rounded-full border px-3 py-1 text-sm font-semibold", moodOptions.find((option) => option.score === log.mood_score)?.tone || "border-border bg-background text-foreground")}>
                {log.mood_score}
              </span>
            </div>
          </article>
        )) : <EmptyState icon={HeartPulse} title="Nenhum registro ainda" description="Use esta área para acompanhar pequenas mudanças entre as sessões." />}
      </section>
    </div>
  );
};

const ProfileView = ({
  patientName,
  patientEmail,
  professionalName,
  onSignOut,
  loggingOut,
}: {
  patientName: string;
  patientEmail?: string | null;
  professionalName: string;
  onSignOut: () => void;
  loggingOut: boolean;
}) => (
  <div className="space-y-4">
    <Panel>
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-background text-muted-foreground">
          <UserRound className="h-5 w-5" />
        </div>
        <div>
          <p className="text-lg font-semibold text-foreground">{patientName}</p>
          <p className="mt-1 text-sm text-muted-foreground">{patientEmail || "E-mail não informado"}</p>
        </div>
      </div>
      <div className="mt-5 rounded-2xl border border-border bg-background/70 p-4">
        <p className="text-sm font-semibold text-foreground">Profissional vinculado</p>
        <p className="mt-1 text-sm text-muted-foreground">{professionalName}</p>
      </div>
    </Panel>
    <Button onClick={onSignOut} disabled={loggingOut} variant="outline" className="h-12 w-full rounded-2xl">
      {loggingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
      Sair
    </Button>
  </div>
);

const HomeShortcutCard = ({
  title,
  value,
  detail,
  icon: Icon,
  onClick,
  children,
}: {
  title: string;
  value: string;
  detail?: string;
  icon: typeof Home;
  onClick: () => void;
  children?: ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="dashboard-retina-card dashboard-tactile group flex min-h-[174px] flex-col rounded-[30px] p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100"
  >
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-muted-foreground">{title}</p>
        <p className="mt-4 text-3xl font-black tracking-tight text-foreground">{value}</p>
        {detail && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{detail}</p>}
      </div>
      <span className="dashboard-soft-fill flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] text-muted-foreground transition-colors group-hover:text-foreground">
        <Icon className="h-5 w-5" />
      </span>
    </div>
    {children && <div className="mt-auto pt-5">{children}</div>}
  </button>
);

const AppointmentHomeCard = ({
  appointment,
  onNavigate,
}: {
  appointment?: PatientPortalAppointment;
  onNavigate: (path: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const isOnline = appointment?.type === "online";
  const isPresential = appointment?.type === "presencial";
  const routeUrl = mapsRouteUrl(appointment?.location);

  if (!appointment) {
    return (
      <HomeShortcutCard
        title="Próxima sessão"
        value="Sem horário"
        detail="Você pode solicitar um novo horário na agenda."
        icon={CalendarDays}
        onClick={() => onNavigate("/portal/agenda")}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") setOpen(true);
        }}
        className="dashboard-retina-card dashboard-tactile group flex min-h-[174px] cursor-pointer flex-col rounded-[30px] p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-muted-foreground">Próxima sessão</p>
            <p className="mt-4 text-3xl font-black tracking-tight text-foreground">{dateTime.format(new Date(appointment.start_time))}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {isOnline ? "Online" : isPresential ? appointment.location || "Presencial" : appointment.type || "Sessão"}
            </p>
          </div>
          <span className="dashboard-soft-fill flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] text-muted-foreground transition-colors group-hover:text-foreground">
            {isOnline ? <Video className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}
          </span>
        </div>
        <div className="mt-auto flex flex-wrap gap-2 pt-5">
          {isOnline && appointment.google_meet_link && (
            <Button
              asChild
              size="sm"
              className="rounded-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <a href={appointment.google_meet_link} target="_blank" rel="noreferrer">Entrar</a>
            </Button>
          )}
          {isPresential && routeUrl && (
            <Button
              asChild
              size="sm"
              className="rounded-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <a href={routeUrl} target="_blank" rel="noreferrer">
                <Route className="mr-2 h-4 w-4" />
                Abrir rota
              </a>
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="rounded-2xl"
            onClick={(event) => {
              event.stopPropagation();
              setOpen(true);
            }}
          >
            Detalhes
          </Button>
        </div>
      </div>
      <DialogContent className="max-w-[560px] rounded-[30px] border border-border/70 bg-card p-0 shadow-2xl">
        <div className="border-b border-border/60 p-6">
          <DialogTitle className="text-xl font-semibold tracking-tight">Detalhes da sessão</DialogTitle>
          <p className="mt-2 text-sm text-muted-foreground">{dateTime.format(new Date(appointment.start_time))}</p>
        </div>
        <div className="space-y-4 p-6">
          <AppointmentCard appointment={appointment} />
          {isPresential && appointment.location && (
            <div className="rounded-2xl border border-border bg-background/70 p-4">
              <p className="text-sm font-semibold text-foreground">Endereço</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{appointment.location}</p>
              {routeUrl && (
                <Button asChild className="mt-4 rounded-2xl">
                  <a href={routeUrl} target="_blank" rel="noreferrer">
                    <Route className="mr-2 h-4 w-4" />
                    Abrir no Google Maps
                  </a>
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const AnamnesisHomeCard = ({
  record,
  onNavigate,
}: {
  record?: PatientPortalAnamnesis;
  onNavigate: (path: string) => void;
}) => {
  if (!record) {
    return (
      <HomeShortcutCard
        title="Anamnese"
        value="Tudo certo"
        detail="Nenhuma ficha nova agora. Se quiser, registre como você está hoje."
        icon={ClipboardList}
        onClick={() => onNavigate("/portal/humor")}
      />
    );
  }

  return (
    <HomeShortcutCard
      title="Anamnese"
      value={`${record.progress}%`}
      detail={record.status === "submitted" ? "Ficha enviada para leitura." : "Continue quando estiver confortável."}
      icon={ClipboardList}
      onClick={() => onNavigate("/portal/anamneses")}
    >
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${record.progress}%` }} />
      </div>
    </HomeShortcutCard>
  );
};

const PackagesHomeCard = ({
  packages,
  onNavigate,
}: {
  packages: PatientPortalPackage[];
  onNavigate: (path: string) => void;
}) => {
  const active = packages.find((pkg) => Number(pkg.total_sessions || 0) > Number(pkg.sessions_used || 0));
  const remaining = active ? Math.max(Number(active.total_sessions || 0) - Number(active.sessions_used || 0), 0) : 0;
  return (
    <HomeShortcutCard
      title="Ritmo de sessões"
      value={active ? `${remaining} disponíveis` : "Sem pacote ativo"}
      detail={active ? active.description || "Pacote em acompanhamento." : "Quando houver um pacote, ele aparece no NeuroFinance."}
      icon={Package}
      onClick={() => onNavigate("/portal/financeiro")}
    />
  );
};

const ReflectionCarousel = ({ patientName }: { patientName: string }) => (
  <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1 no-scrollbar">
    <Panel className="min-w-[88%] snap-start sm:min-w-[48%]">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Frase do dia</p>
      <p className="mt-4 text-2xl font-black leading-tight tracking-tight text-foreground">{quoteOfTheDay()}</p>
    </Panel>
    <Panel className="min-w-[88%] snap-start sm:min-w-[48%]">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Boas-vindas</p>
      <p className="mt-4 text-2xl font-black leading-tight tracking-tight text-foreground">
        Esse ambiente foi construído para você.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Não somos empresários. Somos pacientes que, como você, vislumbram um futuro melhor. Seja muito bem-vindo, {getFirstName(patientName)}.
      </p>
    </Panel>
  </div>
);

const NeuroNexSignature = () => (
  <section className="relative overflow-hidden rounded-[36px] border border-white/[0.08] bg-black px-6 py-16 text-center shadow-[0_26px_100px_-70px_rgba(0,0,0,0.95)]">
    <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-white/10" />
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(255,255,255,0.16),transparent_34%)] motion-safe:animate-pulse" />
    <p className="relative text-[clamp(3.8rem,16vw,15rem)] font-black leading-[0.72] tracking-tight text-white/[0.055] drop-shadow-[0_0_34px_rgba(255,255,255,0.16)]">
      NEURONEX
    </p>
    <div className="relative mt-8 text-white">
      <p className="text-sm font-black uppercase tracking-[0.18em]">NeuroNex AI</p>
      <p className="mt-2 text-sm text-white/58">De paciente para paciente.</p>
    </div>
  </section>
);

const HomeView = ({
  nextAppointment,
  pendingAmount,
  documentsCount,
  activeGoals,
  anamnesisRecord,
  packages,
  mood,
  patientName,
  onNavigate,
}: {
  nextAppointment?: PatientPortalAppointment;
  pendingAmount: number;
  documentsCount: number;
  activeGoals: number;
  anamnesisRecord?: PatientPortalAnamnesis;
  packages: PatientPortalPackage[];
  mood: ReturnType<typeof usePatientPortalMood>;
  patientName: string;
  onNavigate: (path: string) => void;
}) => (
  <div className="space-y-5">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <AppointmentHomeCard appointment={nextAppointment} onNavigate={onNavigate} />
      <HomeShortcutCard
        title="NeuroFinance"
        value={pendingAmount ? "Pagamento disponível" : "Tudo em dia"}
        detail={pendingAmount ? money.format(pendingAmount) : "Sem pagamentos disponíveis agora."}
        icon={CreditCard}
        onClick={() => onNavigate("/portal/financeiro")}
      />
      <HomeShortcutCard
        title="NeuroDrive"
        value={String(documentsCount)}
        detail="Documentos, NeuroView, notas, tarefas e Notion em preparação."
        icon={FileText}
        onClick={() => onNavigate("/portal/documentos")}
      />
      <HomeShortcutCard
        title="Missões"
        value={String(activeGoals)}
        detail={activeGoals ? "Pequenas conquistas em movimento." : "Nada aberto por enquanto."}
        icon={Target}
        onClick={() => onNavigate("/portal/metas")}
      />
    </div>
    <div className="grid gap-3 sm:grid-cols-2">
      <AnamnesisHomeCard record={anamnesisRecord} onNavigate={onNavigate} />
      <PackagesHomeCard packages={packages} onNavigate={onNavigate} />
    </div>
    <ReflectionCarousel patientName={patientName} />
    <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
      <div>
        <SectionHeader title="Agenda próxima" action={<AppointmentRequestDialog />} />
        {nextAppointment ? <AppointmentCard appointment={nextAppointment} /> : <EmptyState icon={CalendarDays} title="Sem horário futuro" description="Solicite um novo horário para confirmação." />}
      </div>
      <DiaryView mood={mood} />
    </div>
    <NeuroNexSignature />
  </div>
);

const PatientPortal = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const activeView = viewFromPath(location.pathname);
  const current = usePatientPortalCurrent();
  const isActive = current.data?.status === "active";
  const appointments = usePatientPortalAppointments(isActive);
  const documents = usePatientPortalDocuments(isActive);
  const billing = usePatientPortalBilling(isActive);
  const mood = usePatientPortalMood(isActive);
  const goals = usePatientPortalGoals(isActive);
  const anamnesis = usePatientPortalAnamnesis(isActive);
  const packages = usePatientPortalPackages(isActive);
  const history = usePatientPortalHistory(isActive);
  const progress = usePatientPortalProgress(isActive);

  const patientName = current.data?.patient?.name || "Paciente";
  const professionalName = current.data?.professional?.name || "Seu psicólogo";
  const activeNav = navItems.find((item) => item.value === activeView) || navItems[0];

  const appointmentRows = appointments.data?.appointments || [];
  const billingEntries = billing.data?.entries || [];
  const goalRows = goals.data?.goals || [];
  const packageRows = packages.data?.packages || [];
  const anamnesisRows = anamnesis.data?.anamneses || [];

  const nextAppointment = useMemo(() => (
    appointmentRows
      .filter((appointment) => new Date(appointment.start_time).getTime() >= Date.now())
      .sort((left, right) => new Date(left.start_time).getTime() - new Date(right.start_time).getTime())[0]
  ), [appointmentRows]);

  const pendingAmount = useMemo(() => (
    billingEntries
      .filter((entry) => !["paid", "received", "confirmed"].includes(String(entry.status || "").toLowerCase()))
      .reduce((total, entry) => total + Number(entry.amount || 0), 0)
  ), [billingEntries]);

  const handleSignOut = async () => {
    setLoggingOut(true);
    await signOut();
    navigate("/auth", { replace: true });
  };

  if (current.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!current.data || current.data.status === "needs_activation") {
    return (
      <LockedPortalState
        title="Ative seu Portal do Paciente"
        description="Entre pelo link do convite enviado por e-mail ou informe o codigo de ativacao para liberar seu acesso."
        action={(
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={() => navigate("/portal/ativar")} className="h-11 rounded-xl">Inserir codigo</Button>
            <Button onClick={handleSignOut} variant="outline" className="h-11 rounded-xl">Sair</Button>
          </div>
        )}
      />
    );
  }

  if (current.data.status === "suspended") {
    return (
      <LockedPortalState
        title="Portal temporariamente indisponível"
        description={current.data.message || "O acesso ao portal depende da assinatura ativa do profissional."}
        action={<Button onClick={handleSignOut} variant="outline" className="h-11 rounded-xl">Sair</Button>}
      />
    );
  }

  if (current.data.status === "revoked") {
    return (
      <LockedPortalState
        title="Vínculo revogado"
        description="Solicite um novo convite ao profissional para voltar a acessar o portal."
        action={<Button onClick={handleSignOut} variant="outline" className="h-11 rounded-xl">Sair</Button>}
      />
    );
  }

  const renderView = () => {
    switch (activeView) {
      case "agenda":
        return appointments.isLoading ? <LoadingCard /> : <AppointmentsView appointments={appointmentRows} />;
      case "anamneses":
        return anamnesis.isLoading ? <LoadingCard /> : <AnamnesisView anamneses={anamnesisRows} />;
      case "historico":
        return history.isLoading ? <LoadingCard /> : <HistoryView items={history.data?.items} />;
      case "documentos":
        return documents.isLoading ? <LoadingCard /> : <DocumentsView documents={documents.data?.documents} />;
      case "metas":
        return goals.isLoading ? <LoadingCard /> : <GoalsView goals={goalRows} />;
      case "progresso":
        return progress.isLoading ? <LoadingCard /> : <ProgressView progress={progress.data?.progress} goals={goalRows} />;
      case "financeiro":
        return billing.isLoading ? <LoadingCard /> : <BillingView entries={billingEntries} invoices={billing.data?.invoices} />;
      case "pacotes":
        return packages.isLoading ? <LoadingCard /> : <PackagesView packages={packageRows} />;
      case "humor":
        return mood.isLoading ? <LoadingCard /> : <DiaryView mood={mood} />;
      case "perfil":
        return (
          <ProfileView
            patientName={patientName}
            patientEmail={current.data.patient?.email}
            professionalName={professionalName}
            onSignOut={handleSignOut}
            loggingOut={loggingOut}
          />
        );
      case "home":
      default:
        if (appointments.isLoading || billing.isLoading || documents.isLoading || goals.isLoading || mood.isLoading || anamnesis.isLoading || packages.isLoading) {
          return <LoadingCard />;
        }
        return (
          <HomeView
            nextAppointment={nextAppointment}
            pendingAmount={pendingAmount}
            documentsCount={documents.data?.documents?.length || 0}
            activeGoals={goalRows.filter((goal) => !goal.is_completed).length}
            anamnesisPending={anamnesisRows.filter((record) => record.status === "pending").length}
            packagesActive={packageRows.filter((pkg) => Number(pkg.total_sessions || 0) > Number(pkg.sessions_used || 0)).length}
            mood={mood}
          />
        );
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background pb-12 pt-28 text-foreground selection:bg-primary/10 selection:text-primary">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_12%_8%,hsl(var(--foreground)/0.055),transparent_32%),radial-gradient(circle_at_88%_4%,hsl(var(--primary)/0.075),transparent_30%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.22)_58%,hsl(var(--background)))] dark:bg-[radial-gradient(circle_at_12%_8%,rgba(255,255,255,0.045),transparent_32%),radial-gradient(circle_at_88%_4%,rgba(255,255,255,0.028),transparent_30%),linear-gradient(180deg,#070708,#0b0b0c_58%,#070708)]" />

      <NeuroDiverTopNav
        activeView={activeView}
        patientName={patientName}
        onNavigate={navigate}
        onSignOut={handleSignOut}
        loggingOut={loggingOut}
      />

      <main className="page-spacing relative z-10 mx-auto flex w-full max-w-[2200px] flex-col gap-4 px-4 pb-10 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        <DesktopWorkspaceShell>
          <div className="space-y-4">
            <PortalHero
              patientName={patientName}
              professionalName={professionalName}
              activeLabel={activeNav.label}
              nextAppointment={nextAppointment}
              pendingAmount={pendingAmount}
              documentsCount={documents.data?.documents?.length || 0}
              activeGoals={goalRows.filter((goal) => !goal.is_completed).length}
            />

            <PortalModuleRail activeView={activeView} onNavigate={navigate} />

            <DesktopWorkspacePanel className="min-h-[520px] p-4 sm:p-5 lg:p-6">
              {renderView()}
            </DesktopWorkspacePanel>
          </div>
        </DesktopWorkspaceShell>
      </main>
    </div>
  );
};

export default PatientPortal;
