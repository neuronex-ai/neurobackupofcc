import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/components/auth/SessionContextProvider";
import {
  useRequestPatientPortalAppointment,
  usePatientPortalAppointments,
  usePatientPortalBilling,
  usePatientPortalCurrent,
  usePatientPortalDocuments,
  usePatientPortalGoals,
  usePatientPortalMood,
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
  CreditCard,
  Download,
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
  ReceiptText,
  ShieldAlert,
  Smile,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
  Video,
} from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
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
const dayOnly = new Intl.DateTimeFormat("pt-BR", { day: "2-digit" });
const monthOnly = new Intl.DateTimeFormat("pt-BR", { month: "short" });

const moodOptions = [
  { score: 1, label: "Pesado", icon: Angry, tone: "text-rose-500 border-rose-500/25 bg-rose-500/10" },
  { score: 2, label: "Dificil", icon: Frown, tone: "text-orange-500 border-orange-500/25 bg-orange-500/10" },
  { score: 3, label: "Neutro", icon: Meh, tone: "text-amber-500 border-amber-500/25 bg-amber-500/10" },
  { score: 4, label: "Bem", icon: Smile, tone: "text-emerald-500 border-emerald-500/25 bg-emerald-500/10" },
  { score: 5, label: "Leve", icon: Laugh, tone: "text-blue-500 border-blue-500/25 bg-blue-500/10" },
] as const;

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

const navItems = [
  { value: "home", label: "Inicio", path: "/portal", icon: Home },
  { value: "agenda", label: "Agenda", path: "/portal/agenda", icon: CalendarDays },
  { value: "diario", label: "Diario", path: "/portal/diario", icon: HeartPulse },
  { value: "metas", label: "Metas", path: "/portal/metas", icon: Target },
  { value: "progresso", label: "Progresso", path: "/portal/progresso", icon: TrendingUp },
  { value: "documentos", label: "Docs", path: "/portal/documentos", icon: FileText },
  { value: "financeiro", label: "Financeiro", path: "/portal/financeiro", icon: CreditCard },
  { value: "perfil", label: "Perfil", path: "/portal/perfil", icon: UserRound },
] as const;

type PortalView = (typeof navItems)[number]["value"];

const viewFromPath = (pathname: string): PortalView => {
  const match = navItems.find((item) => item.path !== "/portal" && pathname.startsWith(item.path));
  return match?.value || "home";
};

