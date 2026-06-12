"use client";

import { NewAppointmentModal } from "@/components/agenda/NewAppointmentModal";
import { useAuth } from "@/components/auth/SessionContextProvider";
import { NewPatientModal } from "@/components/patients/NewPatientModal";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useSynapse } from "@/context/SynapseProvider";
import { useAppointmentsByDateRange } from "@/hooks/use-appointments-by-date-range";
import { useFinancialAccount } from "@/hooks/use-financial-account";
import { usePendingPatientsCount } from "@/hooks/use-pending-patients-count";
import { getAppointmentStatusMeta, isCancelledAppointmentStatus } from "@/lib/appointment-status";
import { getAppointmentDisplayTitle } from "@/lib/appointment-utils";
import { cn } from "@/lib/utils";
import { addDays, differenceInMinutes, endOfDay, format, isAfter, isSameDay, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AnimatePresence, motion } from "framer-motion";
import {
    AlertCircle,
    ArrowRight,
    BadgeCheck,
    BarChart3,
    Calendar,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Clock,
    FileText,
    HeartPulse,
    Landmark,
    Mail,
    MessageSquare,
    Mic,
    Plus,
    SendHorizontal,
    ShieldCheck,
    Sparkles,
    Stethoscope,
    Users,
    Video,
    WalletCards,
} from "lucide-react";
import type { ElementType, ReactNode } from "react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { MobileLayout } from "../components/MobileLayout";

type MobileAppointment = any;

type QueueItem = {
    priority: string;
    title: string;
    description: string;
    icon: ElementType<{ className?: string }>;
    actionLabel: string;
    onClick: () => void;
    tone?: "default" | "dark" | "warning";
};

const getFirstName = (user?: any) => {
    const metadata = user?.user_metadata || {};
    return metadata.first_name || metadata.name?.split?.(" ")?.[0] || "Doutor";
};

const formatAppointmentTime = (appointment?: MobileAppointment) => {
    if (!appointment?.start_time) return "—";
    return format(new Date(appointment.start_time), "HH:mm");
};

const formatAppointmentDate = (appointment?: MobileAppointment) => {
    if (!appointment?.start_time) return "Sem data";
    const date = new Date(appointment.start_time);
    return isSameDay(date, new Date()) ? "Hoje" : format(date, "EEE, dd 'de' MMM", { locale: ptBR });
};

const getMinutesUntil = (appointment?: MobileAppointment) => {
    if (!appointment?.start_time) return null;
    const minutes = differenceInMinutes(new Date(appointment.start_time), new Date());
    if (minutes < 0) return "em andamento";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest ? `${hours}h ${rest}min` : `${hours}h`;
};

const MobilePanel = ({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) => (
    <motion.section
        initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.48, delay, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
            "relative overflow-hidden rounded-[34px] border border-zinc-200/70 bg-white/82 shadow-[0_24px_70px_-58px_rgba(24,24,27,0.72)] backdrop-blur-xl dark:border-white/[0.075] dark:bg-white/[0.035] dark:shadow-[0_28px_90px_-68px_rgba(0,0,0,0.95)]",
            className
        )}
    >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.62),transparent_36%,rgba(255,255,255,0.16))] dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.055),transparent_36%,rgba(255,255,255,0.014))]" />
        <div className="relative z-10">{children}</div>
    </motion.section>
);

const MobileBadge = ({ children, icon: Icon = Sparkles }: { children: ReactNode; icon?: ElementType<{ className?: string }> }) => (
    <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200/70 bg-white/70 px-3.5 py-1.5 text-[8px] font-black uppercase tracking-[0.22em] text-zinc-500 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.045] dark:text-white/42">
        <Icon className="h-3.5 w-3.5" />
        {children}
    </div>
);

const SectionTitle = ({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) => (
    <div>
        <p className="text-[8px] font-black uppercase tracking-[0.26em] text-zinc-400 dark:text-white/32">{eyebrow}</p>
        <h2 className="mt-1.5 text-[1.65rem] font-black leading-[0.95] tracking-[-0.055em] text-zinc-950 dark:text-white">{title}</h2>
        {description ? <p className="mt-2 text-sm font-medium leading-relaxed text-zinc-500 dark:text-white/44">{description}</p> : null}
    </div>
);

const AppointmentKind = ({ appointment, inverted = false }: { appointment?: MobileAppointment; inverted?: boolean }) => {
    const isOnline = appointment?.type === "teleconsulta" || appointment?.type === "online" || !!appointment?.google_meet_link;
    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.14em]",
            inverted
                ? "border-white/10 bg-white/[0.075] text-white/60 dark:border-zinc-950/10 dark:bg-zinc-950/[0.05] dark:text-zinc-950/60"
                : "border-zinc-200/70 bg-zinc-50 text-zinc-500 dark:border-white/10 dark:bg-white/[0.045] dark:text-white/42"
        )}>
            {isOnline ? <Video className="h-3.5 w-3.5" /> : <Stethoscope className="h-3.5 w-3.5" />}
            {isOnline ? "Online" : "Consultório"}
        </span>
    );
};

