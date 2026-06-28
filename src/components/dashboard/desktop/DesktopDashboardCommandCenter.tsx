"use client";

import { addDays, differenceInMinutes, endOfDay, format, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ElementType, ReactNode } from "react";
import { useMemo } from "react";
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

import { AppointmentDetailModal } from "@/components/agenda/AppointmentDetailModal";
import { NewAppointmentModal } from "@/components/agenda/NewAppointmentModal";
import { NewProntuarioModal } from "@/components/notes/NewProntuarioModal";
import { NewPatientModal } from "@/components/patients/NewPatientModal";
import { Button } from "@/components/ui/button";
import {
  DesktopActionTile,
  DesktopMiniStat,
  DesktopWorkspaceIcon,
  DesktopWorkspacePanel,
  DesktopWorkspaceShell,
} from "@/components/ui/desktop-workspace";
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
  return isOnlineAppointment(appointment) ? "Online" : "Consultorio";
};

const SectionHeader = ({
  eyebrow,
  title,
  action,
  inverted = false,
}: {
  eyebrow: string;
  title: string;
  action?: ReactNode;
  inverted?: boolean;
}) => (
  <div className="flex items-start justify-between gap-4">
    <div className="min-w-0">
      <p className={cn("text-[10px] font-black uppercase tracking-[0.16em]", inverted ? "text-background/55" : "text-muted-foreground")}>
        {eyebrow}
      </p>
      <h2 className={cn("mt-1 truncate text-lg font-bold tracking-[-0.03em]", inverted ? "text-background" : "text-foreground")}>{title}</h2>
    </div>
    {action}
  </div>
);

