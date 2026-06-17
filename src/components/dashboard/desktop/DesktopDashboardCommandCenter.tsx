"use client";

import { addDays, differenceInMinutes, endOfDay, format, isAfter, isSameDay, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AnimatePresence, motion } from "framer-motion";
import type { ElementType, ReactNode } from "react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronRight,
  Clock,
  HeartPulse,
  Landmark,
  ListChecks,
  MessageSquare,
  Mic,
  MonitorPlay,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users,
  Video,
  WalletCards,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAppointmentsByDateRange } from "@/hooks/use-appointments-by-date-range";
import { useFinancialAccount } from "@/hooks/use-financial-account";
import { useGoogleCalendarSync } from "@/hooks/use-google-calendar-sync";
import { usePendingPatientsCount } from "@/hooks/use-pending-patients-count";
import { useSynapse } from "@/context/SynapseProvider";
import { cn } from "@/lib/utils";
import { getAppointmentStatusMeta, isCancelledAppointmentStatus } from "@/lib/appointment-status";
import { getAppointmentDisplayTitle } from "@/lib/appointment-utils";

type DashboardAppointment = any;

type ActionItem = {
  priority: string;
  title: string;
  description: string;
  icon: ElementType<{ className?: string }>;
  actionLabel: string;
  onClick: () => void;
  tone?: "default" | "dark" | "warning";
};

const DashboardBadge = ({ children, icon: Icon = Sparkles }: { children: ReactNode; icon?: ElementType<{ className?: string }> }) => (
  <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200/70 bg-white/70 px-3.5 py-1.5 text-[9px] font-black uppercase tracking-[0.24em] text-zinc-500 shadow-sm backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.045] dark:text-white/45">
    <Icon className="h-3.5 w-3.5" />
    {children}
  </div>
);

const DashboardPanel = ({ children, className, innerClassName, delay = 0 }: { children: ReactNode; className?: string; innerClassName?: string; delay?: number }) => (
  <motion.section
    initial={{ opacity: 0, y: 18, filter: "blur(10px)" }}
    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
    transition={{ duration: 0.55, delay: delay / 1000, ease: [0.22, 1, 0.36, 1] }}
    className={cn(
      "relative overflow-hidden rounded-[34px] border border-border/70 bg-card/88 shadow-[0_28px_92px_-72px_rgba(24,24,27,0.58)] dark:border-white/[0.065] dark:bg-card/92 dark:shadow-[0_30px_100px_-70px_rgba(0,0,0,0.95)]",
      className
    )}
  >
    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.62),transparent_34%,rgba(255,255,255,0.18))] dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.055),transparent_34%,rgba(255,255,255,0.016))]" />
    <div className={cn("relative z-10", innerClassName)}>{children}</div>
  </motion.section>
);