const DashboardHero = ({
    firstName,
    todayAppointments,
    pendingPatients,
    nextAppointment,
    openSynapseText,
    openSynapseVoice,
}: {
    firstName: string;
    todayAppointments: MobileAppointment[];
    pendingPatients: number;
    nextAppointment?: MobileAppointment;
    openSynapseText: () => void;
    openSynapseVoice: () => void;
}) => {
    const navigate = useNavigate();
    const nextMinutes = getMinutesUntil(nextAppointment);

    return (
        <MobilePanel className="rounded-[38px] bg-zinc-950 p-6 text-white dark:bg-white dark:text-zinc-950" delay={0.05}>
            <div className="flex items-start justify-between gap-4">
                <MobileBadge icon={Sparkles}>Central da clínica</MobileBadge>
                <NewAppointmentModal>
                    <button className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-zinc-950 shadow-[0_24px_70px_-44px_rgba(255,255,255,0.75)] active:scale-95 dark:bg-zinc-950 dark:text-white" aria-label="Novo agendamento">
                        <Plus className="h-5 w-5 stroke-[3]" />
                    </button>
                </NewAppointmentModal>
            </div>

            <p className="mt-9 text-[9px] font-black uppercase tracking-[0.3em] opacity-42">
                {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
            <h1 className="mt-3 text-[3.05rem] font-black leading-[0.86] tracking-[-0.075em]">
                Bom dia, {firstName}.
            </h1>
            <p className="mt-5 text-sm font-medium leading-relaxed opacity-62">
                {todayAppointments.length > 0
                    ? `Sua clínica tem ${todayAppointments.length} atendimento${todayAppointments.length > 1 ? "s" : ""} hoje${nextAppointment ? ` e a próxima sessão começa às ${formatAppointmentTime(nextAppointment)}${nextMinutes ? ` (${nextMinutes})` : ""}.` : "."}`
                    : pendingPatients > 0
                        ? `${pendingPatients} paciente${pendingPatients > 1 ? "s" : ""} precisam de atenção. Use o dia para revisar retornos e prontuários.`
                        : "Sua agenda está livre. Uma boa janela para revisar pacientes, financeiro e planejar a semana."}
            </p>

            <div className="mt-7 grid grid-cols-2 gap-3">
                <Button onClick={() => navigate("/agenda")} className="h-13 rounded-2xl bg-white text-[9px] font-black uppercase tracking-[0.18em] text-zinc-950 hover:bg-white/90 dark:bg-zinc-950 dark:text-white">
                    Agenda
                </Button>
                <Button onClick={openSynapseText} variant="outline" className="h-13 rounded-2xl border-white/15 bg-white/[0.07] text-[9px] font-black uppercase tracking-[0.18em] text-white hover:bg-white/10 dark:border-zinc-950/10 dark:bg-zinc-950/[0.045] dark:text-zinc-950">
                    <MessageSquare className="mr-2 h-4 w-4" /> Synapse
                </Button>
            </div>
            <button onClick={openSynapseVoice} className="mt-3 flex h-12 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.045] text-[9px] font-black uppercase tracking-[0.18em] opacity-75 active:scale-[0.98] dark:border-zinc-950/10 dark:bg-zinc-950/[0.045]">
                <Mic className="mr-2 h-4 w-4" /> Comandar por voz
            </button>
        </MobilePanel>
    );
};

const RadarCard = ({
    icon: Icon,
    label,
    value,
    hint,
    tone = "default",
    onClick,
}: {
    icon: ElementType<{ className?: string }>;
    label: string;
    value: string | number;
    hint: string;
    tone?: "default" | "dark" | "warning" | "success";
    onClick: () => void;
}) => (
    <button
        type="button"
        onClick={onClick}
        className={cn(
            "relative min-h-[148px] overflow-hidden rounded-[28px] border p-5 text-left transition-all active:scale-[0.98]",
            tone === "dark"
                ? "border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950"
                : "border-zinc-200/70 bg-white/82 text-zinc-950 dark:border-white/[0.075] dark:bg-white/[0.035] dark:text-white",
            tone === "warning" && "border-amber-500/25 bg-amber-50/75 dark:border-amber-300/15 dark:bg-amber-300/[0.055]",
            tone === "success" && "border-emerald-500/20 bg-emerald-50/75 dark:border-emerald-300/15 dark:bg-emerald-300/[0.05]"
        )}
    >
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.55),transparent_42%)] dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.055),transparent_42%)]" />
        <div className="relative z-10 flex items-center justify-between">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-2xl", tone === "dark" ? "bg-white/12 dark:bg-zinc-950/10" : "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950")}>
                <Icon className="h-4.5 w-4.5" />
            </div>
            <ArrowRight className="h-4 w-4 opacity-25" />
        </div>
        <div className="relative z-10 mt-6">
            <div className="text-[2.05rem] font-black leading-none tracking-[-0.065em]">{value}</div>
            <div className={cn("mt-2 text-[8px] font-black uppercase tracking-[0.18em]", tone === "dark" ? "opacity-55" : "text-zinc-400 dark:text-white/32")}>{label}</div>
            <p className={cn("mt-2 line-clamp-2 text-[11px] font-semibold leading-relaxed", tone === "dark" ? "opacity-58" : "text-zinc-500 dark:text-white/42")}>{hint}</p>
        </div>
    </button>
);

