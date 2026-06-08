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
    ChevronUp, Download, Frown, Laugh, Loader2, Meh, Paperclip, Smile, Target
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

interface PatientUnifiedTimelineProps {
    patientId: string;
}

const moodConfig: Record<number, { icon: any, color: string, label: string, bg: string, border: string }> = {
    1: { icon: Angry, color: "text-zinc-600 dark:text-zinc-400", label: "Péssimo", bg: "bg-white/64 dark:bg-[#0a0a0b]/58", border: "border-zinc-200/70 dark:border-white/[0.07]" },
    2: { icon: Frown, color: "text-zinc-600 dark:text-zinc-400", label: "Ruim", bg: "bg-white/64 dark:bg-[#0a0a0b]/58", border: "border-zinc-200/70 dark:border-white/[0.07]" },
    3: { icon: Meh, color: "text-zinc-900 dark:text-zinc-100", label: "Neutro", bg: "bg-white/64 dark:bg-[#0a0a0b]/58", border: "border-zinc-200/70 dark:border-white/[0.07]" },
    4: { icon: Smile, color: "text-zinc-900 dark:text-zinc-100", label: "Bem", bg: "bg-white/64 dark:bg-[#0a0a0b]/58", border: "border-zinc-200/70 dark:border-white/[0.07]" },
    5: { icon: Laugh, color: "text-zinc-900 dark:text-zinc-100", label: "Ótimo", bg: "bg-white/64 dark:bg-[#0a0a0b]/58", border: "border-zinc-200/70 dark:border-white/[0.07]" },
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
    const {
        data: timelinePages,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = usePatientTimeline(patientId);

    const timeline = useMemo(() => {
        const items = timelinePages?.pages.flatMap((page) => page.items) ?? [];
        return items.sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [timelinePages]);

    const handleDownload = useCallback(async (path: string) => {
        const { data } = await supabase.storage.from('files_psico').getPublicUrl(path);
        if (data?.publicUrl) window.open(data.publicUrl, '_blank');
        else toast.error("Erro ao abrir arquivo.");
    }, []);

    if (isLoading) {
        return (
            <div className="space-y-8 py-8 pl-9">
                {[1, 2].map((i) => (
                    <div key={i} className="relative">
                        <Skeleton className="h-4 w-32 bg-zinc-100 dark:bg-zinc-800 rounded mb-4" />
                        <Skeleton className="h-36 w-full rounded-3xl bg-muted" />
                    </div>
                ))}
            </div>
        );
    }

    if (!timeline || timeline.length === 0) {
        return (
            <GlassCard className="!rounded-[30px] !border-dashed !border-zinc-200/70 !bg-white/52 !py-24 !text-center !shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] !backdrop-blur-2xl dark:!border-white/[0.07] dark:!bg-[#0a0a0b]/52 dark:!shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">Linha do tempo vazia</p>
            </GlassCard>
        );
    }

    return (
        <div className="relative space-y-8 pb-24 pl-9 pr-1 pt-3">
            {/* Fine Filament Timeline Line */}
            <div className="absolute bottom-8 left-[15px] top-0 z-0 w-px bg-gradient-to-b from-transparent via-zinc-950/12 to-transparent dark:via-white/[0.08]" />

            {timeline.map((item, index) => {
                const isLatest = index === 0;
                return (
                    <motion.div
                        key={`${item.type}-${item.id}`}
                        initial={{ opacity: 0, y: 18, scale: 0.985 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{
                            duration: 0.46,
                            delay: Math.min(index, 8) * 0.026,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                        className="relative transform-gpu will-change-transform"
                    >
                        {/* Status/Type Connector Dot */}
                        <div className={cn(
                            "absolute -left-[26px] top-5 z-10 h-3.5 w-3.5 rounded-full border-2 bg-background shadow-[0_0_0_4px_rgba(255,255,255,0.45)] transition-all duration-300 dark:shadow-[0_0_0_4px_rgba(255,255,255,0.025)]",
                            isLatest
                                ? "scale-110 border-zinc-950 shadow-[0_0_0_5px_rgba(24,24,27,0.08)] dark:border-white dark:shadow-[0_0_0_5px_rgba(255,255,255,0.065)]"
                                : "border-zinc-300 dark:border-white/[0.14]"
                        )} />

                        {/* Date Header Segment */}
                        <div className="mb-4 flex items-center gap-4 pl-1">
                            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                                {format(item.date, "dd 'de' MMMM", { locale: ptBR })}
                            </span>
                            {isLatest && (
                                <div className="h-px w-12 bg-gradient-to-r from-border to-transparent" />
                            )}
                        </div>

                        {/* Event Card Content */}
                        <div className="group relative">
                            {item.type === 'note' && (
                                <GlassCard
                                    className="!rounded-[30px] !border-zinc-200/70 !bg-white/64 !p-6 !shadow-[0_22px_58px_-46px_rgba(24,24,27,0.45),inset_0_1px_0_rgba(255,255,255,0.76)] !backdrop-blur-2xl transition-all duration-300 hover:!border-zinc-300/80 hover:!bg-white/86 dark:!border-white/[0.07] dark:!bg-[#0a0a0b]/58 dark:!shadow-[0_24px_62px_-44px_rgba(0,0,0,0.92),inset_0_1px_0_rgba(255,255,255,0.032)] dark:hover:!border-white/[0.115] dark:hover:!bg-[#101012]/76"
                                    innerClassName="relative overflow-hidden"
                                >
                                    <div className="premium-noise pointer-events-none absolute inset-0 opacity-[0.012] dark:opacity-[0.022]" />
                                    <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent opacity-80 dark:via-white/[0.08]" />
                                    <div className="relative z-10 mb-6 flex items-center justify-between">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-zinc-900 dark:bg-white animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
                                                <h4 className="text-sm font-bold tracking-tight text-foreground">
                                                    Registro de sessão
                                                </h4>
                                            </div>
                                            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                                                {format(item.date, "HH:mm")} <span className="w-1.5 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800" /> {item.data.ai_summary?.sentiment || "Estável"}
                                            </p>
                                        </div>
                                        <BrainCircuit className="h-5 w-5 text-muted-foreground/45" />
                                    </div>

                                    {item.data.ai_summary ? (
                                        <div className="relative z-10 space-y-5">
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
                                    className="group !rounded-[30px] !border-zinc-200/70 !bg-white/64 !p-6 !shadow-[0_22px_58px_-46px_rgba(24,24,27,0.42),inset_0_1px_0_rgba(255,255,255,0.76)] !backdrop-blur-2xl transition-all duration-300 hover:!border-zinc-300/80 hover:!bg-white/86 dark:!border-white/[0.07] dark:!bg-[#0a0a0b]/58 dark:!shadow-[0_24px_62px_-44px_rgba(0,0,0,0.92),inset_0_1px_0_rgba(255,255,255,0.032)] dark:hover:!border-white/[0.115] dark:hover:!bg-[#101012]/76"
                                    innerClassName="flex items-center gap-5"
                                >
                                    <div className={cn(
                                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition-colors duration-300",
                                        item.data.is_completed
                                            ? "bg-zinc-900 text-zinc-100 dark:bg-white dark:text-black border-zinc-900 dark:border-white shadow-xl"
                                            : "bg-zinc-100 dark:bg-white/[0.03] text-zinc-400 dark:text-zinc-600 border-zinc-200/50 dark:border-white/[0.06]"
                                    )}>
                                        {item.data.is_completed ? <CheckCircle2 className="h-5 w-5" /> : <Target className="h-5 w-5" />}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <span className="text-[11px] text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.35em] font-black">
                                            {item.data.is_completed ? "Meta Alcançada" : "Evolução de Objetivo"}
                                        </span>
                                        <p className={cn("text-base font-bold tracking-tight",
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
                                        className={cn("group relative overflow-hidden !rounded-[30px] !p-6 !shadow-[0_22px_58px_-46px_rgba(24,24,27,0.42),inset_0_1px_0_rgba(255,255,255,0.76)] !backdrop-blur-2xl transition-all duration-300 hover:!border-zinc-300/80 hover:!bg-white/86 dark:!shadow-[0_24px_62px_-44px_rgba(0,0,0,0.92),inset_0_1px_0_rgba(255,255,255,0.032)] dark:hover:!border-white/[0.115] dark:hover:!bg-[#101012]/76", mood.bg, mood.border)}
                                        innerClassName="flex items-center gap-5"
                                    >
                                        <div className="premium-noise pointer-events-none absolute inset-0 opacity-[0.012] dark:opacity-[0.022]" />
                                        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-zinc-950/[0.025] blur-[90px] dark:bg-white/[0.035]" />
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-zinc-200/70 bg-white/74 shadow-sm ring-1 ring-white/60 dark:border-white/[0.07] dark:bg-white/[0.04] dark:ring-white/[0.035]">
                                            <Icon className={cn("h-6 w-6", mood.color)} />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <span className="text-[11px] uppercase tracking-[0.4em] font-black text-zinc-400 dark:text-zinc-600">Bem-estar Diário</span>
                                            <p className="text-base font-bold tracking-tight text-foreground">{mood.label}</p>
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
                                    className="group !rounded-[30px] !border-zinc-200/70 !bg-white/64 !p-6 !shadow-[0_22px_58px_-46px_rgba(24,24,27,0.42),inset_0_1px_0_rgba(255,255,255,0.76)] !backdrop-blur-2xl transition-all duration-300 hover:!border-zinc-300/80 hover:!bg-white/86 dark:!border-white/[0.07] dark:!bg-[#0a0a0b]/58 dark:!shadow-[0_24px_62px_-44px_rgba(0,0,0,0.92),inset_0_1px_0_rgba(255,255,255,0.032)] dark:hover:!border-white/[0.115] dark:hover:!bg-[#101012]/76"
                                    innerClassName="flex items-center justify-between"
                                >
                                    <div className="flex min-w-0 flex-1 items-center gap-5">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-muted/55 text-foreground shadow-sm">
                                            <Paperclip className="h-5 w-5" />
                                        </div>
                                        <div className="flex flex-col gap-2 min-w-0">
                                            <span className="text-[11px] text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.4em] font-black">Anexo Clínico</span>
                                            <p className="truncate pr-6 text-base font-bold tracking-tight text-foreground">
                                                {item.data.name}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 rounded-xl border border-border/70 bg-muted/55 text-muted-foreground transition-colors hover:bg-foreground hover:text-background"
                                        onClick={() => handleDownload(item.data.path)}
                                    >
                                        <Download className="h-4 w-4" />
                                    </Button>
                                </GlassCard>
                            )}
                        </div>
                    </motion.div>
                );
            })}

            {hasNextPage && (
                <div className="relative z-30 flex justify-center pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={isFetchingNextPage}
                        onClick={() => fetchNextPage()}
                        className="h-12 rounded-2xl border-zinc-200/70 bg-white/70 px-6 text-[10px] font-black uppercase tracking-[0.18em] text-foreground shadow-[0_18px_40px_-32px_rgba(24,24,27,0.45)] backdrop-blur-xl transition-all hover:bg-white active:scale-[0.98] dark:border-white/[0.075] dark:bg-white/[0.045] dark:hover:bg-white/[0.075]"
                    >
                        {isFetchingNextPage ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Carregando
                            </>
                        ) : (
                            <>
                                Mais registros
                                <ChevronDown className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </Button>
                </div>
            )}

            {/* End of Line Artistic Fade */}
            <div className="absolute left-[20px] bottom-0 w-[10px] h-64 bg-gradient-to-t from-zinc-50 dark:from-[#080809] to-transparent z-20 pointer-events-none" />
        </div>
    );
};
