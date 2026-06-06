"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RequirementsList } from "@/components/financeiro/RequirementsList";
import { AccountResolutionForm } from "@/components/financeiro/AccountResolutionForm";
import { AsaasAccountStatusTimeline } from "@/components/financeiro/AsaasAccountStatusTimeline";

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
            <DialogContent className="sm:max-w-[1180px] h-[88vh] bg-white/90 dark:bg-zinc-950/95 border border-zinc-200/50 dark:border-white/10 p-0 overflow-hidden flex flex-col rounded-[36px] shadow-[0_40px_120px_-48px_rgba(0,0,0,0.75)] backdrop-blur-3xl">
                <DialogHeader className="p-8 pb-6 border-b border-zinc-100 dark:border-white/5 shrink-0 bg-white/80 dark:bg-zinc-950/80">
                    <DialogTitle className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Análise cadastral</DialogTitle>
                    <DialogDescription className="text-sm text-zinc-500 font-medium tracking-tight">Status de aprovação atualizado diretamente pela Asaas.</DialogDescription>
                </DialogHeader>

                <div className="flex-1 flex overflow-hidden bg-white dark:bg-zinc-950 relative">
                    <div className="absolute inset-0 premium-noise opacity-[0.02] pointer-events-none" />
                    <aside className="w-[360px] border-r border-zinc-100 dark:border-white/5 p-7 overflow-y-auto bg-white/70 dark:bg-zinc-950/70 custom-scrollbar hidden lg:block relative z-10 space-y-6">
                        <RequirementsList onSelectRequirement={setSelectedRequirement} activeRequirement={selectedRequirement} />
                        <div className="rounded-[26px] border border-zinc-200/70 bg-white/70 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
                            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/5">
                                <ShieldCheck className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
                            </div>
                            <h4 className="text-xs font-black uppercase tracking-[0.16em] text-zinc-900 dark:text-white">Acompanhamento</h4>
                            <p className="mt-2 text-xs font-medium leading-relaxed text-zinc-500 dark:text-zinc-400">
                                A timeline principal mostra a análise cadastral sincronizada pela Asaas. Pendências acionáveis aparecem nesta coluna quando houver correção necessária.
                            </p>
                        </div>
                    </aside>
                    <div className="flex-1 bg-zinc-50/50 dark:bg-black/40 p-12 overflow-auto relative custom-scrollbar z-10">
                        <AnimatePresence mode="wait">
                            {selectedRequirement ? (
                                <motion.div key={selectedRequirement} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="max-w-xl mx-auto">
                                    <AccountResolutionForm requirement={selectedRequirement} onSuccess={onSuccess} />
                                </motion.div>
                            ) : (
                                <div className="mx-auto flex min-h-full max-w-3xl flex-col justify-center space-y-6">
                                    <AsaasAccountStatusTimeline />
                                    <div className="rounded-[28px] border border-zinc-200/70 bg-white/80 p-6 text-center shadow-sm dark:border-white/10 dark:bg-white/[0.03] lg:hidden">
                                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/5">
                                            <ShieldCheck className="h-6 w-6 text-zinc-400 dark:text-zinc-500" />
                                        </div>
                                        <h4 className="text-sm font-black uppercase tracking-tight text-zinc-900 dark:text-white">Acompanhamento cadastral</h4>
                                        <p className="mx-auto mt-2 max-w-md text-xs font-medium leading-relaxed text-zinc-500 dark:text-zinc-400">
                                            Quando a Asaas solicitar correção documental ou cadastral, as ações disponíveis aparecerão na coluna de pendências.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
