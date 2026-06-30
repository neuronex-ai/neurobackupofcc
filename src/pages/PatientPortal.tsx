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
  HeartPulse,
  Home,
  Laugh,
  Loader2,
  Lock,
  LogOut,
  MapPin,
  Meh,
  Package,
  ReceiptText,
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
  { score: 2, label: "Dificil", icon: Frown, tone: "text-orange-600 border-orange-500/25 bg-orange-500/10" },
  { score: 3, label: "Neutro", icon: Meh, tone: "text-amber-600 border-amber-500/25 bg-amber-500/10" },
  { score: 4, label: "Bem", icon: Smile, tone: "text-emerald-600 border-emerald-500/25 bg-emerald-500/10" },
  { score: 5, label: "Leve", icon: Laugh, tone: "text-blue-600 border-blue-500/25 bg-blue-500/10" },
] as const;

const navItems = [
  { value: "home", label: "Inicio", path: "/portal", icon: Home },
  { value: "agenda", label: "Agenda", path: "/portal/agenda", icon: CalendarDays },
  { value: "anamneses", label: "Anamneses", path: "/portal/anamneses", icon: ClipboardList },
  { value: "historico", label: "Historico", path: "/portal/historico", icon: FileClock },
  { value: "documentos", label: "Documentos", path: "/portal/documentos", icon: FileText },
  { value: "metas", label: "Metas", path: "/portal/metas", icon: Target },
  { value: "progresso", label: "Progresso", path: "/portal/progresso", icon: TrendingUp },
  { value: "financeiro", label: "NeuroFinance", path: "/portal/financeiro", icon: CreditCard },
  { value: "pacotes", label: "Pacotes", path: "/portal/pacotes", icon: Package },
  { value: "humor", label: "Humor", path: "/portal/humor", icon: HeartPulse },
  { value: "perfil", label: "Perfil", path: "/portal/perfil", icon: UserRound },
] as const;

type PortalView = (typeof navItems)[number]["value"];