const AttentionRadar = ({
    remainingCount,
    weeklyCount,
    pendingPatients,
    nextAppointment,
    financialConnected,
}: {
    remainingCount: number;
    weeklyCount: number;
    pendingPatients: number;
    nextAppointment?: MobileAppointment;
    financialConnected: boolean;
}) => {
    const navigate = useNavigate();

    return (
        <section className="grid grid-cols-2 gap-3">
            <RadarCard icon={Calendar} label="Hoje" value={remainingCount} hint="Atendimentos restantes" tone="dark" onClick={() => navigate("/agenda")} />
            <RadarCard icon={Clock} label="Próxima" value={nextAppointment ? formatAppointmentTime(nextAppointment) : "—"} hint={nextAppointment ? getAppointmentDisplayTitle(nextAppointment) || "Paciente" : "Sem sessão"} onClick={() => navigate("/agenda")} />
            <RadarCard icon={Users} label="Atenção" value={pendingPatients} hint="Pacientes e cadastros" tone={pendingPatients > 0 ? "warning" : "success"} onClick={() => navigate("/pacientes")} />
            <RadarCard icon={WalletCards} label="Financeiro" value={financialConnected ? "ON" : "OFF"} hint={financialConnected ? "Conta conectada" : "Ativar NeuroFinance"} tone={financialConnected ? "success" : "warning"} onClick={() => navigate("/financeiro")} />
            <div className="col-span-2">
                <RadarCard icon={BarChart3} label="Semana clínica" value={weeklyCount} hint="Compromissos ativos nos próximos 7 dias" onClick={() => navigate("/agenda")} />
            </div>
        </section>
    );
};

const NextSession = ({ appointment, isLoading }: { appointment?: MobileAppointment; isLoading: boolean }) => {
    const navigate = useNavigate();
    const minutesUntil = getMinutesUntil(appointment);

    return (
        <MobilePanel className="p-6" delay={0.14}>
            <div className="flex items-start justify-between gap-4">
                <SectionTitle eyebrow="Próxima sessão" title="Preparação imediata" description="O que vem a seguir na rotina clínica." />
                <Clock className="h-5 w-5 text-zinc-300 dark:text-white/24" />
            </div>

            {isLoading ? (
                <div className="mt-7 h-44 animate-pulse rounded-[26px] bg-zinc-100 dark:bg-white/[0.035]" />
            ) : appointment ? (
                <div className="mt-7 rounded-[30px] bg-zinc-950 p-5 text-white dark:bg-white dark:text-zinc-950">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-[8px] font-black uppercase tracking-[0.24em] opacity-45">{formatAppointmentDate(appointment)}</p>
                            <div className="mt-2 text-[3.4rem] font-black leading-none tracking-[-0.075em]">{formatAppointmentTime(appointment)}</div>
                        </div>
                        <AppointmentKind appointment={appointment} inverted />
                    </div>
                    <h3 className="mt-6 text-2xl font-black leading-[0.95] tracking-[-0.055em]">{getAppointmentDisplayTitle(appointment) || appointment.patient_name || "Paciente Particular"}</h3>
                    <p className="mt-3 text-sm font-medium leading-relaxed opacity-62">
                        {minutesUntil ? `Começa em ${minutesUntil}. ` : ""}Revise o contexto e abra o compromisso quando estiver pronto.
                    </p>
                    <Button onClick={() => navigate("/agenda", { state: { openAppointmentId: appointment.id } })} className="mt-6 h-13 w-full rounded-2xl bg-white text-[9px] font-black uppercase tracking-[0.18em] text-zinc-950 hover:bg-white/90 dark:bg-zinc-950 dark:text-white">
                        Abrir compromisso <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <div className="mt-7 rounded-[30px] border border-dashed border-zinc-200/80 bg-zinc-50/70 p-7 text-center dark:border-white/10 dark:bg-white/[0.035]">
                    <Clock className="mx-auto h-8 w-8 text-zinc-300 dark:text-white/24" />
                    <h3 className="mt-5 text-xl font-black tracking-[-0.045em] text-zinc-950 dark:text-white">Sem próxima sessão.</h3>
                    <p className="mt-3 text-sm font-medium leading-relaxed text-zinc-500 dark:text-white/42">Quando houver agendamento, ele aparecerá aqui com ação rápida.</p>
                </div>
            )}
        </MobilePanel>
    );
};

