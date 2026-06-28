"use client";

import { useState, useMemo, useEffect } from "react";
import { Sidebar } from "@/components/agenda/Sidebar";
import { CalendarView } from "@/components/agenda/CalendarView";
import { useAppointments } from "@/hooks/use-appointments";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useSearchParams } from "react-router-dom";
import { useAgendaRealtime } from "@/hooks/use-agenda-realtime";
import { isCancelledAppointmentStatus } from "@/lib/appointment-status";
import { AppointmentDetailModal } from "@/components/agenda/AppointmentDetailModal";
import {
    SYNAPSE_PAGE_ACTION_EVENT,
    type SynapseInterfaceAction,
} from "@/lib/synapse-interface-actions";

export default function DesktopAgenda() {
    useAgendaRealtime();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [view, setView] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [openedAppointmentId, setOpenedAppointmentId] = useState<string | null>(null);

    const { data: appointments = [], isLoading } = useAppointments();

    useEffect(() => {
        const stateAppointmentId = location.state?.openAppointmentId;
        const queryAppointmentId = searchParams.get("appointmentId");
        const targetId = stateAppointmentId || queryAppointmentId;

        if (targetId) setOpenedAppointmentId(targetId);
        if (location.state?.synapseView === "daily") setView("daily");
        if (location.state?.synapseDate) setSelectedDate(new Date(location.state.synapseDate));
    }, [location.state, searchParams]);

    const openedAppointment = useMemo(
        () => appointments.find((appointment) => appointment.id === openedAppointmentId),
        [appointments, openedAppointmentId]
    );

    useEffect(() => {
        if (openedAppointment) {
            setSelectedDate(new Date(openedAppointment.start_time));
            setView("daily");
        }
    }, [openedAppointment]);

    useEffect(() => {
        const handleSynapseAction = (event: Event) => {
            const action = (event as CustomEvent<SynapseInterfaceAction>).detail;
            if (!action) return;

            if (action.action === "open_daily_schedule") {
                setView("daily");
                if (action.date) setSelectedDate(new Date(action.date));
            }

            if (action.action === "scroll_to_appointment" && action.appointmentId) {
                const appointment = appointments.find((item) => item.id === action.appointmentId);
                if (appointment) {
                    setSelectedDate(new Date(appointment.start_time));
                    setView("daily");
                    setOpenedAppointmentId(appointment.id);
                }
            }

            if (action.action === "highlight_element" && action.element === "daily_schedule") {
                const target = document.querySelector("[data-synapse-target='daily-schedule']");
                target?.classList.add("synapse-interface-highlight");
                window.setTimeout(() => target?.classList.remove("synapse-interface-highlight"), 4200);
            }
        };

        window.addEventListener(SYNAPSE_PAGE_ACTION_EVENT, handleSynapseAction);
        return () => window.removeEventListener(SYNAPSE_PAGE_ACTION_EVENT, handleSynapseAction);
    }, [appointments]);

    const closeOpenedAppointment = () => {
        setOpenedAppointmentId(null);
        if (searchParams.has("appointmentId")) {
            const nextParams = new URLSearchParams(searchParams);
            nextParams.delete("appointmentId");
            setSearchParams(nextParams, { replace: true });
        }
        if (location.state?.openAppointmentId) {
            window.history.replaceState({}, document.title, window.location.href);
        }
    };

    const filteredAppointments = useMemo(() => {
        return appointments.filter(app => {
            if (isCancelledAppointmentStatus(app.status, app.notes)) return false;
            const matchesSearch = (app.patient_name || "").toLowerCase().includes(searchQuery.toLowerCase());
            const matchesTag = !selectedTag ||
                (selectedTag === 'Online' && app.type === 'online') ||
                (selectedTag === 'Presencial' && app.type === 'presencial') ||
                (selectedTag === 'Primeira Vez' && app.notes?.toLowerCase().includes('primeira'));
            return matchesSearch && matchesTag;
        });
    }, [appointments, searchQuery, selectedTag]);

    return (
        <div className="relative min-h-screen overflow-hidden bg-background pb-4 pt-24 font-sans text-foreground selection:bg-primary/10 selection:text-primary lg:pt-28">
            <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_50%_10%,hsl(var(--foreground)/0.008),transparent_34%)] dark:bg-[radial-gradient(circle_at_50%_10%,rgba(255,255,255,0.003),transparent_34%)]" />
            <div className="premium-noise pointer-events-none fixed inset-0 z-0 opacity-[0.012] mix-blend-overlay dark:opacity-[0.025]" />

            <div className="page-spacing relative z-10 mx-auto flex h-[calc(100dvh-7rem)] max-w-[2200px] gap-4 overflow-hidden rounded-[40px] border border-border/45 bg-card/42 p-3 shadow-[0_22px_90px_-76px_hsl(var(--foreground)/0.42)] dark:border-white/[0.04] dark:bg-white/[0.02] dark:shadow-[0_22px_70px_-60px_rgba(0,0,0,0.86)] md:p-4 lg:h-[calc(100dvh-8rem)]">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,hsl(var(--foreground)/0.01),transparent_30%),linear-gradient(180deg,hsl(var(--background)/0.05),transparent_42%)] dark:bg-[radial-gradient(circle_at_18%_0%,rgba(255,255,255,0.004),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.006),transparent_42%)]" />
                <AnimatePresence mode="wait">
                    {sidebarOpen && (
                        <motion.aside
                            key="sidebar"
                            initial={{ width: 0, opacity: 0, x: -40 }}
                            animate={{ width: 300, opacity: 1, x: 0 }}
                            exit={{ width: 0, opacity: 0, x: -40 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
                            className="relative z-10 hidden h-full shrink-0 flex-col overflow-hidden xl:flex"
                        >
                            <div className="w-[300px] h-full flex flex-col">
                                <Sidebar
                                    selectedDate={selectedDate}
                                    onDateChange={setSelectedDate}
                                    appointments={appointments}
                                    searchQuery={searchQuery}
                                    onSearchChange={setSearchQuery}
                                    selectedTag={selectedTag}
                                    onTagChange={setSelectedTag}
                                />
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>

                <main className="relative z-10 flex h-full min-w-0 flex-1 flex-col" data-synapse-target="daily-schedule">
                    <div className="relative flex-1 overflow-hidden rounded-[34px] border border-border/65 bg-card/78 shadow-[0_24px_74px_-56px_hsl(var(--foreground)/0.44)] ring-1 ring-foreground/[0.025] dark:border-white/[0.08] dark:bg-white/[0.04] dark:shadow-[0_24px_68px_-54px_rgba(0,0,0,0.9)] dark:ring-white/[0.018]">
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,hsl(var(--foreground)/0.006),transparent_34%),radial-gradient(circle_at_92%_88%,hsl(var(--foreground)/0.004),transparent_38%)] dark:bg-[radial-gradient(circle_at_18%_10%,rgba(255,255,255,0.003),transparent_34%),radial-gradient(circle_at_92%_88%,rgba(255,255,255,0.002),transparent_38%)]" />
                        <CalendarView
                            date={selectedDate}
                            onDateChange={setSelectedDate}
                            appointments={filteredAppointments}
                            isLoading={isLoading}
                            view={view}
                            onViewChange={setView}
                            sidebarOpen={sidebarOpen}
                            setSidebarOpen={setSidebarOpen}
                        />
                    </div>
                </main>
            </div>
            {openedAppointment && (
                <AppointmentDetailModal
                    appointment={openedAppointment}
                    open={!!openedAppointment}
                    onOpenChange={(open) => {
                        if (!open) closeOpenedAppointment();
                    }}
                />
            )}
        </div>
    );
}
