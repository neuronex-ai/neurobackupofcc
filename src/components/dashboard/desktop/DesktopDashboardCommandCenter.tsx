"use client";

import { addDays, differenceInMinutes, endOfDay, format, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, useReducedMotion } from "framer-motion";
import type { ElementType, ReactNode } from "react";
import { forwardRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Bell,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  FileText,
  MessageSquare,
  Mic,
  Plus,
  Stethoscope,
  UserPlus,
  Users,
  Video,
  WalletCards,
} from "lucide-react";

import { NewAppointmentModal } from "@/components/agenda/NewAppointmentModal";
import { AppointmentDetailModal } from "@/components/agenda/AppointmentDetailModal";
import { NewProntuarioModal } from "@/components/notes/NewProntuarioModal";
import { NewPatientModal } from "@/components/patients/NewPatientModal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSynapse } from "@/context/SynapseProvider";
import { useAppointmentsByDateRange } from "@/hooks/use-appointments-by-date-range";
import { useDashboardManagerialMetrics } from "@/hooks/use-dashboard-managerial-metrics";
import { useFinancialAccount } from "@/hooks/use-financial-account";
import { useGoogleCalendarSync } from "@/hooks/use-google-calendar-sync";
import { useNeurofinanceSnapshot } from "@/hooks/use-neurofinance-snapshot";
import { useNotifications } from "@/hooks/use-notifications";
import { usePendingPatientsCount } from "@/hooks/use-pending-patients-count";
import { useProfile } from "@/hooks/use-profile";
import { getAppointmentKind } from "@/lib/appointment-metadata";
import { getAppointmentStatusMeta } from "@/lib/appointment-status";
import { getAppointmentDisplayTitle } from "@/lib/appointment-utils";
import { cn } from "@/lib/utils";
import type { Appointment } from "@/types";
import {
  buildAttentionQueue,
  buildFinancialSignal,
  getActiveAppointments,
  getNextSession,
  getTodayAppointments,
  isOnlineAppointment,
  type AttentionQueueItem,
} from "./dashboard-command-center-model";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatCentsCurrency = (value: number | null) =>
  value === null ? "-" : formatCurrency(value / 100);

const formatAppointmentTime = (appointment?: Appointment | null) =>
  appointment?.start_time ? format(new Date(appointment.start_time), "HH:mm") : "-";

const formatAppointmentDay = (appointment?: Appointment | null) =>
  appointment?.start_time ? format(new Date(appointment.start_time), "dd/MM") : "-";