const AgendaLive = ({ appointments, isLoading, nextAppointment }: { appointments: MobileAppointment[]; isLoading: boolean; nextAppointment?: MobileAppointment }) => {
    const navigate = useNavigate();

    return (
        <MobilePanel className="p-6" delay={0.18}>
            <div className="flex items-start justify-between gap-4">
                <SectionTitle eyebrow="Agenda viva" title="Hoje na clínica" description="Atendimentos e status do dia." />
                <Button onClick={() => navigate("/agenda")} variant="outline" className="h-10 shrink-0 rounded-2xl border-zinc-200 bg-white/70 px-4 text-[8px] font-black uppercase tracking-[0.16em] dark:border-white/10 dark:bg-white/[0.04]">
                    Ver
                </Button>
            </div>

            <div className="mt-7 space-y-3">
                {isLoading ? (
                    [1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-[24px] bg-zinc-100 dark:bg-white/[0.035]" />)
                ) : appointments.length === 0 ? (
                    <div className="rounded-[28px] border border-zinc-200/70 bg-zinc-50/70 p-6 text-center dark:border-white/10 dark:bg-white/[0.035]">
                        <Calendar className="mx-auto h-8 w-8 text-zinc-300 dark:text-white/24" />
                        <p className="mt-4 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-white/32">Nenhum atendimento hoje</p>
                    </div>
                ) : (
                    appointments.map((apt, idx) => {
                        const isPast = new Date(apt.end_time) < new Date();
                        const isNext = apt.id === nextAppointment?.id;
                        const statusMeta = getAppointmentStatusMeta(apt.status, apt.notes);

                        return (
                            <motion.button
                                key={apt.id}
                                type="button"
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.04 }}
                                onClick={() => navigate("/agenda", { state: { openAppointmentId: apt.id } })}
                                className={cn(
                                    "flex w-full items-center gap-4 rounded-[26px] border p-4 text-left transition-all active:scale-[0.99]",
                                    isPast
                                        ? "border-transparent bg-zinc-100/70 opacity-45 grayscale dark:bg-white/[0.025]"
                                        : isNext
                                            ? "border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950"
                                            : "border-zinc-200/70 bg-zinc-50/75 dark:border-white/10 dark:bg-white/[0.035]"
                                )}
                            >
                                <div className={cn("flex h-13 w-16 shrink-0 items-center justify-center rounded-[20px] text-lg font-black tracking-[-0.04em]", isNext ? "bg-white/12 dark:bg-zinc-950/10" : "bg-white text-zinc-950 dark:bg-white/[0.05] dark:text-white")}>{formatAppointmentTime(apt)}</div>
                                <div className="min-w-0 flex-1">
                                    <h4 className={cn("truncate text-base font-black tracking-[-0.035em]", isNext ? "text-white dark:text-zinc-950" : "text-zinc-950 dark:text-white")}>{getAppointmentDisplayTitle(apt) || apt.patient_name || "Paciente Particular"}</h4>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        <AppointmentKind appointment={apt} inverted={isNext} />
                                        <span className={cn("rounded-full border px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.12em]", isNext ? "border-white/10 bg-white/[0.07] text-white/60 dark:border-zinc-950/10 dark:bg-zinc-950/[0.045] dark:text-zinc-950/60" : cn(statusMeta.bgClass, statusMeta.borderClass, statusMeta.textClass))}>{statusMeta.label}</span>
                                    </div>
                                </div>
                                {!isPast ? <ChevronRight className={cn("h-5 w-5 shrink-0", isNext ? "opacity-22" : "text-zinc-300 dark:text-white/24")} /> : null}
                            </motion.button>
                        );
                    })
                )}
            </div>
        </MobilePanel>
    );
};

