"use client";

import { addDays, endOfDay, format, isAfter, isSameDay, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Calendar as CalendarIcon, Clock, MapPin, User, Video, MessageSquare, Mic, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

// Components
import { DashboardHeaderWidget } from "@/components/dashboard/DashboardHeaderWidget";
import { MiniDailyAgenda } from "@/components/dashboard/MiniDailyAgenda";
import { MorningBriefing } from "@/components/dashboard/MorningBriefing";
import { NextAppointmentCard } from "@/components/dashboard/NextAppointmentCard";
import { DashboardKpiCards } from "@/components/dashboard/DashboardKpiCards";

import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard";

// Hooks
import { useAppointmentsByDateRange } from "@/hooks/use-appointments-by-date-range";
import { useGoogleCalendarSync } from "@/hooks/use-google-calendar-sync";
import { usePendingPatientsCount } from "@/hooks/use-pending-patients-count";
import { useSynapse } from "@/context/SynapseProvider";
import { cn } from "@/lib/utils";
import { getAppointmentStatusMeta, isCancelledAppointmentStatus } from "@/lib/appointment-status";
import { getAppointmentDisplayTitle } from "@/lib/appointment-utils";

const PremiumTimelineItem = ({ appointment, index }: { appointment: any, index: number }) => {
    const navigate = useNavigate();
    const isOnline = appointment.type === 'teleconsulta' || !!appointment.google_meet_link;
    const startTime = new Date(appointment.start_time);
    const isToday = isSameDay(startTime, new Date());
    const statusMeta = getAppointmentStatusMeta(appointment.status, appointment.notes);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98, y: -20 }}
            transition={{ 
                duration: 0.6, 
                delay: index * 0.08, // Stagger effect
                ease: [0.23, 1, 0.32, 1] as any 
            }}
            className="group relative flex gap-8 pb-10 last:pb-0"
        >
            {/* Timeline Line & Dot */}
            <div className="flex flex-col items-center">
                <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 z-10",
                    isToday
                        ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xl ring-1 ring-zinc-200 dark:ring-white/10"
                        : "bg-white dark:bg-white/[0.03] text-zinc-400 border border-zinc-100 dark:border-white/5"
                )}>
                    <Clock className="h-4 w-4" />
                </div>
                <div className="w-px flex-1 bg-zinc-200 dark:bg-white/5 my-4" />
            </div>

            {/* Content Card */}
            <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between p-7 rounded-[28px] bg-white/60 dark:bg-white/[0.01] border border-zinc-100 dark:border-white/[0.03] hover:bg-white dark:hover:bg-white/[0.04] hover:border-zinc-300 dark:hover:border-white/10 transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] dark:hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] group-hover:translate-x-1">
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <span className="text-lg font-bold text-black dark:text-white tracking-tighter tabular-nums leading-none">
                            {format(startTime, "HH:mm")}
                        </span>
                        <div className="h-3 w-px bg-zinc-200 dark:bg-white/10" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400">
                            {isToday ? "Hoje" : format(startTime, "EEEE, dd 'de' MMM", { locale: ptBR })}
                        </span>
                    </div>

                    <div className="flex items-center gap-5">
                        <div className="w-11 h-11 rounded-xl bg-zinc-100 dark:bg-white/[0.03] flex items-center justify-center border border-zinc-200 dark:border-white/5 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                            <User className="h-4 w-4" />
                        </div>
                        <div className="space-y-0.5">
                            <h4 className="text-base font-bold text-black dark:text-white tracking-tight">
                                {getAppointmentDisplayTitle(appointment) || "Paciente Particular"}
                            </h4>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                                    {isOnline ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                                    {isOnline ? "Online via Meet" : (appointment.location || "Consultório")}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 md:mt-0 flex items-center gap-4">
                    <div className={cn(
                        "px-5 py-2 rounded-full text-[9px] font-bold uppercase tracking-wider border shadow-sm transition-all duration-300",
                        statusMeta.bgClass,
                        statusMeta.borderClass,
                        statusMeta.textClass
                    )}>
                        {statusMeta.label}
                    </div>

                    <Button
                        onClick={() => navigate("/agenda", { state: { openAppointmentId: appointment.id } })}
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-full bg-zinc-50 dark:bg-white/5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all hover:scale-105"
                    >
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </motion.div>
    );
};


