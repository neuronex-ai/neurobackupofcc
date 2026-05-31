"use client";

import { ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Clock, FileText, Send, PlusCircle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export const NfseGenerateModal = ({ children }: { children: ReactNode }) => {
    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-[700px] bg-white dark:bg-[#0A0A0B] border-zinc-200 dark:border-white/5 p-0 overflow-hidden flex flex-col rounded-[48px] shadow-2xl z-[150] backdrop-blur-3xl outline-none [&>button]:hidden">
                <DialogHeader className="px-10 py-8 border-b border-zinc-100 dark:border-white/5 flex flex-row items-center justify-between space-y-0 bg-zinc-50/50 dark:bg-white/[0.01]">
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-[18px] bg-zinc-900 dark:bg-white text-white dark:text-black flex items-center justify-center shadow-xl">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-[0.2em] leading-none mb-1.5">
                                Emissão de NFS-e
                            </DialogTitle>
                            <p className="text-[9px] text-zinc-400 font-black uppercase tracking-[0.3em] opacity-60">Notas Fiscais de Serviço</p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 p-10 bg-zinc-50/30 dark:bg-black/20 overflow-y-auto custom-scrollbar">
                    <div className="grid gap-6">
                        <motion.div
                            whileHover={{ y: -2 }}
                            className="bg-zinc-50 dark:bg-zinc-900/50 rounded-[32px] p-6 border border-zinc-200/50 dark:border-white/5 flex items-start gap-5 group cursor-pointer"
                        >
                            <div className="w-12 h-12 rounded-[16px] bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                                <PlusCircle className="h-5 w-5" />
                            </div>
                            <div className="flex-1 pt-1">
                                <h4 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-1">Nova Emissão</h4>
                                <p className="text-xs text-zinc-500">Gerar nota fiscal para um paciente, consultoria ou serviço psicológico.</p>
                            </div>
                            <div className="pt-3 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Send className="h-4 w-4 text-emerald-500" />
                            </div>
                        </motion.div>

                        <motion.div
                            whileHover={{ y: -2 }}
                            className="bg-zinc-50 dark:bg-zinc-900/50 rounded-[32px] p-6 border border-zinc-200/50 dark:border-white/5 flex items-start gap-5 group cursor-pointer"
                        >
                            <div className="w-12 h-12 rounded-[16px] bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                                <Clock className="h-5 w-5" />
                            </div>
                            <div className="flex-1 pt-1">
                                <h4 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-1">Notas Suspensas / Agendadas</h4>
                                <p className="text-xs text-zinc-500">Vizualize notas a serem emitidas em datas futuras automaticamente.</p>
                            </div>
                        </motion.div>

                        <div className="pt-4 border-t border-zinc-200 dark:border-white/5 space-y-4">
                            <h5 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Últimas Notas Geradas</h5>
                            <div className="text-center py-10">
                                <CheckCircle2 className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
                                <p className="text-xs text-zinc-500">Nenhuma nota emitida recentemente.</p>
                            </div>
                        </div>

                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