const SynapseBriefing = ({ todayCount, pendingPatients, financialConnected, openSynapseText, openSynapseVoice }: { todayCount: number; pendingPatients: number; financialConnected: boolean; openSynapseText: () => void; openSynapseVoice: () => void }) => {
    const insights = [
        todayCount > 0 ? `${todayCount} atendimento${todayCount > 1 ? "s" : ""} no calendário de hoje.` : "Dia livre para organização clínica.",
        pendingPatients > 0 ? `${pendingPatients} paciente${pendingPatients > 1 ? "s" : ""} no radar de atenção.` : "Sem pendências críticas de pacientes.",
        financialConnected ? "NeuroFinance conectado." : "NeuroFinance ainda não está ativo.",
    ];

    return (
        <MobilePanel className="bg-zinc-950 p-6 text-white dark:bg-white dark:text-zinc-950" delay={0.22}>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-[8px] font-black uppercase tracking-[0.26em] opacity-45">Synapse Briefing</p>
                    <h2 className="mt-2 text-[2rem] font-black leading-[0.92] tracking-[-0.06em]">Pergunte à sua clínica.</h2>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 dark:bg-zinc-950/10"><Sparkles className="h-5 w-5" /></div>
            </div>
            <div className="mt-6 space-y-2">
                {insights.map((insight) => (
                    <div key={insight} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.065] px-4 py-3 text-sm font-semibold leading-relaxed opacity-76 dark:border-zinc-950/10 dark:bg-zinc-950/[0.045]">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                        {insight}
                    </div>
                ))}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
                <Button onClick={openSynapseText} className="h-12 rounded-2xl bg-white text-[9px] font-black uppercase tracking-[0.16em] text-zinc-950 dark:bg-zinc-950 dark:text-white"><MessageSquare className="mr-2 h-4 w-4" /> Texto</Button>
                <Button onClick={openSynapseVoice} variant="outline" className="h-12 rounded-2xl border-white/15 bg-white/[0.065] text-[9px] font-black uppercase tracking-[0.16em] text-white hover:bg-white/10 dark:border-zinc-950/10 dark:bg-zinc-950/[0.045] dark:text-zinc-950"><Mic className="mr-2 h-4 w-4" /> Voz</Button>
            </div>
        </MobilePanel>
    );
};

