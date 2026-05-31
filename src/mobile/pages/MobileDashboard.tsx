"use client";

import { NewAppointmentModal } from "@/components/agenda/NewAppointmentModal";
import { useAuth } from "@/components/auth/SessionContextProvider";
import { NewPatientModal } from "@/components/patients/NewPatientModal";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useAppointmentsByDateRange } from "@/hooks/use-appointments-by-date-range";
import { cn } from "@/lib/utils";
import { endOfDay, format, isAfter, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import {
    ArrowUpRight, Calendar,
    ChevronRight,
    Clock, FileText, Mail, MapPin, MessageSquare, Plus, SendHorizontal, Users, Video,
    Wallet
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { MobileLayout } from "../components/MobileLayout";

export const MobileDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const today = new Date();
    const [remindersOpen, setRemindersOpen] = useState(false);

    const { data: todayAppointments } = useAppointmentsByDateRange(startOfDay(today), endOfDay(today));

    const nextAppointment = useMemo(() => {
        if (!todayAppointments) return undefined;
        const now = new Date();
        return todayAppointments
            .filter(apt => isAfter(new Date(apt.end_time), now) && apt.status !== 'cancelled')
            .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0];
    }, [todayAppointments]);

    const remainingCount = todayAppointments?.filter(apt => isAfter(new Date(apt.end_time), new Date()) && apt.status !== 'cancelled').length || 0;

    const getInitials = (name: string) => name.substring(0, 2).toUpperCase();

    return (
        <MobileLayout className="px-0 h-screen bg-background overflow-hidden">
            <div className="h-full overflow-y-auto overflow-x-hidden touch-pan-y pb-40 pt-6">
                <div className="px-6">
                    {/* --- Header: Clean & Integrated --- */}
                    <div className="mb-8 relative z-40 w-full animate-fade-in">
                        <div className="w-full flex items-center justify-between p-2 pl-4 pr-2 bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                            <div className="flex flex-col justify-center h-full -space-y-0.5">
                                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">
                                    {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
                                </span>
                                <h1 className="text-base font-bold text-zinc-100 tracking-tight leading-none">
                                    Bom dia, <span className="opacity-90">{user?.user_metadata?.first_name || 'Doutor'}</span>
                                </h1>
                            </div>
                            <div className="flex items-center gap-2">
                                <NewAppointmentModal>
                                    <button className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg active:scale-90 transition-all border border-white/10">
                                        <Plus className="w-5 h-5 stroke-[3]" />
                                    </button>
                                </NewAppointmentModal>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-12">
                        <motion.section
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 }}
                        >
                            <div className="flex items-center justify-between mb-5 px-1">
                                <h3 className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em]">Sessão Imediata</h3>
                            </div>

                            {nextAppointment ? (
                                <motion.div
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => navigate('/teleconsulta')}
                                    className="group relative rounded-[32px] bg-card border border-border/50 p-8 overflow-hidden backdrop-blur-md shadow-lg shadow-black/5 dark:shadow-none"
                                >
                                    <div className="absolute top-0 right-0 p-8">
                                        <div className="w-10 h-10 rounded-full border border-border/10 flex items-center justify-center bg-background/50">
                                            <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                        </div>
                                    </div>

                                    <div className="relative z-10">
                                        <div className="flex flex-col gap-6">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
                                                    {nextAppointment.type === 'online' ? <Video size={12} /> : <MapPin size={12} />}
                                                    {nextAppointment.type === 'online' ? 'Sessão Virtual' : 'Presencial'}
                                                </div>
                                                <div className="text-5xl font-black text-foreground tracking-tighter">
                                                    {format(new Date(nextAppointment.start_time), 'HH:mm')}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-16 w-16 rounded-[20px] border border-border/10">
                                                    <AvatarFallback className="bg-primary/5 text-primary text-xl font-bold">
                                                        {getInitials(nextAppointment.patient_name || '')}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0">
                                                    <h4 className="text-2xl font-bold text-foreground truncate tracking-tight">{nextAppointment.patient_name}</h4>
                                                    <p className="text-xs text-muted-foreground font-medium">Aguardando início</p>
                                                </div>
                                            </div>

                                            <Button className="w-full h-16 rounded-[20px] bg-foreground text-background hover:bg-foreground/90 transition-all font-black text-[11px] uppercase tracking-[0.2em]">
                                                Conectar agora
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="rounded-[32px] bg-muted/20 border border-dashed border-border/20 p-12 text-center">
                                    <Clock className="w-8 h-8 text-muted-foreground/20 mx-auto mb-4" />
                                    <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Nenhum agendamento para agora</p>
                                </div>
                            )}
                        </motion.section>

                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className="grid grid-cols-2 gap-4">
                                <motion.div
                                    whileTap={{ scale: 0.96 }}
                                    onClick={() => navigate('/agenda')}
                                    className="p-6 rounded-[28px] bg-card border border-border/40 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <Calendar className="w-5 h-5 text-muted-foreground/60 mb-4" />
                                    <div className="text-3xl font-bold text-foreground mb-1">{remainingCount}</div>
                                    <div className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">Atendimentos</div>
                                </motion.div>

                                <motion.div
                                    whileTap={{ scale: 0.96 }}
                                    onClick={() => navigate('/financeiro')}
                                    className="p-6 rounded-[28px] bg-card border border-border/40 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <Wallet className="w-5 h-5 text-muted-foreground/60 mb-4" />
                                    <div className="text-xl font-bold text-foreground mb-1 mt-2">Relatório</div>
                                    <div className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">Financeiro</div>
                                </motion.div>
                            </div>
                        </motion.section>

                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <h3 className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mb-6 px-1">Comandos de Atalho</h3>
                            <div className="flex gap-6 overflow-x-auto pb-4 -mx-6 px-6 no-scrollbar snap-x">
                                <NewAppointmentModal>
                                    <motion.div whileTap={{ scale: 0.9 }} className="snap-start flex-shrink-0 flex flex-col items-center gap-3">
                                        <div className="w-18 h-18 rounded-[24px] bg-foreground text-background flex items-center justify-center shadow-xl">
                                            <Plus className="w-6 h-6" />
                                        </div>
                                        <span className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">Agenda</span>
                                    </motion.div>
                                </NewAppointmentModal>

                                <NewPatientModal>
                                    <motion.div whileTap={{ scale: 0.9 }} className="snap-start flex-shrink-0 flex flex-col items-center gap-3">
                                        <div className="w-18 h-18 rounded-[24px] bg-secondary/80 border border-border/10 flex items-center justify-center">
                                            <Users className="w-6 h-6 text-foreground/60" />
                                        </div>
                                        <span className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">Paciente</span>
                                    </motion.div>
                                </NewPatientModal>

                                <motion.div
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setRemindersOpen(true)}
                                    className="snap-start flex-shrink-0 flex flex-col items-center gap-3"
                                >
                                    <div className="w-18 h-18 rounded-[24px] bg-secondary/80 border border-border/10 flex items-center justify-center">
                                        <SendHorizontal className="w-6 h-6 text-foreground/60" />
                                    </div>
                                    <span className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">Mensagem</span>
                                </motion.div>

                                <motion.div
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => navigate('/notas')}
                                    className="snap-start flex-shrink-0 flex flex-col items-center gap-3"
                                >
                                    <div className="w-18 h-18 rounded-[24px] bg-secondary/80 border border-border/10 flex items-center justify-center">
                                        <FileText className="w-6 h-6 text-foreground/60" />
                                    </div>
                                    <span className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">Notas</span>
                                </motion.div>
                            </div>
                        </motion.section>

                        {todayAppointments && todayAppointments.length > 0 && (
                            <motion.section
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="pb-10"
                            >
                                <h3 className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mb-8 px-1">Próximos compromissos</h3>
                                <div className="space-y-4">
                                    {todayAppointments.map((apt, idx) => {
                                        const isPast = new Date(apt.end_time) < new Date();
                                        const isNext = apt.id === nextAppointment?.id;

                                        return (
                                            <motion.div
                                                key={apt.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.4 + (idx * 0.1) }}
                                                className={cn(
                                                    "flex items-center justify-between p-6 rounded-[28px] border transition-all duration-500",
                                                    isPast
                                                        ? "opacity-40 grayscale border-transparent bg-muted/20"
                                                        : isNext
                                                            ? "bg-foreground text-background border-transparent"
                                                            : "bg-card border-border/50 shadow-sm"
                                                )}
                                            >
                                                <div className="flex gap-5 items-center">
                                                    <div className={cn(
                                                        "text-xl font-black tracking-tighter",
                                                        isNext ? "text-background" : "text-foreground"
                                                    )}>
                                                        {format(new Date(apt.start_time), 'HH:mm')}
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <h4 className={cn(
                                                            "text-base font-bold tracking-tight",
                                                            isNext ? "text-background" : "text-foreground"
                                                        )}>
                                                            {apt.patient_name}
                                                        </h4>
                                                        <div className={cn(
                                                            "text-[9px] font-black uppercase tracking-[0.1em]",
                                                            isNext ? "text-background/60" : "text-muted-foreground"
                                                        )}>
                                                            {apt.type === 'online' ? 'Sessão Digital' : 'Presencial'}
                                                        </div>
                                                    </div>
                                                </div>
                                                {!isPast && (
                                                    <ChevronRight size={18} className={isNext ? "text-background/20" : "text-foreground/20"} />
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </motion.section>
                        )}
                    </div>
                </div>
            </div>

            <Drawer open={remindersOpen} onOpenChange={setRemindersOpen}>
                <DrawerContent className="bg-background border-t-border/10 rounded-t-[40px] p-0 outline-none">
                    <div className="p-8 pb-12">
                        <div className="mx-auto w-12 h-1 bg-muted rounded-full mb-10" />
                        <DrawerHeader className="p-0 mb-10 text-left">
                            <DrawerTitle className="text-3xl font-black text-foreground tracking-tighter mb-2">Comandos Rápidos</DrawerTitle>
                            <DrawerDescription className="text-muted-foreground text-sm font-medium">
                                Automações inteligentes para sua rotina clínica.
                            </DrawerDescription>
                        </DrawerHeader>

                        <div className="space-y-3">
                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    toast.success("Enviado com sucesso.");
                                    setRemindersOpen(false);
                                }}
                                className="w-full h-20 rounded-[24px] bg-secondary/50 border border-border/30 flex items-center justify-between px-6 transition-all active:bg-secondary/70"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-2xl bg-background border border-border/10 flex items-center justify-center text-foreground">
                                        <Mail size={20} />
                                    </div>
                                    <div className="text-left">
                                        <span className="font-bold text-lg block text-foreground tracking-tight">E-mail em Massa</span>
                                        <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">Protocolo Geral</span>
                                    </div>
                                </div>
                                <ChevronRight size={18} className="text-muted-foreground/30" />
                            </motion.button>

                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    window.open(`https://wa.me/?text=Olá!`, '_blank');
                                    setRemindersOpen(false);
                                }}
                                className="w-full h-20 rounded-[24px] bg-secondary/50 border border-border/30 flex items-center justify-between px-6 transition-all active:bg-secondary/70"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-2xl bg-background border border-border/10 flex items-center justify-center text-foreground">
                                        <MessageSquare size={20} />
                                    </div>
                                    <div className="text-left">
                                        <span className="font-bold text-lg block text-foreground tracking-tight">WhatsApp Direto</span>
                                        <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">Confirmação Rápida</span>
                                    </div>
                                </div>
                                <ChevronRight size={18} className="text-muted-foreground/30" />
                            </motion.button>
                        </div>
                    </div>
                </DrawerContent>
            </Drawer>
        </MobileLayout>
    );
};