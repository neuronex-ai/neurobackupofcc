"use client";

import { useState, useMemo, useEffect } from "react";
import { MobileLayout } from "../components/MobileLayout";
import {
    Video,
    Play,
    CalendarClock,
    Clock,
    Sparkles,
    BrainCircuit,
    Send,
    ChevronRight,
    Search,
    X
} from "lucide-react";
import { useAppointments } from "@/hooks/use-appointments";
import { Appointment } from "@/types";
import { isCancelledAppointmentStatus } from "@/lib/appointment-status";
import { format, isAfter, isBefore, startOfDay, endOfDay, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { MobileActiveSession } from "../components/MobileActiveSession";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/SessionContextProvider";
import { motion, AnimatePresence } from "framer-motion";
import { SessionReminderDrawer } from "../components/SessionReminderDrawer";
import { Input } from "@/components/ui/input";

type LatestSessionNote = {
    patients?: {
        id: string;
        name?: string | null;
    } | null;
    ai_summary?: {
        sentiment?: string | null;
        summary?: string | null;
    } | null;
};

export const MobileTeleconsulta = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    // States
    const [activeSession, setActiveSession] = useState<Appointment | null>(null);
    const [viewMode, setViewMode] = useState<'upcoming' | 'history'>('upcoming');
    const [reminderAppointment, setReminderAppointment] = useState<Appointment | null>(null);
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Fetch latest session note for the Recap section
    const { data: latestNotes } = useQuery<LatestSessionNote[]>({
        queryKey: ['latestSessionNotes', user?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('session_notes')
                .select('*, patients(id, name)')
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false })
                .limit(1);
            if (error) throw error;
            return data;
        },
        enabled: !!user?.id
    });

    const lastSession = latestNotes?.[0];

    // Fetch appointments - Ampliado para pegar histórico e futuro
    const today = new Date();
    const { data: appointments, isLoading } = useAppointments({
        startDate: startOfDay(new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)), // Últimos 30 dias
        endDate: endOfDay(new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000))    // Próximos 30 dias
    });

    // Filtering Logic
    const filteredAppointments = useMemo(() => {
        if (!appointments) return [];
        let filtered = appointments.filter(apt => !isCancelledAppointmentStatus(apt.status, apt.notes) && apt.type !== 'block');

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(apt =>
                apt.patient_name?.toLowerCase().includes(query) ||
                apt.notes?.toLowerCase().includes(query)
            );
        }
        return filtered;
    }, [appointments, searchQuery]);

    const upcomingAppointments = useMemo(() => {
        const now = new Date();
        return filteredAppointments
            ?.filter(apt => {
                const endTime = new Date(apt.end_time);
                return isAfter(endTime, now) || isSameDay(endTime, now);
            })
            .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()) || [];
    }, [filteredAppointments]);

    const historyAppointments = useMemo(() => {
        const now = new Date();
        return filteredAppointments
            ?.filter(apt => isBefore(new Date(apt.end_time), now))
            .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()) || [];
    }, [filteredAppointments]);

    const nextAppointment = useMemo(() => {
        return upcomingAppointments[0];
    }, [upcomingAppointments]);

    useEffect(() => {
        if (location.state?.activeAppointmentId && appointments && !activeSession) {
            const sessionToActivate = appointments.find(a => a.id === location.state.activeAppointmentId);
            if (sessionToActivate) {
                setActiveSession(sessionToActivate);
                window.history.replaceState({}, document.title, location.pathname);
            }
        }
    }, [location.pathname, location.state, appointments, activeSession]);

    const handleStartSession = (appointment: Appointment) => {
        navigate('/teleconsulta', { state: { activeAppointmentId: appointment.id } });
        toast.info(`Conectando à sala de ${appointment.patient_name}...`);
    };

    if (activeSession) {
        return (
            <MobileActiveSession
                activeAppointment={activeSession}
                onSessionEnd={() => setActiveSession(null)}
            />
        );
    }

    return (
        <MobileLayout className="px-0 min-h-screen bg-background">
            <div className="px-6 pb-32 pt-6">
                {/* --- Header: MacOS Floating Bar --- */}
                <div className="mb-6 relative z-40 w-full animate-fade-in">
                    <div className="w-full h-[60px] flex items-center justify-between p-2 pl-4 pr-2 bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-300">
                        {!isSearchVisible ? (
                            <>
                                <div className="flex flex-col justify-center h-full -space-y-0.5">
                                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">Salas Virtuais</span>
                                    <h1 className="text-base font-bold text-zinc-100 tracking-tight leading-none">Teleconsulta</h1>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setIsSearchVisible(true)}
                                        className="w-9 h-9 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-all active:scale-95"
                                    >
                                        <Search className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => navigate('/agenda')}
                                        className="w-9 h-9 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                                    >
                                        <CalendarClock className="w-4 h-4" />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex-1 flex items-center gap-2 w-full"
                            >
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                    <Input
                                        autoFocus
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Buscar sala..."
                                        className="h-9 pl-9 bg-white/5 border-transparent rounded-full text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-0 text-sm"
                                    />
                                </div>
                                <button
                                    onClick={() => {
                                        setIsSearchVisible(false);
                                        setSearchQuery("");
                                    }}
                                    className="w-9 h-9 rounded-full text-zinc-400 hover:text-white flex items-center justify-center"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </motion.div>
                        )}
                    </div>
                </div>

                <div className="space-y-10">
                    {/* Next Session Highlight Block */}
                    {nextAppointment && !searchQuery && (
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="relative"
                        >
                            <div className="flex items-center justify-between mb-5 px-1">
                                <h3 className="text-[10px] font-black text-foreground/20 uppercase tracking-[0.2em]">Próxima Consulta</h3>
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400">Destaque</span>
                                </div>
                            </div>

                            <div className="relative p-6 rounded-[32px] bg-foreground text-background shadow-2xl overflow-hidden group active:scale-[0.98] transition-transform" onClick={() => handleStartSession(nextAppointment)}>
                                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-[60px] -mr-20 -mt-20" />

                                <div className="relative z-10 flex items-center justify-between">
                                    <div className="min-w-0 flex-1 space-y-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-background/50">
                                                {isSameDay(new Date(nextAppointment.start_time), new Date()) ? 'Hoje' : format(new Date(nextAppointment.start_time), "dd 'de' MMM", { locale: ptBR })} às {format(new Date(nextAppointment.start_time), 'HH:mm')}
                                            </p>
                                            <h2 className="text-2xl font-black tracking-tight truncate pr-4">{nextAppointment.patient_name}</h2>
                                        </div>
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="flex min-w-0 max-w-full items-center gap-2 rounded-xl border border-background/20 bg-background/10 px-3 py-1.5 backdrop-blur-md">
                                                <Video className="h-3.5 w-3.5 shrink-0" />
                                                <span className="truncate text-[10px] font-bold uppercase tracking-[0.14em]">Acessar Teleconsulta</span>
                                            </div>
                                        </div>
                                    </div>

                                    <motion.div
                                        whileTap={{ scale: 0.9 }}
                                        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[24px] bg-background text-foreground shadow-xl"
                                    >
                                        <Play className="w-6 h-6 fill-current ml-1" />
                                    </motion.div>
                                </div>
                            </div>
                        </motion.section>
                    )}

                    {/* AI Recap Section */}
                    {!searchQuery && (
                        <motion.section initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}>
                            <div className="flex items-center gap-2 mb-5 px-1">
                                <Sparkles className="w-3.5 h-3.5 text-foreground/40" />
                                <h3 className="text-[10px] font-black text-foreground/20 uppercase tracking-[0.2em]">Recapitulação IA</h3>
                            </div>

                            <div className="group relative">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-foreground/10 to-transparent rounded-[32px] blur-xl opacity-30 group-hover:opacity-50 transition-all duration-700" />
                                <div className="relative bg-card border border-border/20 rounded-[28px] overflow-hidden shadow-2xl">
                                    <div className="p-6 relative z-10">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="min-w-0 flex-1 pr-4">
                                                <h2 className="text-xl font-bold text-foreground leading-tight mb-1">Última Sessão</h2>
                                                <p className="text-sm text-muted-foreground truncate">{lastSession?.patients?.name || 'Inicie uma sessão para gerar insights'}</p>
                                            </div>
                                            <div className="w-10 h-10 rounded-xl bg-foreground/[0.04] border border-border/10 flex items-center justify-center shrink-0">
                                                <BrainCircuit className="w-5 h-5 text-muted-foreground" />
                                            </div>
                                        </div>

                                        <div className="bg-foreground/[0.02] border border-border/10 rounded-[20px] p-5 mb-5 backdrop-blur-sm">
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">Análise</span>
                                                <span className="text-[9px] font-bold uppercase tracking-widest text-foreground/70 px-2 py-0.5 bg-foreground/[0.04] rounded-md border border-border/10">
                                                    {lastSession?.ai_summary?.sentiment || 'Padrão'}
                                                </span>
                                            </div>
                                            <p className="text-[13px] font-medium text-muted-foreground leading-relaxed line-clamp-3">
                                                {lastSession?.ai_summary?.summary || "O resumo inteligente aparecerá aqui após a finalização da nota da sessão do paciente."}
                                            </p>
                                        </div>

                                        <Button
                                            disabled={!lastSession?.patients?.id}
                                            onClick={() => lastSession?.patients?.id && navigate(`/pacientes/${lastSession.patients.id}`)}
                                            className="w-full h-12 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-bold text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                                        >
                                            Ver Detalhes do Prontuário
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </motion.section>
                    )}

                    {/* Tabs / History Section */}
                    <div className="px-1 space-y-6">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h3 className="text-[10px] font-black text-foreground/20 uppercase tracking-[0.2em]">Gestão de Sessões</h3>
                            <div className="flex shrink-0 p-1 rounded-xl bg-foreground/[0.04] border border-border/10 backdrop-blur-md">
                                <button
                                    onClick={() => setViewMode('upcoming')}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-[0.14em] transition-all",
                                        viewMode === 'upcoming' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                                    )}
                                >
                                    Próximas
                                </button>
                                <button
                                    onClick={() => setViewMode('history')}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-[0.14em] transition-all",
                                        viewMode === 'history' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                                    )}
                                >
                                    Histórico
                                </button>
                            </div>
                        </div>

                        {/* Sessions List */}
                        <div className="space-y-4">
                            {isLoading ? (
                                [...Array(3)].map((_, i) => (
                                    <div key={i} className="h-24 rounded-[28px] bg-foreground/[0.02] border border-border/10 animate-pulse" />
                                ))
                            ) : (
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={viewMode}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-3"
                                    >
                                        {(viewMode === 'upcoming' ? upcomingAppointments : historyAppointments).map((apt) => (
                                            <div
                                                key={apt.id}
                                                className="group relative"
                                            >
                                                <div className="flex items-center gap-3 rounded-[28px] border border-border/30 bg-card p-4 shadow-sm transition-all active:scale-[0.98]" onClick={() => handleStartSession(apt)}>
                                                    <div className="flex flex-col items-center justify-center min-w-[55px] space-y-1">
                                                        <span className="text-[16px] font-black text-foreground">{format(new Date(apt.start_time), 'HH:mm')}</span>
                                                        <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">{format(new Date(apt.start_time), 'dd MMM', { locale: ptBR })}</span>
                                                    </div>

                                                    <div className="h-10 w-px shrink-0 bg-border/20" />

                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-[14px] font-bold text-foreground truncate">{apt.patient_name}</h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <div className={cn(
                                                                "w-1.5 h-1.5 rounded-full",
                                                                apt.type === 'online' ? "bg-indigo-400" : "bg-orange-400"
                                                            )} />
                                                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                                                                {apt.type === 'online' ? 'Online' : 'Presencial'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex shrink-0 items-center gap-1.5">
                                                        {viewMode === 'upcoming' && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setReminderAppointment(apt); }}
                                                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[18px] bg-emerald-500/5 text-emerald-600 shadow-inner transition-all hover:bg-emerald-500/10"
                                                            >
                                                                <Send className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <button
                                                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[18px] border border-border/10 bg-foreground/[0.03] transition-all group-active:bg-foreground group-active:text-background"
                                                        >
                                                            {viewMode === 'upcoming' ? <Play className="w-3.5 h-3.5 fill-current ml-0.5" /> : <ChevronRight className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {(viewMode === 'upcoming' ? upcomingAppointments : historyAppointments).length === 0 && (
                                            <div className="py-16 text-center bg-foreground/[0.01] rounded-[32px] border border-dashed border-border/30">
                                                <Clock className="w-10 h-10 text-muted-foreground/20 mx-auto mb-4" />
                                                <p className="text-[10px] font-black text-foreground/20 uppercase tracking-[0.2em]">Nenhum agendamento encontrado</p>
                                            </div>
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Reminder Drawer */}
            <SessionReminderDrawer
                isOpen={!!reminderAppointment}
                onOpenChange={(open) => !open && setReminderAppointment(null)}
                appointment={reminderAppointment}
            />
        </MobileLayout>
    );
};
