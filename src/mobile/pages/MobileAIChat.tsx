"use client";

import { AIOptionsOrb } from "@/components/ai-chat/AIOptionsOrb";
import { ChatMessageItem } from "@/components/ai-chat/ChatMessageItem";
import { EmailDraftModal } from "@/components/ai-chat/EmailDraftModal";
import { InvoiceDraftModal } from "@/components/ai-chat/InvoiceDraftModal";
import { useAuth } from "@/components/auth/SessionContextProvider";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { useChatSessions, useCreateChatSession, useDeleteChatSession, useSendChatMessage, useSessionMessages } from "@/hooks/use-ai-chat";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AnimatePresence, motion } from "framer-motion";
import {
    ArrowLeft, Bell, Calendar, ChevronRight, DollarSign, History, MessageSquare, Mic, Phone, Plus, Send, Sparkles, Trash2, Users, SquarePen, X
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { MobileLayout } from "../components/MobileLayout";

const INITIAL_SUGGESTIONS = [
    { text: "Resumo da agenda", icon: Calendar },
    { text: "Financeiro hoje", icon: DollarSign },
    { text: "Pendências", icon: Users },
    { text: "Criar lembrete", icon: Bell },
];

export const MobileAIChat = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [mode, setMode] = useState<'chat' | 'call'>('chat');
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [lastResponse, setLastResponse] = useState<string>("");
    const [inputValue, setInputValue] = useState("");
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [, setIsUploading] = useState(false);

    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [emailDraftData, setEmailDraftData] = useState<any>(null);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [invoiceDraftData, setInvoiceDraftData] = useState<any>(null);
    const [richMessages, setRichMessages] = useState<Record<string, any>>({});

    const { data: sessions, isLoading: isLoadingSessions } = useChatSessions();
    const { data: messages } = useSessionMessages(sessionId);
    const { mutate: createSession } = useCreateChatSession();
    const { mutate: deleteSession } = useDeleteChatSession();
    const { mutate: sendMessage, isPending: isProcessing } = useSendChatMessage();

    const { isListening, transcript, startListening, stopListening, resetTranscript } = useSpeechRecognition();
    const { speak, stop: stopSpeaking } = useTextToSpeech();

    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!sessionId && !isLoadingSessions) {
            if (sessions && sessions.length > 0) {
                setSessionId(sessions[0].id);
            } else {
                createNewChat();
            }
        }
    }, [sessions, isLoadingSessions]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isProcessing, richMessages]);

    useEffect(() => {
        if (transcript) {
            setInputValue(transcript);
        }
    }, [transcript]);

    const createNewChat = () => {
        createSession(undefined, {
            onSuccess: (data) => {
                setSessionId(data.id);
                setLastResponse("");
                setInputValue("");
                resetTranscript();
                setIsHistoryOpen(false);
            }
        });
    };

    const handleDeleteSession = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        deleteSession(id);
        if (id === sessionId) createNewChat();
    };

    const handleSend = async (text: string = inputValue, attachments: File[] = []) => {
        const messageText = text.trim();
        if (!messageText && attachments.length === 0) return;
        if (!sessionId) return;

        setInputValue("");
        resetTranscript();
        stopListening();

        let uploadedFiles: { name: string, url: string }[] = [];

        if (attachments.length > 0) {
            setIsUploading(true);
            try {
                for (const file of attachments) {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                    const filePath = `${user?.id}/chat/${fileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('files_psico')
                        .upload(filePath, file);

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                        .from('files_psico')
                        .getPublicUrl(filePath);

                    uploadedFiles.push({ name: file.name, url: publicUrl });
                }
            } catch (e: any) {
                toast.error(`Erro no upload: ${e.message}`);
                setIsUploading(false);
                return;
            }
            setIsUploading(false);
        }

        // @ts-ignore
        sendMessage({ message: messageText, sessionId, attachments: uploadedFiles }, {
            onSuccess: (data: any) => {
                if (data?.response && mode === 'call') {
                    setLastResponse(data.response);
                    speak(data.response);
                }

                if (data.clientAction) {
                    if (data.clientAction.type === 'review_draft') {
                        setEmailDraftData(data.clientAction.payload);
                        setIsEmailModalOpen(true);
                    } else if (data.clientAction.type === 'review_invoice_draft') {
                        setInvoiceDraftData(data.clientAction.payload);
                        setIsInvoiceModalOpen(true);
                    } else {
                        setRichMessages(prev => ({ ...prev, latest: data.clientAction }));
                    }
                }
            }
        });
    };

    const toggleCallMode = () => {
        if (mode === 'chat') {
            setMode('call');
        } else {
            setMode('chat');
            stopListening();
            stopSpeaking();
        }
    };

    const groupedSessions = sessions?.reduce((acc, session) => {
        const date = new Date(session.created_at);
        let key = format(date, "yyyy-MM-dd");
        if (isToday(date)) key = "Hoje";
        else if (isYesterday(date)) key = "Ontem";
        else key = format(date, "dd/MM", { locale: ptBR });

        if (!acc[key]) acc[key] = [];
        acc[key].push(session);
        return acc;
    }, {} as Record<string, typeof sessions>);

    const hasMessages = messages && messages.length > 0;

    return (
        <MobileLayout showBottomNav={false} className="px-0 pt-0 pb-0 h-full flex flex-col bg-background overflow-hidden">

            {/* Ambient Background - Adjusted to cover top */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                <div className={cn(
                    "absolute -top-[10%] left-1/2 -translate-x-1/2 w-[140%] h-[120%] rounded-full blur-[150px] transition-all duration-1000",
                    mode === 'call' ? "bg-white/[0.05] animate-pulse" : "bg-primary/[0.08]"
                )} />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
            </div>

            {/* --- Premium Header Floating --- */}
            <header className="fixed top-4 left-0 right-0 z-[100] px-6 pt-safe-top flex items-center justify-between pointer-events-auto">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/mobile')}
                        className="h-11 w-11 rounded-full bg-white/5 dark:bg-white/5 backdrop-blur-3xl border border-white/10 hover:bg-white/10 text-muted-foreground hover:text-foreground active:scale-90 transition-all shadow-xl"
                    >
                        <ArrowLeft className="h-5.5 w-5.5" strokeWidth={2.5} />
                    </Button>
                    <Drawer open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                        <DrawerTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-11 w-11 rounded-full bg-white/5 dark:bg-white/5 backdrop-blur-3xl border border-white/10 hover:bg-white/10 text-muted-foreground hover:text-foreground active:scale-90 transition-all shadow-xl"
                            >
                                <History className="h-5.5 w-5.5" strokeWidth={2.5} />
                            </Button>
                        </DrawerTrigger>
                        <DrawerContent className="h-[85vh] bg-white/95 dark:bg-zinc-950/95 backdrop-blur-3xl border-t border-white/10 dark:border-white/5 p-0 flex flex-col rounded-t-[42px] focus:outline-none z-[200]">
                            <div className="py-6 flex justify-center">
                                <div className="w-12 h-1.5 bg-foreground/10 dark:bg-white/10 rounded-full" />
                            </div>
                            <div className="px-8 pb-6 border-b border-foreground/5 dark:border-white/5 flex items-center justify-between">
                                <h2 className="text-2xl font-black text-foreground tracking-tighter">
                                    Conversas
                                </h2>
                                <Button
                                    onClick={createNewChat}
                                    size="sm"
                                    className="h-10 px-5 rounded-2xl bg-foreground text-background font-black text-[11px] uppercase tracking-widest active:scale-95 transition-all shadow-xl"
                                >
                                    <Plus className="h-4 w-4 mr-2" strokeWidth={3} />
                                    Nova
                                </Button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 space-y-10 custom-scrollbar">
                                {groupedSessions && Object.entries(groupedSessions).map(([label, list]) => (
                                    <div key={label} className="space-y-4">
                                        <p className="text-[10px] font-black text-muted-foreground/40 dark:text-muted-foreground/30 uppercase tracking-[0.3em] px-2">{label}</p>
                                        <div className="space-y-2.5">
                                            {list.map(s => (
                                                <div
                                                    key={s.id}
                                                    onClick={() => { setSessionId(s.id); setIsHistoryOpen(false); }}
                                                    className={cn(
                                                        "group flex items-center justify-between p-5 rounded-[24px] cursor-pointer transition-all active:scale-[0.98]",
                                                        sessionId === s.id
                                                            ? "bg-foreground/5 dark:bg-white/5 border border-foreground/10 dark:border-white/10 ring-1 ring-foreground/5 dark:ring-white/5 shadow-sm"
                                                            : "hover:bg-foreground/[0.03] dark:hover:bg-white/[0.02] border border-transparent"
                                                    )}
                                                >
                                                    <span className="text-[15px] text-foreground/80 dark:text-foreground/90 truncate max-w-[200px] font-bold tracking-tight">
                                                        {s.title || "Nova Conversa"}
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 opacity-0 group-hover:opacity-100 hover:text-rose-500 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 rounded-xl transition-all"
                                                        onClick={(e) => handleDeleteSession(s.id, e)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </DrawerContent>
                    </Drawer>
                </div>

                <div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={createNewChat}
                        className="h-11 w-11 rounded-full bg-white/5 dark:bg-white/5 backdrop-blur-3xl border border-white/10 hover:bg-primary/10 text-muted-foreground hover:text-primary active:scale-90 transition-all shadow-xl"
                    >
                        <SquarePen className="h-5.5 w-5.5" strokeWidth={2.5} />
                    </Button>
                </div>
            </header>

            {/* --- Content Area --- */}
            <AnimatePresence mode="wait">
                {mode === 'call' ? (
                    <motion.div
                        key="call"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 flex flex-col items-center justify-center relative z-10 px-8 pb-20 pt-32 h-full"
                    >
                        <div className="absolute top-48 left-0 right-0 text-center px-10">
                            {lastResponse ? (
                                <motion.p 
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="text-2xl font-bold text-foreground tracking-tight leading-snug"
                                >
                                    "{lastResponse}"
                                </motion.p>
                            ) : (
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.4em]">Synapse Voice Ativo</p>
                            )}
                        </div>

                        <div className="mt-12">
                            <AIOptionsOrb
                                isRecording={isListening}
                                isProcessing={isProcessing}
                                onToggleRecording={() => isListening ? stopListening() : startListening()}
                                onReset={() => { stopSpeaking(); setLastResponse(""); }}
                            />
                        </div>

                        <Button
                            onClick={toggleCallMode}
                            className="absolute bottom-24 rounded-full h-16 px-10 bg-white/5 hover:bg-white/10 backdrop-blur-3xl border border-white/10 text-foreground font-black text-[11px] uppercase tracking-widest active:scale-95 transition-all shadow-2xl"
                        >
                            <MessageSquare className="h-4.5 w-4.5 mr-3" />
                            Modo Texto
                        </Button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="chat"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 flex flex-col relative z-10 overflow-hidden h-full"
                    >
                        {/* Messages Container */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pt-24 pb-48 custom-scrollbar scroll-smooth">
                            {!hasMessages ? (
                                <div className="min-h-full flex flex-col items-center justify-center text-center px-6">
                                    <motion.div
                                        initial={{ scale: 0.8, opacity: 0, y: 20 }}
                                        animate={{ scale: 1, opacity: 1, y: 0 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                        className="relative mb-6 flex flex-col items-center"
                                    >
                                        <div className="absolute -top-10 bg-primary/20 blur-[60px] h-32 w-32 rounded-full animate-pulse" />
                                        <Sparkles className="h-16 w-16 text-primary relative z-10" />
                                        
                                        <div className="mt-4 flex items-center gap-2 px-4 py-1.5 bg-white/5 dark:bg-white/5 backdrop-blur-3xl border border-white/10 rounded-full shadow-xl">
                                            <Sparkles className="w-3.5 h-3.5 text-primary fill-primary/20" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-foreground/90">Synapse</span>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                        className="space-y-3 mb-10"
                                    >
                                        <h2 className="text-3xl font-black text-foreground tracking-tighter">O que vamos fazer?</h2>
                                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.4em]">Inteligência Clínica</p>
                                    </motion.div>

                                    <motion.div
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.3 }}
                                        className="grid grid-cols-2 gap-2.5 w-full"
                                    >
                                        {INITIAL_SUGGESTIONS.map((sugg, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleSend(sugg.text)}
                                                className="flex flex-col items-start gap-3 p-4 rounded-[24px] bg-white/5 border border-white/5 hover:bg-foreground/[0.04] active:scale-[0.98] transition-all text-left group shadow-sm backdrop-blur-sm"
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300">
                                                    <sugg.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" strokeWidth={1.5} />
                                                </div>
                                                <span className="text-[13px] font-bold text-foreground/80 group-hover:text-foreground transition-colors tracking-tight leading-snug">{sugg.text}</span>
                                            </button>
                                        ))}
                                    </motion.div>
                                </div>
                            ) : (
                                <div className="space-y-4 pb-8">
                                    {messages?.map((msg, i) => {
                                        const isLastAssistant = i === messages.length - 1 && msg.role === 'assistant';
                                        const richData = isLastAssistant ? richMessages.latest : undefined;
                                        return (
                                            <ChatMessageItem
                                                key={msg.id}
                                                message={msg}
                                                richData={richData}
                                            />
                                        );
                                    })}

                                    {isProcessing && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex justify-start px-6 pt-2"
                                        >
                                            <div className="bg-secondary/30 backdrop-blur-md border border-border/5 p-4 rounded-[24px] rounded-bl-sm flex items-center gap-1.5 shadow-sm">
                                                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                                                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.15s]" />
                                                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.3s]" />
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Premium Input Area (Fixed Bottom) - Increased gradient height */}
                        <div className="fixed bottom-0 left-0 right-0 z-50 p-6 pt-20 pb-8 bg-gradient-to-t from-background via-background/95 to-transparent">
                            <div className="max-w-md mx-auto relative flex items-center gap-3">
                                <div className="flex-1 relative group">
                                    <Input
                                        ref={inputRef}
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                                        placeholder="Mensagem..."
                                        className="relative h-14 pl-6 pr-14 bg-white/5 dark:bg-white/[0.04] border-white/10 dark:border-white/5 rounded-[28px] text-foreground placeholder:text-muted-foreground/40 focus:bg-white/[0.08] focus:border-white/20 focus:ring-0 transition-all text-base font-medium shadow-2xl backdrop-blur-2xl ring-1 ring-black/5"
                                    />

                                    <button
                                        onClick={() => isListening ? stopListening() : startListening()}
                                        className={cn(
                                            "absolute right-1.5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-500",
                                            isListening
                                                ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.4)] scale-110"
                                                : "text-muted-foreground/60 hover:text-foreground hover:bg-white/10 active:scale-90"
                                        )}
                                    >
                                        {isListening ? (
                                            <div className="relative flex items-center justify-center">
                                                <div className="absolute inset-0 bg-white/30 rounded-full animate-ping" />
                                                <X className="w-5 h-5 relative z-10" />
                                            </div>
                                        ) : (
                                            <Mic className="w-5.5 h-5.5" strokeWidth={1.5} />
                                        )}
                                    </button>
                                </div>

                                <Button
                                    onClick={() => inputValue.trim() ? handleSend() : toggleCallMode()}
                                    disabled={isProcessing}
                                    className={cn(
                                        "h-14 w-14 rounded-full transition-all duration-500 shadow-2xl active:scale-90 flex items-center justify-center border-none",
                                        inputValue.trim()
                                            ? "bg-primary text-primary-foreground shadow-primary/20"
                                            : "bg-white/5 dark:bg-white/5 text-muted-foreground hover:text-foreground border border-white/10"
                                    )}
                                >
                                    {inputValue.trim() ? <Send className="w-5.5 h-5.5 ml-0.5" strokeWidth={2.5} /> : <Phone className="w-5.5 h-5.5" strokeWidth={1.5} />}
                                </Button>
                            </div>
                            
                            {isListening && (
                                <div className="absolute -top-14 left-0 right-0 flex justify-center pointer-events-none">
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        className="px-5 py-2 rounded-full bg-primary text-primary-foreground shadow-2xl text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2.5"
                                    >
                                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                        Sintonizando...
                                    </motion.div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modals */}
            <EmailDraftModal
                open={isEmailModalOpen}
                onOpenChange={setIsEmailModalOpen}
                initialData={emailDraftData}
                onSent={() => toast.info("Email enviado.")}
            />
            <InvoiceDraftModal
                open={isInvoiceModalOpen}
                onOpenChange={setIsInvoiceModalOpen}
                initialData={invoiceDraftData}
                onSent={() => toast.success("Cobrança criada com sucesso!")}
            />
        </MobileLayout>
    );
};