const ContrastStat = ({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) => (
  <div className="min-w-0 rounded-[24px] border border-background/12 bg-background/10 p-4 shadow-[inset_0_1px_0_hsl(var(--background)/0.12)]">
    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-background/52">{label}</p>
    <p className="mt-2 truncate text-3xl font-black leading-none tracking-[-0.06em] text-background tabular-nums">{value}</p>
    <p className="mt-1 line-clamp-2 text-xs font-semibold leading-relaxed text-background/62">{detail}</p>
  </div>
);

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

const QuickActions = ({
  today,
  openSynapseText,
  openSynapseVoice,
}: {
  today: Date;
  openSynapseText: () => void;
  openSynapseVoice: () => void;
}) => (
  <div>
    <SectionHeader eyebrow="Atalhos" title="Acoes rapidas" />
    <div className="mt-4 grid grid-cols-3 gap-2">
      <NewAppointmentModal selectedDate={today}>
        <DesktopActionTile icon={Plus} label="Agendar" active />
      </NewAppointmentModal>
      <NewPatientModal>
        <DesktopActionTile icon={UserPlus} label="Paciente" />
      </NewPatientModal>
      <NewProntuarioModal>
        <DesktopActionTile icon={FileText} label="Prontuario" />
      </NewProntuarioModal>
      <Tooltip>
        <TooltipTrigger asChild>
          <DesktopActionTile icon={MessageSquare} label="Synapse" onClick={openSynapseText} />
        </TooltipTrigger>
        <TooltipContent>Synapse texto</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <DesktopActionTile icon={Mic} label="Voz" onClick={openSynapseVoice} />
        </TooltipTrigger>
        <TooltipContent>Synapse voz</TooltipContent>
      </Tooltip>
    </div>
  </div>
);

const CommandPanel = ({
  today,
  firstName,
  todayAppointments,
  weekAppointmentsCount,
  nextAppointment,
  pendingPatients,
  financialConnected,
  isLoading,
}: {
  today: Date;
  firstName: string;
  todayAppointments: Appointment[];
  weekAppointmentsCount: number;
  nextAppointment?: Appointment;
  pendingPatients: number;
  financialConnected: boolean;
  isLoading: boolean;
}) => {
  const navigate = useNavigate();
  const remainingToday = todayAppointments.filter((appointment) => new Date(appointment.end_time) > new Date()).length;
  const minutesUntil = getMinutesUntil(nextAppointment);
  const online = isOnlineAppointment(nextAppointment);

  return (
    <DesktopWorkspacePanel highContrast className="min-h-[500px] p-6 lg:p-8">
      <div className="flex h-full min-h-[436px] flex-col justify-between gap-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-background/52">
              {format(today, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </p>
            <h1 className="mt-3 max-w-2xl text-4xl font-black leading-[0.92] tracking-[-0.065em] text-background lg:text-6xl">
              Bom dia, {firstName}.
            </h1>
          </div>
          <div className="grid min-w-[220px] grid-cols-2 gap-2 rounded-[28px] border border-background/12 bg-background/10 p-3">
            <ContrastStat label="Hoje" value={remainingToday} detail="Restantes" />
            <ContrastStat label="Atencao" value={pendingPatients} detail="Pacientes" />
          </div>
        </div>

        {isLoading ? (
          <div className="h-56 animate-pulse rounded-[30px] bg-background/10" />
        ) : nextAppointment ? (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_260px] xl:items-end">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-background/14 bg-background/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-background/65">
                  Proxima sessao
                </span>
                {minutesUntil ? (
                  <span className="rounded-full border border-background/14 bg-background/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-background/65">
                    {minutesUntil}
                  </span>
                ) : null}
                <span className="rounded-full border border-background/14 bg-background/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-background/65">
                  {online ? "Online" : "Consultorio"}
                </span>
              </div>

              <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-end">
                <div className="shrink-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-background/52">{formatAppointmentDay(nextAppointment)}</p>
                  <p className="mt-2 text-7xl font-black leading-none tracking-[-0.075em] text-background tabular-nums">
                    {formatAppointmentTime(nextAppointment)}
                  </p>
                </div>
                <div className="min-w-0 pb-2">
                  <h2 className="truncate text-3xl font-black leading-none tracking-[-0.055em] text-background">
                    {getAppointmentDisplayTitle(nextAppointment) || nextAppointment.patient_name || "Paciente"}
                  </h2>
                  <p className="mt-3 line-clamp-2 max-w-2xl text-sm font-semibold leading-relaxed text-background/62">
                    {online ? "Entrar pela Teleconsulta e iniciar o atendimento." : "Abrir ficha, revisar contexto e seguir para a agenda."}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              {online ? (
                <Button
                  className="h-12 rounded-[18px] bg-background px-5 text-[10px] font-black uppercase tracking-[0.18em] text-foreground hover:bg-background/90"
                  onClick={() => navigate("/teleconsulta", { state: { activeAppointmentId: nextAppointment.id } })}
                >
                  Entrar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : null}
              <AppointmentDetailModal appointment={nextAppointment}>
                <Button className="h-12 rounded-[18px] bg-background px-5 text-[10px] font-black uppercase tracking-[0.18em] text-foreground hover:bg-background/90">
                  Ficha
                </Button>
              </AppointmentDetailModal>
              <Button
                variant="outline"
                className="h-12 rounded-[18px] border-background/16 bg-background/8 px-5 text-[10px] font-black uppercase tracking-[0.18em] text-background hover:bg-background/14 hover:text-background"
                onClick={() => navigate("/agenda", { state: { openAppointmentId: nextAppointment.id } })}
              >
                Agenda
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex min-h-[240px] flex-col justify-center rounded-[30px] border border-background/12 bg-background/10 p-8">
            <Clock className="h-9 w-9 text-background/48" />
            <h2 className="mt-5 text-3xl font-black tracking-[-0.055em] text-background">Sem sessao futura.</h2>
            <p className="mt-2 max-w-xl text-sm font-semibold leading-relaxed text-background/62">
              Use os atalhos para agendar, revisar prontuarios ou organizar a semana.
            </p>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-3">
          <ContrastStat
            label="Proxima"
            value={nextAppointment ? formatAppointmentTime(nextAppointment) : "-"}
            detail={nextAppointment ? getAppointmentDisplayTitle(nextAppointment) || "Paciente" : "Sem sessao"}
          />
          <ContrastStat label="Financeiro" value={financialConnected ? "ON" : "OFF"} detail={financialConnected ? "Conta ativa" : "Ativacao pendente"} />
          <ContrastStat label="Semana" value={weekAppointmentsCount} detail="Proximos 7 dias" />
        </div>
      </div>
    </DesktopWorkspacePanel>
  );
};

const QueueIcon = ({ item }: { item: AttentionQueueItem }) => {
  if (item.source === "patients") return <Users className="h-4 w-4" />;
  if (item.source === "finance") return <WalletCards className="h-4 w-4" />;
  if (item.tone === "destructive") return <AlertCircle className="h-4 w-4" />;
  return <Bell className="h-4 w-4" />;
};

const AttentionQueue = ({
  items,
  isLoading,
}: {
  items: AttentionQueueItem[];
  isLoading: boolean;
}) => {
  const navigate = useNavigate();

  return (
    <div>
      <SectionHeader eyebrow="Fila" title="O que exige acao" />
      <div className="mt-4 space-y-2">
        {isLoading ? (
          [1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-[20px] bg-muted/35" />)
        ) : items.length ? (
          items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.actionUrl)}
              className={cn(
                "flex w-full items-start gap-3 rounded-[20px] border border-zinc-200 bg-white p-3 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100 dark:border-white/[0.08] dark:bg-zinc-950",
                item.tone === "warning" && "border-amber-500/25 bg-amber-500/[0.06]",
                item.tone === "destructive" && "border-rose-500/25 bg-rose-500/[0.055]",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] border border-border/45 bg-card text-muted-foreground",
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
          <div className="flex min-h-[170px] flex-col items-center justify-center rounded-[24px] border border-dashed border-border/60 bg-muted/18 p-6 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-500/70" />
            <h3 className="mt-4 text-base font-bold text-foreground">Tudo em dia</h3>
            <p className="mt-2 max-w-sm text-sm font-medium text-muted-foreground">Sem pendencias acionaveis.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const UtilityRail = ({
  today,
  openSynapseText,
  openSynapseVoice,
  attentionItems,
  notificationsLoading,
}: {
  today: Date;
  openSynapseText: () => void;
  openSynapseVoice: () => void;
  attentionItems: AttentionQueueItem[];
  notificationsLoading: boolean;
}) => (
  <DesktopWorkspacePanel className="p-5 lg:p-6">
    <div className="flex h-full min-h-[480px] flex-col gap-7">
      <QuickActions today={today} openSynapseText={openSynapseText} openSynapseVoice={openSynapseVoice} />
      <div className="h-px bg-border/55 dark:bg-white/[0.07]" />
      <AttentionQueue items={attentionItems} isLoading={notificationsLoading} />
    </div>
  </DesktopWorkspacePanel>
);

const EmptyState = ({
  icon: Icon,
  title,
  description,
}: {
  icon: ElementType<{ className?: string }>;
  title: string;
  description: string;
}) => (
  <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[24px] border border-dashed border-border/60 bg-muted/18 p-6 text-center">
    <Icon className="h-8 w-8 text-muted-foreground/45" />
    <h3 className="mt-4 text-base font-bold text-foreground">{title}</h3>
    <p className="mt-2 max-w-sm text-sm font-medium text-muted-foreground">{description}</p>
  </div>
);

const AppointmentRow = ({ appointment }: { appointment: Appointment }) => {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate("/agenda", { state: { openAppointmentId: appointment.id } })}
      className="group flex w-full items-center gap-3 rounded-[20px] border border-zinc-200 bg-white p-3 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100 dark:border-white/[0.08] dark:bg-zinc-950"
    >
      <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-[16px] bg-foreground text-sm font-bold text-background tabular-nums">
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
}: {
  todayAppointments: Appointment[];
  weekAppointments: Appointment[];
  isLoading: boolean;
}) => {
  const navigate = useNavigate();
  const todayVisible = todayAppointments.slice(0, 6);
  const weekVisible = weekAppointments.slice(0, 8);

  return (
    <DesktopWorkspacePanel className="p-5 lg:p-6">
      <SectionHeader
        eyebrow="Agenda"
        title="Fluxo clinico"
        action={
          <Button variant="outline" className="h-9 rounded-[14px] px-3 text-xs font-bold" onClick={() => navigate("/agenda")}>
            Abrir
          </Button>
        }
      />

      <Tabs defaultValue="today" className="mt-5">
        <TabsList className="h-10 rounded-[16px]">
          <TabsTrigger value="today" className="h-8 rounded-[12px] px-3 text-xs">
            Hoje
          </TabsTrigger>
          <TabsTrigger value="week" className="h-8 rounded-[12px] px-3 text-xs">
            7 dias
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-4">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-20 animate-pulse rounded-[20px] bg-muted/35" />
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
                <div key={item} className="h-20 animate-pulse rounded-[20px] bg-muted/35" />
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
    </DesktopWorkspacePanel>
  );
};

const FinancialSignalPanel = ({
  financialConnected,
  financialLoading,
  managerial,
  neuroSnapshot,
  managerLoading,
  snapshotLoading,
}: {
  financialConnected: boolean;
  financialLoading: boolean;
  managerial?: { result?: number | null; receivable?: number | null } | null;
  neuroSnapshot?: { available_balance?: number | null; pending_receivables?: number | null } | null;
  managerLoading: boolean;
  snapshotLoading: boolean;
}) => {
  const navigate = useNavigate();
  const signal = buildFinancialSignal({ financialConnected, financialLoading, managerial, neuroSnapshot });
  const loading = managerLoading || financialLoading || (financialConnected && snapshotLoading);

  return (
    <DesktopWorkspacePanel className="p-5 lg:p-6">
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
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-20 animate-pulse rounded-[20px] bg-muted/35" />
          ))}
        </div>
      ) : (
        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_138px]">
          <button
            type="button"
            onClick={() => navigate(signal.ctaPath)}
            className="group relative min-h-[214px] overflow-hidden rounded-[34px] border border-zinc-200 bg-zinc-50 p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100 dark:border-white/[0.055] dark:bg-gradient-to-br dark:from-[#1A1A1C] dark:to-[#0D0D0F] dark:shadow-xl"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(255,255,255,0.34),transparent_30%),radial-gradient(circle_at_92%_88%,rgba(0,0,0,0.025),transparent_36%)] dark:bg-[radial-gradient(circle_at_16%_12%,rgba(255,255,255,0.045),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.026),transparent_48%)]" />
            <div className="relative z-10 flex h-full flex-col justify-between gap-8">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <DesktopWorkspaceIcon icon={WalletCards} />
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
                <p className="mt-3 text-xs font-medium text-muted-foreground">Resumo executivo. Operacao detalhada no Financeiro.</p>
              </div>
            </div>
          </button>

          <div className="flex flex-col justify-center gap-2 rounded-[30px] border border-zinc-200/50 bg-zinc-100/50 p-3 dark:border-white/[0.055] dark:bg-white/[0.045]">
            <DesktopMiniStat label="A receber" value={formatCurrency(signal.receivable)} accent />
            <DesktopMiniStat label="Saldo NF" value={formatCentsCurrency(signal.bankBalanceCents)} />
            <DesktopMiniStat label="Vai cair" value={formatCentsCurrency(signal.bankPendingCents)} />
          </div>
        </div>
      )}
    </DesktopWorkspacePanel>
  );
};

