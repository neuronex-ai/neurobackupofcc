import { Button } from "@/components/ui/button";
import { DesktopWorkspacePanel, DesktopWorkspaceShell } from "@/components/ui/desktop-workspace";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  useUpdatePatientPortalProfile,
} from "@/hooks/use-patient-portal";
import { cn } from "@/lib/utils";
import {
  Angry,
  ArrowRight,
  BrainCircuit,
  CalendarDays,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
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
  Sparkles,
  Smile,
  Target,
  TrendingUp,
  Upload,
  UserRound,
  Video,
} from "lucide-react";
import { motion } from "framer-motion";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
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

const moodVisualConfig: Record<number, { label: string; color: string; tone: string }> = {
  1: { label: "Pesado", color: "#f43f5e", tone: "bg-rose-500/10 text-rose-500 border-rose-500/20" },
  2: { label: "Difícil", color: "#f97316", tone: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
  3: { label: "Neutro", color: "#eab308", tone: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  4: { label: "Bem", color: "#10b981", tone: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  5: { label: "Leve", color: "#6366f1", tone: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" },
};

const navItems = [
  { value: "home", label: "Início", path: "/portal", icon: Home },
  { value: "agenda", label: "Agenda", path: "/portal/agenda", icon: CalendarDays },
  { value: "humor", label: "Humor", path: "/portal/humor", icon: HeartPulse },
  { value: "documentos", label: "NeuroDrive", path: "/portal/documentos", icon: FileText },
  { value: "progresso", label: "Progresso", path: "/portal/progresso", icon: TrendingUp },
  { value: "financeiro", label: "NeuroFinance", path: "/portal/financeiro", icon: CreditCard },
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
const splitPatientName = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
};

const genderOptions = [
  { value: "", label: "Prefiro não informar" },
  { value: "female", label: "Feminino" },
  { value: "male", label: "Masculino" },
  { value: "non_binary", label: "Não binário" },
  { value: "agender", label: "Agênero" },
  { value: "gender_fluid", label: "Gênero fluido" },
  { value: "transgender", label: "Transgênero" },
  { value: "prefer_not_to_say", label: "Prefiro não dizer" },
  { value: "other", label: "Outro" },
];

const PortalModuleRail = ({
  activeView,
  onNavigate,
}: {
  activeView: PortalView;
  onNavigate: (path: string) => void;
}) => (
  <DesktopWorkspacePanel className="p-2.5">
    <div className="flex gap-1.5 overflow-x-auto no-scrollbar lg:grid lg:grid-cols-7 lg:overflow-visible">
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

const PortalHero = ({
  patientName,
  professionalName,
  activeLabel,
  nextAppointment,
  onSignOut,
  loggingOut,
}: {
  patientName: string;
  professionalName: string;
  activeLabel: string;
  nextAppointment?: PatientPortalAppointment;
  onSignOut: () => void;
  loggingOut: boolean;
}) => (
  <DesktopWorkspacePanel highContrast className="p-0">
    <div className="grid gap-5 p-5 sm:p-6 xl:grid-cols-[minmax(0,1.12fr)_minmax(360px,0.88fr)]">
      <div className="flex min-h-[228px] flex-col justify-between gap-8">
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

      <div className="relative overflow-hidden rounded-[30px] border border-background/16 bg-background/[0.08] p-5 shadow-sm dark:border-zinc-950/12 dark:bg-zinc-950/[0.05]">
        <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-background/12 blur-3xl dark:bg-zinc-950/10" />
        <div className="relative z-10 flex h-full flex-col justify-between gap-6">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-background/18 bg-background/[0.10] text-background/76 dark:border-zinc-950/12 dark:bg-zinc-950/[0.06] dark:text-zinc-950/70">
              <Sparkles className="h-5 w-5" />
            </div>
            <p className="mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-background/54 dark:text-zinc-950/52">
              Portal NeuroDiver
            </p>
            <p className="mt-3 max-w-md text-2xl font-black leading-tight tracking-tight text-background dark:text-zinc-950">
              Um painel simples para acompanhar o que importa agora.
            </p>
            <p className="mt-3 text-sm font-medium leading-relaxed text-background/62 dark:text-zinc-950/62">
              {nextAppointment
                ? `Próxima sessão em ${dateTime.format(new Date(nextAppointment.start_time))}.`
                : "Sem sessão futura confirmada no momento."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-background/18 bg-background/[0.08] px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-background/64 dark:border-zinc-950/12 dark:bg-zinc-950/[0.05] dark:text-zinc-950/62">
              Seguro
            </span>
            <span className="rounded-full border border-background/18 bg-background/[0.08] px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-background/64 dark:border-zinc-950/12 dark:bg-zinc-950/[0.05] dark:text-zinc-950/62">
              Compartilhado com você
            </span>
          </div>
        </div>
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

const PatientMiniCalendar = ({ appointments }: { appointments: PatientPortalAppointment[] }) => {
  const [monthDate, setMonthDate] = useState(new Date());
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const monthStart = new Date(year, month, 1);
  const offset = (monthStart.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - offset);
  const days = Array.from({ length: 42 }, (_, index) => new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index));
  const appointmentsByDay = appointments.reduce<Record<string, PatientPortalAppointment[]>>((result, appointment) => {
    const key = new Date(appointment.start_time).toDateString();
    result[key] = [...(result[key] || []), appointment];
    return result;
  }, {});

  return (
    <Panel className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-border/60 p-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-muted-foreground">Calendário</p>
          <p className="mt-1 text-xl font-black capitalize tracking-tight text-foreground">
            {monthOnly.format(monthDate)} {year}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-10 w-10 rounded-2xl"
            aria-label="Mês anterior"
            onClick={() => setMonthDate(new Date(year, month - 1, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-10 w-10 rounded-2xl"
            aria-label="Próximo mês"
            onClick={() => setMonthDate(new Date(year, month + 1, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-px bg-border/50 p-px">
        {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((day) => (
          <div key={day} className="bg-card px-2 py-2 text-center text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
            {day}
          </div>
        ))}
        {days.map((day) => {
          const key = day.toDateString();
          const dayAppointments = appointmentsByDay[key] || [];
          const isCurrentMonth = day.getMonth() === month;
          const isToday = key === new Date().toDateString();
          return (
            <div
              key={key}
              className={cn(
                "min-h-[86px] bg-card p-2 transition-colors",
                !isCurrentMonth && "bg-muted/35 text-muted-foreground/50",
                isToday && "bg-foreground/[0.035] dark:bg-white/[0.045]",
              )}
            >
              <div className={cn("flex h-7 w-7 items-center justify-center rounded-full text-xs font-black", isToday && "bg-foreground text-background dark:bg-white dark:text-zinc-950")}>
                {day.getDate()}
              </div>
              <div className="mt-2 space-y-1">
                {dayAppointments.slice(0, 2).map((appointment) => (
                  <div key={appointment.id} className="truncate rounded-full border border-border/70 bg-background/70 px-2 py-1 text-[10px] font-semibold text-muted-foreground">
                    {dateTime.format(new Date(appointment.start_time)).slice(-5)} {appointment.type === "online" ? "Online" : "Presencial"}
                  </div>
                ))}
                {dayAppointments.length > 2 && (
                  <p className="px-1 text-[10px] font-semibold text-muted-foreground">+{dayAppointments.length - 2}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
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
        description="Uma visão do calendário compartilhado com você. Pedidos enviados ficam pendentes até confirmação profissional."
        action={<AppointmentRequestDialog />}
      />
      <PatientMiniCalendar appointments={rows} />
      {rows.length ? (
        <>
          <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1 custom-scrollbar">
            <p className="px-1 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Próximas consultas</p>
            {upcoming.length ? upcoming.map((appointment) => <AppointmentCard key={appointment.id} appointment={appointment} />) : (
              <EmptyState icon={CalendarDays} title="Nenhuma consulta futura" description="Solicite um horário para o profissional confirmar." />
            )}
          </div>
          {past.length > 0 && (
            <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1 custom-scrollbar">
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

type NeuroDriveTab = "documentos" | "anamneses" | "neuroview" | "notas" | "tarefas" | "notion";

const PreparedPortalSpace = ({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Home;
  title: string;
  description: string;
}) => (
  <Panel className="min-h-[320px]">
    <div className="flex h-full flex-col items-center justify-center text-center">
      <div className="dashboard-soft-fill flex h-16 w-16 items-center justify-center rounded-[24px] text-muted-foreground">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="mt-6 text-2xl font-black tracking-tight text-foreground">{title}</h3>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  </Panel>
);

const DocumentsView = ({
  documents,
  anamneses,
  tab,
  onTabChange,
}: {
  documents?: PatientPortalDocument[];
  anamneses?: PatientPortalAnamnesis[];
  tab: NeuroDriveTab;
  onTabChange: (tab: NeuroDriveTab) => void;
}) => {
  const rows = documents || [];
  const anamnesisRows = anamneses || [];

  return (
    <div className="space-y-5">
      <SectionHeader title="NeuroDrive" description="Documentos compartilhados, anamneses e espaços preparados para seu acervo pessoal." />
      <div className="grid gap-3 md:grid-cols-4">
        {[
          { title: "Arquivos", value: String(rows.length), icon: FileText },
          { title: "Anamneses", value: String(anamnesisRows.length), icon: ClipboardList },
          { title: "NeuroView", value: "Em breve", icon: BrainCircuit },
          { title: "Notas + Notion", value: "Preparado", icon: Sparkles },
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

      <Tabs value={tab} onValueChange={(value) => onTabChange(value as NeuroDriveTab)}>
        <TabsList className="h-auto max-w-full flex-wrap justify-start rounded-[22px] p-1.5">
          <TabsTrigger value="documentos" className="rounded-2xl">Documentos</TabsTrigger>
          <TabsTrigger value="anamneses" className="rounded-2xl">Anamneses</TabsTrigger>
          <TabsTrigger value="neuroview" className="rounded-2xl">NeuroView</TabsTrigger>
          <TabsTrigger value="notas" className="rounded-2xl">Notas</TabsTrigger>
          <TabsTrigger value="tarefas" className="rounded-2xl">Tarefas</TabsTrigger>
          <TabsTrigger value="notion" className="rounded-2xl">Notion</TabsTrigger>
        </TabsList>
        <TabsContent value="documentos" className="space-y-3">
          {rows.length ? (
            <>
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
            </>
          ) : (
            <EmptyState title="Nenhum documento compartilhado" description="Apenas arquivos liberados pelo profissional aparecem aqui, com links R2 temporários." />
          )}
        </TabsContent>
        <TabsContent value="anamneses">
          <AnamnesisView anamneses={anamnesisRows} />
        </TabsContent>
        <TabsContent value="neuroview">
          <PreparedPortalSpace icon={BrainCircuit} title="NeuroView do paciente" description="Aqui ficará sua visão pessoal de documentos, registros e conexões importantes. Conteúdo clínico privado do profissional não aparece neste espaço." />
        </TabsContent>
        <TabsContent value="notas">
          <PreparedPortalSpace icon={ClipboardList} title="Notas pessoais" description="Área preparada para você criar registros próprios dentro do portal. A escrita persistente será ligada por um contrato seguro separado." />
        </TabsContent>
        <TabsContent value="tarefas">
          <PreparedPortalSpace icon={Target} title="Tarefas" description="Espaço reservado para tarefas pessoais e acompanhamentos leves, separado das missões compartilhadas pelo profissional." />
        </TabsContent>
        <TabsContent value="notion">
          <PreparedPortalSpace icon={Sparkles} title="Importação Notion" description="A integração será ativada apenas quando estiver isolada para o usuário-paciente, sem misturar notas profissionais ou dados clínicos privados." />
        </TabsContent>
      </Tabs>
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

const avatarInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return `${parts[0]?.[0] || "N"}${parts[1]?.[0] || ""}`.toUpperCase();
};

const historyActionText = (item: PatientPortalHistoryItem) => {
  if (item.type === "appointment") return "participou de uma atualização de agenda";
  if (item.type === "document") return "recebeu um documento no NeuroDrive";
  if (item.type === "goal") return "avançou em uma missão compartilhada";
  if (item.type === "mood") return "registrou um momento no diário de humor";
  if (item.type === "billing") return "teve uma atualização no NeuroFinance";
  if (item.type === "anamnesis") return "atualizou uma anamnese";
  return "teve uma atualização no portal";
};

const HistoryView = ({
  items,
  patientName,
  professionalName,
}: {
  items?: PatientPortalHistoryItem[];
  patientName: string;
  professionalName: string;
}) => {
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
    <div className="space-y-5">
      <SectionHeader title="Feed" description="Postagens do seu processo, com apenas informações compartilhadas com você." />
      <div className="relative space-y-4">
        <div className="absolute left-6 top-4 hidden h-[calc(100%-2rem)] w-px bg-gradient-to-b from-transparent via-border to-transparent md:block" />
        {rows.map((item) => {
          const Icon = iconByType[item.type] || FileClock;
          return (
            <article key={item.id} className="dashboard-retina-card group relative overflow-hidden rounded-[32px] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground/18 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
              <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-foreground/[0.035] blur-3xl dark:bg-white/[0.028]" />
              <div className="relative z-10 flex gap-4">
                <div className="relative shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background text-sm font-black text-foreground shadow-sm">
                    {avatarInitials(patientName)}
                  </div>
                  <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-black text-foreground">
                        {patientName}
                        <span className="ml-2 font-medium text-muted-foreground">{historyActionText(item)}</span>
                      </p>
                      <p className="mt-1 text-xs font-semibold text-muted-foreground">{dateTime.format(new Date(item.occurredAt))}</p>
                    </div>
                    <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                      {item.type}
                    </span>
                  </div>
                  <div className="mt-4 rounded-[24px] border border-border/60 bg-background/62 p-4">
                    <p className="text-base font-semibold text-foreground">{item.title}</p>
                    {item.description && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>}
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button type="button" className="inline-flex h-10 items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground">
                      <Heart className="h-3.5 w-3.5" />
                      Acolhido pelo profissional
                    </button>
                    <button type="button" className="inline-flex h-10 items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground">
                      <MessageCircle className="h-3.5 w-3.5" />
                      Comentário do {getFirstName(professionalName)} em breve
                    </button>
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

type ProgressTab = "visao" | "missoes" | "feed";

const ProgressView = ({
  progress,
  goals,
  historyItems,
  patientName,
  professionalName,
  tab,
  onTabChange,
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
  historyItems?: PatientPortalHistoryItem[];
  patientName: string;
  professionalName: string;
  tab: ProgressTab;
  onTabChange: (tab: ProgressTab) => void;
}) => {
  const lastMood = progress?.lastMood;
  const moodMeta = moodOptions.find((option) => option.score === lastMood?.mood_score);
  const MoodIcon = moodMeta?.icon || HeartPulse;
  const openGoals = progress?.nextSteps || (goals || []).filter((goal) => !goal.is_completed).slice(0, 5);

  return (
    <div className="space-y-5">
      <SectionHeader title="Progresso" description="Visão geral, missões e feed do seu processo em um só lugar." />
      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard title="Sessões registradas" value={`${progress?.attendedSessions || 0}/${progress?.sessionsTotal || 0}`} icon={CalendarDays} />
        <MetricCard title="Missões concluídas" value={`${progress?.completedGoals || 0}/${progress?.goalsTotal || 0}`} icon={Target} tone={(progress?.completedGoals || 0) ? "success" : "default"} />
        <MetricCard title="Documentos" value={String(progress?.sharedDocuments || 0)} icon={FileText} tone="info" />
        <MetricCard title="Pacotes em uso" value={String(progress?.activePackages || 0)} icon={Package} />
      </div>
      <Tabs value={tab} onValueChange={(value) => onTabChange(value as ProgressTab)}>
        <TabsList className="h-auto flex-wrap justify-start rounded-[22px] p-1.5">
          <TabsTrigger value="visao" className="rounded-2xl">Visão geral</TabsTrigger>
          <TabsTrigger value="missoes" className="rounded-2xl">Missões</TabsTrigger>
          <TabsTrigger value="feed" className="rounded-2xl">Feed</TabsTrigger>
        </TabsList>
        <TabsContent value="visao" className="space-y-5">
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
                  )) : <p className="text-sm text-muted-foreground">Nenhuma missão aberta no momento.</p>}
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
        </TabsContent>
        <TabsContent value="missoes">
          <GoalsView goals={goals} />
        </TabsContent>
        <TabsContent value="feed">
          <HistoryView items={historyItems} patientName={patientName} professionalName={professionalName} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const MoodChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const score = Number(payload[0].value || 3);
  const config = moodVisualConfig[score] || moodVisualConfig[3];

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white/92 p-4 shadow-2xl ring-1 ring-black/5 backdrop-blur-2xl dark:border-white/[0.085] dark:bg-[#0b0b0d] dark:ring-white/5">
      <p className="mb-3 border-b border-zinc-100 pb-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:border-white/[0.065] dark:text-zinc-500">
        {label}
      </p>
      <div className="flex items-center gap-3">
        <span className={cn("rounded-lg border px-3 py-2 text-xs font-black uppercase tracking-[0.16em]", config.tone)}>
          {config.label}
        </span>
      </div>
    </div>
  );
};

const MoodTrendChart = ({ logs }: { logs: PatientPortalMoodLog[] }) => {
  const rows = [...logs]
    .sort((left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime())
    .slice(-14);
  const avgMood = rows.length ? rows.reduce((total, log) => total + Number(log.mood_score || 0), 0) / rows.length : 0;
  const chartData = rows.map((log) => ({
    date: dateOnly.format(new Date(log.created_at)).slice(0, 5),
    fullDate: dateOnly.format(new Date(log.created_at)),
    score: log.mood_score,
  }));

  return (
    <section className="relative overflow-hidden rounded-[34px] border border-zinc-200/50 bg-white p-6 shadow-[0_24px_72px_-58px_rgba(0,0,0,0.42)] dark:border-white/[0.085] dark:bg-[#0b0b0d] dark:shadow-[0_24px_62px_-46px_rgba(0,0,0,0.96)] md:p-8">
      <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-primary/5 blur-[100px] dark:bg-white/[0.018]" />
      <div className="relative z-10 mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-center">
        <div className="flex items-center gap-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-100 text-zinc-900 shadow-lg dark:border-white/[0.075] dark:bg-[#141415] dark:text-white">
            <TrendingUp className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-xl font-black leading-none tracking-tight text-zinc-900 dark:text-zinc-100">Tendência Emocional</h3>
            <p className="mt-2 text-[10px] font-bold uppercase leading-none tracking-[0.2em] text-zinc-500">Análise de variação de humor</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-zinc-200/50 bg-zinc-100/50 p-1 backdrop-blur-md dark:border-white/[0.065] dark:bg-[#080809]">
          <div className="rounded-xl border border-zinc-200 bg-white px-5 py-3 shadow-lg dark:border-white/[0.075] dark:bg-[#141415]">
            <p className="mb-1 text-[9px] font-black uppercase leading-none tracking-widest text-zinc-400 dark:text-zinc-500">Média geral</p>
            <p className="text-2xl font-black leading-none tracking-tight text-zinc-900 dark:text-white">{avgMood ? avgMood.toFixed(1) : "0.0"}</p>
          </div>
          <div className="hidden px-4 sm:block">
            <p className="mb-1 text-[9px] font-black uppercase leading-none tracking-widest text-zinc-400 dark:text-zinc-500">Registros</p>
            <p className="text-sm font-bold leading-none text-zinc-900 dark:text-white">{rows.length}</p>
          </div>
        </div>
      </div>

      <div className="relative z-10 h-[300px] rounded-[32px] border border-zinc-200/50 bg-zinc-100/30 p-6 shadow-inner dark:border-white/[0.065] dark:bg-[#080809]">
        {rows.length < 2 ? (
          <div className="flex h-full items-center justify-center text-center">
            <p className="max-w-sm text-sm font-medium leading-relaxed text-muted-foreground">
              Com dois registros ou mais, seu histórico emocional começa a desenhar uma linha do tempo.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,120,0.12)" vertical={false} />
              <XAxis dataKey="date" stroke="transparent" tick={{ fill: "rgba(120,120,120,0.58)", fontSize: 10, fontWeight: 700 }} dy={15} />
              <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} stroke="transparent" tick={{ fill: "rgba(120,120,120,0.58)", fontSize: 10, fontWeight: 700 }} />
              <Tooltip content={<MoodChartTooltip />} cursor={{ stroke: "rgba(120,120,120,0.16)", strokeWidth: 2 }} />
              <ReferenceLine y={3} stroke="rgba(120,120,120,0.18)" strokeDasharray="6 6" />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#6366f1"
                strokeWidth={5}
                dot={{ r: 6, fill: "#6366f1", strokeWidth: 4, stroke: "#fff" }}
                activeDot={{ r: 8, strokeWidth: 0, fill: "#4f46e5" }}
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
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
  patientAvatarUrl,
  patientGenderIdentity,
  professionalName,
  onSignOut,
  loggingOut,
}: {
  patientName: string;
  patientEmail?: string | null;
  patientAvatarUrl?: string | null;
  patientGenderIdentity?: string | null;
  professionalName: string;
  onSignOut: () => void;
  loggingOut: boolean;
}) => {
  const initialName = useMemo(() => splitPatientName(patientName), [patientName]);
  const [firstName, setFirstName] = useState(initialName.firstName);
  const [lastName, setLastName] = useState(initialName.lastName);
  const [genderIdentity, setGenderIdentity] = useState(patientGenderIdentity || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const updateProfile = useUpdatePatientPortalProfile();

  useEffect(() => {
    setFirstName(initialName.firstName);
    setLastName(initialName.lastName);
  }, [initialName.firstName, initialName.lastName]);

  useEffect(() => {
    setGenderIdentity(patientGenderIdentity || "");
  }, [patientGenderIdentity]);

  const previewUrl = avatarFile ? URL.createObjectURL(avatarFile) : patientAvatarUrl || "";

  useEffect(() => {
    if (!avatarFile || !previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [avatarFile, previewUrl]);

  const save = () => {
    updateProfile.mutate(
      {
        firstName,
        lastName,
        genderIdentity: genderIdentity || null,
        avatarFile,
      },
      {
        onSuccess: () => {
          setAvatarFile(null);
          toast.success("Perfil atualizado.");
        },
        onError: (error) => toast.error(error instanceof Error ? error.message : "Não foi possível atualizar seu perfil."),
      },
    );
  };

  return (
    <div className="space-y-4">
      <Panel>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="flex items-center gap-4 lg:w-[320px]">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[26px] border border-border bg-background text-muted-foreground">
              {previewUrl ? (
                <img src={previewUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <UserRound className="h-7 w-7" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-foreground">{patientName}</p>
              <p className="mt-1 truncate text-sm text-muted-foreground">{patientEmail || "E-mail não informado"}</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => setAvatarFile(event.target.files?.[0] || null)}
              />
              <Button type="button" variant="outline" size="sm" className="mt-3 rounded-2xl" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Foto
              </Button>
            </div>
          </div>

          <div className="grid min-w-0 flex-1 gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Nome</span>
              <Input value={firstName} onChange={(event) => setFirstName(event.target.value)} maxLength={80} />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Sobrenome</span>
              <Input value={lastName} onChange={(event) => setLastName(event.target.value)} maxLength={120} />
            </label>
            <label className="space-y-2 sm:col-span-2">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Gênero</span>
              <select
                value={genderIdentity}
                onChange={(event) => setGenderIdentity(event.target.value)}
                className="flex h-11 w-full rounded-xl border border-border/30 bg-background/50 px-4 py-2 text-sm shadow-sm outline-none transition-all focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                {genderOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <div className="sm:col-span-2">
              <Button onClick={save} disabled={updateProfile.isPending} className="h-12 rounded-2xl bg-zinc-950 px-6 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100">
                {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar perfil
              </Button>
            </div>
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
};

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
        onClick={() => onNavigate("/portal/documentos?tab=anamneses")}
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

const ReflectionCarousel = ({ patientName }: { patientName: string }) => {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setActiveSlide((current) => (current === 0 ? 1 : 0)), 5200);
    return () => window.clearInterval(timer);
  }, []);

  const slides = [
    {
      eyebrow: "Frase do dia",
      title: quoteOfTheDay(),
      description: "Uma pequena lâmina para atravessar o dia com menos ruído e mais presença.",
    },
    {
      eyebrow: "Boas-vindas",
      title: "Esse ambiente foi construído para você.",
      description: `Não somos empresários. Somos pacientes que, como você, vislumbram um futuro melhor. Seja muito bem-vindo, ${getFirstName(patientName)}.`,
    },
  ];

  return (
    <section className="relative overflow-hidden rounded-[42px] border border-border/45 bg-foreground p-6 text-center text-background shadow-[0_32px_110px_-78px_rgba(0,0,0,0.9)] dark:bg-white dark:text-zinc-950 md:p-10">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.12),transparent_42%,rgba(255,255,255,0.04))] dark:bg-[linear-gradient(135deg,rgba(0,0,0,0.055),transparent_42%,rgba(0,0,0,0.02))]" />
      <div className="relative z-10 mx-auto max-w-4xl overflow-hidden">
        <motion.div
          className="flex"
          animate={{ x: `${activeSlide * -100}%` }}
          transition={{ type: "spring", stiffness: 90, damping: 22, mass: 0.8 }}
        >
          {slides.map((slide) => (
            <div key={slide.eyebrow} className="flex min-h-[220px] min-w-full flex-col items-center justify-center px-4 md:min-h-[260px]">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-background text-foreground dark:bg-zinc-950 dark:text-white">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-55">{slide.eyebrow}</p>
              <h2 className="mt-5 max-w-3xl text-3xl font-black leading-[0.96] tracking-tight md:text-5xl">{slide.title}</h2>
              <p className="mx-auto mt-5 max-w-2xl text-sm font-medium leading-relaxed opacity-62 md:text-base">{slide.description}</p>
            </div>
          ))}
        </motion.div>
        <div className="mt-2 flex justify-center gap-2">
          {slides.map((slide, index) => (
            <button
              key={slide.eyebrow}
              type="button"
              onClick={() => setActiveSlide(index)}
              className={cn(
                "h-2 rounded-full transition-all duration-300 motion-reduce:transition-none",
                activeSlide === index ? "w-8 bg-background dark:bg-zinc-950" : "w-2 bg-background/25 dark:bg-zinc-950/25",
              )}
              aria-label={`Ir para ${slide.eyebrow}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

const NeuroNexSignature = () => (
  <section className="relative overflow-hidden rounded-[38px] border border-border/50 bg-[#050506] p-6 text-white shadow-[0_34px_110px_-76px_rgba(0,0,0,0.95)] md:p-8">
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.09),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.035),transparent_52%)]" />
    <div className="pointer-events-none absolute inset-0 bg-[url('/noise.png')] opacity-[0.008]" />
    <div className="relative z-10 grid gap-6 md:grid-cols-[0.78fr_1.22fr] md:items-center">
      <div className="relative flex min-h-[220px] items-center justify-center overflow-hidden rounded-[30px] border border-white/[0.075] bg-white/[0.026]">
        <div className="absolute h-44 w-44 rounded-full border border-white/[0.10] motion-safe:animate-pulse motion-reduce:animate-none" />
        <div className="absolute h-72 w-72 rounded-full border border-white/[0.035]" />
        <div className="absolute h-28 w-28 rounded-full bg-white/[0.055] blur-2xl" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-[28px] border border-white/[0.12] bg-white/[0.07] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_24px_70px_-40px_rgba(255,255,255,0.35)] backdrop-blur-2xl">
          <BrainCircuit className="h-8 w-8 text-white/82" />
        </div>
      </div>
      <div className="py-2">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/42">NeuroDiver</p>
        <h2 className="mt-4 max-w-2xl text-3xl font-black leading-[0.94] tracking-tight md:text-5xl">
          Um espaço de cuidado com a nossa linguagem.
        </h2>
        <p className="mt-5 max-w-xl text-sm font-medium leading-relaxed text-white/56 md:text-base">
          NeuroNex AI. De paciente para paciente, com privacidade, delicadeza e clareza no centro da experiência.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {["Seguro", "Privado", "Compartilhado com intenção"].map((item) => (
            <span key={item} className="rounded-full border border-white/[0.09] bg-white/[0.04] px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/58">
              {item}
            </span>
          ))}
        </div>
      </div>
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
}) => {
  const todayMood = mood.data?.today;
  const moodMeta = moodOptions.find((option) => option.score === todayMood?.mood_score);
  const packageActive = packages.find((pkg) => Number(pkg.total_sessions || 0) > Number(pkg.sessions_used || 0));

  return (
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
          value={`${documentsCount} itens`}
          detail="Documentos, anamneses e espaços pessoais."
          icon={FileText}
          onClick={() => onNavigate("/portal/documentos")}
        />
        <HomeShortcutCard
          title="Progresso"
          value={activeGoals ? `${activeGoals} missões` : "Em dia"}
          detail={activeGoals ? "Pequenas conquistas em movimento." : "Sem missão aberta agora."}
          icon={TrendingUp}
          onClick={() => onNavigate("/portal/progresso")}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_1fr_0.9fr]">
        <Panel className="min-h-[156px]">
          <div className="flex h-full items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Resumo de hoje</p>
              <p className="mt-4 text-2xl font-black tracking-tight text-foreground">
                {todayMood ? `Humor ${moodMeta?.label || todayMood.mood_score}` : "Sem registro ainda"}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {todayMood ? "Seu diário de humor está salvo para hoje." : "Registre seu humor quando fizer sentido."}
              </p>
            </div>
            <Button variant="outline" className="rounded-2xl" onClick={() => onNavigate("/portal/humor")}>
              Humor
            </Button>
          </div>
        </Panel>
        <AnamnesisHomeCard record={anamnesisRecord} onNavigate={onNavigate} />
        <PackagesHomeCard packages={packages} onNavigate={onNavigate} />
      </div>

      <Panel className="overflow-hidden">
        <div className="grid gap-5 md:grid-cols-[1fr_0.72fr] md:items-center">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Continuidade</p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-foreground">O próximo passo está nas abas certas.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Agenda, humor, documentos, progresso e financeiro ficam separados para você encontrar rápido, sem a Home virar um painel pesado.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Agenda", path: "/portal/agenda", icon: CalendarDays },
              { label: "Humor", path: "/portal/humor", icon: HeartPulse },
              { label: "Missões", path: "/portal/progresso?tab=missoes", icon: Target },
              { label: packageActive ? "Pacote ativo" : "NeuroFinance", path: "/portal/financeiro", icon: CreditCard },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => onNavigate(item.path)}
                className="flex h-20 flex-col items-center justify-center gap-2 rounded-2xl border border-border/60 bg-background/70 text-xs font-black uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </Panel>

      <ReflectionCarousel patientName={patientName} />
      <NeuroNexSignature />
    </div>
  );
};

const PatientPortal = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const activeView = viewFromPath(location.pathname);
  const searchParams = new URLSearchParams(location.search);
  const requestedTab = searchParams.get("tab") || "";
  const neuroDriveTab = (["documentos", "anamneses", "neuroview", "notas", "tarefas", "notion"].includes(requestedTab) ? requestedTab : "documentos") as NeuroDriveTab;
  const progressTab = (["visao", "missoes", "feed"].includes(requestedTab) ? requestedTab : "visao") as ProgressTab;
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

  useEffect(() => {
    if (location.pathname.startsWith("/portal/historico")) {
      navigate("/portal/progresso?tab=feed", { replace: true });
    } else if (location.pathname.startsWith("/portal/metas")) {
      navigate("/portal/progresso?tab=missoes", { replace: true });
    } else if (location.pathname.startsWith("/portal/anamneses")) {
      navigate("/portal/documentos?tab=anamneses", { replace: true });
    }
  }, [location.pathname, navigate]);

  const setNeuroDriveTab = (tab: NeuroDriveTab) => navigate(tab === "documentos" ? "/portal/documentos" : `/portal/documentos?tab=${tab}`);
  const setProgressTab = (tab: ProgressTab) => navigate(tab === "visao" ? "/portal/progresso" : `/portal/progresso?tab=${tab}`);

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
        description="Entre pelo link do convite enviado por e-mail ou informe o código de ativação para liberar seu acesso."
        action={(
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={() => navigate("/portal/ativar")} className="h-11 rounded-xl">Inserir código</Button>
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
      case "documentos":
        return documents.isLoading || anamnesis.isLoading ? <LoadingCard /> : (
          <DocumentsView
            documents={documents.data?.documents}
            anamneses={anamnesisRows}
            tab={neuroDriveTab}
            onTabChange={setNeuroDriveTab}
          />
        );
      case "progresso":
        return progress.isLoading || goals.isLoading || history.isLoading ? <LoadingCard /> : (
          <ProgressView
            progress={progress.data?.progress}
            goals={goalRows}
            historyItems={history.data?.items}
            patientName={patientName}
            professionalName={professionalName}
            tab={progressTab}
            onTabChange={setProgressTab}
          />
        );
      case "financeiro":
        return billing.isLoading || packages.isLoading ? <LoadingCard /> : <BillingView entries={billingEntries} invoices={billing.data?.invoices} packages={packageRows} />;
      case "humor":
        return mood.isLoading ? <LoadingCard /> : <DiaryView mood={mood} />;
      case "perfil":
        return (
          <ProfileView
            patientName={patientName}
            patientEmail={current.data.patient?.email}
            patientAvatarUrl={current.data.patient?.avatarUrl}
            patientGenderIdentity={current.data.patient?.genderIdentity}
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
            anamnesisRecord={anamnesisRows.find((record) => record.status === "pending") || anamnesisRows[0]}
            packages={packageRows}
            mood={mood}
            patientName={patientName}
            onNavigate={navigate}
          />
        );
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background pb-12 pt-6 text-foreground selection:bg-primary/10 selection:text-primary lg:pt-8">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_12%_8%,hsl(var(--foreground)/0.055),transparent_32%),radial-gradient(circle_at_88%_4%,hsl(var(--primary)/0.075),transparent_30%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.22)_58%,hsl(var(--background)))] dark:bg-[radial-gradient(circle_at_12%_8%,rgba(255,255,255,0.045),transparent_32%),radial-gradient(circle_at_88%_4%,rgba(255,255,255,0.028),transparent_30%),linear-gradient(180deg,#070708,#0b0b0c_58%,#070708)]" />

      <main className="page-spacing relative z-10 mx-auto flex w-full max-w-[2200px] flex-col gap-4 px-4 pb-10 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        <DesktopWorkspaceShell>
          <div className="space-y-4">
            <PortalHero
              patientName={patientName}
              professionalName={professionalName}
              activeLabel={activeNav.label}
              nextAppointment={nextAppointment}
              onSignOut={handleSignOut}
              loggingOut={loggingOut}
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
