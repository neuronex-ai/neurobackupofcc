"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppointmentsByDateRange } from "@/hooks/use-appointments-by-date-range";
import { cn } from "@/lib/utils";
import { endOfDay, format, isSameDay, startOfDay } from "date-fns";
import { ArrowRight, Calendar, ChevronDown, Loader2, MapPin, Video, X } from "lucide-react";
import { useMemo, useState } from "react";
import { AppointmentDetailModal } from "../agenda/AppointmentDetailModal";
import { getAppointmentStatusMeta } from "@/lib/appointment-status";
import { getAppointmentDisplayTitle } from "@/lib/appointment-utils";

export const MiniDailyAgenda = () => {
    const today = new Date();
    const { data: appointments, isLoading } = useAppointmentsByDateRange(startOfDay(today), endOfDay(today));
    const [openDetails, setOpenDetails] = useState(false);

    const todaysAppointments = useMemo(() => {
        return appointments?.filter(apt => isSameDay(new Date(apt.start_time), today))
            .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()) || [];
    }, [appointments, today]);

    const MAX_ITEMS = 3;
    const displayedAppointments = todaysAppointments.slice(0, MAX_ITEMS);
    const hasMore = todaysAppointments.length > MAX_ITEMS;

    if (isLoading) {
        return <div className="h-full flex items-center justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-zinc-300 dark:text-zinc-600" /></div>;
    }

    if (todaysAppointments.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-20 h-20 rounded-[28px] bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.06] flex items-center justify-center mb-6 shadow-inner ring-1 ring-zinc-100 dark:ring-white/5">
                    <Calendar className="h-7 w-7 text-zinc-300 dark:text-zinc-600" />
                </div>
                <h4 className="text-sm font-black text-black dark:text-white uppercase tracking-[0.2em] mb-1.5">Agenda Livre</h4>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Sem consultas para hoje</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col pt-10 pb-6 px-8">
            <h3 className="text-[11px] font-black text-zinc-500/80/80 dark:text-zinc-500/80/80 uppercase tracking-[0.35em] mb-8 flex items-center justify-between">
                Cronograma 
                <span className="text-black dark:text-white font-black normal-case text-[10px] bg-zinc-100 dark:bg-white/10 px-4 py-1.5 rounded-full border border-zinc-200 dark:border-white/5 shadow-sm">
                    {format(today, 'dd/MM')}
                </span>
            </h3>

            <div className="flex-1 space-y-4">
                {displayedAppointments.map((apt) => (
                    <AppointmentDetailModal key={apt.id} appointment={apt}>
                        <div
                            className="group flex items-center gap-5 p-5 rounded-[24px] bg-zinc-50/50 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/[0.06] hover:bg-white dark:hover:bg-white/[0.04] hover:border-zinc-300 dark:hover:border-white/[0.15] transition-all duration-500 cursor-pointer active:scale-[0.98] shadow-sm hover:shadow-lg"
                        >
                            <Avatar className="h-12 w-12 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm transition-transform duration-500 group-hover:scale-110">
                                <AvatarFallback className="text-[12px] font-black bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl">
                                    {apt.patient_name?.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-sm font-black text-black dark:text-white truncate pr-3 tracking-tight group-hover:text-black dark:group-hover:text-white transition-colors">
                                        {getAppointmentDisplayTitle(apt)}
                                    </span>
                                    <span className="text-[10px] font-black text-zinc-500/80/80 dark:text-zinc-400 bg-white dark:bg-black/40 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-white/5 tabular-nums shadow-sm">
                                        {format(new Date(apt.start_time), 'HH:mm')}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-2 h-2 rounded-full",
                                        getAppointmentStatusMeta(apt.status, apt.notes).dotClass
                                    )} />
                                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                        {apt.type === 'online' ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                                        {apt.type === 'online' ? 'Online' : 'Clínica'}
                                    </span>
                                </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-zinc-200 dark:text-zinc-800 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-500" />
                        </div>
                    </AppointmentDetailModal>
                ))}
            </div>

            {hasMore && (
                <div className="pt-6 mt-2 border-t border-zinc-100 dark:border-white/[0.06] flex justify-center">
                    <Dialog open={openDetails} onOpenChange={setOpenDetails}>
                        <DialogTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-10 px-8 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.04] rounded-full transition-all duration-500"
                            >
                                Ver Todas ({todaysAppointments.length - MAX_ITEMS}) <ChevronDown className="ml-2 h-3.5 w-3.5" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[550px] rounded-[48px] border-zinc-200 dark:border-white/10 bg-white dark:bg-[#080809] backdrop-blur-3xl shadow-[0_48px_96px_-24px_rgba(0,0,0,0.5)] p-0 overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
                            <DialogClose className="absolute right-8 top-8 rounded-2xl p-3 bg-zinc-100 dark:bg-white/5 text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/10 transition-all z-50 shadow-sm">
                                <X className="h-4 w-4" />
                            </DialogClose>
                            
                            <div className="p-12">
                                <div className="mb-12">
                                    <h3 className="text-3xl font-black text-black dark:text-white tracking-tighter uppercase">Agenda Diária</h3>
                                    <p className="text-[10px] text-zinc-500/80/80 dark:text-zinc-500/80/80 font-black uppercase tracking-[0.3em] mt-2">Ciclo Completo de Atendimentos</p>
                                </div>

                                <ScrollArea className="h-[450px] pr-4 -mr-4">
                                    <div className="space-y-4">
                                        {todaysAppointments.map((app) => (
                                            <div key={app.id} className="group flex items-center gap-6 p-6 rounded-[32px] bg-zinc-50/50 dark:bg-white/[0.03] border border-zinc-100 dark:border-white/[0.06] hover:bg-white dark:hover:bg-white/[0.05] hover:border-zinc-300 dark:hover:border-white/15 transition-all duration-700 shadow-sm hover:shadow-xl cursor-pointer">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-lg font-black text-black dark:text-white tracking-tighter tabular-nums">
                                                        {format(new Date(app.start_time), "HH:mm")}
                                                    </span>
                                                    <div className={cn("w-1.5 h-1.5 rounded-full mt-2", getAppointmentStatusMeta(app.status, app.notes).dotClass)} />
                                                </div>
                                                
                                                <div className="h-10 w-px bg-zinc-100 dark:bg-white/10 mx-2" />

                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-base font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-tight truncate">
                                                        {getAppointmentDisplayTitle(app) || "Paciente"}
                                                    </h4>
                                                    <p className="text-[10px] text-zinc-500/80/80 dark:text-zinc-500/80/80 font-bold uppercase tracking-widest mt-1">
                                                        {app.type === 'presencial' ? 'Consultório' : 'Teleconsulta'}
                                                    </p>
                                                </div>

                                                <div className={cn(
                                                    "px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-lg transition-all",
                                                    getAppointmentStatusMeta(app.status, app.notes).textClass,
                                                    getAppointmentStatusMeta(app.status, app.notes).bgClass,
                                                    getAppointmentStatusMeta(app.status, app.notes).borderClass
                                                )}>
                                                    {getAppointmentStatusMeta(app.status, app.notes).label}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            )}
        </div>
    );
};