const SectionTitle = ({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) => (
  <div className="flex flex-col gap-1.5">
    <p className="text-[9px] font-black uppercase tracking-[0.28em] text-zinc-400 dark:text-white/32">{eyebrow}</p>
    <h2 className="text-xl font-black tracking-[-0.035em] text-zinc-950 dark:text-white">{title}</h2>
    {description ? <p className="max-w-xl text-xs font-medium leading-relaxed text-zinc-500 dark:text-white/42">{description}</p> : null}
  </div>
);

const formatAppointmentTime = (appointment?: DashboardAppointment) => {
  if (!appointment?.start_time) return "—";
  return format(new Date(appointment.start_time), "HH:mm");
};

const formatAppointmentDate = (appointment?: DashboardAppointment) => {
  if (!appointment?.start_time) return "Sem data";
  const date = new Date(appointment.start_time);
  return isSameDay(date, new Date()) ? "Hoje" : format(date, "EEE, dd 'de' MMM", { locale: ptBR });
};

const getMinutesUntil = (appointment?: DashboardAppointment) => {
  if (!appointment?.start_time) return null;
  const minutes = differenceInMinutes(new Date(appointment.start_time), new Date());
  if (minutes < 0) return "em andamento";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}min` : `${hours}h`;
};

const AppointmentTypeLabel = ({ appointment }: { appointment?: DashboardAppointment }) => {
  const isOnline = appointment?.type === "teleconsulta" || !!appointment?.google_meet_link;
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200/70 bg-zinc-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-zinc-500 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/42">
      {isOnline ? <Video className="h-3.5 w-3.5" /> : <Stethoscope className="h-3.5 w-3.5" />}
      {isOnline ? "Online" : "Consultório"}
    </div>
  );
};

const RadarMetric = ({ icon: Icon, label, value, hint, tone = "default", onClick }: { icon: ElementType<{ className?: string }>; label: string; value: string | number; hint: string; tone?: "default" | "dark" | "warning" | "success"; onClick?: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "group relative min-h-[150px] overflow-hidden rounded-[28px] border p-5 text-left transition-all duration-500 hover:-translate-y-1 active:scale-[0.99]",
      tone === "dark"
        ? "border-zinc-950 bg-zinc-950 text-white shadow-[0_28px_90px_-64px_rgba(0,0,0,0.85)] dark:border-white dark:bg-white dark:text-zinc-950"
        : "border-zinc-200/70 bg-white/76 text-zinc-950 shadow-[0_22px_74px_-62px_rgba(24,24,27,0.55)] dark:border-white/[0.065] dark:bg-white/[0.035] dark:text-white",
      tone === "warning" && "border-amber-500/25 bg-amber-50/70 dark:border-amber-300/15 dark:bg-amber-300/[0.055]",
      tone === "success" && "border-emerald-500/20 bg-emerald-50/70 dark:border-emerald-300/15 dark:bg-emerald-300/[0.05]"
    )}
  >
    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.5),transparent_42%)] opacity-70 dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.055),transparent_42%)]" />
    <div className="relative z-10 flex items-start justify-between gap-4">
      <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", tone === "dark" ? "bg-white/12 dark:bg-zinc-950/10" : "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950")}>
        <Icon className="h-5 w-5" />
      </div>
      <ArrowRight className="h-4 w-4 opacity-24 transition-transform group-hover:translate-x-1" />
    </div>
    <div className="relative z-10 mt-7">
      <div className="text-4xl font-black tracking-[-0.06em]">{value}</div>
      <div className={cn("mt-2 text-[9px] font-black uppercase tracking-[0.2em]", tone === "dark" ? "opacity-55" : "text-zinc-400 dark:text-white/34")}>{label}</div>
      <p className={cn("mt-3 text-xs font-semibold leading-relaxed", tone === "dark" ? "opacity-62" : "text-zinc-500 dark:text-white/42")}>{hint}</p>
    </div>
  </button>
);

const CommandCenterHero = ({ todayAppointments, pendingPatients, nextAppointment, openSynapseText, openSynapseVoice }: { todayAppointments: DashboardAppointment[]; pendingPatients: number; nextAppointment?: DashboardAppointment; openSynapseText: () => void; openSynapseVoice: () => void }) => {
  const navigate = useNavigate();
  const greeting = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).format(new Date());
  const nextMinutes = getMinutesUntil(nextAppointment);
  const hasAppointments = todayAppointments.length > 0;

  return (
    <DashboardPanel className="rounded-[42px]" innerClassName="p-8 md:p-10 xl:p-12" delay={60}>
      <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-end">
        <div>
          <DashboardBadge icon={Sparkles}>Central da Clínica</DashboardBadge>
          <p className="mt-10 text-[10px] font-black uppercase tracking-[0.35em] text-zinc-400 dark:text-white/35">{greeting}</p>
          <h1 className="mt-5 max-w-5xl text-[clamp(3rem,6vw,6.2rem)] font-black leading-[0.88] tracking-[-0.075em] text-zinc-950 dark:text-white">
            {hasAppointments ? `Sua clínica tem ${todayAppointments.length} atendimento${todayAppointments.length > 1 ? "s" : ""} hoje.` : "Sua clínica está livre hoje."}
          </h1>
          <p className="mt-7 max-w-3xl text-base font-medium leading-relaxed text-zinc-500 dark:text-white/48 md:text-lg">
            {nextAppointment
              ? `Próxima sessão às ${formatAppointmentTime(nextAppointment)}${nextMinutes ? ` (${nextMinutes})` : ""}. ${pendingPatients > 0 ? `${pendingPatients} paciente${pendingPatients > 1 ? "s" : ""} aguardam atenção.` : "Nenhuma pendência crítica de paciente no radar."}`
              : pendingPatients > 0
                ? `${pendingPatients} paciente${pendingPatients > 1 ? "s" : ""} aguardam atenção. Use o dia para revisar prontuários, retornos e pendências.`
                : "Use este espaço para revisar prontuários, planejar cobranças e preparar a semana com o Synapse."}
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button onClick={() => navigate("/agenda")} className="h-14 rounded-2xl bg-zinc-950 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-black dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100">
              Abrir agenda <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button onClick={openSynapseText} variant="outline" className="h-14 rounded-2xl border-zinc-200/80 bg-white/70 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-700 hover:bg-zinc-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/70 dark:hover:bg-white/[0.07]">
              <MessageSquare className="mr-2 h-4 w-4" /> Perguntar ao Synapse
            </Button>
            <Button onClick={openSynapseVoice} variant="outline" className="h-14 rounded-2xl border-zinc-200/80 bg-white/70 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-700 hover:bg-zinc-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/70 dark:hover:bg-white/[0.07]">
              <Mic className="mr-2 h-4 w-4" /> Voz
            </Button>
          </div>
        </div>

        <div className="rounded-[34px] bg-zinc-950 p-6 text-white shadow-[0_34px_110px_-74px_rgba(0,0,0,0.9)] dark:bg-white dark:text-zinc-950">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 dark:bg-zinc-950/10">
              <Clock className="h-5 w-5" />
            </div>
            <span className="rounded-full border border-white/10 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.2em] opacity-55 dark:border-zinc-950/10">Próxima ação</span>
          </div>
          <div className="mt-10">
            <p className="text-[9px] font-black uppercase tracking-[0.25em] opacity-45">{nextAppointment ? formatAppointmentDate(nextAppointment) : "Sem sessão futura"}</p>
            <h3 className="mt-3 text-4xl font-black leading-[0.92] tracking-[-0.06em]">{nextAppointment ? getAppointmentDisplayTitle(nextAppointment) || "Paciente Particular" : "Planejar a clínica"}</h3>
            <p className="mt-4 text-sm font-medium leading-relaxed opacity-62">
              {nextAppointment ? `Atendimento às ${formatAppointmentTime(nextAppointment)}. Revise o prontuário e prepare a sessão antes de iniciar.` : "Sem compromisso imediato. Uma boa janela para revisar pendências e organizar a semana."}
            </p>
          </div>
          <Button onClick={() => nextAppointment ? navigate("/agenda", { state: { openAppointmentId: nextAppointment.id } }) : openSynapseText()} className="mt-8 h-12 w-full rounded-2xl bg-white text-[10px] font-black uppercase tracking-[0.2em] text-zinc-950 hover:bg-white/90 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900">
            {nextAppointment ? "Abrir compromisso" : "Gerar briefing"} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </DashboardPanel>
  );
};

const AttentionRadar = ({ todayAppointments, upcomingAppointments, pendingPatients, nextAppointment, financialConnected }: { todayAppointments: DashboardAppointment[]; upcomingAppointments: DashboardAppointment[]; pendingPatients: number; nextAppointment?: DashboardAppointment; financialConnected: boolean }) => {
  const navigate = useNavigate();
  const nextTime = nextAppointment ? formatAppointmentTime(nextAppointment) : "—";

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <RadarMetric icon={CalendarIcon} label="Atendimentos hoje" value={todayAppointments.length} hint="Agenda viva do dia" tone="dark" onClick={() => navigate("/agenda")} />
      <RadarMetric icon={Clock} label="Próxima sessão" value={nextTime} hint={nextAppointment ? getAppointmentDisplayTitle(nextAppointment) || "Paciente Particular" : "Sem compromisso próximo"} onClick={() => navigate("/agenda")} />
      <RadarMetric icon={Users} label="Pacientes em atenção" value={pendingPatients} hint="Pendências e convites aguardando resposta" tone={pendingPatients > 0 ? "warning" : "success"} onClick={() => navigate("/pacientes")} />
      <RadarMetric icon={WalletCards} label="NeuroFinance" value={financialConnected ? "ON" : "OFF"} hint={financialConnected ? "Conta financeira conectada" : "Ative para ver financeiro aqui"} tone={financialConnected ? "success" : "warning"} onClick={() => navigate("/financeiro")} />
      <RadarMetric icon={BarChart3} label="Semana" value={upcomingAppointments.length} hint="Compromissos ativos nos próximos 7 dias" onClick={() => navigate("/agenda")} />
    </div>
  );
};

const TodaySchedule = ({ appointments, isLoading }: { appointments: DashboardAppointment[]; isLoading: boolean }) => {
  const navigate = useNavigate();

  return (
    <DashboardPanel className="h-full min-h-[560px]" innerClassName="flex h-full flex-col p-7 md:p-8" delay={150}>
      <div className="flex items-start justify-between gap-4">
        <SectionTitle eyebrow="Agenda viva" title="Hoje na clínica" description="Atendimentos, status e ações rápidas do dia." />
        <Button onClick={() => navigate("/agenda")} variant="outline" className="h-11 shrink-0 rounded-2xl border-zinc-200 bg-white/70 text-[9px] font-black uppercase tracking-[0.18em] dark:border-white/10 dark:bg-white/[0.04]">
          Agenda <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div className="mt-8 flex-1 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
        {isLoading ? (
          [1, 2, 3, 4].map((item) => <div key={item} className="h-24 animate-pulse rounded-[24px] bg-zinc-100 dark:bg-white/[0.035]" />)
        ) : appointments.length === 0 ? (
          <div className="flex h-full min-h-[360px] flex-col items-center justify-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"><CalendarIcon className="h-6 w-6" /></div>
            <h3 className="mt-6 text-2xl font-black tracking-[-0.045em] text-zinc-950 dark:text-white">Nenhum atendimento hoje.</h3>
            <p className="mt-3 max-w-sm text-sm font-medium leading-relaxed text-zinc-500 dark:text-white/42">Use o dia para organizar prontuários, revisar pacientes e preparar cobranças.</p>
          </div>
        ) : (
          appointments.map((appointment, index) => {
            const statusMeta = getAppointmentStatusMeta(appointment.status, appointment.notes);
            return (
              <motion.button
                key={appointment.id}
                type="button"
                onClick={() => navigate("/agenda", { state: { openAppointmentId: appointment.id } })}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04, duration: 0.35 }}
                className="group flex w-full items-center gap-4 rounded-[26px] border border-zinc-200/70 bg-zinc-50/70 p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_22px_70px_-54px_rgba(24,24,27,0.55)] dark:border-white/[0.07] dark:bg-white/[0.032] dark:hover:bg-white/[0.055]"
              >
                <div className="flex h-14 w-16 shrink-0 flex-col items-center justify-center rounded-[20px] bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
                  <span className="text-lg font-black tabular-nums tracking-[-0.04em]">{formatAppointmentTime(appointment)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="truncate text-base font-black tracking-[-0.035em] text-zinc-950 dark:text-white">{getAppointmentDisplayTitle(appointment) || "Paciente Particular"}</h4>
                    <span className={cn("rounded-full border px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.12em]", statusMeta.bgClass, statusMeta.borderClass, statusMeta.textClass)}>{statusMeta.label}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <AppointmentTypeLabel appointment={appointment} />
                    <span className="rounded-full border border-zinc-200/70 bg-white/60 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-zinc-400 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/34">{appointment.location || "Local não informado"}</span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-zinc-300 transition-transform group-hover:translate-x-1 dark:text-white/25" />
              </motion.button>
            );
          })
        )}
      </div>
    </DashboardPanel>
  );
};

const NextSessionPanel = ({ appointment, isLoading }: { appointment?: DashboardAppointment; isLoading: boolean }) => {
  const navigate = useNavigate();
  const minutesUntil = getMinutesUntil(appointment);

  return (
    <DashboardPanel className="min-h-[270px]" innerClassName="p-7 md:p-8" delay={190}>
      <SectionTitle eyebrow="Próxima sessão" title="Preparação imediata" description="O que vem a seguir na rotina clínica." />
      {isLoading ? (
        <div className="mt-8 h-44 animate-pulse rounded-[28px] bg-zinc-100 dark:bg-white/[0.035]" />
      ) : appointment ? (
        <div className="mt-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-zinc-400 dark:text-white/34">{formatAppointmentDate(appointment)}</p>
              <h3 className="mt-3 text-4xl font-black leading-[0.9] tracking-[-0.06em] text-zinc-950 dark:text-white">{formatAppointmentTime(appointment)}</h3>
            </div>
            <AppointmentTypeLabel appointment={appointment} />
          </div>
          <h4 className="mt-6 text-2xl font-black tracking-[-0.045em] text-zinc-950 dark:text-white">{getAppointmentDisplayTitle(appointment) || "Paciente Particular"}</h4>
          <p className="mt-3 text-sm font-medium leading-relaxed text-zinc-500 dark:text-white/44">{minutesUntil ? `Começa em ${minutesUntil}. ` : ""}Revise o prontuário, confirme o contexto e abra a sessão quando estiver pronto.</p>
          <div className="mt-7 grid grid-cols-2 gap-3">
            <Button onClick={() => navigate("/agenda", { state: { openAppointmentId: appointment.id } })} className="h-12 rounded-2xl bg-zinc-950 text-[9px] font-black uppercase tracking-[0.16em] text-white dark:bg-white dark:text-zinc-950">Abrir agenda</Button>
            <Button onClick={() => navigate("/pacientes")} variant="outline" className="h-12 rounded-2xl border-zinc-200 bg-white/70 text-[9px] font-black uppercase tracking-[0.16em] dark:border-white/10 dark:bg-white/[0.04]">Paciente</Button>
          </div>
        </div>
      ) : (
        <div className="mt-8 rounded-[28px] border border-zinc-200/70 bg-zinc-50/75 p-6 text-center dark:border-white/10 dark:bg-white/[0.035]">
          <MonitorPlay className="mx-auto h-8 w-8 text-zinc-300 dark:text-white/25" />
          <h3 className="mt-5 text-xl font-black tracking-[-0.04em] text-zinc-950 dark:text-white">Sem próxima sessão.</h3>
          <p className="mt-3 text-sm font-medium leading-relaxed text-zinc-500 dark:text-white/42">O dashboard fica pronto para destacar o próximo atendimento assim que houver agendamentos.</p>
        </div>
      )}
    </DashboardPanel>
  );
};

const SynapseBriefingPanel = ({ todayAppointments, pendingPatients, financialConnected, openSynapseText, openSynapseVoice }: { todayAppointments: DashboardAppointment[]; pendingPatients: number; financialConnected: boolean; openSynapseText: () => void; openSynapseVoice: () => void }) => {
  const insights = [
    todayAppointments.length > 0 ? `${todayAppointments.length} atendimento${todayAppointments.length > 1 ? "s" : ""} no calendário de hoje.` : "Dia sem atendimentos: bom momento para organização clínica.",
    pendingPatients > 0 ? `${pendingPatients} paciente${pendingPatients > 1 ? "s" : ""} em atenção ou aguardando retorno.` : "Nenhum paciente pendente no radar principal.",
    financialConnected ? "NeuroFinance conectado para acompanhamento financeiro." : "NeuroFinance ainda não está ativo no dashboard.",
  ];

  return (
    <DashboardPanel className="min-h-[270px] bg-zinc-950 text-white dark:bg-white dark:text-zinc-950" innerClassName="p-7 md:p-8" delay={230}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.28em] opacity-45">Synapse Briefing</p>
          <h2 className="mt-3 text-3xl font-black leading-[0.92] tracking-[-0.055em]">Pergunte à sua clínica.</h2>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 dark:bg-zinc-950/10"><Sparkles className="h-5 w-5" /></div>
      </div>
      <div className="mt-7 space-y-2">
        {insights.map((insight) => (
          <div key={insight} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.065] px-4 py-3 text-sm font-semibold leading-relaxed opacity-78 dark:border-zinc-950/10 dark:bg-zinc-950/[0.045]">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            {insight}
          </div>
        ))}
      </div>
      <div className="mt-7 grid grid-cols-2 gap-3">
        <Button onClick={openSynapseText} className="h-12 rounded-2xl bg-white text-[9px] font-black uppercase tracking-[0.16em] text-zinc-950 dark:bg-zinc-950 dark:text-white"><MessageSquare className="mr-2 h-4 w-4" /> Texto</Button>
        <Button onClick={openSynapseVoice} variant="outline" className="h-12 rounded-2xl border-white/15 bg-white/[0.065] text-[9px] font-black uppercase tracking-[0.16em] text-white hover:bg-white/10 dark:border-zinc-950/10 dark:bg-zinc-950/[0.045] dark:text-zinc-950"><Mic className="mr-2 h-4 w-4" /> Voz</Button>
      </div>
    </DashboardPanel>
  );
};

const ClinicalPulsePanel = ({ todayAppointments, pendingPatients, weeklyAppointments }: { todayAppointments: DashboardAppointment[]; pendingPatients: number; weeklyAppointments: DashboardAppointment[] }) => {
  const activePatients = new Set(weeklyAppointments.map((apt) => getAppointmentDisplayTitle(apt) || apt.patient_id || apt.patient?.id).filter(Boolean)).size;
  const patientsToWatch = [
    pendingPatients > 0 ? `${pendingPatients} paciente${pendingPatients > 1 ? "s" : ""} com pendência de cadastro ou retorno` : "Nenhuma pendência crítica de cadastro",
    todayAppointments.length > 0 ? `${todayAppointments.length} sessão${todayAppointments.length > 1 ? "ões" : ""} para preparar hoje` : "Sem sessões para preparar hoje",
    weeklyAppointments.length > 0 ? `${weeklyAppointments.length} compromisso${weeklyAppointments.length > 1 ? "s" : ""} na semana` : "Semana ainda sem compromissos ativos",
  ];

  return (
    <DashboardPanel className="h-full" innerClassName="p-7 md:p-8" delay={280}>
      <SectionTitle eyebrow="Pulso clínico" title="Continuidade dos pacientes" description="Um resumo da atenção clínica que precisa estar no radar." />
      <div className="mt-8 grid grid-cols-3 gap-3">
        <div className="rounded-[24px] bg-zinc-950 p-4 text-white dark:bg-white dark:text-zinc-950">
          <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-45">Ativos</p>
          <p className="mt-4 text-3xl font-black tracking-[-0.06em]">{activePatients}</p>
        </div>
        <div className="rounded-[24px] border border-zinc-200/70 bg-zinc-50/75 p-4 dark:border-white/10 dark:bg-white/[0.035]">
          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-white/34">Hoje</p>
          <p className="mt-4 text-3xl font-black tracking-[-0.06em] text-zinc-950 dark:text-white">{todayAppointments.length}</p>
        </div>
        <div className="rounded-[24px] border border-zinc-200/70 bg-zinc-50/75 p-4 dark:border-white/10 dark:bg-white/[0.035]">
          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-white/34">Atenção</p>
          <p className="mt-4 text-3xl font-black tracking-[-0.06em] text-zinc-950 dark:text-white">{pendingPatients}</p>
        </div>
      </div>
      <div className="mt-6 space-y-2">
        {patientsToWatch.map((item) => (
          <div key={item} className="flex items-center gap-3 rounded-[20px] border border-zinc-200/70 bg-zinc-50/70 px-4 py-3 text-sm font-semibold text-zinc-600 dark:border-white/10 dark:bg-white/[0.035] dark:text-white/48">
            <HeartPulse className="h-4 w-4 shrink-0 text-zinc-400 dark:text-white/32" />
            {item}
          </div>
        ))}
      </div>
    </DashboardPanel>
  );
};

const FinancialPulsePanel = ({ financialConnected, financialStatus }: { financialConnected: boolean; financialStatus?: string | null }) => {
  const navigate = useNavigate();

  return (
    <DashboardPanel className="h-full" innerClassName="p-7 md:p-8" delay={320}>
      <SectionTitle eyebrow="Pulso financeiro" title="NeuroFinance no radar" description="Um resumo leve da camada financeira sem sair do Dashboard." />
      <div className="mt-8 rounded-[30px] bg-zinc-950 p-6 text-white dark:bg-white dark:text-zinc-950">
        <div className="flex items-center justify-between gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 dark:bg-zinc-950/10">
            {financialConnected ? <BadgeCheck className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          </div>
          <span className="rounded-full border border-white/10 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.2em] opacity-55 dark:border-zinc-950/10">{financialConnected ? "Conectado" : "Pendente"}</span>
        </div>
        <h3 className="mt-9 text-3xl font-black leading-[0.92] tracking-[-0.055em]">{financialConnected ? "Conta financeira ativa no sistema." : "Ative o financeiro para ver recebíveis aqui."}</h3>
        <p className="mt-4 text-sm font-medium leading-relaxed opacity-62">{financialConnected ? `Status atual: ${financialStatus || "em operação"}. Use o NeuroFinance para cobranças, Pix, boletos, saques e extrato.` : "Quando o NeuroFinance estiver ativo, este card exibirá cobranças pendentes, recebidos no mês e próximos repasses."}</p>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {["Recebido", "Pendente", "Previsto"].map((item) => (
          <div key={item} className="rounded-[22px] border border-zinc-200/70 bg-zinc-50/70 p-4 text-center dark:border-white/10 dark:bg-white/[0.035]">
            <p className="text-[8px] font-black uppercase tracking-[0.18em] text-zinc-400 dark:text-white/32">{item}</p>
            <p className="mt-3 text-xl font-black tracking-[-0.04em] text-zinc-950 dark:text-white">—</p>
          </div>
        ))}
      </div>
      <Button onClick={() => navigate("/financeiro")} className="mt-5 h-12 w-full rounded-2xl bg-zinc-950 text-[9px] font-black uppercase tracking-[0.16em] text-white dark:bg-white dark:text-zinc-950">
        Abrir NeuroFinance <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </DashboardPanel>
  );
};

const WorkQueuePanel = ({ items }: { items: ActionItem[] }) => (
  <DashboardPanel innerClassName="p-7 md:p-8" delay={360}>
    <div className="flex items-start justify-between gap-4">
      <SectionTitle eyebrow="Fila de trabalho" title="O que precisa de ação" description="Pendências operacionais organizadas por prioridade." />
      <ListChecks className="h-6 w-6 text-zinc-300 dark:text-white/24" />
    </div>
    <div className="mt-8 grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <button
          key={`${item.priority}-${item.title}`}
          type="button"
          onClick={item.onClick}
          className={cn(
            "group relative min-h-[210px] overflow-hidden rounded-[28px] border p-5 text-left transition-all duration-300 hover:-translate-y-1 active:scale-[0.99]",
            item.tone === "dark" ? "border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950" : "border-zinc-200/70 bg-zinc-50/72 text-zinc-950 dark:border-white/10 dark:bg-white/[0.035] dark:text-white",
            item.tone === "warning" && "border-amber-500/25 bg-amber-50/75 dark:border-amber-300/15 dark:bg-amber-300/[0.055]"
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", item.tone === "dark" ? "bg-white/12 dark:bg-zinc-950/10" : "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950")}>
              <item.icon className="h-5 w-5" />
            </div>
            <span className={cn("rounded-full border px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.16em]", item.tone === "dark" ? "border-white/10 opacity-55 dark:border-zinc-950/10" : "border-zinc-200 bg-white/70 text-zinc-400 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/32")}>{item.priority}</span>
          </div>
          <h3 className="mt-7 text-lg font-black leading-tight tracking-[-0.035em]">{item.title}</h3>
          <p className={cn("mt-3 text-sm font-medium leading-relaxed", item.tone === "dark" ? "opacity-62" : "text-zinc-500 dark:text-white/42")}>{item.description}</p>
          <div className={cn("mt-6 flex items-center text-[9px] font-black uppercase tracking-[0.18em]", item.tone === "dark" ? "opacity-70" : "text-zinc-500 dark:text-white/48")}>{item.actionLabel}<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" /></div>
        </button>
      ))}
    </div>
  </DashboardPanel>
);

const OperationalTimeline = ({ appointments, isLoading, isExpanded, setExpanded }: { appointments: DashboardAppointment[]; isLoading: boolean; isExpanded: boolean; setExpanded: (value: boolean) => void }) => {
  const navigate = useNavigate();
  const visibleAppointments = isExpanded ? appointments : appointments.slice(0, 4);

  return (
    <DashboardPanel className="min-h-[520px]" innerClassName="p-7 md:p-8" delay={420}>
      <div className="mb-8 flex items-start justify-between gap-4">
        <SectionTitle eyebrow="Linha do tempo" title="Fluxo operacional da clínica" description="Agenda, sessões e eventos importantes em ordem cronológica." />
        {appointments.length > 4 ? (
          <Button variant="outline" onClick={() => setExpanded(!isExpanded)} className="h-11 rounded-2xl border-zinc-200 bg-white/70 text-[9px] font-black uppercase tracking-[0.18em] dark:border-white/10 dark:bg-white/[0.04]">
            {isExpanded ? "Recolher" : "Ver tudo"}
          </Button>
        ) : null}
      </div>

      <div className="space-y-4">
        {isLoading ? (
          [1, 2, 3, 4].map((item) => <div key={item} className="h-24 animate-pulse rounded-[24px] bg-zinc-100 dark:bg-white/[0.035]" />)
        ) : visibleAppointments.length === 0 ? (
          <div className="rounded-[28px] border border-zinc-200/70 bg-zinc-50/70 p-10 text-center dark:border-white/10 dark:bg-white/[0.035]">
            <CalendarIcon className="mx-auto h-9 w-9 text-zinc-300 dark:text-white/24" />
            <p className="mt-5 text-[10px] font-black uppercase tracking-[0.22em] text-zinc-400 dark:text-white/32">Nenhum evento futuro</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout" initial={false}>
            {visibleAppointments.map((appointment, index) => {
              const statusMeta = getAppointmentStatusMeta(appointment.status, appointment.notes);
              return (
                <motion.button
                  key={appointment.id}
                  type="button"
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ delay: index * 0.04, duration: 0.32 }}
                  onClick={() => navigate("/agenda", { state: { openAppointmentId: appointment.id } })}
                  className="group grid w-full grid-cols-[88px_1fr_auto] items-center gap-5 rounded-[26px] border border-zinc-200/70 bg-zinc-50/70 p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:bg-white dark:border-white/[0.07] dark:bg-white/[0.032] dark:hover:bg-white/[0.055]"
                >
                  <div className="rounded-[20px] bg-zinc-950 px-3 py-3 text-center text-white dark:bg-white dark:text-zinc-950">
                    <div className="text-lg font-black tabular-nums tracking-[-0.04em]">{formatAppointmentTime(appointment)}</div>
                    <div className="mt-1 text-[8px] font-black uppercase tracking-[0.14em] opacity-52">{formatAppointmentDate(appointment)}</div>
                  </div>
                  <div className="min-w-0">
                    <h4 className="truncate text-base font-black tracking-[-0.03em] text-zinc-950 dark:text-white">{getAppointmentDisplayTitle(appointment) || "Paciente Particular"}</h4>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <AppointmentTypeLabel appointment={appointment} />
                      <span className={cn("rounded-full border px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.12em]", statusMeta.bgClass, statusMeta.borderClass, statusMeta.textClass)}>{statusMeta.label}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-zinc-300 transition-transform group-hover:translate-x-1 dark:text-white/24" />
                </motion.button>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </DashboardPanel>
  );
};

const OperationalHealthPanel = ({ financialConnected, financialLoading, pendingPatients }: { financialConnected: boolean; financialLoading: boolean; pendingPatients: number }) => {
  const items = [
    { label: "Agenda", status: "Sincronização ativa", icon: CalendarIcon, good: true },
    { label: "NeuroFinance", status: financialLoading ? "Verificando" : financialConnected ? "Conectado" : "Aguardando ativação", icon: Landmark, good: financialConnected },
    { label: "Pacientes", status: pendingPatients > 0 ? `${pendingPatients} pendência${pendingPatients > 1 ? "s" : ""}` : "Sem pendências críticas", icon: Users, good: pendingPatients === 0 },
    { label: "Segurança", status: "Controles ativos", icon: ShieldCheck, good: true },
  ];

  return (
    <DashboardPanel innerClassName="p-7 md:p-8" delay={460}>
      <SectionTitle eyebrow="Saúde operacional" title="Status da clínica" description="Integrações, segurança e pontos que podem afetar sua rotina." />
      <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="rounded-[24px] border border-zinc-200/70 bg-zinc-50/70 p-5 dark:border-white/10 dark:bg-white/[0.035]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"><item.icon className="h-4 w-4" /></div>
              {item.good ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <AlertCircle className="h-4 w-4 text-amber-500" />}
            </div>
            <h3 className="mt-5 text-sm font-black uppercase tracking-[0.12em] text-zinc-950 dark:text-white">{item.label}</h3>
            <p className="mt-2 text-xs font-semibold leading-relaxed text-zinc-500 dark:text-white/42">{item.status}</p>
          </div>
        ))}
      </div>
    </DashboardPanel>
  );
};

export const DesktopDashboardCommandCenter = () => {
  const today = new Date();
  const navigate = useNavigate();
  const { setShellState, setActiveTab, toggleVoiceMode } = useSynapse();

  useGoogleCalendarSync();

  const { data: allUpcomingAppointments, isLoading: loadingApts } = useAppointmentsByDateRange(startOfDay(today), endOfDay(addDays(today, 7)));
  const { data: pendingPatientsRaw } = usePendingPatientsCount();
  const { isConnected: financialConnected, status: financialStatus, isLoading: financialLoading } = useFinancialAccount();
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(false);

  const pendingPatients = Number(pendingPatientsRaw || 0);

  const activeUpcomingAppointments = useMemo(() => {
    if (!allUpcomingAppointments) return [];
    return allUpcomingAppointments
      .filter((apt: DashboardAppointment) => !isCancelledAppointmentStatus(apt.status, apt.notes))
      .sort((a: DashboardAppointment, b: DashboardAppointment) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  }, [allUpcomingAppointments]);

  const todayAppointments = useMemo(() => activeUpcomingAppointments.filter((apt: DashboardAppointment) => isSameDay(new Date(apt.start_time), today)), [activeUpcomingAppointments, today]);

  const nextAppointment = useMemo(() => {
    const now = new Date();
    return activeUpcomingAppointments.find((apt: DashboardAppointment) => isAfter(new Date(apt.end_time), now));
  }, [activeUpcomingAppointments]);

  const openSynapseText = () => {
    setShellState("compact");
    setActiveTab("chat");
  };

  const openSynapseVoice = () => {
    setShellState("compact");
    setActiveTab("voice");
    toggleVoiceMode();
  };

  const workQueue = useMemo<ActionItem[]>(() => {
    const items: ActionItem[] = [];

    if (nextAppointment) {
      items.push({
        priority: "Agora",
        title: "Preparar próxima sessão",
        description: `${getAppointmentDisplayTitle(nextAppointment) || "Paciente Particular"} às ${formatAppointmentTime(nextAppointment)}. Revise o contexto antes do atendimento.`,
        icon: Clock,
        actionLabel: "Abrir agenda",
        tone: "dark",
        onClick: () => navigate("/agenda", { state: { openAppointmentId: nextAppointment.id } }),
      });
    }

    if (pendingPatients > 0) {
      items.push({
        priority: "Atenção",
        title: "Pacientes aguardando ação",
        description: `${pendingPatients} paciente${pendingPatients > 1 ? "s" : ""} precisam de revisão, cadastro ou retorno.`,
        icon: Users,
        actionLabel: "Ver pacientes",
        tone: "warning",
        onClick: () => navigate("/pacientes"),
      });
    }

    if (!financialConnected) {
      items.push({
        priority: "Financeiro",
        title: "Ativar NeuroFinance",
        description: "Conecte sua conta financeira para acompanhar cobranças, recebíveis e saques pelo dashboard.",
        icon: WalletCards,
        actionLabel: "Abrir financeiro",
        tone: "warning",
        onClick: () => navigate("/financeiro"),
      });
    }

    if (todayAppointments.length === 0) {
      items.push({
        priority: "Planejamento",
        title: "Organizar prontuários e cobranças",
        description: "Sem atendimentos hoje. Use o Synapse para gerar um plano de revisão clínica e financeira.",
        icon: Sparkles,
        actionLabel: "Falar com Synapse",
        onClick: openSynapseText,
      });
    }

    items.push({
      priority: "Rotina",
      title: "Revisar a semana clínica",
      description: `${activeUpcomingAppointments.length} compromisso${activeUpcomingAppointments.length !== 1 ? "s" : ""} ativo${activeUpcomingAppointments.length !== 1 ? "s" : ""} nos próximos 7 dias.`,
      icon: CalendarIcon,
      actionLabel: "Ver agenda",
      onClick: () => navigate("/agenda"),
    });

    return items.slice(0, 4);
  }, [activeUpcomingAppointments.length, financialConnected, navigate, nextAppointment, pendingPatients, todayAppointments.length]);

  return (
    <div className="relative min-h-screen w-full bg-background pb-32 pt-28 font-sans selection:bg-primary/10 selection:text-primary">
      <main className="relative z-10 mx-auto flex w-full max-w-[2220px] flex-col gap-6 px-5 md:px-8 lg:px-10 xl:px-14">
        <CommandCenterHero
          todayAppointments={todayAppointments}
          pendingPatients={pendingPatients}
          nextAppointment={nextAppointment}
          openSynapseText={openSynapseText}
          openSynapseVoice={openSynapseVoice}
        />

        <AttentionRadar
          todayAppointments={todayAppointments}
          upcomingAppointments={activeUpcomingAppointments}
          pendingPatients={pendingPatients}
          nextAppointment={nextAppointment}
          financialConnected={financialConnected}
        />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.75fr)]">
          <TodaySchedule appointments={todayAppointments} isLoading={loadingApts} />
          <div className="grid gap-6">
            <NextSessionPanel appointment={nextAppointment} isLoading={loadingApts} />
            <SynapseBriefingPanel
              todayAppointments={todayAppointments}
              pendingPatients={pendingPatients}
              financialConnected={financialConnected}
              openSynapseText={openSynapseText}
              openSynapseVoice={openSynapseVoice}
            />
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <ClinicalPulsePanel todayAppointments={todayAppointments} pendingPatients={pendingPatients} weeklyAppointments={activeUpcomingAppointments} />
          <FinancialPulsePanel financialConnected={financialConnected} financialStatus={financialStatus} />
        </div>

        <WorkQueuePanel items={workQueue} />
        <OperationalTimeline appointments={activeUpcomingAppointments} isLoading={loadingApts} isExpanded={isTimelineExpanded} setExpanded={setIsTimelineExpanded} />
        <OperationalHealthPanel financialConnected={financialConnected} financialLoading={financialLoading} pendingPatients={pendingPatients} />
      </main>
    </div>
  );
};

export default DesktopDashboardCommandCenter;
