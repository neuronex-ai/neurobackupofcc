"use client";

import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Skeleton } from "@/components/ui/skeleton";
import { usePatientTimeline } from "@/hooks/use-patient-timeline";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import {
    Angry, BrainCircuit, CheckCircle2, ChevronDown,
    ChevronUp, Download, Frown, Laugh, Meh, Paperclip, Smile, Target
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface PatientUnifiedTimelineProps {
    patientId: string;
}

const moodConfig: Record<number, { icon: any, color: string, label: string, bg: string, border: string }> = {
    1: { icon: Angry, color: "text-zinc-600 dark:text-zinc-400", label: "Péssimo", bg: "bg-zinc-100 dark:bg-white/[0.02]", border: "border-zinc-200 dark:border-white/[0.06]" },
    2: { icon: Frown, color: "text-zinc-600 dark:text-zinc-400", label: "Ruim", bg: "bg-zinc-100 dark:bg-white/[0.02]", border: "border-zinc-200 dark:border-white/[0.06]" },
    3: { icon: Meh, color: "text-zinc-900 dark:text-zinc-100", label: "Neutro", bg: "bg-zinc-100 dark:bg-white/[0.02]", border: "border-zinc-200 dark:border-white/[0.06]" },
    4: { icon: Smile, color: "text-zinc-900 dark:text-zinc-100", label: "Bem", bg: "bg-zinc-100 dark:bg-white/[0.02]", border: "border-zinc-200 dark:border-white/[0.06]" },
    5: { icon: Laugh, color: "text-zinc-900 dark:text-zinc-100", label: "Ótimo", bg: "bg-zinc-100 dark:bg-white/[0.02]", border: "border-zinc-200 dark:border-white/[0.06]" },
};

const ExpandableText = ({ text, className, limit = 150 }: { text: string, className?: string, limit?: number }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!text) return null;

    const shouldTruncate = text.length > limit;

    return (
        <div className="relative">
            <p className={cn(className, !isExpanded && shouldTruncate ? "line-clamp-3" : "")}>
                {text}
            </p>
            {shouldTruncate && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(!isExpanded);
                    }}
                    className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100 hover:opacity-70 mt-3 transition-all"
                >
                    {isExpanded ? (
                        <>Recolher <ChevronUp className="h-3 w-3" /></>
                    ) : (
                        <>Ler mais <ChevronDown className="h-3 w-3" /></>
                    )}
                </button>
            )}
        </div>
    );
};