const getMinutesUntil = (appointment?: Appointment | null) => {
  if (!appointment?.start_time) return null;

  const minutes = differenceInMinutes(new Date(appointment.start_time), new Date());
  if (minutes < 0) return "em andamento";
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}min` : `${hours}h`;
};

const getFirstName = (profile?: { first_name?: string | null; full_name?: string | null; name?: string | null } | null) =>
  profile?.first_name || profile?.full_name?.split(" ")[0] || profile?.name?.split(" ")[0] || "Doutor";

const getAppointmentLabel = (appointment: Appointment) => {
  const kind = getAppointmentKind(appointment);
  if (kind === "block") return "Bloqueio";
  if (kind === "event") return "Evento";
  return appointment.type === "online" || isOnlineAppointment(appointment) ? "Online" : "Consultorio";
};

const DashboardPanel = ({
  children,
  className,
  delay = 0,
  reduceMotion,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  reduceMotion: boolean;
}) => (
  <motion.section
    initial={reduceMotion ? false : { opacity: 0, y: 10 }}
    animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
    transition={{ duration: 0.28, delay, ease: [0.22, 1, 0.36, 1] }}
    className={cn(
      "relative overflow-hidden rounded-[34px] border border-border/65 bg-card/78 shadow-[0_28px_90px_-70px_hsl(var(--foreground)/0.7)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.04]",
      className,
    )}
  >
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,hsl(var(--foreground)/0.052),transparent_34%),radial-gradient(circle_at_92%_88%,hsl(var(--foreground)/0.035),transparent_38%)]" />
    <div className="relative z-10">{children}</div>
  </motion.section>
);

const SectionHeader = ({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: ReactNode;
}) => (
  <div className="flex items-start justify-between gap-4">
    <div className="min-w-0">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">{eyebrow}</p>
      <h2 className="mt-1 truncate text-lg font-bold tracking-[-0.03em] text-foreground">{title}</h2>
    </div>
    {action}
  </div>
);

const IconPill = ({ icon: Icon }: { icon: ElementType<{ className?: string }> }) => (
  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] border border-border/50 bg-white text-muted-foreground shadow-sm dark:border-white/[0.07] dark:bg-white/[0.055]">
    <Icon className="h-4 w-4" />
  </span>
);

type QuickActionButtonProps = {
  icon: ElementType<{ className?: string }>;
  label: string;
  onClick?: () => void;
};

const QuickActionButton = forwardRef<HTMLButtonElement, QuickActionButtonProps>(({
  icon: Icon,
  label,
  onClick,
}, ref) => (
  <button
    ref={ref}
    type="button"
    onClick={onClick}
    aria-label={label}
    className="group flex w-[86px] shrink-0 flex-col items-center gap-1.5 rounded-[18px] px-2 py-2 transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.96]"
  >
    <span className="flex h-12 w-12 items-center justify-center rounded-[20px] border border-border/60 bg-white text-muted-foreground shadow-sm transition-all duration-300 group-hover:text-foreground dark:border-white/[0.07] dark:bg-white/[0.045] dark:group-hover:bg-white/[0.08]">
      <Icon className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
    </span>
    <span className="w-full text-center text-[8px] font-black uppercase leading-tight tracking-[0.1em] text-muted-foreground transition-colors group-hover:text-foreground">
      {label}
    </span>
  </button>
));
QuickActionButton.displayName = "QuickActionButton";

const DashboardToolbar = ({
  today,
  firstName,
  openSynapseText,
  openSynapseVoice,
}: {
  today: Date;
  firstName: string;
  openSynapseText: () => void;
  openSynapseVoice: () => void;
}) => (
  <div className="relative overflow-hidden rounded-[34px] border border-border/65 bg-card/78 p-4 shadow-[0_24px_74px_-54px_hsl(var(--foreground)/0.76)] ring-1 ring-foreground/[0.025] backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.035] dark:ring-white/[0.035]">
    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,hsl(var(--background)/0.62),transparent_42%),radial-gradient(circle_at_0%_0%,hsl(var(--foreground)/0.045),transparent_34%)]" />
    <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
    <div className="min-w-0">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
        {format(today, "EEEE, dd 'de' MMMM", { locale: ptBR })}
      </p>
      <h1 className="mt-1 truncate text-2xl font-bold tracking-[-0.04em] text-foreground">Bom dia, {firstName}.</h1>
    </div>

    <div className="flex max-w-full items-start gap-2 overflow-x-auto rounded-[24px] border border-border/45 bg-white/58 px-3 py-1 shadow-sm backdrop-blur-xl no-scrollbar dark:border-white/[0.055] dark:bg-white/[0.018]">
      <NewAppointmentModal selectedDate={today}>
        <QuickActionButton icon={Plus} label="Agendar" />
      </NewAppointmentModal>

      <NewPatientModal>
        <QuickActionButton icon={UserPlus} label="Paciente" />
      </NewPatientModal>

      <NewProntuarioModal>
        <QuickActionButton icon={FileText} label="Prontuario" />
      </NewProntuarioModal>

      <Tooltip>
        <TooltipTrigger asChild>
          <QuickActionButton icon={MessageSquare} label="Synapse" onClick={openSynapseText} />
        </TooltipTrigger>
        <TooltipContent>Synapse texto</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <QuickActionButton icon={Mic} label="Voz" onClick={openSynapseVoice} />
        </TooltipTrigger>
        <TooltipContent>Synapse voz</TooltipContent>
      </Tooltip>
    </div>
    </div>
  </div>
);

const MetricCard = ({
  icon,
  label,
  value,
  detail,
  tone = "default",
  onClick,
}: {
  icon: ElementType<{ className?: string }>;
  label: string;
  value: string | number;
  detail: string;
  tone?: "default" | "warning" | "success";
  onClick: () => void;
}) => {
  const Icon = icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group min-w-0 rounded-[26px] border border-zinc-200/70 bg-white/70 p-4 text-left shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_20px_48px_-38px_rgba(0,0,0,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] dark:border-white/[0.065] dark:bg-white/[0.032] dark:hover:bg-white/[0.055]",
        tone === "warning" && "border-amber-500/25 bg-amber-500/[0.06]",
        tone === "success" && "border-emerald-500/20 bg-emerald-500/[0.055]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <IconPill icon={Icon} />
        <ArrowRight className="h-4 w-4 text-muted-foreground/45 transition-transform group-hover:translate-x-0.5" />
      </div>
      <p className="mt-4 truncate text-3xl font-bold leading-none tracking-[-0.055em] text-foreground">{value}</p>
      <p className="mt-2 text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-muted-foreground/80">{detail}</p>
    </button>
  );
};

const MetricsRail = ({
  todayAppointments,
  nextAppointment,
  pendingPatients,
  financialConnected,
}: {
  todayAppointments: Appointment[];
  nextAppointment?: Appointment;
  pendingPatients: number;
  financialConnected: boolean;
}) => {
  const navigate = useNavigate();
  const remainingToday = todayAppointments.filter((appointment) => new Date(appointment.end_time) > new Date()).length;

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard icon={CalendarIcon} label="Hoje" value={remainingToday} detail="Atendimentos restantes" onClick={() => navigate("/agenda")} />
      <MetricCard
        icon={Clock}
        label="Proxima"
        value={nextAppointment ? formatAppointmentTime(nextAppointment) : "-"}
        detail={nextAppointment ? getAppointmentDisplayTitle(nextAppointment) || "Paciente" : "Sem sessao futura"}
        onClick={() => navigate("/agenda")}
      />
      <MetricCard
        icon={Users}
        label="Atencao"
        value={pendingPatients}
        detail="Cadastros ou retornos pendentes"
        tone={pendingPatients > 0 ? "warning" : "success"}
        onClick={() => navigate("/pacientes")}
      />
      <MetricCard
        icon={WalletCards}
        label="Financeiro"
        value={financialConnected ? "ON" : "OFF"}
        detail={financialConnected ? "Conta conectada" : "Ativacao pendente"}
        tone={financialConnected ? "success" : "warning"}
        onClick={() => navigate("/financeiro/neurofinance")}
      />
    </div>
  );
};

const AppointmentStatusPill = ({ appointment }: { appointment: Appointment }) => {
  const status = getAppointmentStatusMeta(appointment.status, appointment.notes);

  return (
    <span className={cn("rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em]", status.bgClass, status.borderClass, status.textClass)}>
      {status.label}
    </span>
  );
};

const AppointmentModePill = ({ appointment }: { appointment: Appointment }) => {
  const online = isOnlineAppointment(appointment);
  const Icon = online ? Video : Stethoscope;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/45 bg-background/45 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      {getAppointmentLabel(appointment)}
    </span>
  );
};

const NextSessionPanel = ({
  appointment,
  isLoading,
  reduceMotion,
}: {
  appointment?: Appointment;
  isLoading: boolean;
  reduceMotion: boolean;
}) => {
  const navigate = useNavigate();
  const minutesUntil = getMinutesUntil(appointment);
  const online = isOnlineAppointment(appointment);

  return (
    <DashboardPanel className="min-h-[316px] p-5 lg:p-6" reduceMotion={reduceMotion} delay={0.03}>
      <SectionHeader eyebrow="Agora" title="Proxima sessao" />

      {isLoading ? (
        <div className="mt-5 h-52 animate-pulse rounded-[20px] bg-muted/40" />
      ) : appointment ? (
        <div className="mt-5 flex h-[calc(100%-3.25rem)] min-h-[230px] flex-col justify-between gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <AppointmentStatusPill appointment={appointment} />
              <AppointmentModePill appointment={appointment} />
              {minutesUntil ? (
                <span className="rounded-full border border-border/45 bg-background/45 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                  {minutesUntil}
                </span>
              ) : null}
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-[150px_minmax(0,1fr)] md:items-end">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">{formatAppointmentDay(appointment)}</p>
                <p className="mt-2 text-5xl font-bold leading-none tracking-[-0.06em] text-foreground tabular-nums">{formatAppointmentTime(appointment)}</p>
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-2xl font-bold tracking-[-0.045em] text-foreground">
                  {getAppointmentDisplayTitle(appointment) || appointment.patient_name || "Paciente"}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm font-medium leading-relaxed text-muted-foreground">
                  {online ? "Sessao online pronta para iniciar pela Teleconsulta." : "Revise o contexto e abra a ficha antes do atendimento."}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {online ? (
              <Button
                className="h-10 rounded-xl px-4 text-xs font-bold"
                onClick={() => navigate("/teleconsulta", { state: { activeAppointmentId: appointment.id } })}
              >
                Entrar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : null}

            <AppointmentDetailModal appointment={appointment}>
              <Button variant={online ? "outline" : "default"} className="h-10 rounded-xl px-4 text-xs font-bold">
                Ficha
              </Button>
            </AppointmentDetailModal>

            {appointment.patient_id ? (
              <Button variant="outline" className="h-10 rounded-xl px-4 text-xs font-bold" onClick={() => navigate(`/pacientes/${appointment.patient_id}`)}>
                Paciente
              </Button>
            ) : null}

            <Button variant="ghost" className="h-10 rounded-xl px-4 text-xs font-bold" onClick={() => navigate("/agenda", { state: { openAppointmentId: appointment.id } })}>
              Agenda
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-5 flex min-h-[230px] flex-col items-center justify-center rounded-[20px] border border-dashed border-border/60 bg-muted/20 p-6 text-center">
          <Clock className="h-8 w-8 text-muted-foreground/45" />
          <h3 className="mt-4 text-lg font-bold text-foreground">Sem sessao futura</h3>
          <p className="mt-2 max-w-sm text-sm font-medium text-muted-foreground">Quando houver agendamento, a proxima acao aparece aqui.</p>
          <NewAppointmentModal>
            <Button variant="outline" className="mt-5 h-10 rounded-xl px-4 text-xs font-bold">
              Agendar sessao
            </Button>
          </NewAppointmentModal>
        </div>
      )}
    </DashboardPanel>
  );
};

const AppointmentRow = ({ appointment }: { appointment: Appointment }) => {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate("/agenda", { state: { openAppointmentId: appointment.id } })}
      className="group flex w-full items-center gap-3 rounded-[18px] border border-border/45 bg-background/35 p-3 text-left transition-all duration-200 hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.995]"
    >
      <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-xl bg-foreground text-sm font-bold text-background tabular-nums">
        {formatAppointmentTime(appointment)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <p className="min-w-0 truncate text-sm font-bold tracking-[-0.015em] text-foreground">
            {getAppointmentDisplayTitle(appointment) || appointment.patient_name || "Paciente"}
          </p>
          <AppointmentStatusPill appointment={appointment} />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <AppointmentModePill appointment={appointment} />
          <span className="rounded-full border border-border/45 bg-background/45 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
            {formatAppointmentDay(appointment)}
          </span>
        </div>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/45 transition-transform group-hover:translate-x-0.5" />
    </button>
  );
};

const AgendaPanel = ({
  todayAppointments,
  weekAppointments,
  isLoading,
  reduceMotion,
}: {
  todayAppointments: Appointment[];
  weekAppointments: Appointment[];
  isLoading: boolean;
  reduceMotion: boolean;
}) => {
  const navigate = useNavigate();
  const todayVisible = todayAppointments.slice(0, 6);
  const weekVisible = weekAppointments.slice(0, 8);

  return (
    <DashboardPanel className="p-5 lg:p-6" reduceMotion={reduceMotion} delay={0.06}>
      <SectionHeader
        eyebrow="Agenda"
        title="Fluxo clinico"
        action={
          <Button variant="outline" className="h-9 rounded-xl px-3 text-xs font-bold" onClick={() => navigate("/agenda")}>
            Abrir
          </Button>
        }
      />

      <Tabs defaultValue="today" className="mt-5">
        <TabsList className="h-10 rounded-xl">
          <TabsTrigger value="today" className="h-8 rounded-lg px-3 text-xs">
            Hoje
          </TabsTrigger>
          <TabsTrigger value="week" className="h-8 rounded-lg px-3 text-xs">
            7 dias
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-4">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-20 animate-pulse rounded-[18px] bg-muted/40" />
              ))}
            </div>
          ) : todayVisible.length ? (
            <div className="space-y-2">
              {todayVisible.map((appointment) => (
                <AppointmentRow key={appointment.id} appointment={appointment} />
              ))}
            </div>
          ) : (
            <EmptyState icon={CalendarIcon} title="Dia livre" description="Nenhum atendimento marcado para hoje." />
          )}
        </TabsContent>

        <TabsContent value="week" className="mt-4">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-20 animate-pulse rounded-[18px] bg-muted/40" />
              ))}
            </div>
          ) : weekVisible.length ? (
            <div className="space-y-2">
              {weekVisible.map((appointment) => (
                <AppointmentRow key={appointment.id} appointment={appointment} />
              ))}
            </div>
          ) : (
            <EmptyState icon={CalendarIcon} title="Semana livre" description="Sem compromissos ativos nos proximos 7 dias." />
          )}
        </TabsContent>
      </Tabs>
    </DashboardPanel>
  );
};

const EmptyState = ({
  icon: Icon,
  title,
  description,
}: {
  icon: ElementType<{ className?: string }>;
  title: string;
  description: string;
}) => (
  <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[20px] border border-dashed border-border/60 bg-muted/20 p-6 text-center">
    <Icon className="h-8 w-8 text-muted-foreground/45" />
    <h3 className="mt-4 text-base font-bold text-foreground">{title}</h3>
    <p className="mt-2 max-w-sm text-sm font-medium text-muted-foreground">{description}</p>
  </div>
);

const QueueIcon = ({ item }: { item: AttentionQueueItem }) => {
  if (item.source === "patients") return <Users className="h-4 w-4" />;
  if (item.source === "finance") return <WalletCards className="h-4 w-4" />;
  if (item.tone === "destructive") return <AlertCircle className="h-4 w-4" />;
  return <Bell className="h-4 w-4" />;
};

const AttentionQueuePanel = ({
  items,
  isLoading,
  reduceMotion,
}: {
  items: AttentionQueueItem[];
  isLoading: boolean;
  reduceMotion: boolean;
}) => {
  const navigate = useNavigate();

  return (
    <DashboardPanel className="p-5 lg:p-6" reduceMotion={reduceMotion} delay={0.09}>
      <SectionHeader eyebrow="Fila" title="O que exige acao" />

      <div className="mt-5 space-y-2">
        {isLoading ? (
          [1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-[18px] bg-muted/40" />)
        ) : items.length ? (
          items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.actionUrl)}
              className={cn(
                "flex w-full items-start gap-3 rounded-[18px] border border-border/45 bg-background/35 p-3 text-left transition-all duration-200 hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.995]",
                item.tone === "warning" && "border-amber-500/25 bg-amber-500/[0.055]",
                item.tone === "destructive" && "border-rose-500/25 bg-rose-500/[0.055]",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/45 bg-card text-muted-foreground",
                  item.tone === "warning" && "border-amber-500/25 text-amber-600",
                  item.tone === "destructive" && "border-rose-500/25 text-rose-600",
                )}
              >
                <QueueIcon item={item} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">{item.label}</span>
                <span className="mt-1 block truncate text-sm font-bold text-foreground">{item.title}</span>
                <span className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-muted-foreground">{item.description}</span>
              </span>
              <ArrowRight className="mt-3 h-4 w-4 shrink-0 text-muted-foreground/45" />
            </button>
          ))
        ) : (
          <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[20px] border border-dashed border-border/60 bg-muted/20 p-6 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-500/70" />
            <h3 className="mt-4 text-base font-bold text-foreground">Tudo em dia</h3>
            <p className="mt-2 max-w-sm text-sm font-medium text-muted-foreground">Sem pendencias acionaveis no momento.</p>
          </div>
        )}
      </div>
    </DashboardPanel>
  );
};

const FinancialMetric = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-[20px] border border-zinc-200 bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-zinc-950">
    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
    <p className="mt-2 truncate text-base font-black tracking-[-0.035em] text-foreground tabular-nums">{value}</p>
  </div>
);

const FinancialSignalPanel = ({
  financialConnected,
  financialLoading,
  managerial,
  neuroSnapshot,
  managerLoading,
  snapshotLoading,
  reduceMotion,
}: {
  financialConnected: boolean;
  financialLoading: boolean;
  managerial?: { result?: number | null; receivable?: number | null } | null;
  neuroSnapshot?: { available_balance?: number | null; pending_receivables?: number | null } | null;
  managerLoading: boolean;
  snapshotLoading: boolean;
  reduceMotion: boolean;
}) => {
  const navigate = useNavigate();
  const signal = buildFinancialSignal({ financialConnected, financialLoading, managerial, neuroSnapshot });
  const loading = managerLoading || financialLoading || (financialConnected && snapshotLoading);

  return (
    <DashboardPanel className="p-5 lg:p-6" reduceMotion={reduceMotion} delay={0.12}>
      <SectionHeader
        eyebrow="Financeiro"
        title="Sinal do consultorio"
        action={
          <Button variant="outline" className="h-9 rounded-[14px] px-3 text-xs font-bold" onClick={() => navigate(signal.ctaPath)}>
            {signal.ctaLabel}
          </Button>
        }
      />

      {loading ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-20 animate-pulse rounded-[18px] bg-muted/40" />
          ))}
        </div>
      ) : (
        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_132px]">
          <button
            type="button"
            onClick={() => navigate(signal.ctaPath)}
            className="group relative min-h-[188px] overflow-hidden rounded-[32px] border border-zinc-200 bg-zinc-50 p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99] dark:border-white/[0.055] dark:bg-gradient-to-br dark:from-[#1A1A1C] dark:to-[#0D0D0F] dark:shadow-xl"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(255,255,255,0.82),transparent_34%),radial-gradient(circle_at_92%_88%,rgba(0,0,0,0.035),transparent_38%)] dark:bg-[radial-gradient(circle_at_16%_12%,rgba(255,255,255,0.095),transparent_36%),linear-gradient(135deg,rgba(255,255,255,0.04),transparent_48%)]" />
            <div className="relative z-10 flex h-full flex-col justify-between gap-8">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <IconPill icon={WalletCards} />
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">Resultado</p>
                    <p
                      className={cn(
                        "mt-1 text-xs font-black uppercase tracking-[0.12em]",
                        signal.statusTone === "success" && "text-emerald-600 dark:text-emerald-400",
                        signal.statusTone === "warning" && "text-amber-600 dark:text-amber-400",
                        signal.statusTone === "default" && "text-muted-foreground",
                      )}
                    >
                      {signal.statusLabel}
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground/45 transition-transform group-hover:translate-x-1" />
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Gestao do mes</p>
                <div className="mt-3 flex min-w-0 items-baseline gap-2">
                  <span className="text-2xl font-light italic text-muted-foreground/70">R$</span>
                  <p className="truncate text-5xl font-black leading-none tracking-[-0.065em] text-foreground tabular-nums">
                    {signal.result.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <p className="mt-3 text-xs font-medium text-muted-foreground">Resumo executivo. A operacao detalhada permanece no Financeiro.</p>
              </div>
            </div>
          </button>

          <div className="flex flex-col justify-center gap-2 rounded-[28px] border border-zinc-200/50 bg-zinc-100/50 p-3 backdrop-blur-xl dark:border-white/[0.055] dark:bg-white/[0.045]">
            <FinancialMetric label="A receber" value={formatCurrency(signal.receivable)} />
            <FinancialMetric label="Saldo NF" value={formatCentsCurrency(signal.bankBalanceCents)} />
            <FinancialMetric label="Vai cair" value={formatCentsCurrency(signal.bankPendingCents)} />
          </div>
        </div>
      )}
    </DashboardPanel>
  );
};

export const DesktopDashboardCommandCenter = () => {
  const today = useMemo(() => new Date(), []);
  const reduceMotion = Boolean(useReducedMotion());
  const { data: profile } = useProfile();
  const { setShellState, setActiveTab, toggleVoiceMode } = useSynapse();

  useGoogleCalendarSync();

  const { data: allUpcomingAppointments, isLoading: loadingAppointments } = useAppointmentsByDateRange(startOfDay(today), endOfDay(addDays(today, 7)));
  const { data: pendingPatientsRaw } = usePendingPatientsCount();
  const { notifications, isLoading: notificationsLoading } = useNotifications();
  const { data: managerial, isLoading: managerLoading } = useDashboardManagerialMetrics();
  const { data: neuroSnapshot, isLoading: snapshotLoading } = useNeurofinanceSnapshot();
  const { isConnected: financialConnected, isLoading: financialLoading } = useFinancialAccount();

  const pendingPatients = Number(pendingPatientsRaw || 0);
  const activeAppointments = useMemo(() => getActiveAppointments((allUpcomingAppointments || []) as Appointment[]), [allUpcomingAppointments]);
  const todayAppointments = useMemo(() => getTodayAppointments(activeAppointments, today), [activeAppointments, today]);
  const nextAppointment = useMemo(() => getNextSession(activeAppointments, new Date()), [activeAppointments]);
  const attentionItems = useMemo(
    () =>
      buildAttentionQueue({
        notifications,
        pendingPatients,
        financialConnected,
        financialLoading,
      }),
    [financialConnected, financialLoading, notifications, pendingPatients],
  );

  const openSynapseText = () => {
    setShellState("compact");
    setActiveTab("chat");
  };

  const openSynapseVoice = () => {
    setShellState("compact");
    setActiveTab("voice");
    toggleVoiceMode();
  };

  return (
    <div className="relative min-h-screen w-full bg-background pb-24 pt-28 font-sans text-foreground selection:bg-primary/10 selection:text-primary">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_50%_10%,hsl(var(--foreground)/0.035),transparent_34%)] dark:bg-[radial-gradient(circle_at_50%_10%,hsl(var(--foreground)/0.045),transparent_34%)]" />
      <main className="page-spacing relative z-10 flex w-full max-w-[2200px] flex-col gap-4 px-6 md:px-8 lg:px-12 xl:px-16">
        <div className="relative overflow-hidden rounded-[34px] border border-border/45 bg-card/42 p-3 shadow-[0_22px_90px_-76px_hsl(var(--foreground)/0.7)] backdrop-blur-sm dark:border-white/[0.04] dark:bg-white/[0.02] md:p-4">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,hsl(var(--foreground)/0.04),transparent_30%),linear-gradient(180deg,hsl(var(--background)/0.16),transparent_42%)]" />
          <div className="relative z-10 flex flex-col gap-4">
        <DashboardToolbar
          today={today}
          firstName={getFirstName(profile)}
          openSynapseText={openSynapseText}
          openSynapseVoice={openSynapseVoice}
        />

        <MetricsRail
          todayAppointments={todayAppointments}
          nextAppointment={nextAppointment}
          pendingPatients={pendingPatients}
          financialConnected={financialConnected}
        />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.12fr)_minmax(360px,0.78fr)]">
          <NextSessionPanel appointment={nextAppointment} isLoading={loadingAppointments} reduceMotion={reduceMotion} />
          <AttentionQueuePanel items={attentionItems} isLoading={notificationsLoading} reduceMotion={reduceMotion} />
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.18fr)_minmax(380px,0.72fr)]">
          <AgendaPanel
            todayAppointments={todayAppointments}
            weekAppointments={activeAppointments}
            isLoading={loadingAppointments}
            reduceMotion={reduceMotion}
          />
          <FinancialSignalPanel
            financialConnected={financialConnected}
            financialLoading={financialLoading}
            managerial={managerial}
            neuroSnapshot={neuroSnapshot}
            managerLoading={managerLoading}
            snapshotLoading={snapshotLoading}
            reduceMotion={reduceMotion}
          />
        </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DesktopDashboardCommandCenter;
