import { useState } from "react";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { ArrowRightLeft, CalendarDays, Loader2, ArrowRight, CheckCircle2, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useDayOperations } from "@/hooks/use-day-operations";
import { useAuth } from "@/components/auth/SessionContextProvider";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";

interface MassRescheduleModalProps {
    children?: React.ReactNode;
    currentDate: Date;
}

export const MassRescheduleModal = ({ children, currentDate }: MassRescheduleModalProps) => {
    const [open, setOpen] = useState(false);
    const [sourceDate, setSourceDate] = useState<Date | undefined>(currentDate);
    const [targetDate, setTargetDate] = useState<Date | undefined>();
    const [step, setStep] = useState<'source' | 'target' | 'confirm'>('source');

    const { calculateMove, executeMove, isCalculating, isExecuting } = useDayOperations();
    const { user } = useAuth();
    const [operations, setOperations] = useState<any[]>([]);

    const handleCalculate = async () => {
        if (!sourceDate || !targetDate || !user) return;

        const ops = await calculateMove(sourceDate, targetDate, user.id);
        if (ops.length === 0) {
            toast.info("Nenhum agendamento encontrado na data de origem.");
            return;
        }
        setOperations(ops);
        setStep('confirm');
    };

    const handleExecute = async () => {
        const result = await executeMove(operations);

        // Only close if we had at least one successful update
        if (result.success) {
            // Longer delay to ensure React Query has time to refetch and update the UI
            await new Promise(resolve => setTimeout(resolve, 1000));
            setOpen(false);
            reset();
        }
    };

    const reset = () => {
        setTimeout(() => {
            setStep('source');
            setOperations([]);
            setTargetDate(undefined);
            setSourceDate(currentDate);
        }, 300);
    };

    const motionProps = {
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 },
        transition: { duration: 0.3, ease: "easeInOut" as const },
    };

    return (
        <ResponsiveModal
            open={open}
            onOpenChange={(val) => { setOpen(val); if (!val) reset(); }}
            trigger={children || (
                <Button variant="outline" size="sm" className="gap-2 border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-neutral-100">
                    <ArrowRightLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Reagendar</span>
                </Button>
            )}
            className="sm:max-w-md bg-black/50 backdrop-blur-2xl border border-neutral-800 p-0 overflow-hidden rounded-2xl shadow-2xl gap-0 outline-none"
            drawerClassName="bg-neutral-900 border-t border-neutral-800"
        >
            <div className="flex flex-col relative">

                <div className="p-6 border-b border-neutral-800">
                    <DialogHeader>
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2.5 rounded-lg bg-neutral-800/50 text-neutral-300 border border-neutral-700/80">
                                <ArrowRightLeft className="h-5 w-5" />
                            </div>
                            <div className="flex gap-1.5">
                                <div className={cn("w-2 h-2 rounded-full transition-all duration-300", step === 'source' ? "bg-white w-5" : "bg-neutral-700")} />
                                <div className={cn("w-2 h-2 rounded-full transition-all duration-300", step === 'target' ? "bg-white w-5" : "bg-neutral-700")} />
                                <div className={cn("w-2 h-2 rounded-full transition-all duration-300", step === 'confirm' ? "bg-white w-5" : "bg-neutral-700")} />
                            </div>
                        </div>
                        <DialogTitle className="text-xl font-semibold text-neutral-100 tracking-tight">
                            Mover Agenda em Massa
                        </DialogTitle>
                        <DialogDescription className="text-sm text-neutral-400">
                            Transfira múltiplos atendimentos de forma inteligente.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6 min-h-[410px] flex flex-col relative">
                    <AnimatePresence mode="wait">

                        {step === 'source' && (
                            <motion.div
                                key="source"
                                {...motionProps}
                                className="flex-1 flex flex-col gap-4"
                            >
                                <div className="text-center space-y-1">
                                    <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Passo 1 de 3</span>
                                    <h3 className="text-lg font-medium text-neutral-100">Qual dia deseja mover?</h3>
                                </div>

                                <div className="flex justify-center bg-neutral-900/50 rounded-xl p-2 border border-neutral-800">
                                    <Calendar
                                        mode="single"
                                        selected={sourceDate}
                                        onSelect={setSourceDate}
                                        initialFocus
                                        locale={ptBR}
                                        className="bg-transparent"
                                    />
                                </div>

                                <Button
                                    onClick={() => setStep('target')}
                                    disabled={!sourceDate}
                                    className="w-full h-11 rounded-lg font-semibold text-sm bg-white text-black hover:bg-neutral-200 mt-auto transition-all active:scale-[0.98]"
                                >
                                    Escolher Destino <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                            </motion.div>
                        )}

                        {step === 'target' && (
                            <motion.div
                                key="target"
                                {...motionProps}
                                className="flex-1 flex flex-col gap-4"
                            >
                                <div className="text-center space-y-1">
                                    <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Passo 2 de 3</span>
                                    <h3 className="text-lg font-medium text-neutral-100">Para qual dia?</h3>
                                    <p className="text-sm text-neutral-400">
                                        Origem: <span className="text-neutral-100 font-semibold">{sourceDate ? format(sourceDate, "dd 'de' MMMM", { locale: ptBR }) : '-'}</span>
                                    </p>
                                </div>

                                <div className="flex justify-center bg-neutral-900/50 rounded-xl p-2 border border-neutral-800">
                                    <Calendar
                                        mode="single"
                                        selected={targetDate}
                                        onSelect={setTargetDate}
                                        initialFocus
                                        locale={ptBR}
                                        disabled={(date) => date < new Date() || (sourceDate ? date.toDateString() === sourceDate.toDateString() : false)}
                                        className="bg-transparent"
                                    />
                                </div>

                                <div className="flex gap-3 mt-auto">
                                    <Button variant="outline" onClick={() => setStep('source')} className="h-11 rounded-lg text-sm flex-1 border-neutral-700 hover:bg-neutral-800 hover:text-neutral-200">Voltar</Button>
                                    <Button
                                        onClick={handleCalculate}
                                        disabled={!targetDate || isCalculating}
                                        className="h-11 rounded-lg font-semibold text-sm bg-white text-black hover:bg-neutral-200 flex-[2] transition-all active:scale-[0.98]"
                                    >
                                        {isCalculating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verificar Conflitos"}
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {step === 'confirm' && (
                            <motion.div
                                key="confirm"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="flex-1 flex flex-col items-center justify-center text-center gap-6"
                            >
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center relative z-10">
                                        <CalendarDays className="h-8 w-8 text-neutral-400" />
                                        <div className="absolute -top-2 -right-2 bg-white text-black text-xs font-bold w-7 h-7 flex items-center justify-center rounded-full border-4 border-neutral-900">
                                            {operations.length}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-xl font-semibold text-neutral-100">Confirmar Mudança</h3>

                                    <div className="flex items-center justify-center gap-3 text-sm">
                                        <div className="text-neutral-300 text-center">
                                            <p className="text-xs text-neutral-500 font-medium mb-0.5">De</p>
                                            <p className="font-semibold">{sourceDate ? format(sourceDate, "dd MMM", { locale: ptBR }) : ''}</p>
                                        </div>
                                        <ArrowRight className="text-neutral-600 w-4 h-4 mt-4" />
                                        <div className="text-neutral-300 text-center">
                                            <p className="text-xs text-neutral-500 font-medium mb-0.5">Para</p>
                                            <p className="font-semibold">{targetDate ? format(targetDate, "dd MMM", { locale: ptBR }) : ''}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-yellow-900/20 border border-yellow-500/20 p-3 rounded-lg text-left w-full flex items-start gap-3">
                                    <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
                                    <p className="text-xs text-yellow-200/70 leading-relaxed">
                                        Horários conflitantes serão mantidos na data original. Pacientes podem ser notificados sobre a mudança.
                                    </p>
                                </div>

                                <div className="flex gap-3 w-full mt-auto">
                                    <Button variant="outline" onClick={() => setStep('target')} className="h-11 rounded-lg text-sm flex-1 border-neutral-700 hover:bg-neutral-800 hover:text-neutral-200">Voltar</Button>
                                    <Button
                                        onClick={handleExecute}
                                        disabled={isExecuting}
                                        className="h-11 rounded-lg font-semibold text-sm bg-white text-black hover:bg-neutral-200 flex-[2] transition-all active:scale-[0.98]"
                                    >
                                        {isExecuting ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Executar</span>}
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>
            </div>
        </ResponsiveModal>
    );
};