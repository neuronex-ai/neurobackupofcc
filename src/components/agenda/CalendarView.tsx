"use client";

import { Appointment } from "@/types";
import { format, addDays, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval, setHours, setMinutes, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatTimeBrazil } from "@/lib/timezone";
import { Loader2, Clock, Video, MapPin, ChevronLeft, ChevronRight, Lock, Plus, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppointmentDetailModal } from "./AppointmentDetailModal";
import { AgendaSettingsModal } from "./AgendaSettingsModal";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
    DndContext,
    DragEndEvent,
    useSensor,
    useSensors,
    PointerSensor,
    TouchSensor,
    DragOverlay,
    DragStartEvent,
    defaultDropAnimationSideEffects,
    MeasuringStrategy,
} from "@dnd-kit/core";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAppointments } from "@/hooks/use-appointments";
import { useState, useMemo, useEffect } from "react";
import { NewAppointmentModal } from "./NewAppointmentModal";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { createPortal } from "react-dom";
import { useAuth } from "@/components/auth/SessionContextProvider";
import { useNavigate } from "react-router-dom";
import { useGoogleAuth } from "@/hooks/use-google-auth";
import { getAppointmentStatusMeta, isCancelledAppointmentStatus } from "@/lib/appointment-status";
import { getAppointmentDisplayTitle } from "@/lib/appointment-utils";
import { useUpdateAppointment } from "@/hooks/use-update-appointment";
import {
    SYNAPSE_PAGE_ACTION_EVENT,
    type SynapseInterfaceAction,
} from "@/lib/synapse-interface-actions";

// Generate time labels from 00:00 to 23:00
const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
const HOUR_HEIGHT = 64; // px per hour row

interface CalendarViewProps {
    date: Date;
    onDateChange: (date: Date) => void;
    appointments: Appointment[];
    isLoading: boolean;
    view: 'daily' | 'weekly' | 'monthly';
    onViewChange?: (view: 'daily' | 'weekly' | 'monthly') => void;
    sidebarOpen?: boolean;
    setSidebarOpen?: (open: boolean) => void;
}

interface WorkingHoursConfig {
    [key: string]: { enabled: boolean; start: string; end: string };
}

