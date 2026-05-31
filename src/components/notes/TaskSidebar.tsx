"use client";

import { cn } from "@/lib/utils";
import {
    LayoutGrid,
    List,
    Columns,
    Inbox,
    Clock,
    CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TaskSidebarProps {
    view: 'list' | 'grid' | 'kanban';
    setView: (v: 'list' | 'grid' | 'kanban') => void;
    filter: 'all' | 'pending' | 'completed';
    setFilter: (f: 'all' | 'pending' | 'completed') => void;
    isListCollapsed?: boolean;
}

export const TaskSidebar = ({ view, setView, filter, setFilter, isListCollapsed = false }: TaskSidebarProps) => {
    return (
        <motion.div
            animate={{ width: isListCollapsed ? 0 : 320 }}
            transition={{ type: "spring", stiffness: 300, damping: 35 }}
            className="shrink-0 border-r border-zinc-200/50 dark:border-white/[0.05] bg-white/40 dark:bg-black/20 flex flex-col overflow-hidden relative backdrop-blur-3xl"
        >
            <div className="absolute inset-0 premium-noise opacity-[0.03] pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-900/5 dark:via-white/5 to-transparent pointer-events-none" />

            <AnimatePresence mode="wait">
                {!isListCollapsed && (
                    <motion.div
                        key="content"
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="p-10 space-y-14 relative z-10 w-[320px]"
                    >
                        <div className="space-y-8">
                            <label className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-400 dark:text-zinc-600 px-1 block mb-6">Orquestração</label>
                            <div className="flex flex-col gap-3">
                                {[
                                    { id: 'kanban', icon: Columns, label: 'Kanban Board' },
                                    { id: 'list', icon: List, label: 'Lista Dinmica' },
                                    { id: 'grid', icon: LayoutGrid, label: 'Grid Adaptativo' }
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setView(item.id as any)}
                                        className={cn(
                                            "flex items-center gap-5 px-6 py-5 rounded-[24px] transition-all duration-700 font-bold text-xs relative overflow-hidden group",
                                            view === item.id
                                                ? "bg-zinc-900 text-white dark:bg-white dark:text-black shadow-[0_20px_40px_-12px_rgba(0,0,0,0.3)] scale-[1.02]"
                                                : "text-zinc-500 hover:bg-zinc-900/5 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white"
                                        )}
                                    >
                                        <item.icon className={cn("h-4 w-4 transition-transform duration-700", view === item.id ? "scale-110" : "group-hover:translate-x-1")} />
                                        <span className="tracking-widest uppercase text-[10px] font-black">{item.label}</span>
                                        {view === item.id && (
                                            <motion.div
                                                layoutId="active-view"
                                                className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-8">
                            <label className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-400 dark:text-zinc-600 px-1 block mb-6">Filtros de Prioridade</label>
                            <div className="flex flex-col gap-3">
                                {[
                                    { id: 'all', icon: Inbox, label: 'Todos os Fluxos' },
                                    { id: 'pending', icon: Clock, label: 'Ciclos Pendentes' },
                                    { id: 'completed', icon: CheckCircle2, label: 'Concluídos' }
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setFilter(item.id as any)}
                                        className={cn(
                                            "flex items-center gap-5 px-6 py-5 rounded-[24px] transition-all duration-700 font-bold text-xs relative overflow-hidden group",
                                            filter === item.id
                                                ? "bg-zinc-900 text-white dark:bg-white dark:text-black shadow-[0_20px_40px_-12px_rgba(0,0,0,0.3)] scale-[1.02]"
                                                : "text-zinc-500 hover:bg-zinc-900/5 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white"
                                        )}
                                    >
                                        <item.icon className={cn("h-4 w-4 transition-transform duration-700", filter === item.id ? "scale-110" : "group-hover:translate-x-1")} />
                                        <span className="tracking-widest uppercase text-[10px] font-black">{item.label}</span>
                                        {filter === item.id && (
                                            <motion.div
                                                layoutId="active-filter"
                                                className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};