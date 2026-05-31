import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SynapseTimelineEntry, SynapseExecState } from '@/context/SynapseProvider';
import { Check, AlertCircle, Loader2, Brain, Ear } from 'lucide-react';

// ─── State Icon Map ───────────────────────────────────────────────────

const STATE_ICON: Record<SynapseExecState, React.ReactNode> = {
    idle: <div className="w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-500" />,
    listening: <Ear className="h-3 w-3 text-blue-500 dark:text-blue-400" />,
    thinking: <Brain className="h-3 w-3 text-purple-500 dark:text-purple-400 animate-pulse" />,
    executing: <Loader2 className="h-3 w-3 text-amber-500 dark:text-amber-400 animate-spin" />,
    success: <Check className="h-3 w-3 text-emerald-500 dark:text-emerald-400" />,
    error: <AlertCircle className="h-3 w-3 text-red-500 dark:text-red-400" />,
};

const STATE_COLOR: Record<SynapseExecState, string> = {
    idle: 'border-zinc-300 dark:border-zinc-700',
    listening: 'border-blue-500/40',
    thinking: 'border-purple-500/40',
    executing: 'border-amber-500/40',
    success: 'border-emerald-500/40',
    error: 'border-red-500/40',
};

// ─── Component ────────────────────────────────────────────────────────

interface SynapseActionTimelineProps {
    entries: SynapseTimelineEntry[];
    compact?: boolean;
}

export const SynapseActionTimeline = ({ entries, compact = false }: SynapseActionTimelineProps) => {
    if (entries.length === 0) return null;

    const displayEntries = compact ? entries.slice(-3) : entries;

    return (
        <div className="flex flex-col gap-1 py-2">
            {compact && entries.length > 3 && (
                <div className="text-center">
                    <span className="text-[9px] text-zinc-500 dark:text-zinc-600 uppercase tracking-widest">
                        +{entries.length - 3} anteriores
                    </span>
                </div>
            )}

            {displayEntries.map((entry, i) => (
                <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-[14px]',
                        'bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.02] dark:border-white/[0.02]',
                        'border-l-2',
                        STATE_COLOR[entry.state]
                    )}
                >
                    {/* State Icon */}
                    <div className="shrink-0 w-5 h-5 flex items-center justify-center">
                        {STATE_ICON[entry.state]}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 truncate">
                            {entry.label}
                        </p>
                        {entry.detail && (
                            <p className="text-[9px] text-zinc-500 dark:text-zinc-500 truncate mt-0.5">
                                {entry.detail}
                            </p>
                        )}
                    </div>

                    {/* Timestamp */}
                    <span className="text-[9px] text-zinc-400 dark:text-zinc-600 tabular-nums shrink-0">
                        {entry.timestamp.toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </span>
                </motion.div>
            ))}
        </div>
    );
};