const DesktopDashboard = () => {
    const today = new Date();
    const { setShellState, setActiveTab, toggleVoiceMode } = useSynapse();

    useGoogleCalendarSync();

    const { data: allUpcomingAppointments, isLoading: loadingApts } = useAppointmentsByDateRange(startOfDay(today), endOfDay(addDays(today, 7)));
    const { data: pendingPatients } = usePendingPatientsCount();
    const [isTimelineExpanded, setIsTimelineExpanded] = useState(false);

    const todayAppointments = useMemo(() => {
        if (!allUpcomingAppointments) return [];
        return allUpcomingAppointments
            .filter((apt: any) => isSameDay(new Date(apt.start_time), today))
            .sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    }, [allUpcomingAppointments, today]);

    const nextAppointment = useMemo(() => {
        if (!allUpcomingAppointments) return undefined;
        const now = new Date();
        return allUpcomingAppointments
            .filter((apt: any) => isAfter(new Date(apt.end_time), now) && !isCancelledAppointmentStatus(apt.status, apt.notes))
            .sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0];
    }, [allUpcomingAppointments]);

    const displayedTimeline = useMemo(() => {
        if (!allUpcomingAppointments) return [];
        // Show only 3 when collapsed, show all when expanded
        const visible = allUpcomingAppointments.filter((apt: any) => !isCancelledAppointmentStatus(apt.status, apt.notes));
        return isTimelineExpanded ? visible : visible.slice(0, 3);
    }, [allUpcomingAppointments, isTimelineExpanded]);

    return (
        <>
        <div className="w-full min-h-screen pb-40 relative font-sans bg-transparent selection:bg-black/10 dark:selection:bg-white/10 selection:text-black dark:selection:text-white">
            <div className="liquid-mesh-bg" />

            {/* Spacer for top area */}
            <div className="h-12" />

            {/* ─── Main Grid Layout ─── */}
            <div className="max-w-[1920px] mx-auto px-6 md:px-10 lg:px-14 xl:px-20 relative z-10 space-y-12">

                {/* ROW 0: Synapse Global Pill Intro */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                    <div className="group relative overflow-hidden rounded-[32px] border border-black/5 dark:border-white/5 p-10 flex flex-col md:flex-row items-center justify-between gap-10 shadow-[0_4px_20px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_20px_rgba(255,255,255,0.01)] transition-all duration-500 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)]">

                        <div className="absolute inset-0 pointer-events-none z-0">
                            <div className="absolute inset-0 bg-white dark:bg-[#080809] transition-colors duration-500" />
                            {/* Subtle Depth Gradients */}
                            <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-zinc-50/50 dark:from-white/[0.02] to-transparent" />
                        </div>

                        <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-8 relative z-10">
                            <div className="w-14 h-14 shrink-0 flex items-center justify-center rounded-2xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-900 shadow-xl">
                                <Sparkles className="w-6 h-6" strokeWidth={2} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl md:text-2xl font-bold text-black dark:text-white tracking-tight flex items-center justify-center md:justify-start gap-3">
                                    Converse com sua clínica
                                    <span className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 text-[9px] uppercase tracking-widest font-bold">Inteligência</span>
                                </h3>
                                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 max-w-xl leading-relaxed tracking-tight">
                                    Ações rápidas e insights automáticos através de voz ou texto. Synapse entende o contexto atual do seu dashboard.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-3 relative z-10 w-full md:w-auto shrink-0">
                            <Button
                                onClick={() => { setShellState('compact'); setActiveTab('chat'); }}
                                variant="outline"
                                className="w-full sm:w-auto h-12 px-6 bg-white dark:bg-transparent text-zinc-900 dark:text-white border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/5 transition-all rounded-xl font-bold"
                            >
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Por Texto
                            </Button>

                            <Button
                                onClick={() => { setShellState('compact'); setActiveTab('voice'); toggleVoiceMode(); }}
                                className="w-full sm:w-auto h-12 px-6 bg-zinc-900 hover:bg-black text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 transition-all rounded-xl font-bold shadow-lg"
                            >
                                <Mic className="w-4 h-4 mr-2" />
                                Por Voz
                                <ArrowRight className="w-4 h-4 ml-2 opacity-50" />
                            </Button>
                        </div>
                    </div>
                </motion.div>


                {/* ROW 0.5: KPI Mini-Cards */}
                <DashboardKpiCards />

                {/* ROW 1: Briefing & Next Appointment */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <GlassCard className="h-full min-h-[380px] shadow-sm border-zinc-100 dark:border-white/[0.04]" innerClassName="p-0" delay={80}>
                            <MorningBriefing
                                appointments={todayAppointments || []}
                                pendingPatients={pendingPatients || 0}
                            />
                        </GlassCard>
                    </div>
                    <div className="lg:col-span-1">
                        <NextAppointmentCard
                            className="h-full min-h-[380px] border-zinc-100 dark:border-white/[0.04]"
                            appointment={nextAppointment}
                            isLoading={loadingApts}
                        />
                    </div>
                </div>

                {/* ROW 3: Header Widgets & Mini Agenda */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <DashboardHeaderWidget />
                    </div>
                    <div className="lg:col-span-1">
                        <GlassCard className="h-full min-h-[340px] border-zinc-100 dark:border-white/[0.04]" innerClassName="p-0" delay={160}>
                            <MiniDailyAgenda />
                        </GlassCard>
                    </div>
                </div>

                {/* ROW 4: Premium Timeline */}
                <GlassCard className="w-full min-h-[600px] border-zinc-100 dark:border-white/[0.04]" innerClassName="p-12 md:p-14 h-full flex flex-col" delay={240}>
                    <div className="flex items-center justify-between mb-12">
                        <div className="space-y-1.5">
                            <h3 className="text-xl font-bold text-black dark:text-white uppercase tracking-tight">Agenda Cronológica</h3>
                            <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-[0.3em]">Fluxo de Atendimentos {allUpcomingAppointments && `(${allUpcomingAppointments.length})`}</p>
                        </div>
                        {allUpcomingAppointments && allUpcomingAppointments.length > 3 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsTimelineExpanded(!isTimelineExpanded)}
                                className="h-12 px-6 text-[10px] uppercase font-bold tracking-[0.2em] border-zinc-200 dark:border-white/10 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/5 transition-all"
                            >
                                {isTimelineExpanded ? "Recolher Histórico" : "Ver Tudo"}
                            </Button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar -mr-6 pr-6">
                        <AnimatePresence mode="popLayout" initial={false}>
                            {loadingApts ? (
                                <motion.div key="loading" exit={{ opacity: 0 }} className="space-y-6">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-28 bg-zinc-50 dark:bg-white/[0.01] rounded-[24px] animate-pulse" />
                                    ))}
                                </motion.div>
                            ) : displayedTimeline?.length === 0 ? (
                                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center flex flex-col items-center gap-6 opacity-40">
                                    <CalendarIcon className="h-10 w-10 text-zinc-400" />
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Nenhum compromisso futuro</p>
                                </motion.div>
                            ) : (
                                <motion.div layout className="space-y-1">
                                    {displayedTimeline?.map((apt: any, idx: number) => (
                                        <PremiumTimelineItem 
                                            key={apt.id} 
                                            appointment={apt} 
                                            index={idx} 
                                        />
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </GlassCard>

            </div>
        </div>
        </>
    );
};

export default DesktopDashboard;
