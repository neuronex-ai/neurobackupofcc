import { NewPatientModal } from "../patients/NewPatientModal";
import { NewAppointmentModal } from "../agenda/NewAppointmentModal";
import { NewTransactionModal } from "../financeiro/NewTransactionModal";
import { NewProntuarioModal } from "../notes/NewProntuarioModal";
import { Plus, UserPlus, CreditCard, Mic, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface QuickActionsProps {
    variant?: 'compact' | 'grid' | 'dropdown';
}

export const QuickActions = ({ variant = 'compact' }: QuickActionsProps) => {
    if (variant === 'dropdown') {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button className="h-10 w-10 p-0 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl shadow-lg transition-all active:scale-[0.98] hover:scale-105 flex items-center justify-center">
                        <Plus className="h-5 w-5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-black/5 dark:border-white/10 bg-white/90 dark:bg-[#0a0a0c]/90 backdrop-blur-3xl shadow-2xl">
                    <NewAppointmentModal>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="gap-3 p-3 rounded-xl cursor-pointer hover:bg-zinc-100 dark:hover:bg-white/10 font-bold text-xs uppercase tracking-widest text-zinc-700 dark:text-zinc-300">
                            <Plus className="h-4 w-4 text-emerald-500" /> Nova Sessão
                        </DropdownMenuItem>
                    </NewAppointmentModal>
                    
                    <NewProntuarioModal>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="gap-3 p-3 rounded-xl cursor-pointer hover:bg-zinc-100 dark:hover:bg-white/10 font-bold text-xs uppercase tracking-widest text-zinc-700 dark:text-zinc-300">
                            <FileText className="h-4 w-4 text-indigo-500" /> Novo Prontuário
                        </DropdownMenuItem>
                    </NewProntuarioModal>

                    <NewPatientModal>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="gap-3 p-3 rounded-xl cursor-pointer hover:bg-zinc-100 dark:hover:bg-white/10 font-bold text-xs uppercase tracking-widest text-zinc-700 dark:text-zinc-300">
                            <UserPlus className="h-4 w-4 text-amber-500" /> Novo Paciente
                        </DropdownMenuItem>
                    </NewPatientModal>

                    <NewTransactionModal>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="gap-3 p-3 rounded-xl cursor-pointer hover:bg-zinc-100 dark:hover:bg-white/10 font-bold text-xs uppercase tracking-widest text-zinc-700 dark:text-zinc-300">
                            <CreditCard className="h-4 w-4 text-blue-500" /> Nova Taxa
                        </DropdownMenuItem>
                    </NewTransactionModal>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    if (variant === 'grid') {
        return (
            <div className="grid grid-cols-2 gap-3">
                <NewAppointmentModal>
                    <Button className="w-full h-12 bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg transition-all active:scale-[0.98]">
                        <Plus className="h-4 w-4 md:mr-3" /> <span className="hidden md:inline">Sessão</span>
                    </Button>
                </NewAppointmentModal>
                
                <NewProntuarioModal>
                    <Button className="w-full h-12 bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg transition-all active:scale-[0.98]">
                        <Mic className="h-4 w-4 md:mr-3" /> <span className="hidden md:inline">Prontuário</span>
                    </Button>
                </NewProntuarioModal>

                <NewPatientModal>
                    <Button variant="outline" className="w-full h-12 rounded-2xl border-black/[0.08] dark:border-white/[0.08] bg-white/50 dark:bg-white/[0.02] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/[0.06] font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-[0.98]">
                        <UserPlus className="h-4 w-4 md:mr-3" /> <span className="hidden md:inline">Paciente</span>
                    </Button>
                </NewPatientModal>

                <NewTransactionModal>
                    <Button variant="outline" className="w-full h-12 rounded-2xl border-black/[0.08] dark:border-white/[0.08] bg-white/50 dark:bg-white/[0.02] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/[0.06] font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-[0.98]">
                        <CreditCard className="h-4 w-4 md:mr-3" /> <span className="hidden md:inline">Taxa</span>
                    </Button>
                </NewTransactionModal>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <NewAppointmentModal>
                <Button className="bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 h-8 px-4 rounded-xl font-bold text-[9px] uppercase tracking-[0.15em] shadow-[0_1px_2px_rgba(0,0,0,0.1)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3)] transition-all duration-300 ease-apple active:scale-[0.96] hover:scale-[1.01]">
                    <Plus className="h-3.5 w-3.5 mr-1.5" /> <span className="hidden md:inline">Agendar</span>
                </Button>
            </NewAppointmentModal>

            <NewProntuarioModal>
                <Button className="bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 h-8 px-4 rounded-xl font-bold text-[9px] uppercase tracking-[0.15em] shadow-[0_1px_2px_rgba(0,0,0,0.1)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3)] transition-all duration-300 ease-apple active:scale-[0.96] hover:scale-[1.01]">
                    <Mic className="h-3.5 w-3.5 mr-1.5" /> <span className="hidden md:inline">Prontuário</span>
                </Button>
            </NewProntuarioModal>

            <NewPatientModal>
                <Button variant="outline" className="h-8 w-8 md:w-auto md:px-3 rounded-xl border-black/[0.06] dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] text-zinc-500/80/80 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.06] hover:border-black/[0.1] dark:hover:border-white/[0.10] transition-all duration-300 ease-apple active:scale-[0.96]">
                    <UserPlus className="h-3.5 w-3.5" />
                </Button>
            </NewPatientModal>

            <NewTransactionModal>
                <Button variant="outline" className="h-8 w-8 md:w-auto md:px-3 rounded-xl border-black/[0.06] dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] text-zinc-500/80/80 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.06] hover:border-black/[0.1] dark:hover:border-white/[0.10] transition-all duration-300 ease-apple active:scale-[0.96]">
                    <CreditCard className="h-3.5 w-3.5" />
                </Button>
            </NewTransactionModal>
        </div>
    );
};