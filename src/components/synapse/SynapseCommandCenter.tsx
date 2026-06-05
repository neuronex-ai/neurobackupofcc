"use client";

import { useMemo, useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/SessionContextProvider";
import { useSynapseChat } from "@/hooks/use-synapse-chat";
import { useSynapse } from "@/context/SynapseProvider";
import { useAppointmentsByDateRange } from "@/hooks/use-appointments-by-date-range";
import { usePendingPatientsCount } from "@/hooks/use-pending-patients-count";
import { isCancelledAppointmentStatus } from "@/lib/appointment-status";
import { startOfDay, endOfDay, addDays, isSameDay, format, isAfter } from "date-fns";
import {
    Sparkles,
    ArrowUp,
    Sun,
    CloudSun,
    Moon,
    MessageSquare,
    Loader2,
    Bot,
    User as UserIcon,
    Eraser,
    Copy,
    Check,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SynapseWidgetRenderer } from "./SynapseWidgetRenderer";


// ─── Greeting Logic ───────────────────────────────────────────────────

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: "Bom dia", Icon: Sun };
    if (hour < 18) return { text: "Boa tarde", Icon: CloudSun };
    return { text: "Boa noite", Icon: Moon };
};

// ─── Component ────────────────────────────────────────────────────────

export const SynapseCommandCenter = () => {
    const { user } = useAuth();
    const { setShellState } = useSynapse();
    const { send, messages, isSending, sessionReady, clearSession } = useSynapseChat();
    const [input, setInput] = useState("");
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleCopy = (id: string, content: string) => {
        navigator.clipboard.writeText(content);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Data for smart suggestions
    const today = new Date();
    const { data: appointments } = useAppointmentsByDateRange(startOfDay(today), endOfDay(addDays(today, 7)));
    const { data: pendingPatients } = usePendingPatientsCount();

    const greeting = getGreeting();
    const GreetingIcon = greeting.Icon;

    const firstName = useMemo(() => {
        const rawName = user?.user_metadata?.first_name || user?.email?.split("@")[0] || "Doutor(a)";
        return rawName.split(" ")[0].charAt(0).toUpperCase() + rawName.split(" ")[0].slice(1).toLowerCase();
    }, [user]);

    // Smart suggestion pills — context-aware operational actions
    const suggestions = useMemo(() => {
        const pills: { label: string; message: string }[] = [];

        // Next appointment patient
        const nextApt = appointments
            ?.filter((a) => isAfter(new Date(a.start_time), new Date()) && !isCancelledAppointmentStatus(a.status, a.notes))
            ?.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())?.[0];

        if (nextApt?.patient_name) {
            pills.push({
                label: `Preparar sessão de ${nextApt.patient_name.split(" ")[0]}`,
                message: `Me ajude a preparar para a sessão com ${nextApt.patient_name} que acontece às ${format(new Date(nextApt.start_time), "HH:mm")}.`,
            });
        }

        // Pending patients
        if ((pendingPatients || 0) > 0) {
            pills.push({
                label: `Revisar ${pendingPatients} pacientes pendentes`,
                message: `Tenho ${pendingPatients} pacientes pendentes. Me ajude a revisar e organizar.`,
            });
        }

        // Today appointment count
        const todayCount = appointments?.filter((a) =>
            isSameDay(new Date(a.start_time), today) &&
            !isCancelledAppointmentStatus(a.status, a.notes)
        )?.length || 0;
        if (todayCount > 0) {
            pills.push({
                label: `Resumo dos ${todayCount} atendimentos de hoje`,
                message: `Faça um resumo dos meus ${todayCount} atendimentos de hoje e me ajude com a priorização.`,
            });
        }

        // Always have a financial suggestion
        pills.push({
            label: "Análise financeira da semana",
            message: "Me dê uma análise financeira resumida da semana: faturamento, sessões realizadas e pendências.",
        });

        return pills.slice(0, 4);
    }, [appointments, pendingPatients, today]);

    // Auto-scroll to latest message
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: "smooth"
            });
        }
    }, [messages, isSending]);

    const handleSend = () => {
        if (!input.trim() || !sessionReady) return;
        send(input.trim());
        setInput("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (!isSending) handleSend();
        }
    };

    const handleSuggestionClick = (message: string) => {
        if (!sessionReady) return;
        send(message);
    };

    const hasMessages = messages.length > 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05, ease: [0.23, 1, 0.32, 1] }}
            className={cn(
                "relative overflow-hidden rounded-[32px]",
                "bg-zinc-50/90 dark:bg-[#0a0a0c]/90",
                "backdrop-blur-3xl saturate-150",
                "border border-black/5 dark:border-white/[0.04]",
                "shadow-[0_16px_48px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.02)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,255,255,0.04)]"
            )}
        >
            {/* Subtle gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />

            <div className="p-8 lg:p-10 space-y-8">
                {/* ── Header ─────────────────────────────────────────────── */}
                <div className="flex items-start justify-between">
                    <div className="space-y-4 flex-1">
                        {/* Section label */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-black/5 dark:bg-white/[0.04] border border-black/5 dark:border-white/[0.06]">
                                <GreetingIcon className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-600 dark:text-zinc-400">
                                    Converse com sua clínica
                                </span>
                            </div>
                        </div>

                        {/* Greeting */}
                        <div>
                            <h2 className="text-3xl lg:text-4xl font-black text-black dark:text-white tracking-tighter leading-tight">
                                {greeting.text},{" "}
                                <span className="text-zinc-400 dark:text-zinc-600">{firstName}.</span>
                            </h2>
                            <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-1.5 font-medium">
                                O que posso fazer pela sua clínica hoje?
                            </p>
                        </div>
                    </div>

                    {/* Synapse icon & Actions */}
                    <div className="flex items-center gap-2">
                        {messages.length > 0 && (
                            <button
                                onClick={clearSession}
                                className="w-10 h-10 rounded-xl bg-black/5 hover:bg-black/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-black/5 dark:border-white/[0.06] flex items-center justify-center transition-colors mr-2"
                                title="Limpar conversa"
                            >
                                <Eraser className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                            </button>
                        )}
                        <motion.div
                            animate={{ scale: [1, 1.04, 1], opacity: [0.8, 1, 0.8] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/10 dark:border-white/[0.06] flex items-center justify-center"
                        >
                            <Sparkles className="h-6 w-6 text-purple-500/60 dark:text-purple-400/50" />
                        </motion.div>
                    </div>
                </div>

                {/* ── Suggestion Pills ───────────────────────────────────── */}
                {!hasMessages && (
                    <div className="flex flex-wrap gap-2.5">
                        {suggestions.map((s, idx) => (
                            <motion.button
                                key={idx}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 + idx * 0.08 }}
                                onClick={() => handleSuggestionClick(s.message)}
                                disabled={isSending || !sessionReady}
                                className={cn(
                                    "px-4 py-2.5 rounded-2xl",
                                    "text-[11px] font-bold text-left",
                                    "bg-black/[0.03] dark:bg-white/[0.03]",
                                    "border border-black/[0.04] dark:border-white/[0.06]",
                                    "text-zinc-600 dark:text-zinc-400",
                                    "hover:bg-black/[0.06] dark:hover:bg-white/[0.06]",
                                    "hover:border-black/[0.08] dark:hover:border-white/[0.12]",
                                    "hover:text-zinc-900 dark:hover:text-zinc-200",
                                    "transition-all duration-300",
                                    "active:scale-[0.97]",
                                    "disabled:opacity-40 disabled:pointer-events-none"
                                )}
                            >
                                {s.label}
                            </motion.button>
                        ))}
                    </div>
                )}

                {/* ── Messages Area ──────────────────────────────────────── */}
                {hasMessages && (
                    <div
                        ref={scrollRef}
                        className="max-h-[320px] overflow-y-auto space-y-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800 -mr-2 pr-2"
                    >
                        <AnimatePresence initial={false}>
                            {messages.slice(-10).map((msg, idx) => (
                                <motion.div
                                    key={msg.id || idx}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.25 }}
                                    className={cn(
                                        "flex gap-3",
                                        msg.role === "user" ? "justify-end" : "justify-start"
                                    )}
                                >
                                    {msg.role === "assistant" && (
                                        <div className="shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-purple-500/15 to-blue-500/15 border border-purple-500/10 flex items-center justify-center mt-0.5">
                                            <Bot className="h-3.5 w-3.5 text-purple-400/70" />
                                        </div>
                                    )}
                                    <div
                                        className={cn(
                                            "relative group max-w-[75%] px-4 py-3 rounded-[20px] text-[13px] leading-relaxed shadow-sm",
                                            msg.role === "user"
                                                ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium"
                                                : "bg-white/60 dark:bg-white/[0.04] text-zinc-800 dark:text-zinc-200 border border-black/5 dark:border-white/[0.06] backdrop-blur-md"
                                        )}
                                    >
                                        {msg.role === "assistant" && (
                                            <button
                                                onClick={() => handleCopy(msg.id, msg.content)}
                                                className="absolute -right-10 top-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-500"
                                                title="Copiar mensagem"
                                            >
                                                {copiedId === msg.id ? (
                                                    <Check className="h-3.5 w-3.5 text-green-500" />
                                                ) : (
                                                    <Copy className="h-3.5 w-3.5" />
                                                )}
                                            </button>
                                        )}
                                        {msg.role === "assistant" ? (
                                            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-zinc-800 prose-pre:text-zinc-100">
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm as any]}
                                                    components={{
                                                        code({ node, inline, className, children, ...props }: any) {
                                                            const match = /language-(\w+)/.exec(className || '');
                                                            if (!inline && match && match[1] === 'json' && String(children).includes('__actionType')) {
                                                                try {
                                                                    const parsedData = JSON.parse(String(children));
                                                                    return <SynapseWidgetRenderer widgetData={parsedData} />;
                                                                } catch (e) {
                                                                    console.error("Widget render error:", e);
                                                                }
                                                            }
                                                            return <code className={className} {...props}>{children}</code>;
                                                        }
                                                    }}
                                                >
                                                    {msg.content}
                                                </ReactMarkdown>
                                            </div>
                                        ) : (
                                            msg.content
                                        )}
                                    </div>
                                    {msg.role === "user" && (
                                        <div className="shrink-0 w-7 h-7 rounded-full bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/5 flex items-center justify-center mt-0.5">
                                            <UserIcon className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400" />
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Typing indicator */}
                        {isSending && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center gap-3"
                            >
                                <div className="shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-purple-500/15 to-blue-500/15 border border-purple-500/10 flex items-center justify-center">
                                    <Bot className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div className="px-4 py-3.5 rounded-[20px] bg-white/60 dark:bg-white/[0.04] border border-black/5 dark:border-white/[0.06] shadow-sm backdrop-blur-md">
                                    <div className="flex items-center gap-1 h-3">
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }}
                                            transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                                            className="w-1.5 h-1.5 rounded-full bg-purple-500/50"
                                        />
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }}
                                            transition={{ repeat: Infinity, duration: 1.2, delay: 0.2, ease: "easeInOut" }}
                                            className="w-1.5 h-1.5 rounded-full bg-purple-500/50"
                                        />
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }}
                                            transition={{ repeat: Infinity, duration: 1.2, delay: 0.4, ease: "easeInOut" }}
                                            className="w-1.5 h-1.5 rounded-full bg-purple-500/50"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                )}

                {/* ── Input Bar ───────────────────────────────────────────── */}
                <div
                    className={cn(
                        "flex items-end gap-3 rounded-2xl",
                        "bg-black/[0.02] dark:bg-white/[0.03]",
                        "border border-black/[0.05] dark:border-white/[0.06]",
                        "px-4 py-3",
                        "focus-within:border-black/[0.15] dark:focus-within:border-white/[0.15]",
                        "focus-within:bg-white/80 dark:focus-within:bg-white/[0.05]",
                        "focus-within:shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:focus-within:shadow-none",
                        "transition-all duration-300"
                    )}
                >
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Peça qualquer coisa ao Synapse..."
                        rows={1}
                        disabled={!sessionReady || isSending}
                        className={cn(
                            "flex-1 bg-transparent text-[13px] py-1",
                            "text-zinc-800 dark:text-zinc-200",
                            "placeholder:text-zinc-400 dark:placeholder:text-zinc-600",
                            "resize-none outline-none max-h-36",
                            "leading-relaxed",
                            "disabled:opacity-50"
                        )}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isSending || !sessionReady}
                        className={cn(
                            "shrink-0 w-9 h-9 rounded-xl flex items-center justify-center",
                            "transition-all duration-200",
                            input.trim() && sessionReady
                                ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:scale-105 active:scale-90 shadow-lg"
                                : "bg-black/5 dark:bg-white/5 text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
                        )}
                    >
                        {isSending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <ArrowUp className="h-4 w-4" />
                        )}
                    </button>
                </div>

                {/* ── Footer ─────────────────────────────────────────────── */}
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-3 w-3 text-zinc-300 dark:text-zinc-700" />
                        <span className="text-[8px] text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em] font-black">
                            Synapse AI
                        </span>
                    </div>
                    <button
                        onClick={() => setShellState("compact")}
                        className="flex items-center gap-1.5 text-[9px] text-zinc-400 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors font-bold uppercase tracking-wider"
                    >
                        <MessageSquare className="h-3 w-3" />
                        Abrir painel
                    </button>
                </div>
            </div>
        </motion.div >
    );
};
