"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RequirementsList } from "@/components/financeiro/RequirementsList";
import { AccountResolutionForm } from "@/components/financeiro/AccountResolutionForm";

interface NeuroFinanceVerificationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedRequirement: string | null;
    setSelectedRequirement: (req: string | null) => void;
    onSuccess: () => void;
}

export function NeuroFinanceVerificationModal({
    open,
    onOpenChange,
    selectedRequirement,
    setSelectedRequirement,
    onSuccess
}: NeuroFinanceVerificationModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[1200px] h-[90vh] bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-white/10 p-0 overflow-hidden flex flex-col rounded-[32px] shadow-2xl">
                <DialogHeader className="p-8 pb-6 border-b border-zinc-100 dark:border-white/5 shrink-0 bg-white dark:bg-zinc-950">
                    <DialogTitle className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter">CENTRO DE VERIFICAÇÃO NeuroFinance</DialogTitle>
                    <DialogDescription className="text-sm text-zinc-500 font-medium tracking-tight">Resolva as pendências para liberar todos os recursos da sua conta.</DialogDescription>
                </DialogHeader>

                <div className="flex-1 flex overflow-hidden bg-white dark:bg-zinc-950 relative">
                    <div className="absolute inset-0 premium-noise opacity-[0.02] pointer-events-none" />
                    <aside className="w-[420px] border-r border-zinc-100 dark:border-white/5 p-10 overflow-y-auto bg-white dark:bg-zinc-950 custom-scrollbar hidden lg:block relative z-10">
                        <RequirementsList onSelectRequirement={setSelectedRequirement} activeRequirement={selectedRequirement} />
                    </aside>
                    <div className="flex-1 bg-zinc-50/50 dark:bg-black/40 p-12 overflow-auto relative custom-scrollbar z-10">
                        <AnimatePresence mode="wait">
                            {selectedRequirement ? (
                                <motion.div key={selectedRequirement} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="max-w-xl mx-auto">
                                    <AccountResolutionForm requirement={selectedRequirement} onSuccess={onSuccess} />
                                </motion.div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-6">
                                    <div className="w-24 h-24 rounded-[40px] bg-zinc-100 dark:bg-white/5 flex items-center justify-center mb-2"><ShieldCheck className="w-10 h-10 text-zinc-300 dark:text-zinc-700" /></div>
                                    <div><h4 className="text-sm font-black uppercase tracking-tight text-zinc-900 dark:text-white mb-2">Selecione uma ação</h4><p className="text-[11px] font-medium text-zinc-400 leading-relaxed uppercase tracking-widest">Atualize as informações solicitadas diretamente aqui.</p></div>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
