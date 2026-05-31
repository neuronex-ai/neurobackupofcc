import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { X, Sparkles, Activity, ChevronRight } from 'lucide-react';

interface SynapseAllActionsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    availableTools: any[];
    handleActionClick: (toolName: string) => void;
    ctxInfo: { label: string };
}

export function SynapseAllActionsModal({ open, onOpenChange, availableTools, handleActionClick, ctxInfo }: SynapseAllActionsModalProps) {
    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md"
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="w-full max-w-lg max-h-[80vh] bg-zinc-50 dark:bg-[#0a0a0c] rounded-[40px] border border-black/10 dark:border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col"
                    >
                        <div className="p-8 pb-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-zinc-950 dark:bg-white flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-white dark:text-zinc-950" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black uppercase tracking-tight text-zinc-950 dark:text-white italic leading-none">Protocolos Synapse</h2>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400 mt-1.5">Módulo: {ctxInfo.label}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => onOpenChange(false)}
                                className="p-2.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-zinc-400 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-6 space-y-2">
                            {availableTools.map((tool, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleActionClick(tool.name)}
                                    className="w-full flex items-center justify-between p-5 rounded-[24px] bg-white dark:bg-white/[0.02] border border-black/[0.03] dark:border-white/[0.05] hover:bg-zinc-950 dark:hover:bg-white hover:text-white dark:hover:text-zinc-950 transition-all duration-300 group/action"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center group-hover/action:bg-white/10 transition-colors">
                                            <Activity className="w-4 h-4 opacity-40" />
                                        </div>
                                        <span className="text-[13px] font-black uppercase italic tracking-tight">{tool.name.replace(/_/g, ' ')}</span>
                                    </div>
                                    <ChevronRight className="w-4 h-4 opacity-20 group-hover/action:opacity-100 group-hover/action:translate-x-1 transition-all" />
                                </button>
                            ))}
                        </div>

                        <div className="p-8 pt-4 border-t border-black/5 dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.01]">
                            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-400 text-center">
                                {availableTools.length} Ações Identificadas no Contexto Atual
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
