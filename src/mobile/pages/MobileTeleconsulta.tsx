"use client";

import { useAuth } from "@/components/auth/SessionContextProvider";
import { Button } from "@/components/ui/button";
import { useAppointments } from "@/hooks/use-appointments";
import { supabase } from "@/integrations/supabase/client";
import { isCancelledAppointmentStatus } from "@/lib/appointment-status";
import { cn } from "@/lib/utils";
import { Appointment } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { endOfDay, format, isAfter, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    BrainCircuit,
    CalendarClock,
    ChevronRight,
    Clock,
    Play,
    Search,
    Send,
    Video,
    X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { MobileActiveSession } from "../components/MobileActiveSession";
import {
    MobileEmptyState,
    MobilePageHeader,
    MobilePageScaffold,
    MobileSectionHeader,
    MobileSegmentedControl,
    MobileSkeletonCard,
} from "../components/MobilePagePrimitives";
import { SessionReminderDrawer } from "../components/SessionReminderDrawer";

type ViewMode = "upcoming" | "history";

export const MobileTeleconsulta = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [activeSession, setActiveSession] = useState<Appointment | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>("upcoming");
    const [reminderAppointment, setReminderAppointment] = useState<Appointment | null>(null);
    const [searchVisible, setSearchVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const { data: latestNotes } = useQuery<any[]>({
        queryKey: ["latestSessionNotes", user?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("session_notes")
                .select("*, patients(id, name)")
                .eq("user_id", user?.id)
                .order("created_at", { ascending: false })
                .limit(1);
            if (error) throw error;
            return data;
        },
        enabled: Boolean(user?.id),
    });

    const now = useMemo(() => new Date(), []);
    const { data: appointments, isLoading } = useAppointments({
        startDate: startOfDay(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)),
        endDate: endOfDay(new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)),
    });

    const filteredAppointments = useMemo(() => {
        const normalizedSearch = searchQuery.trim().toLowerCase();
        return (appointments || []).filter((appointment) => {
            if (isCancelledAppointmentStatus(appointment.status, appointment.notes) || appointment.type === "block") return false;
            if (!normalizedSearch) return true;
            return `${appointment.patient_name || ""} ${appointment.notes || ""}`.toLowerCase().includes(normalizedSearch);
        });
    }, [appointments, searchQuery]);

    const upcomingAppointments = useMemo(
        () => filteredAppointments
            .filter((appointment) => isAfter(new Date(appointment.end_time), new Date()))
            .sort((left, right) => new Date(left.start_time).getTime() - new Date(right.start_time).getTime()),
        [filteredAppointments],
    );

    const historyAppointments = useMemo(
        () => filteredAppointments
            .filter((appointment) => isBefore(new Date(appointment.end_time), new Date()))
            .sort((left, right) => new Date(right.start_time).getTime() - new Date(left.start_time).getTime()),
        [filteredAppointments],
    );

    const nextAppointment = upcomingAppointments[0];
    const lastSession = latestNotes?.[0];

    useEffect(() => {
        const appointmentId = location.state?.activeAppointmentId;
        if (!appointmentId || !appointments || activeSession) return;
        const sessionToActivate = appointments.find((appointment) => appointment.id === appointmentId);
        if (sessionToActivate && isAfter(new Date(sessionToActivate.end_time), new Date())) {
            setActiveSession(sessionToActivate);
            window.history.replaceState({}, document.title, location.pathname);
        }
    }, [activeSession, appointments, location.pathname, location.state]);

    const startSession = (appointment: Appointment) => {
        if (isBefore(new Date(appointment.end_time), new Date())) {
            toast.info("Esta sessão já foi encerrada.");
            if (appointment.patient_id) navigate(`/pacientes/${appointment.patient_id}`);
            return;
        }
        setActiveSession(appointment);
    };

    const openHistory = (appointment: Appointment) => {
        if (appointment.patient_id) {
            navigate(`/pacientes/${appointment.patient_id}`);
            return;
        }
        toast.info("Não há prontuário vinculado a esta sessão.");
    };

    if (activeSession) {
        return (
            <MobileActiveSession
                activeAppointment={activeSession}
                onSessionEnd={() => setActiveSession(null)}
            />
        );
    }

    const visibleAppointments = viewMode === "upcoming" ? upcomingAppointments : historyAppointments;

    return (
        <MobilePageScaffold>
            <MobilePageHeader
                eyebrow="Salas virtuais"
                title="Teleconsulta"
                description="Entre em sessões futuras e consulte o histórico sem reabrir atendimentos encerrados."
                actions={(
                    <div className="flex gap-1.5">
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => {
                                setSearchVisible((current) => !current);
                                if (searchVisible) setSearchQuery("");
                            }}
                            className="h-10 w-10 rounded-[14px]"
                        >
                            {searchVisible ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
                            <span className="sr-only">{searchVisible ? "Fechar busca" : "Buscar sessões"}</span>
                        </Button>
                        <Button type="button" size="icon" onClick={() => navigate("/agenda")} className="h-10 w-10 rounded-[14px]">
                            <CalendarClock className="h-4 w-4" />
                            <span className="sr-only">Abrir agenda</span>
                        </Button>
                    </div>
                )}
            />

            <div className="space-y-4 pb-2">
                {searchVisible ? (
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/45" />
                        <input
                            autoFocus
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder="Buscar paciente ou anotação"
                            className="h-11 w-full rounded-[15px] border border-border/45 bg-card/70 pl-10 pr-4 text-sm outline-none focus:border-foreground/25 dark:border-white/10 dark:bg-white/[0.03]"
                        />
                    </div>
                ) : null}

                {nextAppointment && !searchQuery ? (
                    <section className="rounded-[22px] border border-foreground bg-foreground p-4.5 text-background">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-[8px] font-black uppercase tracking-[0.15em] opacity-50">Próxima sessão</p>
                                <p className="mt-2 text-[1.65rem] font-black leading-none tracking-[-0.045em]">
                                    {format(new Date(nextAppointment.start_time), "HH:mm")}
                                </p>
                                <p className="mt-2 truncate text-[13px] font-black">{nextAppointment.patient_name || "Paciente"}</p>
                                <p className="mt-1 text-[9px] font-medium opacity-55">
                                    {format(new Date(nextAppointment.start_time), "EEEE, d 'de' MMMM", { locale: ptBR })}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => startSession(nextAppointment)}
                                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-background text-foreground active:opacity-80"
                                aria-label="Entrar na próxima sessão"
                            >
                                <Play className="ml-0.5 h-5 w-5 fill-current" />
                            </button>
                        </div>
                        <Button onClick={() => startSession(nextAppointment)} className="mt-4 h-11 w-full rounded-[14px] bg-background text-[8px] font-black uppercase tracking-[0.12em] text-foreground hover:bg-background/90">
                            <Video className="mr-2 h-4 w-4" /> Preparar teleconsulta
                        </Button>
                    </section>
                ) : null}

                {!searchQuery && lastSession ? (
                    <section className="rounded-[20px] border border-border/40 bg-card/68 p-4 dark:border-white/10 dark:bg-white/[0.025]">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-foreground/[0.045] text-muted-foreground">
                                <BrainCircuit className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[8px] font-black uppercase tracking-[0.14em] text-muted-foreground/55">Última sessão</p>
                                <p className="mt-1 truncate text-[13px] font-black text-foreground">{lastSession.patients?.name || "Paciente"}</p>
                                <p className="mt-2 line-clamp-3 text-[10px] font-medium leading-relaxed text-muted-foreground/68">
                                    {lastSession.ai_summary?.summary || "O resumo aparecerá depois que a nota da sessão for finalizada."}
                                </p>
                                {lastSession.patients?.id ? (
                                    <button type="button" onClick={() => navigate(`/pacientes/${lastSession.patients.id}`)} className="mt-2.5 inline-flex items-center text-[8px] font-black uppercase tracking-[0.11em] text-foreground">
                                        Abrir prontuário <ChevronRight className="ml-1 h-3.5 w-3.5" />
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    </section>
                ) : null}

                <MobileSegmentedControl
                    value={viewMode}
                    onValueChange={setViewMode}
                    ariaLabel="Lista de sessões"
                    options={[
                        { value: "upcoming", label: "Próximas", icon: Video, badge: upcomingAppointments.length },
                        { value: "history", label: "Histórico", icon: Clock, badge: historyAppointments.length },
                    ]}
                />

                <section className="space-y-3">
                    <MobileSectionHeader
                        eyebrow="Sessões"
                        title={viewMode === "upcoming" ? "Próximos atendimentos" : "Atendimentos encerrados"}
                        description={viewMode === "upcoming" ? "Use o lembrete ou entre na sala quando estiver pronto." : "Sessões passadas abrem o prontuário, não uma nova sala."}
                    />

                    {isLoading ? (
                        <div className="space-y-2">
                            <MobileSkeletonCard lines={1} />
                            <MobileSkeletonCard lines={1} />
                        </div>
                    ) : visibleAppointments.length === 0 ? (
                        <MobileEmptyState
                            icon={Clock}
                            title={searchQuery ? "Nada encontrado" : viewMode === "upcoming" ? "Nenhuma sessão futura" : "Histórico vazio"}
                            description={searchQuery ? "Nenhuma sessão corresponde à busca." : "Os atendimentos aparecerão aqui conforme a agenda for utilizada."}
                            className="min-h-[230px] rounded-[20px] border border-dashed border-border/45"
                        />
                    ) : (
                        <div className="space-y-2">
                            {visibleAppointments.map((appointment) => {
                                const online = appointment.type === "online" || appointment.type === "teleconsulta" || Boolean(appointment.google_meet_link);
                                return (
                                    <div key={appointment.id} className="flex items-center gap-3 rounded-[18px] border border-border/40 bg-card/68 p-3.5 dark:border-white/10 dark:bg-white/[0.025]">
                                        <button
                                            type="button"
                                            onClick={() => viewMode === "upcoming" ? startSession(appointment) : openHistory(appointment)}
                                            className="flex min-w-0 flex-1 items-center gap-3 text-left active:opacity-75"
                                        >
                                            <div className="shrink-0 text-center">
                                                <p className="text-sm font-black text-foreground">{format(new Date(appointment.start_time), "HH:mm")}</p>
                                                <p className="mt-1 text-[7px] font-black uppercase tracking-[0.09em] text-muted-foreground/50">{format(new Date(appointment.start_time), "dd MMM", { locale: ptBR })}</p>
                                            </div>
                                            <div className="min-w-0 flex-1 border-l border-border/40 pl-3 dark:border-white/10">
                                                <p className="truncate text-[13px] font-black text-foreground">{appointment.patient_name || "Paciente"}</p>
                                                <p className="mt-1 inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-[0.09em] text-muted-foreground/55">
                                                    <span className={cn("h-1.5 w-1.5 rounded-full", online ? "bg-indigo-400" : "bg-orange-400")} />
                                                    {online ? "Online" : "Presencial"}
                                                </p>
                                            </div>
                                        </button>

                                        {viewMode === "upcoming" ? (
                                            <button
                                                type="button"
                                                onClick={() => setReminderAppointment(appointment)}
                                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px] bg-emerald-500/[0.08] text-emerald-600 active:opacity-75 dark:text-emerald-400"
                                                aria-label="Enviar lembrete"
                                            >
                                                <Send className="h-4 w-4" />
                                            </button>
                                        ) : null}
                                        <button
                                            type="button"
                                            onClick={() => viewMode === "upcoming" ? startSession(appointment) : openHistory(appointment)}
                                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px] bg-foreground/[0.04] text-muted-foreground active:opacity-75"
                                            aria-label={viewMode === "upcoming" ? "Entrar na sessão" : "Abrir prontuário"}
                                        >
                                            {viewMode === "upcoming" ? <Play className="ml-0.5 h-3.5 w-3.5 fill-current" /> : <ChevronRight className="h-4 w-4" />}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>

            <SessionReminderDrawer
                isOpen={Boolean(reminderAppointment)}
                onOpenChange={(open) => !open && setReminderAppointment(null)}
                appointment={reminderAppointment}
            />
        </MobilePageScaffold>
    );
};