const viewFromPath = (pathname: string): PortalView => {
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

const NeuroDiverTopNav = ({
  activeView,
  patientName,
  onNavigate,
  onSignOut,
  loggingOut,
}: {
  activeView: PortalView;
  patientName: string;
  onNavigate: (path: string) => void;
  onSignOut: () => void;
  loggingOut: boolean;
}) => (
  <nav
    id="neurodiver-navbar"
    className="fixed left-0 right-0 top-7 z-[60] flex justify-center px-4 pointer-events-none"
    aria-label="Navegacao principal do NeuroDiver"
  >
    <div className="pointer-events-auto flex w-full max-w-[1480px] items-center gap-2 overflow-hidden rounded-[30px] border border-black/[0.075] bg-white/[0.72] px-2 py-2 shadow-[0_20px_70px_-52px_rgba(0,0,0,0.72)] ring-1 ring-white/55 backdrop-blur-2xl dark:border-white/[0.09] dark:bg-[#070708]/72 dark:ring-white/[0.05]">
      <button
        type="button"
        onClick={() => onNavigate("/portal")}
        className="flex min-w-0 shrink-0 items-center gap-3 rounded-[24px] px-3 py-2 text-left transition-colors hover:bg-foreground/[0.045] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Ir para Inicio do NeuroDiver"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-[18px] border border-foreground/[0.105] bg-background shadow-sm dark:border-white/[0.08] dark:bg-white/[0.045]">
          <img src="/favicon-dark.png" alt="" className="h-5 w-5 object-contain dark:hidden" />
          <img src="/favicon-light.png" alt="" className="hidden h-5 w-5 object-contain dark:block" />
        </span>
        <span className="hidden min-w-0 sm:block">
          <span className="block text-sm font-black leading-none tracking-tight text-foreground">NeuroDiver</span>
          <span className="mt-1 block max-w-[140px] truncate text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            {getFirstName(patientName)}
          </span>
        </span>
      </button>

      <div className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto px-1 no-scrollbar lg:flex">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeView === item.value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onNavigate(item.path)}
              className={cn(
                "flex h-11 shrink-0 items-center gap-2 rounded-[18px] px-3 text-xs font-black uppercase tracking-[0.08em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100",
                active
                  ? "bg-foreground text-background shadow-sm dark:bg-white dark:text-zinc-950"
                  : "text-muted-foreground hover:bg-foreground/[0.055] hover:text-foreground dark:hover:bg-white/[0.07]",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <Button
        onClick={onSignOut}
        disabled={loggingOut}
        variant="ghost"
        size="icon"
        className="ml-auto h-11 w-11 shrink-0 rounded-[18px] text-muted-foreground hover:bg-foreground/[0.055] hover:text-foreground dark:hover:bg-white/[0.07]"
        aria-label="Sair"
      >
        {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
      </Button>
    </div>
  </nav>
);

const PortalModuleRail = ({
  activeView,
  onNavigate,
}: {
  activeView: PortalView;
  onNavigate: (path: string) => void;
}) => (
  <DesktopWorkspacePanel className="p-2.5">
    <div className="flex gap-1.5 overflow-x-auto no-scrollbar lg:grid lg:grid-cols-11 lg:overflow-visible">
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
}: {
  patientName: string;
  professionalName: string;
  activeLabel: string;
  nextAppointment?: PatientPortalAppointment;
  pendingAmount: number;
  documentsCount: number;
  activeGoals: number;
}) => (
  <DesktopWorkspacePanel highContrast className="p-0">
    <div className="grid gap-5 p-5 sm:p-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)]">
      <div className="flex min-h-[238px] flex-col justify-between gap-8">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-background/18 bg-background/[0.08] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-background/62 dark:border-zinc-950/12 dark:bg-zinc-950/[0.05] dark:text-zinc-950/58">
              NeuroDiver
            </span>
            <span className="rounded-full border border-background/18 bg-background/[0.08] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-background/62 dark:border-zinc-950/12 dark:bg-zinc-950/[0.05] dark:text-zinc-950/58">
              {activeLabel}
            </span>
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
          label="Proxima sessao"
          value={nextAppointment ? dateTime.format(new Date(nextAppointment.start_time)) : "Sem horario"}
          detail={nextAppointment?.type || "Agenda"}
        />
        <PortalHeroStat
          label="NeuroFinance"
          value={pendingAmount ? money.format(pendingAmount) : "Em dia"}
          detail={pendingAmount ? "Pendencias abertas" : "Sem pendencias"}
          tone={pendingAmount ? "warning" : "success"}
        />
        <PortalHeroStat
          label="Documentos"
          value={documentsCount}
          detail="Compartilhados"
        />
        <PortalHeroStat
          label="Metas ativas"
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
      toast.error("Escolha um horario futuro.");
      return;
    }

    requestAppointment.mutate(
      { startTime: start.toISOString(), type },
      {
        onSuccess: () => {
          toast.success("Pedido enviado para confirmacao.");
          setOpen(false);
        },
        onError: (error) => toast.error(error instanceof Error ? error.message : "Nao foi possivel solicitar o horario."),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-11 rounded-2xl bg-zinc-950 px-4 text-xs font-bold uppercase tracking-[0.14em] text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100">
          <CalendarPlus className="mr-2 h-4 w-4" />
          Solicitar horario
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[520px] rounded-[28px] border border-border/70 bg-card p-0 shadow-2xl">
        <div className="border-b border-border/60 p-6">
          <DialogTitle className="text-xl font-semibold tracking-tight">Solicitar agendamento</DialogTitle>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Seu pedido fica pendente ate o profissional confirmar na agenda.
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
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Horario</span>
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
                {isRequest ? "Aguardando confirmacao" : isPast ? "Realizada/passada" : appointment.status || "Agendada"}
              </span>
              <span className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                {appointment.type === "online" ? <Video className="mr-1.5 h-3 w-3" /> : <MapPin className="mr-1.5 h-3 w-3" />}
                {appointment.type || "Sessao"}
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
        description="Consultas confirmadas e pedidos enviados por voce ficam agrupados aqui."
        action={<AppointmentRequestDialog />}
      />
      {rows.length ? (
        <>
          <div className="space-y-3">
            <p className="px-1 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Proximas consultas</p>
            {upcoming.length ? upcoming.map((appointment) => <AppointmentCard key={appointment.id} appointment={appointment} />) : (
              <EmptyState icon={CalendarDays} title="Nenhuma consulta futura" description="Solicite um horario para o profissional confirmar." />
            )}
          </div>
          {past.length > 0 && (
            <div className="space-y-3">
              <p className="px-1 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Historico de consultas</p>
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
  if (!rows.length) {
    return <EmptyState title="Nenhum documento compartilhado" description="Apenas arquivos liberados pelo profissional aparecem aqui, com links R2 temporarios." />;
  }

  return (
    <div className="space-y-4">
      <SectionHeader title="Documentos compartilhados" description={`${rows.length} arquivo${rows.length === 1 ? "" : "s"} disponivel${rows.length === 1 ? "" : "is"} com URL assinada.`} />
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
  );
};

const GoalsView = ({ goals }: { goals?: PatientPortalGoal[] }) => {
  const rows = goals || [];
  const toggleGoal = useTogglePatientPortalGoal();
  const completedCount = rows.filter((goal) => goal.is_completed).length;
  const progress = rows.length ? Math.round((completedCount / rows.length) * 100) : 0;

  if (!rows.length) {
    return <EmptyState icon={Target} title="Nenhuma meta ativa" description="Metas compartilhadas pelo profissional aparecem aqui para acompanhamento." />;
  }

  return (
    <div className="space-y-5">
      <Panel>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Plano de metas</p>
            <p className="mt-1 text-sm text-muted-foreground">{completedCount} de {rows.length} concluidas</p>
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
                  onSuccess: () => toast.success(goal.is_completed ? "Meta reaberta." : "Meta concluida."),
                  onError: (error) => toast.error(error instanceof Error ? error.message : "Nao foi possivel atualizar a meta."),
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
              {goal.due_date && <span className="mt-1 block text-xs font-medium text-muted-foreground">Ate {dateOnly.format(new Date(`${goal.due_date}T00:00:00`))}</span>}
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
}: {
  entries?: PatientPortalBillingEntry[];
  invoices?: PatientPortalInvoice[];
}) => {
  const entryRows = entries || [];
  const invoiceRows = invoices || [];
  const pendingAmount = entryRows
    .filter((entry) => !["paid", "received", "confirmed"].includes(String(entry.status || "").toLowerCase()))
    .reduce((total, entry) => total + Number(entry.amount || 0), 0);

  if (!entryRows.length && !invoiceRows.length) {
    return <EmptyState icon={ReceiptText} title="Nenhuma movimentacao compartilhada" description="Cobrancas, recibos e documentos financeiros aparecem aqui pelo NeuroFinance." />;
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard title="Pendencias" value={pendingAmount ? money.format(pendingAmount) : "Em dia"} icon={CreditCard} tone={pendingAmount ? "warning" : "success"} />
        <MetricCard title="Cobrancas" value={String(entryRows.length)} icon={ReceiptText} tone="info" />
        <MetricCard title="Documentos" value={String(invoiceRows.length)} icon={FileText} />
      </div>
      <div className="space-y-3">
        <p className="px-1 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Cobrancas NeuroFinance</p>
        {entryRows.map((entry) => (
          <article key={entry.id} className="rounded-[24px] border border-border/60 bg-card/82 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-base font-semibold text-foreground">{entry.title || entry.description || "Cobranca"}</p>
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
            <p className="text-base font-semibold text-foreground">{pkg.description || "Pacote terapeutico"}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Inicio {dateOnly.format(new Date(`${pkg.start_date}T00:00:00`))}
              {pkg.end_date ? ` - vence ${dateOnly.format(new Date(`${pkg.end_date}T00:00:00`))}` : ""}
            </p>
          </div>
        </div>
        <span className={cn("shrink-0 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em]", statusTone(complete ? "submitted" : expired ? "expired" : "pending"))}>
          {complete ? "Concluido" : expired ? "Expirado" : "Ativo"}
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
    return <EmptyState icon={Package} title="Nenhum pacote compartilhado" description="Pacotes contratados ou em acompanhamento ficam visiveis aqui quando estiverem cadastrados." />;
  }
  return (
    <div className="space-y-4">
      <SectionHeader title="Pacotes" description="Acompanhe sessoes usadas, restantes e historico de planos." />
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
    return <EmptyState icon={FileClock} title="Historico ainda vazio" description="Eventos compartilhados do seu cuidado aparecem em ordem cronologica aqui." />;
  }

  return (
    <div className="space-y-4">
      <SectionHeader title="Historico compartilhado" description="Timeline sanitizada: sem notas clinicas privadas ou resumos internos nao publicados." />
      <div className="space-y-3">
        {rows.map((item) => {
          const Icon = iconByType[item.type] || FileClock;
          return (
            <article key={item.id} className="rounded-[24px] border border-border/60 bg-card/82 p-4">
              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-background text-muted-foreground">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="text-xs font-medium text-muted-foreground">{dateTime.format(new Date(item.occurredAt))}</p>
                  </div>
                  {item.description && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.description}</p>}
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
        onError: (error) => toast.error(error instanceof Error ? error.message : "Nao foi possivel salvar a anamnese."),
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
          {record.status === "submitted" ? "Leitura" : record.status === "expired" ? "Expirada" : "Editavel"}
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
        <EmptyState icon={ClipboardList} title="Ficha sem perguntas" description="Esta anamnese ainda nao tem conteudo estruturado para exibir." />
      )}
    </Panel>
  );
};

const AnamnesisView = ({ anamneses }: { anamneses?: PatientPortalAnamnesis[] }) => {
  const rows = anamneses || [];
  if (!rows.length) {
    return <EmptyState icon={ClipboardList} title="Nenhuma anamnese disponivel" description="Fichas enviadas pelo profissional aparecem aqui para preencher ou consultar." />;
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
        <MetricCard title="Sessoes registradas" value={`${progress?.attendedSessions || 0}/${progress?.sessionsTotal || 0}`} icon={CalendarDays} />
        <MetricCard title="Metas concluidas" value={`${progress?.completedGoals || 0}/${progress?.goalsTotal || 0}`} icon={Target} tone={(progress?.completedGoals || 0) ? "success" : "default"} />
        <MetricCard title="Documentos" value={String(progress?.sharedDocuments || 0)} icon={FileText} tone="info" />
        <MetricCard title="Pacotes ativos" value={String(progress?.activePackages || 0)} icon={Package} />
      </div>
      <Panel>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-background text-muted-foreground">
            <BrainCircuit className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold text-foreground">Direcao atual</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Este painel usa apenas sinais compartilhados: agenda, metas, humor, documentos e pacotes. Notas clinicas privadas nao aparecem aqui.
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
                : "Nenhum diario preenchido ainda."}
            </p>
          </div>
        </div>
      </Panel>
    </div>
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
      { onSuccess: () => toast.success("Registro salvo no diario.") },
    );
  };

  return (
    <div className="space-y-5">
      <Panel>
        <p className="text-lg font-semibold text-foreground">Como voce esta hoje?</p>
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
        )) : <EmptyState icon={HeartPulse} title="Nenhum registro ainda" description="Use esta area para acompanhar pequenas mudancas entre as sessoes." />}
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
          <p className="mt-1 text-sm text-muted-foreground">{patientEmail || "E-mail nao informado"}</p>
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

const HomeView = ({
  nextAppointment,
  pendingAmount,
  documentsCount,
  activeGoals,
  anamnesisPending,
  packagesActive,
  mood,
}: {
  nextAppointment?: PatientPortalAppointment;
  pendingAmount: number;
  documentsCount: number;
  activeGoals: number;
  anamnesisPending: number;
  packagesActive: number;
  mood: ReturnType<typeof usePatientPortalMood>;
}) => (
  <div className="space-y-5">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard title="Proxima sessao" value={nextAppointment ? dateTime.format(new Date(nextAppointment.start_time)) : "Sem horario"} icon={CalendarDays} />
      <MetricCard title="NeuroFinance" value={pendingAmount ? money.format(pendingAmount) : "Em dia"} icon={CreditCard} tone={pendingAmount ? "warning" : "success"} />
      <MetricCard title="Documentos" value={String(documentsCount)} icon={FileText} tone="info" />
      <MetricCard title="Metas ativas" value={String(activeGoals)} icon={Target} />
    </div>
    <div className="grid gap-3 sm:grid-cols-2">
      <MetricCard title="Anamneses pendentes" value={String(anamnesisPending)} icon={ClipboardList} tone={anamnesisPending ? "warning" : "success"} />
      <MetricCard title="Pacotes ativos" value={String(packagesActive)} icon={Package} />
    </div>
    <Panel>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-foreground">Continuidade do cuidado</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Seu portal concentra agenda, documentos, financeiro, metas, pacotes, anamnese e registros de humor compartilhados com seguranca.
          </p>
        </div>
        <ShieldCheck className="h-5 w-5 text-emerald-500" />
      </div>
    </Panel>
    <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
      <div>
        <SectionHeader title="Agenda proxima" action={<AppointmentRequestDialog />} />
        {nextAppointment ? <AppointmentCard appointment={nextAppointment} /> : <EmptyState icon={CalendarDays} title="Sem horario futuro" description="Solicite um novo horario para confirmacao." />}
      </div>
      <DiaryView mood={mood} />
    </div>
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
  const professionalName = current.data?.professional?.name || "Seu psicologo";
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
        title="Portal temporariamente indisponivel"
        description={current.data.message || "O acesso ao portal depende da assinatura ativa do profissional."}
        action={<Button onClick={handleSignOut} variant="outline" className="h-11 rounded-xl">Sair</Button>}
      />
    );
  }

  if (current.data.status === "revoked") {
    return (
      <LockedPortalState
        title="Vinculo revogado"
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