export const PatientUnifiedTimeline = ({ patientId }: PatientUnifiedTimelineProps) => {
    const { data: timeline, isLoading } = usePatientTimeline(patientId);

    const handleDownload = async (path: string) => {
        const { data } = await supabase.storage.from('files_psico').getPublicUrl(path);
        if (data?.publicUrl) window.open(data.publicUrl, '_blank');
        else toast.error("Erro ao abrir arquivo.");
    };

    if (isLoading) {
        return (
            <div className="space-y-12 pl-12 py-10">
                {[1, 2].map((i) => (
                    <div key={i} className="relative">
                        <Skeleton className="h-4 w-32 bg-zinc-100 dark:bg-zinc-800 rounded mb-4" />
                        <Skeleton className="h-40 w-full bg-zinc-100 dark:bg-zinc-800 rounded-[32px]" />
                    </div>
                ))}
            </div>
        );
    }

    if (!timeline || timeline.length === 0) {
        return (
            <GlassCard className="flex flex-col items-center justify-center py-32 text-center border-dashed">
                <p className="text-sm font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-[0.3em]">Linha do Tempo Vazia</p>
            </GlassCard>
        );
    }

    return (
        <div className="relative pl-12 space-y-16 pt-4 pb-40">
            {/* Fine Filament Timeline Line */}
            <div className="absolute left-[24px] top-0 bottom-10 w-[1px] bg-gradient-to-b from-transparent via-zinc-200 dark:via-white/20 to-transparent z-0" />

            {timeline.map((item, index) => {
                const isLatest = index === 0;
                return (
                    <motion.div
                        key={`${item.type}-${item.id}`}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: index * 0.05 }}
                        className="relative"
                    >
                        {/* Status/Type Connector Dot */}
                        <div className={cn(
                            "absolute -left-[33px] top-6 w-4.5 h-4.5 rounded-full z-10 transition-all duration-700 border-2 bg-white dark:bg-[#080809]",
                            isLatest
                                ? "border-zinc-900 dark:border-white shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-110"
                                : "border-zinc-200 dark:border-zinc-800"
                        )} />

                        {/* Date Header Segment */}
                        <div className="mb-8 pl-2 flex items-center gap-6">
                            <span className="text-[11px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.4em]">
                                {format(item.date, "dd 'de' MMMM", { locale: ptBR })}
                            </span>
                            {isLatest && (
                                <div className="h-px w-16 bg-gradient-to-r from-zinc-200 dark:from-white/20 to-transparent" />
                            )}
                        </div>

                        {/* Event Card Content */}
                        <div className="group relative">
                            {item.type === 'note' && (
                                <GlassCard
                                    className="p-10 hover:-translate-y-1.5 transition-all duration-700 shadow-sm hover:shadow-2xl"
                                    innerClassName="relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-32 bg-zinc-500/5 dark:bg-white/[0.03] rounded-full blur-[80px] pointer-events-none group-hover:bg-zinc-500/10 dark:group-hover:bg-white/10 transition-all duration-700 opacity-0 group-hover:opacity-100" />

                                    <div className="flex items-center justify-between mb-10 relative z-10">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-zinc-900 dark:bg-white animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
                                                <h4 className="text-base font-black text-zinc-900 dark:text-white tracking-tighter uppercase">
                                                    Registro de Sessão
                                                </h4>
                                            </div>
                                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-[0.3em] flex items-center gap-3">
                                                {format(item.date, "HH:mm")} <span className="w-1.5 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800" /> {item.data.ai_summary?.sentiment || "Estável"}
                                            </p>
                                        </div>
                                        <BrainCircuit className="h-6 w-6 text-zinc-200 dark:text-zinc-800 opacity-40" />
                                    </div>

                                    {item.data.ai_summary ? (
                                        <div className="space-y-8 relative z-10">
                                            <ExpandableText
                                                text={item.data.ai_summary.summary}
                                                className="text-sm md:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium"
                                            />
                                            <div className="flex flex-wrap gap-3 pt-4">
                                                {item.data.ai_summary.topics?.slice(0, 5).map((t: string, i: number) => (
                                                    <span key={i} className="text-[10px] bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] px-3.5 py-2 rounded-xl text-zinc-500 dark:text-zinc-400 font-black uppercase tracking-widest shadow-sm">
                                                        {t}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative z-10">
                                            <ExpandableText
                                                text={item.data.notes}
                                                className="text-sm md:text-base text-zinc-600 dark:text-zinc-400 italic font-medium leading-relaxed"
                                            />
                                        </div>
                                    )}
                                </GlassCard>
                            )}

                            {item.type === 'goal' && (
                                <GlassCard
                                    className="p-8 md:p-10 hover:shadow-2xl transition-all duration-700 group"
                                    innerClassName="flex items-center gap-8"
                                >
                                    <div className={cn(
                                        "w-16 h-16 rounded-[24px] shrink-0 transition-all duration-700 group-hover:scale-110 flex items-center justify-center border-2",
                                        item.data.is_completed
                                            ? "bg-zinc-900 text-zinc-100 dark:bg-white dark:text-black border-zinc-900 dark:border-white shadow-xl"
                                            : "bg-zinc-100 dark:bg-white/[0.03] text-zinc-400 dark:text-zinc-600 border-zinc-200/50 dark:border-white/[0.06]"
                                    )}>
                                        {item.data.is_completed ? <CheckCircle2 className="h-7 w-7" /> : <Target className="h-7 w-7" />}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <span className="text-[11px] text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.35em] font-black">
                                            {item.data.is_completed ? "Meta Alcançada" : "Evolução de Objetivo"}
                                        </span>
                                        <p className={cn("text-lg font-black tracking-tighter",
                                            item.data.is_completed
                                                ? "text-zinc-400 dark:text-zinc-600 line-through decoration-zinc-300 dark:decoration-zinc-700"
                                                : "text-zinc-900 dark:text-white"
                                        )}>
                                            {item.data.description}
                                        </p>
                                    </div>
                                </GlassCard>
                            )}

                            {item.type === 'mood' && (() => {
                                const mood = moodConfig[item.data.mood_score] || moodConfig[3];
                                const Icon = mood.icon;
                                return (
                                    <GlassCard
                                        className={cn("p-8 md:p-10 group hover:shadow-2xl transition-all duration-700 overflow-hidden relative", mood.bg, mood.border)}
                                        innerClassName="flex items-center gap-8"
                                    >
                                        <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/5 dark:bg-white/5 rounded-full blur-[100px] pointer-events-none" />
                                        <div className="w-16 h-16 rounded-[24px] bg-white dark:bg-[#080809] shadow-xl ring-1 ring-zinc-900/5 dark:ring-white/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-700">
                                            <Icon className={cn("h-8 w-8", mood.color)} />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <span className="text-[11px] uppercase tracking-[0.4em] font-black text-zinc-400 dark:text-zinc-600">Bem-estar Diário</span>
                                            <p className="text-lg font-black text-zinc-900 dark:text-white tracking-tighter uppercase">{mood.label}</p>
                                            {item.data.notes && (
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400 italic mt-3 line-clamp-2 font-medium bg-white/50 dark:bg-black/20 px-4 py-2 rounded-xl border border-zinc-200/50 dark:border-white/[0.06] shadow-inner">
                                                    "{item.data.notes}"
                                                </p>
                                            )}
                                        </div>
                                    </GlassCard>
                                );
                            })()}

                            {item.type === 'document' && (
                                <GlassCard
                                    className="p-8 md:p-10 group hover:shadow-2xl transition-all duration-700"
                                    innerClassName="flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-8 flex-1 min-w-0">
                                        <div className="w-16 h-16 rounded-[24px] bg-zinc-100 dark:bg-white/[0.04] text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/[0.1] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-700 shadow-sm">
                                            <Paperclip className="h-7 w-7" />
                                        </div>
                                        <div className="flex flex-col gap-2 min-w-0">
                                            <span className="text-[11px] text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.4em] font-black">Anexo Clínico</span>
                                            <p className="text-lg font-black text-zinc-900 dark:text-white truncate pr-6 tracking-tighter group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors uppercase">
                                                {item.data.name}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-14 w-14 rounded-[24px] bg-zinc-100 dark:bg-white/[0.04] hover:bg-zinc-900 dark:hover:bg-white text-zinc-500 dark:text-zinc-500 hover:text-white dark:hover:text-black transition-all border border-zinc-200 dark:border-white/[0.08] active:scale-90 shadow-sm"
                                        onClick={() => handleDownload(item.data.path)}
                                    >
                                        <Download className="h-6 w-6" />
                                    </Button>
                                </GlassCard>
                            )}
                        </div>
                    </motion.div>
                );
            })}

            {/* End of Line Artistic Fade */}
            <div className="absolute left-[20px] bottom-0 w-[10px] h-64 bg-gradient-to-t from-zinc-50 dark:from-[#080809] to-transparent z-20 pointer-events-none" />
        </div>
    );
};