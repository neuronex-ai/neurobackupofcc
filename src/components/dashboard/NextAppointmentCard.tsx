"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Video, MapPin, ArrowRight, Coffee, Calendar as CalendarIcon, CalendarRange } from "lucide-react";
import { Appointment } from "@/types";
import { format, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { AppointmentDetailModal } from "../agenda/AppointmentDetailModal";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import React, { useMemo } from "react";

interface NextAppointmentCardProps {
    appointment: Appointment | undefined;
    isLoading: boolean;
    className?: string;
}

const getInitials = (name: string) => {
    if (!name) return "??";
    const names = name.split(' ');
    return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : name.substring(0, 2).toUpperCase();
};

const CardWrapper = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <motion.div
        initial={{ opacity: 0, filter: "blur(6px)" }}
        animate={{ opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        id="dashboard-next-appt"
        className={cn(
            "relative h-full w-full rounded-[32px] overflow-hidden group",
            "bg-white dark:bg-[#0A0A0B]",
            "border border-zinc-200 dark:border-white/[0.06]",
            "shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)]",
            "transition-all duration-500",
            className
        )}
    >
        <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-zinc-500/5 dark:bg-white/[0.015] rounded-full blur-[100px] pointer-events-none" />
        {children}
    </motion.div>
);

export const NextAppointmentCard = React.memo(({ appointment, isLoading, className }: NextAppointmentCardProps) => {
    const navigate = useNavigate();

    const startTime = useMemo(() => appointment ? new Date(appointment.start_time) : null, [appointment]);
    const isOnline = useMemo(() => {
        if (!appointment) return false;
        return (appointment.type as string) === 'online' || (appointment.type as string) === 'teleconsulta' || !!appointment.google_meet_link;
    }, [appointment]);

    const isAptToday = useMemo(() => startTime ? isToday(startTime) : false, [startTime]);

    if (isLoading) {
        return (
            <CardWrapper className={className}>
                <div className="h-full w-full bg-zinc-100/50 dark:bg-white/[0.02] animate-pulse" />
            </CardWrapper>
        );
    }

    if (!appointment || !isAptToday) {
        return (
            <CardWrapper className={className}>
                <div className="h-full p-10 flex flex-col items-center justify-between relative min-h-[420px]">
                    <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-zinc-50/80 dark:bg-white/[0.03] border border-zinc-200/60 dark:border-white/[0.06] backdrop-blur-xl shadow-sm">
                        <CalendarIcon className="w-3.5 h-3.5 text-zinc-500/80 dark:text-zinc-500/80" />
                        <span className="text-[10px] font-black text-zinc-500/80 dark:text-zinc-500/80 uppercase tracking-[0.25em]">Próxima Consulta</span>
                    </div>

                    <div className="flex flex-col items-center gap-8 opacity-50 group-hover:opacity-100 transition-all duration-700">
                        <div className="h-20 w-20 rounded-[32px] bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.06] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-700">
                            <Coffee className="h-8 w-8 text-zinc-300 dark:text-zinc-700" />
                        </div>
                        <div className="space-y-2 text-center">
                            <h3 className="text-lg font-black text-zinc-600 dark:text-zinc-400 tracking-tight uppercase tracking-widest">Sem consultas hoje</h3>
                            <p className="text-[9px] text-zinc-500/80 dark:text-zinc-500/80 uppercase tracking-[0.2em] font-bold">Aproveite para organizar sua agenda</p>
                        </div>
                    </div>

                    <div className="w-full flex flex-col gap-3">
                        <Button
                            onClick={() => navigate('/agenda')}
                            variant="outline"
                            className="w-full h-14 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border-zinc-200 dark:border-white/10 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-white/5 transition-all"
                        >
                            <CalendarRange className="mr-2 h-4 w-4" /> Conferir agenda completa
                        </Button>
                    </div>
                </div>
            </CardWrapper>
        );
    }

    const handleAction = () => {
        if (isOnline) {
            navigate('/teleconsulta', { state: { activeAppointmentId: appointment.id } });
        }
    };

    return (
        <CardWrapper className={className}>
            <div className="h-full p-10 flex flex-col items-center justify-between relative min-h-[420px]">
                <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-zinc-50/80 dark:bg-white/[0.03] border border-zinc-200/60 dark:border-white/[0.06] backdrop-blur-xl shadow-sm">
                    <CalendarIcon className="w-3.5 h-3.5 text-zinc-500/80 dark:text-zinc-500/80" />
                    <span className="text-[10px] font-black text-zinc-500/80 dark:text-zinc-500/80 uppercase tracking-[0.25em]">Próxima Consulta</span>
                </div>

                <div className="flex flex-col items-center gap-6 my-6">
                    <div className="relative">
                        <Avatar className="h-28 w-28 border-[6px] border-white dark:border-[#0C0C0E] shadow-2xl relative z-10 rounded-full transition-transform duration-700 group-hover:scale-105">
                            <AvatarFallback className="bg-zinc-900 dark:bg-white text-white dark:text-black text-3xl font-black uppercase tracking-widest rounded-full">
                                {getInitials(appointment.patient_name || '')}
                            </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 z-20 bg-white dark:bg-[#0A0A0B] p-1.5 rounded-full border border-zinc-100 dark:border-white/5 shadow-xl">
                            <div className={cn(
                                "p-2 rounded-full border transition-colors",
                                isOnline ? "bg-indigo-50 dark:bg-white/5 border-indigo-200 dark:border-white/10 text-indigo-500 dark:text-indigo-400" : "bg-emerald-50 dark:bg-white/5 border-emerald-200 dark:border-white/10 text-emerald-500 dark:text-emerald-400"
                            )}>
                                {isOnline ? <Video className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                            </div>
                        </div>
                    </div>

                    <div className="text-center space-y-1">
                        <h2 className="text-2xl font-black text-black dark:text-white tracking-tighter leading-none truncate max-w-[240px]">
                            {appointment.patient_name}
                        </h2>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em]">
                            {isOnline ? "Teleconsulta" : "Presencial"}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-2 mb-8">
                    <div className="text-5xl font-black text-black dark:text-white tracking-tighter tabular-nums leading-none">
                        {startTime && format(startTime, "HH:mm")}
                    </div>
                    <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5">
                        <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                            {startTime && format(startTime, "d 'de' MMMM", { locale: ptBR })}
                        </span>
                        <div className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                        <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                            {startTime && format(startTime, "EEEE", { locale: ptBR })}
                        </span>
                    </div>
                </div>

                <div className="w-full flex gap-4 mt-auto">
                    {isOnline ? (
                        <Button
                            className="flex-1 h-14 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] bg-zinc-900 dark:bg-white text-white dark:text-black hover:scale-[1.03] active:scale-[0.97] shadow-xl transition-all duration-500"
                            onClick={handleAction}
                        >
                            Entrar <ArrowRight className="ml-2 h-4 w-4 stroke-[3]" />
                        </Button>
                    ) : (
                        <div className="flex-1 h-14 rounded-2xl flex items-center justify-center bg-zinc-50 dark:bg-white/[0.03] border border-zinc-100 dark:border-white/[0.05] text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.25em] cursor-default">
                            Presencial
                        </div>
                    )}

                    <AppointmentDetailModal appointment={appointment}>
                        <Button variant="outline" className="flex-1 h-14 rounded-2xl border-zinc-200 dark:border-white/[0.1] bg-zinc-50/50 dark:bg-white/[0.03] hover:bg-zinc-900 dark:hover:bg-white hover:text-white dark:hover:text-black text-zinc-600 dark:text-zinc-300 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 hover:scale-[1.03] active:scale-[0.97] shadow-sm">
                            Detalhes
                        </Button>
                    </AppointmentDetailModal>
                </div>
            </div>
        </CardWrapper>
    );
});

NextAppointmentCard.displayName = 'NextAppointmentCard';