export const DesktopDashboardCommandCenter = () => {
  const today = useMemo(() => new Date(), []);
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
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_50%_10%,hsl(var(--foreground)/0.014),transparent_34%)] dark:bg-[radial-gradient(circle_at_50%_10%,hsl(var(--foreground)/0.018),transparent_34%)]" />
      <main className="page-spacing relative z-10 flex w-full max-w-[2200px] flex-col gap-4 px-6 md:px-8 lg:px-12 xl:px-16">
        <DesktopWorkspaceShell>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.48fr)_minmax(360px,0.72fr)]">
            <CommandPanel
              today={today}
              firstName={getFirstName(profile)}
              todayAppointments={todayAppointments}
              weekAppointmentsCount={activeAppointments.length}
              nextAppointment={nextAppointment}
              pendingPatients={pendingPatients}
              financialConnected={financialConnected}
              isLoading={loadingAppointments}
            />
            <UtilityRail
              today={today}
              openSynapseText={openSynapseText}
              openSynapseVoice={openSynapseVoice}
              attentionItems={attentionItems}
              notificationsLoading={notificationsLoading}
            />
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(460px,0.95fr)]">
            <AgendaPanel
              todayAppointments={todayAppointments}
              weekAppointments={activeAppointments}
              isLoading={loadingAppointments}
            />
            <FinancialSignalPanel
              financialConnected={financialConnected}
              financialLoading={financialLoading}
              managerial={managerial}
              neuroSnapshot={neuroSnapshot}
              managerLoading={managerLoading}
              snapshotLoading={snapshotLoading}
            />
          </div>
        </DesktopWorkspaceShell>
      </main>
    </div>
  );
};

export default DesktopDashboardCommandCenter;