export const CalendarView = ({ date, onDateChange, appointments, isLoading, view, onViewChange, sidebarOpen, setSidebarOpen }: CalendarViewProps) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { isConnected: isGoogleConnected, isLoading: isLoadingGoogle } = useGoogleAuth();
    const { refetch } = useAppointments();
    const updateAppointment = useUpdateAppointment();
    const [activeId, setActiveId] = useState<string | null>(null);
    const [overId, setOverId] = useState<string | null>(null);
    const [newAppointmentDate, setNewAppointmentDate] = useState<Date | undefined>();
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | undefined>();
    const [isMounted, setIsMounted] = useState(false);
    const [workingHours, setWorkingHours] = useState<WorkingHoursConfig | null>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Load working hours from profile
    useEffect(() => {
        if (user?.id) {
            supabase.from('profiles').select('working_hours').eq('id', user.id).single()
                .then(({ data }) => {
                    if (data?.working_hours) setWorkingHours(data.working_hours as WorkingHoursConfig);
                });
        }
    }, [user]);

    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

    const monthStart = startOfWeek(startOfMonth(date), { weekStartsOn: 1 });
    const monthEnd = endOfWeek(endOfMonth(date), { weekStartsOn: 1 });
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 2,
            }
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 200,
                tolerance: 5
            }
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragOver = (event: any) => {
        setOverId(event.over?.id ?? null);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        setOverId(null);

        if (!over) return;

        const appointmentId = active.id as string;
        const targetDate = new Date(over.id as string);
        const appointment = appointments.find(a => a.id === appointmentId);

        if (!appointment) return;

        const oldStart = new Date(appointment.start_time);
        const duration = new Date(appointment.end_time).getTime() - oldStart.getTime();

        const newStart = new Date(targetDate);
        newStart.setMinutes(oldStart.getMinutes());
        const newEnd = new Date(newStart.getTime() + duration);

        const now = new Date();
        if (newStart < now) {
            toast.error("Não é possível reagendar para um horário no passado.");
            return;
        }

        const hasConflict = appointments.some(app => {
            if (app.id === appointment.id) return false;
            if (isCancelledAppointmentStatus(app.status, app.notes)) return false;
            const appStart = new Date(app.start_time);
            const appEnd = new Date(app.end_time);
            return newStart < appEnd && newEnd > appStart;
        });

        if (hasConflict) {
            toast.error("Conflito de agenda no novo horário");
            return;
        }

        try {
            await updateAppointment.mutateAsync({
                id: appointmentId,
                updates: {
                    start_time: newStart.toISOString(),
                    end_time: newEnd.toISOString()
                }
            });
            toast.success("Agendamento reagendado");
            refetch();
        } catch (err) {
            toast.error("Falha ao mover agendamento");
        }
    };

    const activeAppointment = useMemo(() =>
        appointments.find(a => a.id === activeId),
        [activeId, appointments]);

    // Determine if a specific hour is blocked for a given day
    const isHourBlocked = (day: Date, hour: number): boolean => {
        if (!workingHours) return false;
        const dayId = day.getDay().toString();
        const hw = workingHours[dayId];
        if (!hw) return false;
        if (!hw.enabled) return true; // Entire day is off
        const startHour = parseInt(hw.start.split(':')[0]);
        const endHour = parseInt(hw.end.split(':')[0]);
        return hour < startHour || hour >= endHour;
    };

    const handleSlotClick = (day: Date, hour: number) => {
        const targetDate = setMinutes(setHours(day, hour), 0);
        if (targetDate < new Date()) {
            toast.error("Não é possível agendar no passado.");
            return;
        }
        setNewAppointmentDate(day);
        setSelectedTimeSlot(`${String(hour).padStart(2, '0')}:00`);
    };

    useEffect(() => {
        const handleSynapseAction = (event: Event) => {
            const action = (event as CustomEvent<SynapseInterfaceAction>).detail;
            if (action?.action !== "open_modal" || action.modal !== "new_appointment") return;

            const targetDate = action.date ? new Date(action.date) : new Date();
            onDateChange(targetDate);
            onViewChange?.("daily");
            setNewAppointmentDate(targetDate);
            setSelectedTimeSlot(action.date ? format(targetDate, "HH:mm") : undefined);
        };

        window.addEventListener(SYNAPSE_PAGE_ACTION_EVENT, handleSynapseAction);
        return () => window.removeEventListener(SYNAPSE_PAGE_ACTION_EVENT, handleSynapseAction);
    }, [onDateChange, onViewChange]);

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="h-10 w-10 text-zinc-300 dark:text-white/20 animate-spin" />
            </div>
        );
    }

    // ─── Render: Time-grid based view (daily / weekly) ────────────────────

    const renderTimeGridView = () => {
        const days = view === 'daily' ? [date] : weekDays;

        return (
            <div className="flex flex-col flex-1 min-h-[600px] h-full">
                {/* Day Headers */}
                <div className="flex shrink-0 border-b border-zinc-200 dark:border-white/[0.04]">
                    {/* Time gutter header */}
                    <div className="w-16 shrink-0" />
                    {/* Day columns headers */}
                    {days.map(day => {
                        const isToday = isSameDay(day, new Date());
                        return (
                            <div
                                key={day.toISOString()}
                                className={cn(
                                    "flex-1 min-w-0 text-center py-4 border-l border-zinc-100 dark:border-white/[0.03]",
                                    isToday && "bg-zinc-50/50 dark:bg-white/[0.02]"
                                )}
                            >
                                <span className={cn(
                                    "text-[9px] font-bold uppercase tracking-[0.25em] block mb-1",
                                    isToday ? "text-zinc-900 dark:text-white" : "text-zinc-400 dark:text-zinc-500"
                                )}>
                                    {format(day, "EEE", { locale: ptBR })}
                                </span>
                                <span className={cn(
                                    "text-xl font-semibold tracking-tight",
                                    isToday ? "text-zinc-900 dark:text-white" : "text-zinc-400 dark:text-zinc-400"
                                )}>
                                    {format(day, "dd")}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Time grid body */}
                <div className="flex-1 overflow-y-auto custom-scrollbar relative h-full">
                    <div className="flex" style={{ minHeight: HOUR_LABELS.length * HOUR_HEIGHT }}>
                        {/* Time gutter */}
                        <div className="w-16 shrink-0 relative">
                            {HOUR_LABELS.map((label, i) => (
                                <div
                                    key={label}
                                    className="absolute w-full flex items-start justify-end pr-3"
                                    style={{ top: i * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                                >
                                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 tabular-nums -mt-[6px]">
                                        {label}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Day columns */}
                        {days.map(day => {
                            const isToday = isSameDay(day, new Date());
                            const dayId = day.toISOString();

                            return (
                                <GridDroppableColumn
                                    key={dayId}
                                    day={day}
                                    appointments={appointments}
                                    isToday={isToday}
                                    isBlocked={(hour) => isHourBlocked(day, hour)}
                                    onSlotClick={(hour) => handleSlotClick(day, hour)}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    // ─── Render: Monthly (existing card-based layout) ─────────────────────

    const renderMonthlyView = () => (
        <div className={cn(
            "grid gap-4 flex-1 min-h-[600px] h-full select-none",
            "grid-cols-4 sm:grid-cols-7"
        )}>
            {monthDays.map(day => (
                <MonthDroppableColumn
                    key={day.toISOString()}
                    id={day.toISOString()}
                    day={day}
                    appointments={appointments}
                    isDraggingAny={!!activeId}
                    activeAppointment={activeAppointment}
                    isTarget={overId === day.toISOString()}
                    onAddAppointment={() => {
                        setNewAppointmentDate(day);
                        setSelectedTimeSlot(undefined);
                    }}
                />
            ))}
        </div>
    );

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            measuring={{
                droppable: {
                    strategy: MeasuringStrategy.Always,
                },
            }}
        >
            <div id="agenda-main-calendar" className="px-6 pt-6 pb-6 h-full flex flex-col bg-zinc-50/50 dark:bg-transparent overflow-hidden">
                <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-6 border-b border-zinc-200 dark:border-white/[0.03] shrink-0 mb-6">
                    {/* Left side: Sidebar Toggle, Title/Date, Google Status */}
                    <div className="flex flex-wrap items-center gap-4">
                        {setSidebarOpen && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="hidden xl:flex h-10 w-10 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.05] border border-transparent hover:border-zinc-200 dark:hover:border-white/[0.05] transition-all active:scale-95"
                            >
                                {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
                            </Button>
                        )}

                        <div className="flex items-baseline gap-4">
                            <motion.div
                                key={`${view}-${date.toISOString()}`}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                            >
                                <span className="text-4xl xl:text-5xl font-light text-zinc-900 dark:text-white tracking-tighter leading-none">
                                    {format(date, "dd")} <span className="text-zinc-400 dark:text-zinc-500 font-thin lowercase">{format(date, "MMMM", { locale: ptBR })}</span> <span className="text-zinc-300 dark:text-zinc-600 font-thin text-3xl ml-1">{format(date, "yyyy")}</span>
                                </span>
                            </motion.div>
                        </div>

                        {/* Google Connected Badge Moved Here */}
                        <div className="ml-2 hidden sm:block">
                            {isLoadingGoogle ? (
                                <div className="h-6 w-20 bg-zinc-100 dark:bg-white/[0.02] rounded-full animate-pulse" />
                            ) : isGoogleConnected ? (
                                <div className="flex items-center gap-2 px-2.5 py-1 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.05] rounded-full cursor-default group/status">
                                    <div className="relative flex h-1.5 w-1.5">
                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                                    </div>
                                    <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Conectado</span>
                                </div>
                            ) : (
                                <Button
                                    onClick={() => navigate('/ajustes?tab=integrations')}
                                    className="h-6 px-3 bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 border border-zinc-900 dark:border-white rounded-full text-[9px] font-bold uppercase tracking-widest transition-all"
                                >
                                    Conectar
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Right side: Compact Actions Panel */}
                    <div className="flex flex-wrap items-center gap-3">

                        {/* View Switcher Controls */}
                        {onViewChange && (
                            <div className="flex bg-zinc-100 dark:bg-black/40 rounded-full p-1 border border-zinc-200 dark:border-white/[0.05]">
                                {[
                                    { id: 'daily', label: 'Dia' },
                                    { id: 'weekly', label: 'Sem' },
                                    { id: 'monthly', label: 'Mês' }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => onViewChange(tab.id as any)}
                                        className={cn(
                                            "relative px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors z-10",
                                            view === tab.id ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                                        )}
                                    >
                                        {view === tab.id && (
                                            <motion.div
                                                layoutId="activeViewTabCompact"
                                                className="absolute inset-0 bg-white dark:bg-zinc-200 rounded-full shadow-sm"
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                        <span className="relative z-10">{tab.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="w-px h-6 bg-zinc-200 dark:bg-white/[0.06] hidden sm:block" />

                        {/* Navigation Controls */}
                        <div className="flex items-center gap-1.5">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onDateChange(view === 'monthly' ? subMonths(date, 1) : addDays(date, view === 'daily' ? -1 : -7))}
                                className="h-10 w-10 rounded-full bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.05] shadow-sm hover:shadow transition-all hover:bg-zinc-100 dark:hover:bg-white/[0.05]"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => onDateChange(new Date())}
                                className="h-10 px-5 rounded-full bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.05] text-[10px] font-bold uppercase tracking-widest shadow-sm hover:shadow transition-all hover:bg-zinc-100 dark:hover:bg-white/[0.05]"
                            >
                                Hoje
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onDateChange(view === 'monthly' ? addMonths(date, 1) : addDays(date, view === 'daily' ? 1 : 7))}
                                className="h-10 w-10 rounded-full bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.05] shadow-sm hover:shadow transition-all hover:bg-zinc-100 dark:hover:bg-white/[0.05]"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="w-px h-6 bg-zinc-200 dark:bg-white/[0.06] hidden sm:block mx-1" />

                        {/* Settings Button */}
                        <AgendaSettingsModal />

                        {/* New Appointment Add Button */}
                        <Button
                            size="icon"
                            onClick={() => { setNewAppointmentDate(new Date()); setSelectedTimeSlot(undefined); }}
                            className="h-10 w-10 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 font-bold uppercase tracking-[0.1em] shadow-sm transition-colors flex items-center justify-center shrink-0"
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </header>

                {/* Main content area */}
                <div className="flex-1 min-h-[500px] flex flex-col overflow-y-auto">
                    {view === 'monthly' ? renderMonthlyView() : renderTimeGridView()}
                </div>

                {newAppointmentDate && (
                    <NewAppointmentModal
                        initialDate={newAppointmentDate}
                        selectedTime={selectedTimeSlot}
                        onOpenChange={(isOpen) => !isOpen && setNewAppointmentDate(undefined)}
                        open={!!newAppointmentDate}
                    />
                )}
            </div>

            {isMounted && createPortal(
                <DragOverlay
                    zIndex={9999}
                    dropAnimation={{
                        duration: 150,
                        easing: 'ease-out',
                        sideEffects: defaultDropAnimationSideEffects({
                            styles: {
                                active: { opacity: '0' },
                            },
                        }),
                    }}
                >
                    {activeAppointment ? (
                        <div style={{ width: '280px' }} className="cursor-grabbing">
                            <div className="scale-[1.02] rotate-0 shadow-2xl transition-transform duration-200 rounded-[20px] overflow-hidden">
                                <AppointmentCard app={activeAppointment} isOverlay />
                            </div>
                        </div>
                    ) : null}
                </DragOverlay>,
                document.body
            )}
        </DndContext>
    );
};

// ─── Grid Time View Droppable Subcomponent ──────────────────────────────────

const HourDroppableSlot = ({
    id,
    hourIndex,
    blocked,
    onSlotClick
}: {
    id: string;
    hourIndex: number;
    blocked: boolean;
    onSlotClick: (hour: number) => void;
}) => {
    const { setNodeRef, isOver } = useDroppable({ id });

    return (
        <div
            ref={setNodeRef}
            onClick={() => !blocked && onSlotClick(hourIndex)}
            className={cn(
                "absolute w-full border-t border-zinc-100 dark:border-white/[0.03] group transition-colors",
                blocked ? "bg-zinc-100/70 dark:bg-white/[0.02] cursor-not-allowed" : "cursor-pointer hover:bg-zinc-100/30 dark:hover:bg-white/[0.02]",
                isOver && !blocked && "bg-primary/20 dark:bg-primary/30 z-[5]"
            )}
            style={{ top: hourIndex * HOUR_HEIGHT, height: HOUR_HEIGHT }}
        >
            {blocked ? (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-zinc-200/80 dark:bg-white/[0.06]">
                        <Lock className="w-2.5 h-2.5 text-zinc-400 dark:text-zinc-500" />
                        <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Bloqueado</span>
                    </div>
                </div>
            ) : (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-zinc-300 dark:text-zinc-600">
                    <Plus className="w-4 h-4" />
                </div>
            )}
            {/* Half-hour dashed line */}
            <div className="absolute w-full border-t border-dashed border-zinc-100/70 dark:border-white/[0.02] pointer-events-none" style={{ top: HOUR_HEIGHT / 2 }} />
        </div>
    );
};

const GridDroppableColumn = ({
    day,
    appointments,
    isToday,
    isBlocked,
    onSlotClick
}: {
    day: Date;
    appointments: Appointment[];
    isToday: boolean;
    isBlocked: (hour: number) => boolean;
    onSlotClick: (hour: number) => void;
}) => {
    const dayApps = useMemo(() =>
        appointments
            .filter(app => isSameDay(new Date(app.start_time), day))
            .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()),
        [appointments, day]);

    return (
        <div
            className={cn(
                "flex-1 min-w-0 relative border-l border-zinc-100 dark:border-white/[0.03] transition-colors",
                isToday && "bg-zinc-50/30 dark:bg-white/[0.01]"
            )}
        >
            {/* Interactive Grid Slots */}
            {HOUR_LABELS.map((_, i) => {
                const blocked = isBlocked(i);
                const targetHourDate = new Date(day);
                targetHourDate.setHours(i, 0, 0, 0);
                return (
                    <HourDroppableSlot
                        key={i}
                        id={targetHourDate.toISOString()}
                        hourIndex={i}
                        blocked={blocked}
                        onSlotClick={onSlotClick}
                    />
                );
            })}

            {/* Current time indicator */}
            {isToday && (() => {
                const now = new Date();
                const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
                const topPx = (minutesSinceMidnight / 60) * HOUR_HEIGHT;
                return (
                    <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: topPx }}>
                        <div className="flex items-center">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] -ml-[5px]" />
                            <div className="flex-1 h-[2px] bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.3)]" />
                        </div>
                    </div>
                );
            })()}

            {/* Appointment cards (Draggable in grid) */}
            {dayApps.map((app) => (
                <DraggableGridItem key={app.id} app={app} />
            ))}
        </div>
    );
};

const DraggableGridItem = ({ app }: { app: Appointment }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: app.id,
        data: { type: 'appointment', app }
    });

    const appStart = new Date(app.start_time);
    const appEnd = new Date(app.end_time);
    const startMinutes = appStart.getHours() * 60 + appStart.getMinutes();
    const endMinutes = appEnd.getHours() * 60 + appEnd.getMinutes();
    const topPx = (startMinutes / 60) * HOUR_HEIGHT;
    const heightPx = Math.max(((endMinutes - startMinutes) / 60) * HOUR_HEIGHT, 28);

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "absolute left-1 right-1 z-10",
                isDragging ? "invisible pointer-events-none opacity-0" : "visible"
            )}
            style={{ top: topPx, height: heightPx }}
        >
            <AppointmentDetailModal appointment={app}>
                <div
                    {...listeners}
                    {...attributes}
                    className="w-full h-full cursor-grab active:cursor-grabbing focus:outline-none touch-none"
                    onClick={(e) => {
                        // Prevent click propagation when dragging
                        if (isDragging) e.stopPropagation();
                    }}
                >
                    <div className={cn(
                        "w-full h-full rounded-xl text-left overflow-hidden transition-all duration-200 group/card",
                        "hover:shadow-lg hover:z-30 border",
                        getAppointmentStatusMeta(app.status, app.notes).bgClass,
                        getAppointmentStatusMeta(app.status, app.notes).borderClass
                    )}>
                        <div className="px-2.5 py-1.5 flex flex-col gap-0.5 pointer-events-none">
                            <div className="flex items-center gap-1.5">
                                {app.type === 'online'
                                    ? <Video className="h-3 w-3 shrink-0 text-zinc-500 dark:text-zinc-400" />
                                    : <MapPin className="h-3 w-3 shrink-0 text-zinc-500 dark:text-zinc-400" />
                                }
                                <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                    {getAppointmentDisplayTitle(app)}
                                </span>
                            </div>
                            {heightPx > 36 && (
                                <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 tabular-nums">
                                    {formatTimeBrazil(app.start_time)} – {formatTimeBrazil(app.end_time)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </AppointmentDetailModal>
        </div>
    );
};


// ─── Monthly sub-components (kept separate) ─────────────────────────────────

const MonthDroppableColumn = ({
    id,
    day,
    appointments,
    isDraggingAny,
    activeAppointment,
    isTarget,
    onAddAppointment
}: {
    id: string,
    day: Date,
    appointments: Appointment[],
    isDraggingAny?: boolean,
    activeAppointment?: Appointment,
    isTarget?: boolean,
    onAddAppointment?: () => void,
}) => {
    const { setNodeRef } = useDroppable({ id });

    const dayApps = useMemo(() =>
        appointments
            .filter(app => isSameDay(new Date(app.start_time), day))
            .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()),
        [appointments, day]);

    const isToday = isSameDay(day, new Date());

    const itemsWithGhost = useMemo(() => {
        if (!isTarget || !activeAppointment) return dayApps;

        const appsExceptActive = dayApps.filter(a => a.id !== activeAppointment.id);
        const activeStartTime = new Date(activeAppointment.start_time);

        const insertIndex = appsExceptActive.findIndex(a => new Date(a.start_time) > activeStartTime);

        const result = [...appsExceptActive];
        const ghostApp = { ...activeAppointment, isGhost: true } as any;

        if (insertIndex === -1) result.push(ghostApp);
        else result.splice(insertIndex, 0, ghostApp);

        return result;
    }, [dayApps, isTarget, activeAppointment]);

    return (
        <div ref={setNodeRef} onClick={onAddAppointment} className={cn(
            "flex flex-col min-w-0 transition-all duration-300 relative group/col cursor-pointer",
            "gap-1 bg-white dark:bg-[#121214]/40 hover:bg-zinc-50 dark:hover:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.05] rounded-xl p-1 shadow-sm",
            isDraggingAny && "bg-zinc-500/[0.02] dark:bg-white/[0.01]",
            isTarget && "bg-white/[0.8] dark:bg-white/[0.04] ring-1 ring-zinc-200 dark:ring-white/10 z-10"
        )}>
            <div className="flex-row justify-between w-full px-2 py-1 flex items-center">
                <span className={cn(
                    "text-[10px] font-medium",
                    isToday ? "text-zinc-900 dark:text-white bg-zinc-200 dark:bg-white/10 px-1.5 py-0.5 rounded-md" : "text-zinc-500"
                )}>
                    {format(day, "dd")}
                </span>
                {dayApps.length > 0 && <div className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-600" />}
            </div>

            <div className="flex flex-col flex-1 relative gap-1 min-h-[80px]">
                <AnimatePresence mode="popLayout">
                    {itemsWithGhost.slice(0, 2).map((app: any) => (
                        app.isGhost ? (
                            <div key="ghost" className="opacity-40 scale-[0.98]">
                                <AppointmentCard app={app} isGhost />
                            </div>
                        ) : (
                            <div key={app.id} onClick={e => e.stopPropagation()}>
                                <DraggableItem app={app} isMonthly />
                            </div>
                        )
                    ))}
                </AnimatePresence>

                {dayApps.length > 2 && (
                    <Popover>
                        <PopoverTrigger asChild>
                            <button onClick={e => e.stopPropagation()} className="w-full text-center text-[9px] font-bold text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 bg-zinc-200/50 dark:bg-white/[0.04] hover:bg-zinc-300/50 dark:hover:bg-white/[0.08] rounded-lg py-1 transition-all cursor-pointer">
                                +{dayApps.length - 2} mais
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[260px] p-3 bg-white dark:bg-[#0A0A0D] border border-zinc-200 dark:border-white/10 rounded-2xl shadow-2xl backdrop-blur-3xl" align="center" side="bottom">
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400 dark:text-zinc-500 mb-3 px-1">
                                {format(day, "dd MMM", { locale: ptBR })} &mdash; {dayApps.length} agendamentos
                            </p>
                            <div className="space-y-1.5 max-h-[240px] overflow-y-auto custom-scrollbar">
                                {dayApps.map(app => (
                                    <AppointmentDetailModal key={app.id} appointment={app}>
                                        <button className="w-full text-left p-2.5 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/5 hover:bg-zinc-100 dark:hover:bg-white/[0.06] hover:border-zinc-300 dark:hover:border-white/10 transition-all group">
                                            <div className="flex items-center gap-2">
                                                <div className={cn(
                                                    "w-1.5 h-1.5 rounded-full shrink-0",
                                                    getAppointmentStatusMeta(app.status, app.notes).dotClass
                                                )} />
                                                <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 truncate group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                                                    {getAppointmentDisplayTitle(app)}
                                                </span>
                                                <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-600 ml-auto shrink-0">
                                                    {formatTimeBrazil(app.start_time)}
                                                </span>
                                            </div>
                                        </button>
                                    </AppointmentDetailModal>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>
                )}
            </div>
        </div>
    );
};

const DraggableItem = ({ app, isMonthly }: { app: Appointment, isMonthly?: boolean }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: app.id,
        data: { type: 'appointment', app }
    });

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "relative outline-none",
                isDragging ? "invisible pointer-events-none" : "visible"
            )}
        >
            <AppointmentDetailModal appointment={app}>
                <div
                    {...listeners}
                    {...attributes}
                    className="w-full cursor-grab active:cursor-grabbing focus:outline-none touch-none"
                    onClick={(e) => { if (isDragging) e.stopPropagation(); }}
                >
                    <AppointmentCard app={app} isMonthly={isMonthly} />
                </div>
            </AppointmentDetailModal>
        </div>
    );
};

const AppointmentCard = ({ app, isOverlay, isMonthly, isGhost }: { app: Appointment, isOverlay?: boolean, isMonthly?: boolean, isGhost?: boolean }) => (
    <div
        className={cn(
            "rounded-[20px] border border-zinc-200 dark:border-white/[0.04] bg-white dark:bg-[#161619] group relative overflow-hidden",
            !isOverlay && !isGhost && "transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:border-zinc-300 dark:hover:border-white/10",
            isOverlay && "border-none shadow-none z-50 pointer-events-none",
            isGhost && "border-dashed border-zinc-300 dark:border-white/20 bg-zinc-100/50 dark:bg-white/[0.03] shadow-none",
            isMonthly ? "p-1.5 rounded-xl border-none bg-zinc-100 dark:bg-white/[0.03]" : "p-4"
        )}
    >
        {!isMonthly && (
            <div className={cn(
                "absolute top-4 right-4 w-1.5 h-1.5 rounded-full transition-all duration-500",
                getAppointmentStatusMeta(app.status, app.notes).dotClass
            )} />
        )}

        <div className="flex flex-col gap-2">
            {!isMonthly && (
                <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-white/[0.03] flex items-center justify-center mb-1 group-hover:bg-zinc-200 dark:group-hover:bg-white/10 transition-colors">
                    {app.type === 'online' ? <Video className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" /> : <MapPin className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />}
                </div>
            )}

            <div className={cn("space-y-0.5", isMonthly && "flex items-center gap-1.5")}>
                <h4 className={cn("font-medium tracking-tight leading-tight line-clamp-1 text-zinc-900 dark:text-white", isMonthly ? "text-[10px]" : "text-[13px] font-bold")}>
                    {getAppointmentDisplayTitle(app)}
                </h4>
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
                    {!isMonthly && <Clock className="h-3 w-3" />}
                    {formatTimeBrazil(app.start_time)}
                </div>
            </div>
        </div>

        {!isOverlay && !isGhost && (
            <div className="absolute inset-0 bg-gradient-to-br from-black/[0.02] dark:from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        )}
    </div>
);
