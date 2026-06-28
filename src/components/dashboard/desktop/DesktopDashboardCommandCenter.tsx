"use client";

import { addDays, differenceInMinutes, endOfDay, format, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ElementType, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Bell,
  Calculator,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Landmark,
  LineChart,
  MessageSquare,
  Mic,
  Plus,
  ReceiptText,
  Save,
  Stethoscope,
  Target,
  TrendingUp,
  UserPlus,
  Users,
  Video,
  WalletCards,
} from "lucide-react";

import { AppointmentDetailModal } from "@/components/agenda/AppointmentDetailModal";
import { NewAppointmentModal } from "@/components/agenda/NewAppointmentModal";
import { NewPatientModal } from "@/components/patients/NewPatientModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DesktopActionTile,
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
import { fromPlanningCents, useFinancialPlanning } from "@/hooks/use-financial-planning";
import { useGoogleCalendarSync } from "@/hooks/use-google-calendar-sync";
import { useNeurofinanceSnapshot } from "@/hooks/use-neurofinance-snapshot";
import { useNotifications } from "@/hooks/use-notifications";
import { usePendingPatientsCount } from "@/hooks/use-pending-patients-count";
import { useProfile } from "@/hooks/use-profile";
import { useSessionNotes } from "@/hooks/use-session-notes";
import { getAppointmentKind } from "@/lib/appointment-metadata";
import { getAppointmentStatusMeta } from "@/lib/appointment-status";
import { getAppointmentDisplayTitle } from "@/lib/appointment-utils";
import { cn } from "@/lib/utils";
import type { AISummary, Appointment, SessionNote } from "@/types";
import { toast } from "sonner";
import {
  buildAttentionQueue,
  buildFinancialSignal,
  getActiveAppointments,
  getNextSession,
  getTodayAppointments,
  isOnlineAppointment,
  type AttentionQueueCategory,
  type AttentionQueueItem,
} from "./dashboard-command-center-model";

type PendingFilter = "all" | AttentionQueueCategory;

type ManagerialDashboardMetrics = {
  income?: number | null;
  expense?: number | null;
  result?: number | null;
  receivable?: number | null;
  payable?: number | null;
};

const pendingFilters: Array<{ value: PendingFilter; label: string }> = [
  { value: "all", label: "Todas" },
  { value: "sessions", label: "Sessões" },
  { value: "appointments", label: "Agenda" },
  { value: "registrations", label: "Cadastros" },
  { value: "neurofinance", label: "NeuroFinance" },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatCompactCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 }).format(value);

const formatCentsCurrency = (value: number | null) =>
  value === null ? "-" : formatCurrency(value / 100);

const parseMoneyInput = (value: string) => {
  const normalized = value.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const amount = Number(normalized);
  return Number.isFinite(amount) ? Math.max(0, amount) : 0;
};

const formatMoneyInputValue = (value: number) => value.toFixed(2).replace(".", ",");

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
  return isOnlineAppointment(appointment) ? "Online" : "Consultório";
};

const getSessionSummaryText = (note?: SessionNote | null) => {
  const summary = note?.ai_summary;
  if (summary?.summary) return summary.summary;
  if (note?.notes) return note.notes;
  return null;
};

const getSummaryTopics = (summary?: AISummary | null) => summary?.topics?.filter(Boolean).slice(0, 3) || [];
const getSummaryNextSteps = (summary?: AISummary | null) => summary?.next_steps?.filter(Boolean).slice(0, 2) || [];

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

