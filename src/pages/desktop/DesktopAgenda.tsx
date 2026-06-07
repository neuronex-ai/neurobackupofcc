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

    // Handle incoming state from dashboard to open specific appointment
    useEffect(() => {
        const stateAppointmentId = location.state?.openAppointmentId;
        const queryAppointmentId = searchParams.get("appointmentId");
        const targetId = stateAppointmentId || queryAppointmentId;

        if (targetId) {
            setOpenedAppointmentId(targetId);
        }
    }, [location.state, searchParams]);

    const openedAppointment = useMemo(
        () => appointments.find((appointment) => appointment.id === openedAppointmentId),
        [appointments, openedAppointmentId]
    );

    useEffect(() => {
        if (openedAppointment) {
            setSelectedDate(new Date(openedAppointment.start_time));
        }
    }, [openedAppointment]);

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
        <div className="desktop-page-canvas min-h-screen overflow-hidden px-5 pb-10 pt-10 select-none lg:px-8">

            <div className="relative mx-auto flex h-[calc(100vh-132px)] max-w-[2100px] gap-5">

                <AnimatePresence mode="wait">
                    {sidebarOpen && (
                        <motion.aside
                            key="sidebar"
                            initial={{ width: 0, opacity: 0, x: -40 }}
                            animate={{ width: 300, opacity: 1, x: 0 }}
                            exit={{ width: 0, opacity: 0, x: -40 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
                            className="shrink-0 hidden xl:flex flex-col h-full overflow-hidden"
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

                <main className="flex-1 relative flex flex-col min-w-0 h-full">
                    <div className="desktop-apple-shell flex-1 overflow-hidden rounded-[30px]">
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
