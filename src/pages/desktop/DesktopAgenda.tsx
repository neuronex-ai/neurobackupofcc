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
    const [sidebarOpen, setSidebarOpen] = useState(false);
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

    useEffect(() => {
        if (!sidebarOpen) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setSidebarOpen(false);
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [sidebarOpen]);

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
        <div className="relative flex h-screen w-full flex-col overflow-hidden bg-transparent pt-10 font-sans text-foreground selection:bg-primary/10 selection:text-primary">
            <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-[2200px] flex-1 px-4 pb-4 md:px-6 lg:px-8 xl:px-10">
                <div className="relative flex min-h-0 flex-1 overflow-hidden rounded-[40px] border border-zinc-200/60 bg-white/58 p-2 shadow-[0_22px_72px_-52px_rgba(24,24,27,0.34),inset_0_1px_0_rgba(255,255,255,0.82)] backdrop-blur-2xl dark:border-white/[0.05] dark:bg-[#0A0A0B]/88 dark:shadow-[0_28px_90px_-58px_rgba(0,0,0,0.96),inset_0_1px_0_rgba(255,255,255,0.04)] md:p-3">
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.22),transparent_28%)] opacity-60 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.012),transparent_32%)] dark:opacity-100" />
                <AnimatePresence>
                    {sidebarOpen && (
                        <>
                            <motion.button
                                key="agenda-sidebar-dismiss"
                                type="button"
                                aria-label="Fechar painel da agenda"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.16 }}
                                onClick={() => setSidebarOpen(false)}
                                className="absolute inset-0 z-30 hidden cursor-default bg-zinc-950/[0.015] dark:bg-black/10 xl:block"
                            />
                            <motion.aside
                                key="sidebar"
                                initial={{ opacity: 0, x: -18, scale: 0.985 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: -18, scale: 0.985 }}
                                transition={{ type: "spring", stiffness: 380, damping: 36, mass: 0.8 }}
                                className="absolute inset-y-3 left-3 z-40 hidden w-[318px] flex-col overflow-hidden xl:flex"
                            >
                                <div className="relative h-full w-full rounded-[36px] border border-zinc-200/60 bg-white/74 p-2 shadow-[0_26px_80px_-42px_rgba(24,24,27,0.42)] backdrop-blur-2xl dark:border-white/[0.065] dark:bg-[#101012]/86 dark:shadow-[0_28px_82px_-48px_rgba(0,0,0,0.95)]">
                                    <div className="pointer-events-none absolute inset-0 rounded-[36px] bg-[linear-gradient(145deg,rgba(255,255,255,0.48),transparent_36%)] dark:bg-[linear-gradient(145deg,rgba(255,255,255,0.035),transparent_38%)]" />
                                    <div className="relative z-10 h-full">
                                        <Sidebar
                                            selectedDate={selectedDate}
                                            onDateChange={setSelectedDate}
                                            appointments={appointments}
                                            searchQuery={searchQuery}
                                            onSearchChange={setSearchQuery}
                                            selectedTag={selectedTag}
                                            onTagChange={setSelectedTag}
                                            onClose={() => setSidebarOpen(false)}
                                        />
                                    </div>
                                </div>
                            </motion.aside>
                        </>
                    )}
                </AnimatePresence>

                <main className="relative z-10 flex h-full min-w-0 flex-1 flex-col" data-synapse-target="daily-schedule">
                    <div className="relative flex-1 overflow-hidden rounded-[34px] border border-zinc-200/65 bg-zinc-50/68 shadow-[0_18px_58px_-42px_rgba(24,24,27,0.32)] ring-1 ring-zinc-950/[0.022] dark:border-white/[0.055] dark:bg-[#0B0B0C] dark:shadow-[0_24px_68px_-54px_rgba(0,0,0,0.9)] dark:ring-white/[0.018]">
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(24,24,27,0.018),transparent_34%),radial-gradient(circle_at_92%_88%,rgba(24,24,27,0.012),transparent_38%)] dark:bg-[radial-gradient(circle_at_18%_10%,rgba(255,255,255,0.018),transparent_34%),radial-gradient(circle_at_92%_88%,rgba(255,255,255,0.008),transparent_38%)]" />
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