const GreetingChip = ({ label, value }: { label: string; value: string | number }) => (
  <span className="inline-flex items-center gap-2 rounded-full border border-background/14 bg-background/10 px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-background/62">
    {label}
    <strong className="text-sm font-black text-background tabular-nums">{value}</strong>
  </span>
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

const ActionSidebar = ({
  today,
  openSynapseText,
  openSynapseVoice,
}: {
  today: Date;
  openSynapseText: () => void;
  openSynapseVoice: () => void;
}) => {
  const navigate = useNavigate();

  return (
    <DesktopWorkspacePanel className="p-2.5">
      <nav aria-label="Atalhos do dashboard" className="flex gap-1.5 overflow-x-auto xl:min-h-[318px] xl:flex-col xl:items-center xl:overflow-visible">
        <NewAppointmentModal selectedDate={today}>
          <DesktopActionTile icon={Plus} label="Agendar" active />
        </NewAppointmentModal>
        <NewPatientModal>
          <DesktopActionTile icon={UserPlus} label="Paciente" />
        </NewPatientModal>
        <DesktopActionTile icon={CalendarIcon} label="Agenda" onClick={() => navigate("/agenda")} />
        <DesktopActionTile icon={WalletCards} label="Financeiro" onClick={() => navigate("/financeiro")} />
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
      </nav>
    </DesktopWorkspacePanel>
  );
};

const GreetingPanel = ({
  today,
  firstName,
  todayAppointments,
  weekAppointmentsCount,
  attentionItems,
  nextAppointment,
}: {
  today: Date;
  firstName: string;
  todayAppointments: Appointment[];
  weekAppointmentsCount: number;
  attentionItems: AttentionQueueItem[];
  nextAppointment?: Appointment;
}) => {
  const remainingToday = todayAppointments.filter((appointment) => new Date(appointment.end_time) > new Date()).length;
  const sessionsToday = todayAppointments.filter((appointment) => getAppointmentKind(appointment) === "session").length;
  const onlineToday = todayAppointments.filter((appointment) => isOnlineAppointment(appointment)).length;
  const clinicalSignals = attentionItems.filter((item) => item.category === "sessions").length;
  const appointmentSignals = attentionItems.filter((item) => item.category === "appointments").length;
  const nextPatient = nextAppointment ? getAppointmentDisplayTitle(nextAppointment) || nextAppointment.patient_name || "Paciente" : "Sem sessão futura";
  const nextTime = nextAppointment ? formatAppointmentTime(nextAppointment) : "Livre";

  return (
    <DesktopWorkspacePanel highContrast className="min-h-[376px] p-6 lg:p-8">
      <div className="flex h-full min-h-[312px] flex-col justify-between gap-8">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-background/52">
            {format(today, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </p>
          <h1 className="mt-4 max-w-2xl text-4xl font-black leading-[0.92] tracking-[-0.065em] text-background lg:text-6xl">
            Bom dia, {firstName}.
          </h1>
        </div>

        <div className="grid gap-2 lg:grid-cols-3">
          <div className="rounded-[24px] border border-background/12 bg-background/10 p-4 shadow-[inset_0_1px_0_hsl(var(--background)/0.12)] transition-transform duration-300 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-background/48">Próximo foco</p>
            <p className="mt-2 truncate text-xl font-black tracking-[-0.04em] text-background">{nextPatient}</p>
            <p className="mt-1 text-xs font-semibold text-background/58">{nextTime}</p>
          </div>
          <div className="rounded-[24px] border border-background/12 bg-background/10 p-4 shadow-[inset_0_1px_0_hsl(var(--background)/0.12)] transition-transform duration-300 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-background/48">Revisar antes</p>
            <p className="mt-2 text-xl font-black tracking-[-0.04em] text-background">{clinicalSignals + appointmentSignals}</p>
            <p className="mt-1 text-xs font-semibold text-background/58">sinais clínicos e agenda</p>
          </div>
          <div className="rounded-[24px] border border-background/12 bg-background/10 p-4 shadow-[inset_0_1px_0_hsl(var(--background)/0.12)] transition-transform duration-300 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-background/48">Operação do dia</p>
            <p className="mt-2 text-xl font-black tracking-[-0.04em] text-background">{sessionsToday}</p>
            <p className="mt-1 text-xs font-semibold text-background/58">{onlineToday} online</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <GreetingChip label="Hoje" value={remainingToday} />
          <GreetingChip label="Semana" value={weekAppointmentsCount} />
          <GreetingChip label="Pendências" value={attentionItems.length} />
        </div>
      </div>
    </DesktopWorkspacePanel>
  );
};

const NextSessionPanel = ({
  nextAppointment,
  isLoading,
}: {
  nextAppointment?: Appointment;
  isLoading: boolean;
}) => {
  const navigate = useNavigate();
  const patientId = nextAppointment?.patient_id || "";
  const { data: sessionNotes = [], isLoading: loadingSessionNotes } = useSessionNotes(patientId);
  const latestSessionNote = sessionNotes[0];
  const latestSummaryText = getSessionSummaryText(latestSessionNote);
  const latestTopics = getSummaryTopics(latestSessionNote?.ai_summary);
  const latestNextSteps = getSummaryNextSteps(latestSessionNote?.ai_summary);
  const minutesUntil = getMinutesUntil(nextAppointment);
  const online = isOnlineAppointment(nextAppointment);

  return (
    <DesktopWorkspacePanel className="min-h-[376px] p-5 lg:p-6">
      <div className="flex h-full min-h-[328px] flex-col justify-between gap-6">
        <SectionHeader
          eyebrow="Agora"
          title="Próxima sessão"
          action={
            <Button variant="outline" className="h-9 rounded-[14px] px-3 text-xs font-bold" onClick={() => navigate("/agenda")}>
              Agenda
            </Button>
          }
        />

        {isLoading ? (
          <div className="h-48 animate-pulse rounded-[28px] bg-muted/35" />
        ) : nextAppointment ? (
          <div className="relative overflow-hidden rounded-[30px] border border-zinc-200 bg-zinc-50 p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:border-white/[0.055] dark:bg-gradient-to-br dark:from-[#171719] dark:to-[#0C0C0E] dark:shadow-[0_24px_58px_-50px_rgba(0,0,0,0.9)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_0%,rgba(0,0,0,0.035),transparent_32%)] dark:bg-[radial-gradient(circle_at_14%_0%,rgba(255,255,255,0.012),transparent_34%)]" />
            <div className="relative z-10">
              <div className="flex flex-wrap items-center gap-2">
                {minutesUntil ? (
                  <span className="rounded-full border border-border/45 bg-background/65 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                    {minutesUntil}
                  </span>
                ) : null}
                <span className="rounded-full border border-border/45 bg-background/65 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                  {online ? "Online" : "Consultorio"}
                </span>
              </div>

              <div className="mt-6">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">{formatAppointmentDay(nextAppointment)}</p>
                <p className="mt-2 text-6xl font-black leading-none tracking-[-0.075em] text-foreground tabular-nums">
                  {formatAppointmentTime(nextAppointment)}
                </p>
                <h3 className="mt-5 truncate text-2xl font-black leading-none tracking-[-0.055em] text-foreground">
                  {getAppointmentDisplayTitle(nextAppointment) || nextAppointment.patient_name || "Paciente"}
                </h3>
                <p className="mt-3 line-clamp-2 text-sm font-medium leading-relaxed text-muted-foreground">
                  {online ? "Teleconsulta pronta para entrada direta." : "Abra a ficha ou siga para a agenda."}
                </p>
              </div>

              <div className="mt-5 rounded-[22px] border border-zinc-200/70 bg-white/72 p-4 shadow-sm dark:border-white/[0.07] dark:bg-white/[0.035]">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground">Última sessão</p>
                  {latestSessionNote?.created_at ? (
                    <span className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground/70">
                      {format(new Date(latestSessionNote.created_at), "dd/MM", { locale: ptBR })}
                    </span>
                  ) : null}
                </div>

                {loadingSessionNotes ? (
                  <div className="mt-3 h-16 animate-pulse rounded-[16px] bg-muted/40" />
                ) : latestSummaryText ? (
                  <>
                    <p className="mt-3 line-clamp-3 text-sm font-semibold leading-relaxed text-foreground/88">{latestSummaryText}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {[...latestTopics, ...latestNextSteps].slice(0, 4).map((item) => (
                        <span key={item} className="rounded-full border border-border/50 bg-background/70 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground">
                          {item}
                        </span>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="mt-3 text-sm font-medium leading-relaxed text-muted-foreground">Sem resumo confirmado para este paciente ainda.</p>
                )}
              </div>

              <div className="mt-6 grid gap-2 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
                {online ? (
                  <Button
                    className="h-11 rounded-[16px] bg-foreground px-4 text-[10px] font-black uppercase tracking-[0.16em] text-background hover:bg-foreground/90 dark:bg-white dark:text-zinc-950"
                    onClick={() => navigate("/teleconsulta", { state: { activeAppointmentId: nextAppointment.id } })}
                  >
                    Entrar
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : null}
                <AppointmentDetailModal appointment={nextAppointment}>
                  <Button variant="outline" className="h-11 rounded-[16px] px-4 text-[10px] font-black uppercase tracking-[0.16em]">
                    Ficha
                  </Button>
                </AppointmentDetailModal>
                <Button
                  variant="outline"
                  className="h-11 rounded-[16px] px-4 text-[10px] font-black uppercase tracking-[0.16em]"
                  onClick={() => navigate("/agenda", { state: { openAppointmentId: nextAppointment.id } })}
                >
                  Abrir
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex min-h-[210px] flex-col justify-center rounded-[28px] border border-dashed border-border/60 bg-muted/18 p-6">
            <Clock className="h-8 w-8 text-muted-foreground/45" />
            <h3 className="mt-5 text-2xl font-black tracking-[-0.055em] text-foreground">Sem sessão futura.</h3>
            <p className="mt-2 text-sm font-medium leading-relaxed text-muted-foreground">Use Agenda para organizar o próximo horário.</p>
          </div>
        )}
      </div>
    </DesktopWorkspacePanel>
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
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/45 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0" />
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

const ManagementWidget = ({
  managerial,
  isLoading,
}: {
  managerial?: { result?: number | null; receivable?: number | null } | null;
  isLoading: boolean;
}) => {
  const navigate = useNavigate();
  const result = Number(managerial?.result || 0);
  const receivable = Number(managerial?.receivable || 0);
  const healthy = result >= 0;

  if (isLoading) {
    return <div className="h-[270px] animate-pulse rounded-[30px] bg-muted/35" />;
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_150px]">
      <button
        type="button"
        onClick={() => navigate("/financeiro")}
        className="group relative min-h-[236px] overflow-hidden rounded-[34px] border border-zinc-200 bg-zinc-50 p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100 dark:border-white/[0.055] dark:bg-gradient-to-br dark:from-[#171719] dark:to-[#0C0C0E] dark:shadow-[0_24px_58px_-50px_rgba(0,0,0,0.9)]"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(0,0,0,0.035),transparent_30%)] dark:bg-[radial-gradient(circle_at_16%_12%,rgba(255,255,255,0.012),transparent_34%)]" />
        <div className="relative z-10 flex h-full flex-col justify-between gap-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <DesktopWorkspaceIcon icon={TrendingUp} className="bg-foreground text-background dark:bg-white dark:text-zinc-950" />
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">Gestao Financeira</p>
                <p className={cn("mt-1 text-xs font-black uppercase tracking-[0.12em]", healthy ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400")}>
                  {healthy ? "Resultado positivo" : "Revisar operacao"}
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground/45 transition-transform group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0" />
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Resultado do mes</p>
            <div className="mt-3 flex min-w-0 items-baseline gap-2">
              <span className="text-2xl font-light italic text-muted-foreground/70">R$</span>
              <p className="truncate text-5xl font-black leading-none tracking-[-0.065em] text-foreground tabular-nums">
                {result.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <p className="mt-3 text-xs font-medium text-muted-foreground">Resumo gerencial. Detalhes continuam na Gestao Financeira.</p>
          </div>
        </div>
      </button>

      <div className="flex flex-col justify-center gap-2 rounded-[30px] border border-zinc-200/50 bg-zinc-100/50 p-3 dark:border-white/[0.055] dark:bg-white/[0.035]">
        <DesktopMiniStat label="Resultado" value={formatCurrency(result)} accent />
        <DesktopMiniStat label="A receber" value={formatCurrency(receivable)} />
        <DesktopMiniStat label="Status" value={healthy ? "OK" : "Atencao"} tone={healthy ? "success" : "warning"} />
      </div>
    </div>
  );
};

const NeuroFinanceWidget = ({
  financialConnected,
  financialLoading,
  neuroSnapshot,
  snapshotLoading,
  managerial,
}: {
  financialConnected: boolean;
  financialLoading: boolean;
  neuroSnapshot?: { available_balance?: number | null; pending_receivables?: number | null } | null;
  snapshotLoading: boolean;
  managerial?: { result?: number | null; receivable?: number | null } | null;
}) => {
  const navigate = useNavigate();
  const signal = buildFinancialSignal({ financialConnected, financialLoading, managerial, neuroSnapshot });
  const loading = financialLoading || (financialConnected && snapshotLoading);

  if (loading) {
    return <div className="h-[270px] animate-pulse rounded-[30px] bg-muted/35" />;
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_150px]">
      <button
        type="button"
        onClick={() => navigate(signal.ctaPath)}
        className="group relative min-h-[236px] overflow-hidden rounded-[34px] border border-zinc-200 bg-zinc-50 p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100 dark:border-white/[0.055] dark:bg-gradient-to-br dark:from-[#171719] dark:to-[#0C0C0E] dark:shadow-[0_24px_58px_-50px_rgba(0,0,0,0.9)]"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(0,0,0,0.035),transparent_30%)] dark:bg-[radial-gradient(circle_at_16%_12%,rgba(255,255,255,0.012),transparent_34%)]" />
        <div className="relative z-10 flex h-full flex-col justify-between gap-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <DesktopWorkspaceIcon icon={Landmark} className="bg-foreground text-background dark:bg-white dark:text-zinc-950" />
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">NeuroFinance</p>
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
            <ArrowRight className="h-4 w-4 text-muted-foreground/45 transition-transform group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0" />
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{financialConnected ? "Saldo disponivel" : "Conta digital"}</p>
            <div className="mt-3 flex min-w-0 items-baseline gap-2">
              {financialConnected ? <span className="text-2xl font-light italic text-muted-foreground/70">R$</span> : null}
              <p className="truncate text-5xl font-black leading-none tracking-[-0.065em] text-foreground tabular-nums">
                {financialConnected ? formatCentsCurrency(signal.bankBalanceCents).replace("R$", "").trim() : "Ativar"}
              </p>
            </div>
            <p className="mt-3 text-xs font-medium text-muted-foreground">
              {financialConnected ? "Conta, recebiveis e movimentos reais ficam no NeuroFinance." : "Ative para operar conta, Pix, cobrancas e saldo real."}
            </p>
          </div>
        </div>
      </button>

      <div className="flex flex-col justify-center gap-2 rounded-[30px] border border-zinc-200/50 bg-zinc-100/50 p-3 dark:border-white/[0.055] dark:bg-white/[0.035]">
        <DesktopMiniStat label="Disponivel" value={formatCentsCurrency(signal.bankBalanceCents)} accent={financialConnected} />
        <DesktopMiniStat label="Vai cair" value={formatCentsCurrency(signal.bankPendingCents)} />
        <DesktopMiniStat label="Status" value={financialConnected ? "ON" : "OFF"} tone={financialConnected ? "success" : "warning"} />
      </div>
    </div>
  );
};

const FinancialOverviewPanel = ({
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
}) => (
  <DesktopWorkspacePanel className="p-5 lg:p-6">
    <Tabs defaultValue="management">
      <SectionHeader
        eyebrow="Financeiro"
        title="Resumo util"
        action={
          <TabsList className="h-10 rounded-[16px]">
            <TabsTrigger value="management" className="h-8 rounded-[12px] px-3 text-xs">
              Gestao
            </TabsTrigger>
            <TabsTrigger value="neurofinance" className="h-8 rounded-[12px] px-3 text-xs">
              NeuroFinance
            </TabsTrigger>
          </TabsList>
        }
      />

      <TabsContent value="management" className="mt-5">
        <ManagementWidget managerial={managerial} isLoading={managerLoading} />
      </TabsContent>

      <TabsContent value="neurofinance" className="mt-5">
        <NeuroFinanceWidget
          financialConnected={financialConnected}
          financialLoading={financialLoading}
          neuroSnapshot={neuroSnapshot}
          snapshotLoading={snapshotLoading}
          managerial={managerial}
        />
      </TabsContent>
    </Tabs>
  </DesktopWorkspacePanel>
);

const PendingIcon = ({ item }: { item: AttentionQueueItem }) => {
  if (item.category === "sessions") return <Users className="h-4 w-4" />;
  if (item.category === "appointments") return <CalendarIcon className="h-4 w-4" />;
  if (item.category === "registrations") return <UserPlus className="h-4 w-4" />;
  if (item.category === "neurofinance") return <WalletCards className="h-4 w-4" />;
  if (item.tone === "destructive") return <AlertCircle className="h-4 w-4" />;
  return <Bell className="h-4 w-4" />;
};

const PendingRows = ({ items }: { items: AttentionQueueItem[] }) => {
  const navigate = useNavigate();

  if (!items.length) {
    return (
      <div className="flex min-h-[190px] flex-col items-center justify-center rounded-[24px] border border-dashed border-border/60 bg-muted/18 p-6 text-center">
        <CheckCircle2 className="h-8 w-8 text-emerald-500/70" />
        <h3 className="mt-4 text-base font-bold text-foreground">Tudo em dia</h3>
        <p className="mt-2 max-w-sm text-sm font-medium text-muted-foreground">Sem pendencias acionaveis nesta categoria.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-2 md:grid-cols-2">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => navigate(item.actionUrl)}
          className={cn(
            "group flex w-full items-start gap-3 rounded-[20px] border border-zinc-200 bg-white p-3 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100 dark:border-white/[0.08] dark:bg-zinc-950",
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
            <PendingIcon item={item} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">{item.label}</span>
            <span className="mt-1 block truncate text-sm font-bold text-foreground">{item.title}</span>
            <span className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-muted-foreground">{item.description}</span>
          </span>
          <ArrowRight className="mt-3 h-4 w-4 shrink-0 text-muted-foreground/45 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0" />
        </button>
      ))}
    </div>
  );
};

const PendingWorkPanel = ({
  items,
  isLoading,
}: {
  items: AttentionQueueItem[];
  isLoading: boolean;
}) => {
  const countForFilter = (filter: PendingFilter) => (filter === "all" ? items.length : items.filter((item) => item.category === filter).length);
  const itemsForFilter = (filter: PendingFilter) => (filter === "all" ? items : items.filter((item) => item.category === filter));

  return (
    <DesktopWorkspacePanel className="p-5 lg:p-6">
      <Tabs defaultValue="all">
        <SectionHeader
          eyebrow="Pendencias"
          title="Lista operacional"
          action={
            <TabsList className="h-auto flex-wrap justify-end rounded-[16px] p-1">
              {pendingFilters.map((filter) => (
                <TabsTrigger key={filter.value} value={filter.value} className="h-8 gap-2 rounded-[12px] px-3 text-xs">
                  {filter.label}
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-black text-muted-foreground">{countForFilter(filter.value)}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          }
        />

        {pendingFilters.map((filter) => (
          <TabsContent key={filter.value} value={filter.value} className="mt-5">
            {isLoading ? (
              <div className="grid gap-2 md:grid-cols-2">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="h-20 animate-pulse rounded-[20px] bg-muted/35" />
                ))}
              </div>
            ) : (
              <PendingRows items={itemsForFilter(filter.value)} />
            )}
          </TabsContent>
        ))}
      </Tabs>
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
        appointments: activeAppointments,
        pendingPatients,
        financialConnected,
        financialLoading,
        limit: 8,
      }),
    [activeAppointments, financialConnected, financialLoading, notifications, pendingPatients],
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
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_50%_10%,hsl(var(--foreground)/0.008),transparent_34%)] dark:bg-[radial-gradient(circle_at_50%_10%,rgba(255,255,255,0.003),transparent_34%)]" />
      <main className="page-spacing relative z-10 flex w-full max-w-[2200px] flex-col gap-4 px-6 md:px-8 lg:px-12 xl:px-16">
        <DesktopWorkspaceShell>
          <div className="grid gap-4 xl:grid-cols-[104px_minmax(0,1fr)_minmax(420px,0.78fr)]">
            <ActionSidebar today={today} openSynapseText={openSynapseText} openSynapseVoice={openSynapseVoice} />
            <GreetingPanel
              today={today}
              firstName={getFirstName(profile)}
              todayAppointments={todayAppointments}
              weekAppointmentsCount={activeAppointments.length}
              pendingCount={attentionItems.length}
            />
            <NextSessionPanel nextAppointment={nextAppointment} isLoading={loadingAppointments} />
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.02fr)_minmax(500px,0.98fr)]">
            <AgendaPanel todayAppointments={todayAppointments} weekAppointments={activeAppointments} isLoading={loadingAppointments} />
            <FinancialOverviewPanel
              financialConnected={financialConnected}
              financialLoading={financialLoading}
              managerial={managerial}
              neuroSnapshot={neuroSnapshot}
              managerLoading={managerLoading}
              snapshotLoading={snapshotLoading}
            />
          </div>

          <div className="mt-4">
            <PendingWorkPanel items={attentionItems} isLoading={notificationsLoading} />
          </div>
        </DesktopWorkspaceShell>
      </main>
    </div>
  );
};

export default DesktopDashboardCommandCenter;