const EmptyState = ({ title, description }: { title: string; description: string }) => (
  <div className="rounded-3xl border border-dashed border-border/65 bg-muted/25 p-6 text-center">
    <p className="text-sm font-semibold text-foreground">{title}</p>
    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
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
  tone?: "default" | "success" | "warning";
}) => (
  <div className="rounded-3xl border border-border/50 bg-card/76 p-4 shadow-sm">
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <div
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-2xl",
          tone === "success" && "bg-emerald-500/10 text-emerald-500",
          tone === "warning" && "bg-amber-500/10 text-amber-500",
          tone === "default" && "bg-foreground/8 text-foreground",
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
    </div>
    <p className="mt-4 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
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
    <section className="w-full max-w-[560px] rounded-[32px] border border-border/55 bg-card/80 p-6 shadow-2xl shadow-black/5 sm:p-8">
      <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-foreground text-background">
        <Lock className="h-6 w-6" />
      </div>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </section>
  </div>
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
          toast.success("Solicitacao enviada para o profissional.");
          setOpen(false);
        },
        onError: (error) => toast.error(error instanceof Error ? error.message : "Nao foi possivel solicitar o horario."),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-11 rounded-2xl bg-zinc-950 px-4 text-xs font-black uppercase tracking-[0.16em] text-white shadow-xl shadow-black/10 hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100">
          <CalendarPlus className="mr-2 h-4 w-4" />
          Novo horario
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[520px] rounded-[28px] border border-border/70 bg-card p-0 shadow-2xl">
        <div className="border-b border-border/60 p-6">
          <DialogTitle className="text-xl font-semibold tracking-tight">Solicitar agendamento</DialogTitle>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Envie uma preferencia de horario para confirmacao do profissional.
          </p>
        </div>

        <div className="space-y-5 p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Data</span>
              <input
                type="date"
                min={toDateInputValue(new Date())}
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-foreground outline-none transition-colors focus:border-foreground/40"
              />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Horario</span>
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
            className="h-12 w-full rounded-2xl bg-zinc-950 text-xs font-black uppercase tracking-[0.18em] text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
          >
            {requestAppointment.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
            Enviar solicitacao
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const AppointmentsView = ({ appointments }: { appointments: ReturnType<typeof usePatientPortalAppointments>["data"] }) => {
  const rows = appointments?.appointments || [];

  if (!rows.length) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <AppointmentRequestDialog />
        </div>
        <EmptyState title="Nenhuma sessao agendada" description="Quando seu psicologo confirmar novos horarios, eles aparecem aqui." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Agenda compartilhada</p>
          <p className="mt-1 text-sm text-muted-foreground">{rows.length} registro{rows.length === 1 ? "" : "s"} visivel{rows.length === 1 ? "" : "s"}</p>
        </div>
        <AppointmentRequestDialog />
      </div>
      {rows.map((appointment) => (
        <article key={appointment.id} className="rounded-[28px] border border-border/55 bg-card/80 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 gap-4">
              <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl border border-border bg-background">
                <span className="text-base font-bold text-foreground">{dayOnly.format(new Date(appointment.start_time))}</span>
                <span className="text-[9px] font-black uppercase text-muted-foreground">{monthOnly.format(new Date(appointment.start_time))}</span>
              </div>
              <div className="min-w-0">
                <p className="text-base font-semibold text-foreground">{dateTime.format(new Date(appointment.start_time))}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {appointment.type || "Sessao"} - {appointment.status || "agendada"}
                </p>
                {appointment.location && <p className="mt-2 text-sm text-muted-foreground">{appointment.location}</p>}
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <span className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                {appointment.type === "online" ? <Video className="mr-1.5 h-3 w-3" /> : <MapPin className="mr-1.5 h-3 w-3" />}
                {appointment.type || "Sessao"}
              </span>
              {appointment.google_meet_link && (
                <Button asChild size="sm" className="rounded-xl">
                  <a href={appointment.google_meet_link} target="_blank" rel="noreferrer">
                    Entrar
                  </a>
                </Button>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
};

const DocumentsView = ({ documents }: { documents: ReturnType<typeof usePatientPortalDocuments>["data"] }) => {
  const rows = documents?.documents || [];

  if (!rows.length) {
    return <EmptyState title="Nenhum documento compartilhado" description="Apenas arquivos liberados pelo seu psicologo ficam disponiveis aqui." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Arquivos compartilhados</p>
          <p className="mt-1 text-sm text-muted-foreground">{rows.length} documento{rows.length === 1 ? "" : "s"} {rows.length === 1 ? "disponivel" : "disponiveis"}</p>
        </div>
      </div>
      {rows.map((document) => (
        <article key={document.id} className="rounded-[28px] border border-border/55 bg-card/80 p-4 shadow-sm transition-colors hover:border-foreground/15">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-background text-muted-foreground">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-foreground">{document.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {fileSize(document.sizeBytes)} - {document.sharedAt ? `Compartilhado em ${dateOnly.format(new Date(document.sharedAt))}` : "Compartilhado"}
                </p>
              </div>
            </div>
            <Button
              disabled={!document.signedUrl}
              size="icon"
              variant="outline"
              className="h-10 w-10 shrink-0 rounded-xl"
              onClick={() => document.signedUrl && window.open(document.signedUrl, "_blank", "noopener,noreferrer")}
              aria-label={`Baixar ${document.name}`}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
};

const BillingView = ({ billing }: { billing: ReturnType<typeof usePatientPortalBilling>["data"] }) => {
  const entries = billing?.entries || [];
  const invoices = billing?.invoices || [];

  if (!entries.length && !invoices.length) {
    return <EmptyState title="Nenhuma pendencia financeira" description="Cobrancas e comprovantes compartilhados aparecem nesta area." />;
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-border/55 bg-card/80 p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground">NeuroFinance</p>
            <p className="mt-1 text-sm text-muted-foreground">Cobrancas, pagamentos e comprovantes compartilhados.</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-background text-muted-foreground">
            <ReceiptText className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {entries.map((entry) => (
          <article key={entry.id} className="rounded-[24px] border border-border/55 bg-card/80 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-base font-semibold text-foreground">{entry.title || entry.description || "Cobranca"}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {entry.due_date ? `Vence em ${dateOnly.format(new Date(`${entry.due_date}T00:00:00`))}` : "Sem vencimento"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-base font-semibold">{money.format(Number(entry.amount || 0))}</p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">{entry.status}</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      {invoices.length > 0 && (
        <section className="space-y-3">
          <p className="px-1 text-sm font-semibold text-muted-foreground">Documentos financeiros</p>
          {invoices.map((invoice) => {
            const url = invoice.invoice_url || invoice.bank_slip_url || invoice.receipt_url || "";
            return (
              <article key={invoice.id} className="rounded-[24px] border border-border/55 bg-card/80 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold text-foreground">{invoice.invoice_number || "Documento"}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {invoice.status} {invoice.due_date ? `- ${dateOnly.format(new Date(`${invoice.due_date}T00:00:00`))}` : ""}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!url}
                    className="rounded-xl"
                    onClick={() => url && window.open(url, "_blank", "noopener,noreferrer")}
                  >
                    Abrir
                  </Button>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
};

const GoalsView = ({ goals }: { goals: ReturnType<typeof usePatientPortalGoals>["data"] }) => {
  const rows = goals?.goals || [];
  const toggleGoal = useTogglePatientPortalGoal();
  const completedCount = rows.filter((goal) => goal.is_completed).length;
  const progress = rows.length ? Math.round((completedCount / rows.length) * 100) : 0;

  if (!rows.length) {
    return <EmptyState title="Nenhuma meta ativa" description="Quando novas metas forem compartilhadas, elas aparecem aqui." />;
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[28px] border border-border/55 bg-card/80 p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Plano de metas</p>
            <p className="mt-1 text-sm text-muted-foreground">{completedCount} de {rows.length} concluidas</p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-background text-lg font-black text-foreground">
            {progress}%
          </div>
        </div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-foreground transition-all" style={{ width: `${progress}%` }} />
        </div>
      </section>

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
                : "border-border/55 bg-card/80 hover:border-foreground/15",
            )}
          >
            <span className="mt-0.5 text-foreground">
              {goal.is_completed ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className={cn("block text-sm font-semibold text-foreground", goal.is_completed && "text-muted-foreground line-through")}>
                {goal.description}
              </span>
              {goal.due_date && (
                <span className="mt-1 block text-xs font-medium text-muted-foreground">
                  Ate {dateOnly.format(new Date(`${goal.due_date}T00:00:00`))}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

const ProgressView = ({
  appointments,
  goals,
  mood,
}: {
  appointments: ReturnType<typeof usePatientPortalAppointments>["data"];
  goals: ReturnType<typeof usePatientPortalGoals>["data"];
  mood: ReturnType<typeof usePatientPortalMood>;
}) => {
  const appointmentRows = appointments?.appointments || [];
  const goalRows = goals?.goals || [];
  const completedGoals = goalRows.filter((goal) => goal.is_completed).length;
  const completedSessions = appointmentRows.filter((appointment) => new Date(appointment.start_time).getTime() < Date.now()).length;
  const activeGoals = goalRows.filter((goal) => !goal.is_completed).slice(0, 4);
  const lastMood = mood.data?.logs?.[0];
  const moodMeta = moodOptions.find((option) => option.score === lastMood?.mood_score);
  const MoodIcon = moodMeta?.icon || HeartPulse;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard title="Sessoes registradas" value={String(completedSessions)} icon={CalendarDays} />
        <MetricCard title="Metas concluidas" value={`${completedGoals}/${goalRows.length || 0}`} icon={Target} tone={completedGoals ? "success" : "default"} />
        <MetricCard title="Ultimo humor" value={lastMood ? String(lastMood.mood_score) : "Sem registro"} icon={HeartPulse} />
      </div>

      <section className="rounded-[28px] border border-border/55 bg-card/80 p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-background text-muted-foreground">
            <BrainCircuit className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold text-foreground">Direcao atual</p>
            {activeGoals.length ? (
              <div className="mt-4 grid gap-2">
                {activeGoals.map((goal) => (
                  <div key={goal.id} className="rounded-2xl border border-border/55 bg-background/60 p-3 text-sm text-muted-foreground">
                    {goal.description}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Nenhuma meta aberta no momento.</p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-border/55 bg-card/80 p-5 shadow-sm">
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
      </section>
    </div>
  );
};

const DiaryView = ({ mood }: { mood: ReturnType<typeof usePatientPortalMood> }) => {
  const [moodScore, setMoodScore] = useState(mood.data?.today?.mood_score || 4);
  const [notes, setNotes] = useState(mood.data?.today?.notes || "");
  const logs = mood.data?.logs || [];

  const saveMood = () => {
    mood.saveMood.mutate(
      { moodScore, notes },
      { onSuccess: () => toast.success("Registro salvo no diario.") },
    );
  };

  return (
    <div className="space-y-5">
      <section className="rounded-[28px] border border-border/55 bg-card/80 p-5 shadow-sm">
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
        <Button onClick={saveMood} disabled={mood.saveMood.isPending} className="mt-4 h-11 rounded-xl bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100">
          {mood.saveMood.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar diario
        </Button>
      </section>

      <section className="space-y-3">
        <p className="px-1 text-sm font-semibold text-muted-foreground">Registros recentes</p>
        {logs.length ? (
          logs.map((log) => (
            <article key={log.id} className="rounded-[24px] border border-border/55 bg-card/80 p-4">
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
          ))
        ) : (
          <EmptyState title="Nenhum registro ainda" description="Use o diario para acompanhar pequenas mudancas entre as sessoes." />
        )}
      </section>
    </div>
  );
};

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

  const nextAppointment = useMemo(() => {
    const rows = appointments.data?.appointments || [];
    return rows
      .filter((appointment) => new Date(appointment.start_time).getTime() >= Date.now())
      .sort((left, right) => new Date(left.start_time).getTime() - new Date(right.start_time).getTime())[0];
  }, [appointments.data?.appointments]);

  const pendingAmount = useMemo(() => {
    const rows = billing.data?.entries || [];
    return rows
      .filter((entry) => !["paid", "received", "confirmed"].includes(String(entry.status || "").toLowerCase()))
      .reduce((total, entry) => total + Number(entry.amount || 0), 0);
  }, [billing.data?.entries]);

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
        description="Entre pelo link do convite enviado por e-mail e informe o codigo de ativacao para liberar seu acesso."
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

  const patientName = current.data.patient?.name || "Paciente";
  const professionalName = current.data.professional?.name || "Seu psicologo";
  const activeNav = navItems.find((item) => item.value === activeView) || navItems[0];

  const renderView = () => {
    if (appointments.isLoading || billing.isLoading || documents.isLoading || mood.isLoading || goals.isLoading) {
      return (
        <div className="flex min-h-60 items-center justify-center rounded-3xl border border-border/50 bg-card/60">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }

    switch (activeView) {
      case "agenda":
        return <AppointmentsView appointments={appointments.data} />;
      case "diario":
        return <DiaryView mood={mood} />;
      case "metas":
        return <GoalsView goals={goals.data} />;
      case "progresso":
        return <ProgressView appointments={appointments.data} goals={goals.data} mood={mood} />;
      case "documentos":
        return <DocumentsView documents={documents.data} />;
      case "financeiro":
        return <BillingView billing={billing.data} />;
      case "perfil":
        return (
          <div className="space-y-4">
            <section className="rounded-3xl border border-border/50 bg-card/76 p-5">
              <p className="text-lg font-semibold text-foreground">{patientName}</p>
              <p className="mt-1 text-sm text-muted-foreground">{current.data.patient?.email}</p>
              <div className="mt-5 rounded-2xl bg-muted/45 p-4">
                <p className="text-sm font-semibold text-foreground">Profissional vinculado</p>
                <p className="mt-1 text-sm text-muted-foreground">{professionalName}</p>
              </div>
            </section>
            <Button onClick={handleSignOut} disabled={loggingOut} variant="outline" className="h-12 w-full rounded-2xl">
              {loggingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
              Sair
            </Button>
          </div>
        );
      case "home":
      default:
        return (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard title="Proxima sessao" value={nextAppointment ? dateTime.format(new Date(nextAppointment.start_time)) : "Sem horario"} icon={CalendarDays} />
              <MetricCard title="Pendencias" value={pendingAmount ? money.format(pendingAmount) : "Em dia"} icon={CreditCard} tone={pendingAmount ? "warning" : "success"} />
              <MetricCard title="Documentos" value={String(documents.data?.documents?.length || 0)} icon={FileText} />
              <MetricCard title="Metas ativas" value={String(goals.data?.goals?.filter((goal) => !goal.is_completed).length || 0)} icon={CheckCircle2} />
            </div>

            <section className="rounded-3xl border border-border/50 bg-card/76 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-foreground">Continuidade do cuidado</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Use o portal para acompanhar sessoes, pendencias e registros que voce decidiu compartilhar.
                  </p>
                </div>
                <Sparkles className="h-5 w-5 text-muted-foreground" />
              </div>
            </section>

            <div className="grid gap-5 lg:grid-cols-[1fr_0.85fr]">
              <AppointmentsView appointments={{ appointments: nextAppointment ? [nextAppointment] : [] }} />
              <DiaryView mood={mood} />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col lg:flex-row">
        <aside className="hidden w-[280px] shrink-0 border-r border-border/50 px-5 py-6 lg:block">
          <div className="sticky top-6 space-y-6">
            <div className="rounded-[28px] border border-border/55 bg-card/80 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground text-background">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <p className="mt-4 text-lg font-semibold tracking-tight">{patientName}</p>
              <p className="mt-1 text-sm text-muted-foreground">{professionalName}</p>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "flex h-12 w-full items-center gap-3 rounded-2xl px-4 text-sm font-semibold transition-colors",
                    activeView === item.value ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">
          <header className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Portal do Paciente</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{activeNav.label}</h1>
            </div>
            <Button onClick={handleSignOut} variant="outline" size="icon" className="h-11 w-11 rounded-2xl lg:hidden">
              <LogOut className="h-4 w-4" />
            </Button>
          </header>

          {renderView()}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border/50 bg-background/94 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-[640px] grid-cols-4 gap-1 sm:grid-cols-8">
          {navItems.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => navigate(item.path)}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center rounded-2xl px-1 text-[10px] font-semibold transition-colors",
                activeView === item.value ? "bg-foreground text-background" : "text-muted-foreground",
              )}
            >
              <item.icon className="mb-1 h-4 w-4" />
              <span className="max-w-full truncate">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default PatientPortal;
