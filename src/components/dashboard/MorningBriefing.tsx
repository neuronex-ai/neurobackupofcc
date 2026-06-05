"use client";

import { useAuth } from "@/components/auth/SessionContextProvider";
import { Appointment } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Sun, CloudSun, Moon, X, ArrowRight } from "lucide-react";
import { SmartInsightsWidget } from "./SmartInsightsWidget";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { useState, useMemo } from "react";
import { SubscriptionBadge } from "./SubscriptionBadge";
import { useSubscription } from "@/context/SubscriptionContext";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { QuickActions } from "./QuickActions";

interface MorningBriefingProps {
    appointments: Appointment[];
    pendingPatients: number;
}

export const MorningBriefing = ({ appointments, pendingPatients }: MorningBriefingProps) => {
    const { user } = useAuth();
    const { plan } = useSubscription();
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [modalStep, setModalStep] = useState(1);

    const hour = new Date().getHours();

    let greeting = { text: "Bom dia", icon: Sun };
    if (hour >= 12 && hour < 18) greeting = { text: "Boa tarde", icon: CloudSun };
    else if (hour >= 18) greeting = { text: "Boa noite", icon: Moon };

    const GreetingIcon = greeting.icon;

    const todayAppointments = useMemo(() =>
        appointments.filter(a => a.status !== 'cancelled' && a.type !== 'block')
            .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()),
        [appointments]
    );

    const firstName = useMemo(() => {
        const rawName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Doutor(a)';
        return rawName.split(' ')[0].charAt(0).toUpperCase() + rawName.split(' ')[0].slice(1).toLowerCase();
    }, [user]);

    return (
        <div className="relative p-6 lg:p-10 space-y-10 animate-fade-in bg-white dark:bg-[#080809]">
            {/* Header Greeting */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 rounded-full bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.06] flex items-center gap-3 shadow-sm">
                        <GreetingIcon className="h-3.5 w-3.5 text-zinc-500/80 dark:text-zinc-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500/80 dark:text-zinc-400">
                            {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                        </span>
                    </div>
                    <SubscriptionBadge plan={plan} />
                </div>

                <h2 className="text-5xl md:text-[4.5rem] font-black text-black dark:text-white tracking-tighter leading-[0.9]">
                    {greeting.text}, <span className="text-zinc-400 dark:text-zinc-700">{firstName}.</span>
                </h2>
            </div>

            {/* Mini-Cards Row: Quick Actions (left) + NeuroInsights (right) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Left Card - Ações Rápidas */}
                <QuickActions variant="dashboard-card" />

                {/* Right Card - NeuroInsights (scrollable) */}
                <SmartInsightsWidget variant="dashboard-card" />
            </div>

            {/* Details Modal remains available via other triggers if needed */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="sm:max-w-[550px] rounded-[48px] border-zinc-200 dark:border-white/10 bg-white dark:bg-[#080809] backdrop-blur-3xl shadow-[0_64px_128px_-32px_rgba(0,0,0,0.5)] p-0 overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
                    <DialogClose className="absolute right-8 top-8 rounded-2xl p-3 bg-zinc-100 dark:bg-white/5 text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/10 transition-all z-50 shadow-sm">
                        <X className="h-4 w-4" />
                    </DialogClose>

                    <div className="p-12">
                        <div className="flex gap-1.5 mb-10 justify-center">
                            {[1, 2].map(i => (
                                <div key={i} className={cn("h-1 rounded-full transition-all duration-700", modalStep >= i ? "w-10 bg-zinc-900 dark:bg-white" : "w-4 bg-zinc-100 dark:bg-white/10")} />
                            ))}
                        </div>

                        <AnimatePresence mode="wait">
                            {modalStep === 1 ? (
                                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                                    <div className="space-y-3">
                                        <h3 className="text-3xl font-black text-black dark:text-white tracking-tighter uppercase">Ciclo Diário</h3>
                                        <p className="text-[10px] text-zinc-500/80 dark:text-zinc-500/80 font-black uppercase tracking-[0.3em]">Resumo de Performance Clínica</p>
                                    </div>

                                    <div className="p-8 rounded-[32px] bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 space-y-6">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Sessões Totais</span>
                                            <span className="text-xl font-black text-black dark:text-white">{todayAppointments.length}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Confirmadas</span>
                                            <span className="text-xl font-black text-emerald-500">{todayAppointments.filter(a => a.status === 'confirmed').length}</span>
                                        </div>
                                        <div className="h-px bg-zinc-200 dark:bg-white/10" />
                                        <p className="text-sm text-zinc-500/80 font-bold leading-relaxed italic text-center">"Sua agenda está operando em capacidade otimizada hoje."</p>
                                    </div>

                                    <Button onClick={() => setModalStep(2)} className="w-full h-16 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl transition-all">
                                        Ver Agenda Completa <ArrowRight className="ml-3 h-4 w-4" />
                                    </Button>
                                </motion.div>
                            ) : (
                                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                                    <div className="space-y-3">
                                        <h3 className="text-3xl font-black text-black dark:text-white tracking-tighter uppercase">Cronograma</h3>
                                        <p className="text-[10px] text-zinc-500/80 dark:text-zinc-500/80 font-black uppercase tracking-[0.3em]">Atendimentos Confirmados</p>
                                    </div>

                                    <div className="space-y-4 max-h-[40vh] overflow-y-auto custom-scrollbar pr-4 -mr-4">
                                        {todayAppointments.map((app) => (
                                            <div key={app.id} className="group flex flex-col p-6 rounded-[28px] bg-zinc-50 dark:bg-white/[0.03] border border-zinc-100 dark:border-white/[0.06] hover:bg-zinc-100 dark:hover:bg-white/[0.05] transition-all duration-500 shadow-sm">
                                                <div className="flex justify-between items-center mb-4">
                                                    <span className="text-lg font-black text-black dark:text-white tracking-tighter tabular-nums">
                                                        {format(new Date(app.start_time), "HH:mm")}
                                                    </span>
                                                    <span className="text-[8px] uppercase font-black text-zinc-500/80 px-3 py-1.5 rounded-lg bg-white dark:bg-black/40 border border-zinc-200 dark:border-white/5">
                                                        {app.type}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-base text-zinc-800 dark:text-zinc-200 font-black tracking-tight uppercase truncate mr-4">
                                                        {app.patient_name || "Paciente"}
                                                    </span>
                                                    <div className={cn(
                                                        "w-2 h-2 rounded-full",
                                                        app.status === 'confirmed' ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-800"
                                                    )} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex gap-4">
                                        <Button variant="ghost" onClick={() => setModalStep(1)} className="h-16 px-8 rounded-2xl text-zinc-400 hover:text-black dark:hover:text-white uppercase tracking-widest text-[10px] font-black border border-zinc-200/50 dark:border-white/5">Voltar</Button>
                                        <Button onClick={() => setIsDetailsOpen(false)} className="flex-1 h-16 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl uppercase tracking-[0.3em] text-[10px] font-black shadow-2xl">Fechar Detalhes</Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};