const PulsePanels = ({ todayCount, weeklyCount, pendingPatients, financialConnected, financialStatus }: { todayCount: number; weeklyCount: number; pendingPatients: number; financialConnected: boolean; financialStatus?: string | null }) => {
    const navigate = useNavigate();

    return (
        <section className="grid gap-4">
            <MobilePanel className="p-6" delay={0.24}>
                <SectionTitle eyebrow="Pulso clínico" title="Continuidade dos pacientes" description="Resumo da atenção clínica da semana." />
                <div className="mt-6 grid grid-cols-3 gap-2">
                    <div className="rounded-[22px] bg-zinc-950 p-4 text-white dark:bg-white dark:text-zinc-950">
                        <p className="text-[8px] font-black uppercase tracking-[0.18em] opacity-45">Hoje</p>
                        <p className="mt-3 text-2xl font-black tracking-[-0.06em]">{todayCount}</p>
                    </div>
                    <div className="rounded-[22px] border border-zinc-200/70 bg-zinc-50/75 p-4 dark:border-white/10 dark:bg-white/[0.035]">
                        <p className="text-[8px] font-black uppercase tracking-[0.18em] text-zinc-400 dark:text-white/32">Semana</p>
                        <p className="mt-3 text-2xl font-black tracking-[-0.06em] text-zinc-950 dark:text-white">{weeklyCount}</p>
                    </div>
                    <div className="rounded-[22px] border border-zinc-200/70 bg-zinc-50/75 p-4 dark:border-white/10 dark:bg-white/[0.035]">
                        <p className="text-[8px] font-black uppercase tracking-[0.18em] text-zinc-400 dark:text-white/32">Atenção</p>
                        <p className="mt-3 text-2xl font-black tracking-[-0.06em] text-zinc-950 dark:text-white">{pendingPatients}</p>
                    </div>
                </div>
                <div className="mt-5 rounded-[24px] border border-zinc-200/70 bg-zinc-50/70 p-4 dark:border-white/10 dark:bg-white/[0.035]">
                    <div className="flex items-start gap-3 text-sm font-semibold leading-relaxed text-zinc-600 dark:text-white/48">
                        <HeartPulse className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400 dark:text-white/32" />
                        {pendingPatients > 0 ? `${pendingPatients} paciente${pendingPatients > 1 ? "s" : ""} precisam de revisão, cadastro ou retorno.` : "Nenhuma pendência crítica de paciente no radar."}
                    </div>
                </div>
            </MobilePanel>

            <MobilePanel className="p-6" delay={0.26}>
                <SectionTitle eyebrow="Pulso financeiro" title="NeuroFinance no radar" description="Resumo leve da camada financeira." />
                <div className="mt-6 rounded-[28px] bg-zinc-950 p-5 text-white dark:bg-white dark:text-zinc-950">
                    <div className="flex items-center justify-between">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 dark:bg-zinc-950/10">
                            {financialConnected ? <BadgeCheck className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                        </div>
                        <span className="rounded-full border border-white/10 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.18em] opacity-55 dark:border-zinc-950/10">{financialConnected ? "Conectado" : "Pendente"}</span>
                    </div>
                    <h3 className="mt-7 text-2xl font-black leading-[0.95] tracking-[-0.055em]">{financialConnected ? "Conta financeira ativa." : "Ative o financeiro para ver recebíveis."}</h3>
                    <p className="mt-3 text-sm font-medium leading-relaxed opacity-62">{financialConnected ? `Status: ${financialStatus || "em operação"}.` : "Cobranças, recebidos e próximos repasses aparecerão aqui."}</p>
                    <Button onClick={() => navigate("/financeiro")} className="mt-6 h-12 w-full rounded-2xl bg-white text-[9px] font-black uppercase tracking-[0.16em] text-zinc-950 hover:bg-white/90 dark:bg-zinc-950 dark:text-white">
                        Abrir NeuroFinance <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </MobilePanel>
        </section>
    );
};

const WorkQueue = ({ items }: { items: QueueItem[] }) => (
    <MobilePanel className="p-6" delay={0.28}>
        <SectionTitle eyebrow="Fila de trabalho" title="O que precisa de ação" description="Pendências do dia em ordem de prioridade." />
        <div className="mt-6 space-y-3">
            {items.map((item) => (
                <button
                    key={`${item.priority}-${item.title}`}
                    type="button"
                    onClick={item.onClick}
                    className={cn(
                        "flex w-full items-start gap-4 rounded-[26px] border p-4 text-left transition-all active:scale-[0.99]",
                        item.tone === "dark"
                            ? "border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950"
                            : "border-zinc-200/70 bg-zinc-50/72 text-zinc-950 dark:border-white/10 dark:bg-white/[0.035] dark:text-white",
                        item.tone === "warning" && "border-amber-500/25 bg-amber-50/75 dark:border-amber-300/15 dark:bg-amber-300/[0.055]"
                    )}
                >
                    <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", item.tone === "dark" ? "bg-white/12 dark:bg-zinc-950/10" : "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950")}>
                        <item.icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                            <span className={cn("rounded-full border px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.16em]", item.tone === "dark" ? "border-white/10 opacity-55 dark:border-zinc-950/10" : "border-zinc-200 bg-white/70 text-zinc-400 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/32")}>{item.priority}</span>
                            <ChevronRight className="h-4 w-4 opacity-25" />
                        </div>
                        <h3 className="mt-3 text-base font-black leading-tight tracking-[-0.035em]">{item.title}</h3>
                        <p className={cn("mt-2 text-xs font-medium leading-relaxed", item.tone === "dark" ? "opacity-62" : "text-zinc-500 dark:text-white/42")}>{item.description}</p>
                        <div className={cn("mt-3 text-[8px] font-black uppercase tracking-[0.16em]", item.tone === "dark" ? "opacity-70" : "text-zinc-500 dark:text-white/48")}>{item.actionLabel}</div>
                    </div>
                </button>
            ))}
        </div>
    </MobilePanel>
);

const QuickActions = ({ onMessagesOpen }: { onMessagesOpen: () => void }) => {
    const navigate = useNavigate();

    return (
        <section>
            <h3 className="mb-5 px-1 text-[9px] font-black uppercase tracking-[0.24em] text-zinc-400 dark:text-white/32">Comandos rápidos</h3>
            <div className="-mx-5 flex gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <NewAppointmentModal>
                    <button className="flex min-w-[86px] flex-col items-center gap-3 active:scale-95">
                        <div className="flex h-18 w-18 items-center justify-center rounded-[24px] bg-zinc-950 text-white shadow-[0_22px_70px_-50px_rgba(0,0,0,0.65)] dark:bg-white dark:text-zinc-950"><Plus className="h-6 w-6" /></div>
                        <span className="text-[8px] font-black uppercase tracking-[0.16em] text-zinc-500 dark:text-white/44">Agenda</span>
                    </button>
                </NewAppointmentModal>
                <NewPatientModal>
                    <button className="flex min-w-[86px] flex-col items-center gap-3 active:scale-95">
                        <div className="flex h-18 w-18 items-center justify-center rounded-[24px] border border-zinc-200/70 bg-white/80 dark:border-white/10 dark:bg-white/[0.04]"><Users className="h-6 w-6 text-zinc-500 dark:text-white/48" /></div>
                        <span className="text-[8px] font-black uppercase tracking-[0.16em] text-zinc-500 dark:text-white/44">Paciente</span>
                    </button>
                </NewPatientModal>
                <button onClick={onMessagesOpen} className="flex min-w-[86px] flex-col items-center gap-3 active:scale-95">
                    <div className="flex h-18 w-18 items-center justify-center rounded-[24px] border border-zinc-200/70 bg-white/80 dark:border-white/10 dark:bg-white/[0.04]"><SendHorizontal className="h-6 w-6 text-zinc-500 dark:text-white/48" /></div>
                    <span className="text-[8px] font-black uppercase tracking-[0.16em] text-zinc-500 dark:text-white/44">Mensagem</span>
                </button>
                <button onClick={() => navigate("/notas")} className="flex min-w-[86px] flex-col items-center gap-3 active:scale-95">
                    <div className="flex h-18 w-18 items-center justify-center rounded-[24px] border border-zinc-200/70 bg-white/80 dark:border-white/10 dark:bg-white/[0.04]"><FileText className="h-6 w-6 text-zinc-500 dark:text-white/48" /></div>
                    <span className="text-[8px] font-black uppercase tracking-[0.16em] text-zinc-500 dark:text-white/44">Notas</span>
                </button>
            </div>
        </section>
    );
};

const OperationalHealth = ({ financialConnected, pendingPatients }: { financialConnected: boolean; pendingPatients: number }) => {
    const [open, setOpen] = useState(false);
    const items = [
        { label: "Agenda", status: "Ativa", good: true, icon: Calendar },
        { label: "NeuroFinance", status: financialConnected ? "Conectado" : "Aguardando", good: financialConnected, icon: Landmark },
        { label: "Pacientes", status: pendingPatients > 0 ? `${pendingPatients} pendência${pendingPatients > 1 ? "s" : ""}` : "OK", good: pendingPatients === 0, icon: Users },
        { label: "Segurança", status: "Controles ativos", good: true, icon: ShieldCheck },
    ];

    return (
        <MobilePanel className="p-6" delay={0.3}>
            <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-start justify-between gap-4 text-left">
                <SectionTitle eyebrow="Saúde operacional" title="Status da clínica" description="Integrações e pontos de atenção." />
                <ChevronDown className={cn("mt-1 h-5 w-5 text-zinc-300 transition-transform dark:text-white/24", open && "rotate-180")} />
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                        <div className="mt-6 grid gap-3">
                            {items.map((item) => (
                                <div key={item.label} className="flex items-center gap-4 rounded-[24px] border border-zinc-200/70 bg-zinc-50/70 p-4 dark:border-white/10 dark:bg-white/[0.035]">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"><item.icon className="h-4 w-4" /></div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-sm font-black uppercase tracking-[0.12em] text-zinc-950 dark:text-white">{item.label}</h3>
                                        <p className="mt-1 text-xs font-semibold text-zinc-500 dark:text-white/42">{item.status}</p>
                                    </div>
                                    {item.good ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <AlertCircle className="h-4 w-4 text-amber-500" />}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </MobilePanel>
    );
};

export const MobileDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const today = new Date();
    const [messagesOpen, setMessagesOpen] = useState(false);
    const { setShellState, setActiveTab, toggleVoiceMode } = useSynapse();

    const { data: allAppointments, isLoading: loadingApts } = useAppointmentsByDateRange(startOfDay(today), endOfDay(addDays(today, 7)));
    const { data: pendingPatientsRaw } = usePendingPatientsCount();
    const { isConnected: financialConnected, status: financialStatus } = useFinancialAccount();

    const activeAppointments = useMemo(() => {
        if (!allAppointments) return [];
        return allAppointments
            .filter((apt: MobileAppointment) => !isCancelledAppointmentStatus(apt.status, apt.notes))
            .sort((a: MobileAppointment, b: MobileAppointment) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    }, [allAppointments]);

    const todayAppointments = useMemo(() => activeAppointments.filter((apt: MobileAppointment) => isSameDay(new Date(apt.start_time), today)), [activeAppointments, today]);

    const nextAppointment = useMemo(() => {
        const now = new Date();
        return activeAppointments.find((apt: MobileAppointment) => isAfter(new Date(apt.end_time), now));
    }, [activeAppointments]);

    const remainingCount = todayAppointments.filter((apt: MobileAppointment) => isAfter(new Date(apt.end_time), new Date())).length;
    const pendingPatients = Number(pendingPatientsRaw || 0);

    const openSynapseText = () => {
        setShellState("compact");
        setActiveTab("chat");
    };

    const openSynapseVoice = () => {
        setShellState("compact");
        setActiveTab("voice");
        toggleVoiceMode();
    };

    const workQueue = useMemo<QueueItem[]>(() => {
        const items: QueueItem[] = [];

        if (nextAppointment) {
            items.push({
                priority: "Agora",
                title: "Preparar próxima sessão",
                description: `${getAppointmentDisplayTitle(nextAppointment) || nextAppointment.patient_name || "Paciente"} às ${formatAppointmentTime(nextAppointment)}.`,
                icon: Clock,
                actionLabel: "Abrir compromisso",
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
                description: "Conecte a conta financeira para acompanhar cobranças e recebíveis.",
                icon: WalletCards,
                actionLabel: "Abrir financeiro",
                tone: "warning",
                onClick: () => navigate("/financeiro"),
            });
        }

        if (todayAppointments.length === 0) {
            items.push({
                priority: "Planejar",
                title: "Organizar o consultório",
                description: "Sem atendimentos hoje. Use o Synapse para revisar prontuários e cobranças.",
                icon: Sparkles,
                actionLabel: "Falar com Synapse",
                onClick: openSynapseText,
            });
        }

        items.push({
            priority: "Rotina",
            title: "Revisar a semana clínica",
            description: `${activeAppointments.length} compromisso${activeAppointments.length !== 1 ? "s" : ""} ativo${activeAppointments.length !== 1 ? "s" : ""} nos próximos 7 dias.`,
            icon: Calendar,
            actionLabel: "Ver agenda",
            onClick: () => navigate("/agenda"),
        });

        return items.slice(0, 4);
    }, [activeAppointments.length, financialConnected, navigate, nextAppointment, pendingPatients, todayAppointments.length]);

    return (
        <MobileLayout className="px-0 h-full overflow-hidden bg-[#f4f4f5] dark:bg-[#050506]">
            <div className="h-full overflow-y-auto overflow-x-hidden touch-pan-y px-5 pb-44 pt-4">
                <div className="pointer-events-none fixed inset-0 z-0">
                    <div className="absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-zinc-950/[0.045] blur-[120px] dark:bg-white/[0.055]" />
                    <div className="premium-noise absolute inset-0 opacity-[0.014] dark:opacity-[0.02]" />
                </div>

                <div className="relative z-10 space-y-5">
                    <DashboardHero
                        firstName={getFirstName(user)}
                        todayAppointments={todayAppointments}
                        pendingPatients={pendingPatients}
                        nextAppointment={nextAppointment}
                        openSynapseText={openSynapseText}
                        openSynapseVoice={openSynapseVoice}
                    />

                    <AttentionRadar
                        remainingCount={remainingCount}
                        weeklyCount={activeAppointments.length}
                        pendingPatients={pendingPatients}
                        nextAppointment={nextAppointment}
                        financialConnected={financialConnected}
                    />

                    <NextSession appointment={nextAppointment} isLoading={loadingApts} />
                    <AgendaLive appointments={todayAppointments} isLoading={loadingApts} nextAppointment={nextAppointment} />
                    <SynapseBriefing todayCount={todayAppointments.length} pendingPatients={pendingPatients} financialConnected={financialConnected} openSynapseText={openSynapseText} openSynapseVoice={openSynapseVoice} />
                    <PulsePanels todayCount={todayAppointments.length} weeklyCount={activeAppointments.length} pendingPatients={pendingPatients} financialConnected={financialConnected} financialStatus={financialStatus} />
                    <WorkQueue items={workQueue} />
                    <QuickActions onMessagesOpen={() => setMessagesOpen(true)} />
                    <OperationalHealth financialConnected={financialConnected} pendingPatients={pendingPatients} />
                </div>
            </div>

            <Drawer open={messagesOpen} onOpenChange={setMessagesOpen}>
                <DrawerContent className="rounded-t-[40px] border-t border-zinc-200/70 bg-[#f7f7f8] p-0 outline-none dark:border-white/10 dark:bg-[#070708]">
                    <div className="p-7 pb-12">
                        <div className="mx-auto mb-9 h-1 w-12 rounded-full bg-zinc-300 dark:bg-white/10" />
                        <DrawerHeader className="mb-8 p-0 text-left">
                            <DrawerTitle className="text-3xl font-black tracking-[-0.06em] text-zinc-950 dark:text-white">Comandos rápidos</DrawerTitle>
                            <DrawerDescription className="mt-2 text-sm font-medium leading-relaxed text-zinc-500 dark:text-white/42">
                                Automações simples para comunicação com pacientes.
                            </DrawerDescription>
                        </DrawerHeader>

                        <div className="space-y-3">
                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    toast.success("Enviado com sucesso.");
                                    setMessagesOpen(false);
                                }}
                                className="flex h-20 w-full items-center justify-between rounded-[24px] border border-zinc-200/70 bg-white/70 px-5 transition-all active:bg-white dark:border-white/10 dark:bg-white/[0.035]"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
                                        <Mail size={20} />
                                    </div>
                                    <div className="text-left">
                                        <span className="block text-lg font-black tracking-[-0.035em] text-zinc-950 dark:text-white">E-mail em massa</span>
                                        <span className="text-[8px] font-black uppercase tracking-[0.18em] text-zinc-400 dark:text-white/32">Protocolo geral</span>
                                    </div>
                                </div>
                                <ChevronRight size={18} className="text-zinc-300 dark:text-white/24" />
                            </motion.button>

                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    window.open("https://wa.me/?text=Olá!", "_blank");
                                    setMessagesOpen(false);
                                }}
                                className="flex h-20 w-full items-center justify-between rounded-[24px] border border-zinc-200/70 bg-white/70 px-5 transition-all active:bg-white dark:border-white/10 dark:bg-white/[0.035]"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
                                        <MessageSquare size={20} />
                                    </div>
                                    <div className="text-left">
                                        <span className="block text-lg font-black tracking-[-0.035em] text-zinc-950 dark:text-white">WhatsApp direto</span>
                                        <span className="text-[8px] font-black uppercase tracking-[0.18em] text-zinc-400 dark:text-white/32">Confirmação rápida</span>
                                    </div>
                                </div>
                                <ChevronRight size={18} className="text-zinc-300 dark:text-white/24" />
                            </motion.button>
                        </div>
                    </div>
                </DrawerContent>
            </Drawer>
        </MobileLayout>
    );
};
