"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useSendReminder } from "@/hooks/use-send-reminder";
import { Appointment } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Users, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface MassReminderModalProps {
    appointments: Appointment[];
    children: React.ReactNode;
}

export const MassReminderModal = ({ appointments, children }: MassReminderModalProps) => {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);
    const [sentIds, setSentIds] = useState<string[]>([]);
    const { mutateAsync: sendEmail } = useSendReminder();

    const validAppointments = appointments.filter(apt => apt.status !== 'cancelled' && apt.type !== 'block');
    const pendingCount = validAppointments.filter(apt => !sentIds.includes(apt.id)).length;

    const handleSendAllEmails = async () => {
        if (pendingCount === 0) {
            toast.info("Nenhum paciente pendente.");
            return;
        }

        setIsProcessing(true);
        let successCount = 0;

        for (const apt of validAppointments) {
            if (sentIds.includes(apt.id) || !apt.patient_email) continue;

            try {
                await sendEmail({
                    appointmentId: apt.id,
                    patientEmail: apt.patient_email!,
                    patientName: apt.patient_name!,
                    startTime: apt.start_time,
                    endTime: apt.end_time,
                    type: apt.type,
                    meetLink: apt.google_meet_link || null,
                    location: apt.location || null
                });
                successCount++;
                setSentIds(prev => [...prev, apt.id]);
            } catch (e) {
                console.error(e);
            }
        }

        setIsProcessing(false);
        setStep(3); // Final success step
    };

    const resetModal = () => {
        setOpen(false);
        setTimeout(() => {
            setStep(1);
        }, 300);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="bg-white dark:bg-[#080809] border border-zinc-200 dark:border-white/10 sm:max-w-[480px] p-0 gap-0 overflow-hidden rounded-[40px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.2)] dark:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] backdrop-blur-3xl ring-1 ring-black/5 dark:ring-white/5 outline-none">
                <DialogClose className="absolute right-8 top-8 rounded-2xl p-3 bg-zinc-100 dark:bg-white/5 text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/10 transition-all z-50 shadow-sm">
                  <X className="h-4 w-4" />
                </DialogClose>

                <div className="p-12">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div 
                                key="step1" 
                                initial={{ opacity: 0, x: 20 }} 
                                animate={{ opacity: 1, x: 0 }} 
                                exit={{ opacity: 0, x: -20 }}
                                className="flex flex-col items-center text-center space-y-10"
                            >
                                <div className="w-24 h-24 rounded-[32px] bg-zinc-900 dark:bg-white text-white dark:text-black flex items-center justify-center shadow-2xl relative group transition-transform hover:scale-105 duration-700">
                                    <Users className="h-10 w-10 relative z-10" />
                                </div>

                                <div className="space-y-3">
                                    <h2 className="text-3xl font-black text-black dark:text-white uppercase tracking-tighter">Preparar Lembretes</h2>
                                    <p className="text-[10px] text-zinc-500/80/80 dark:text-zinc-500/80/80 font-black uppercase tracking-[0.35em] max-w-[280px] mx-auto leading-relaxed">
                                        Identificamos <span className="text-black dark:text-zinc-200">{pendingCount} atendimentos</span> elegíveis para notificação imediata.
                                    </p>
                                </div>

                                <Button onClick={() => setStep(2)} className="w-full h-16 bg-zinc-900 dark:bg-white text-white dark:text-black hover:scale-[1.02] active:scale-[0.98] rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl transition-all">
                                    Configurar Envio <ArrowRight className="ml-3 h-4 w-4" />
                                </Button>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div 
                                key="step2" 
                                initial={{ opacity: 0, x: 20 }} 
                                animate={{ opacity: 1, x: 0 }} 
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-10"
                            >
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setStep(1)} className="p-3 bg-zinc-100 dark:bg-white/5 rounded-2xl text-zinc-500/80/80 hover:text-black dark:hover:text-white transition-all">
                                        <ArrowLeft className="h-4 w-4" />
                                    </button>
                                    <div>
                                        <h3 className="text-xl font-black text-black dark:text-white uppercase tracking-tighter">Protocolo Ativo</h3>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Verificação de Segurança</p>
                                    </div>
                                </div>

                                <div className="p-8 bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/10 rounded-[32px] space-y-6">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-zinc-500/80/80 dark:text-zinc-500/80/80 uppercase tracking-widest">Canal</span>
                                        <span className="text-xs font-black text-black dark:text-white uppercase tracking-widest">E-mail Corporativo</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-zinc-500/80/80 dark:text-zinc-500/80/80 uppercase tracking-widest">Alvos</span>
                                        <span className="text-xs font-black text-black dark:text-white uppercase tracking-widest">{pendingCount} Pacientes</span>
                                    </div>
                                    <div className="h-px bg-zinc-200 dark:bg-white/10" />
                                    <p className="text-[11px] text-zinc-500/80/80 dark:text-zinc-400 font-medium leading-relaxed italic text-center">
                                        "Os lembretes incluem data, horário e link de teleconsulta caso aplicável."
                                    </p>
                                </div>

                                <Button onClick={handleSendAllEmails} disabled={isProcessing} className="w-full h-16 bg-zinc-900 dark:bg-white text-white dark:text-black hover:scale-[1.02] active:scale-[0.98] rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl transition-all">
                                    {isProcessing ? <Loader2 className="animate-spin h-5 w-5" /> : "Disparar Protocolo"}
                                </Button>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div 
                                key="step3" 
                                initial={{ opacity: 0, scale: 0.95 }} 
                                animate={{ opacity: 1, scale: 1 }} 
                                className="flex flex-col items-center text-center space-y-8"
                            >
                                <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                    <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-black dark:text-white uppercase tracking-tighter">Ciclo Concluído</h3>
                                    <p className="text-xs text-zinc-500/80/80 dark:text-zinc-400 font-bold uppercase tracking-widest mt-2">Lembretes em fila de entrega</p>
                                </div>
                                <Button onClick={resetModal} className="w-full h-16 bg-zinc-100 dark:bg-white/5 text-black dark:text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px]">Fechar Dashboard</Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

            </DialogContent>
        </Dialog>
    );
};
