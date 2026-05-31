"use client";

import { useState, useMemo, useEffect } from "react";
import { Sidebar } from "@/components/agenda/Sidebar";
import { CalendarView } from "@/components/agenda/CalendarView";
import { useAppointments } from "@/hooks/use-appointments";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { useAgendaRealtime } from "@/hooks/use-agenda-realtime";

export default function DesktopAgenda() {
    useAgendaRealtime();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [view, setView] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTag, setSelectedTag] = useState<string | null>(null);

    const { data: appointments = [], isLoading } = useAppointments();

    // Handle incoming state from dashboard to open specific appointment
    useEffect(() => {
        if (location.state?.openAppointmentId) {
            // Logic to handle opening the appointment could be added here
            // For now, we just ensure the view is ready
            console.log("Opening appointment:", location.state.openAppointmentId);
        }
    }, [location.state]);

    const filteredAppointments = useMemo(() => {
        return appointments.filter(app => {
            if (app.status === 'cancelled') return false;
            const matchesSearch = (app.patient_name || "").toLowerCase().includes(searchQuery.toLowerCase());
            const matchesTag = !selectedTag ||
                (selectedTag === 'Online' && app.type === 'online') ||
                (selectedTag === 'Presencial' && app.type === 'presencial') ||
                (selectedTag === 'Primeira Vez' && app.notes?.toLowerCase().includes('primeira'));
            return matchesSearch && matchesTag;
        });
    }, [appointments, searchQuery, selectedTag]);

    return (
        <div className="min-h-screen pt-10 pb-12 page-spacing overflow-hidden select-none bg-zinc-10 dark:bg-zinc-950">
            <div className="premium-noise opacity-[0.01] dark:opacity-[0.03] mix-blend-overlay fixed inset-0 bg-gradient-to-br from-transparent via-zinc-100/20 to-transparent dark:via-zinc-900/10 pointer-events-none" />

            <div className="max-w-[1800px] mx-auto relative flex h-[calc(100vh-140px)] gap-6">

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
                    <div className="flex-1 bg-white dark:bg-[#0A0A0C] border border-zinc-200 dark:border-white/[0.06] rounded-[32px] overflow-hidden relative shadow-lg dark:shadow-2xl">
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
    );
}