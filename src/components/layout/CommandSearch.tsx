"use client";

import * as React from "react";
import {
    Search,
    User,
    FileText,
    Calendar,
    DollarSign,
    Command,
    ArrowRight,
    Loader2,
    CheckSquare,
    Sparkles,
    StickyNote
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SearchResult {
    id: string;
    title: string;
    subtitle: string;
    type: 'patient' | 'note' | 'appointment' | 'finance' | 'ai' | 'reminder' | 'personal_note';
    url: string;
    date?: string;
}

export const CommandSearch = ({ open, setOpen }: { open: boolean, setOpen: (open: boolean) => void }) => {
    const [query, setQuery] = React.useState("");
    const [results, setResults] = React.useState<SearchResult[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [activeIndex, setActiveIndex] = React.useState(0);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen(true);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, [setOpen]);

    React.useEffect(() => {
        if (open) {
            inputRef.current?.focus();
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
            setQuery("");
            setResults([]);
        }
    }, [open]);

    React.useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setLoading(true);
            try {
                // Fetch basic data from multiple tables
                const [
                    { data: patients },
                    { data: notes },
                    { data: appointments },
                    { data: finance },
                    { data: reminders },
                    { data: personalNotes },
                    { data: aiMessages }
                ] = await Promise.all([
                    supabase.from('patients').select('id, name').ilike('name', `%${query}%`).limit(3),
                    supabase.from('session_notes').select('id, patient_id, created_at, patients(name)').ilike('notes', `%${query}%`).limit(3),
                    supabase.from('appointments').select('id, patient_name, start_time').ilike('patient_name', `%${query}%`).limit(3),
                    supabase.from('transactions').select('id, description, amount, date').ilike('description', `%${query}%`).limit(3),
                    supabase.from('reminders').select('id, title, due_date').ilike('title', `%${query}%`).limit(3),
                    supabase.from('personal_notes').select('id, title, created_at').ilike('title', `%${query}%`).limit(3),
                    supabase.from('messages').select('id, content, created_at').ilike('content', `%${query}%`).limit(3)
                ]);

                const formattedResults: SearchResult[] = [];

                // 1. Ask Synapse AI Option (Always First if query exists)
                formattedResults.push({
                    id: 'ask-synapse',
                    title: `Perguntar sobre "${query}"`,
                    subtitle: 'Synapse AI Assistant',
                    type: 'ai',
                    url: `/synapse-ai?q=${encodeURIComponent(query)}`
                });

                patients?.forEach(p => formattedResults.push({
                    id: p.id,
                    title: p.name,
                    subtitle: 'Registro de Paciente',
                    type: 'patient',
                    url: `/pacientes/${p.id}`
                }));

                notes?.forEach((n: any) => {
                    const pName = Array.isArray(n.patients) ? n.patients[0]?.name : n.patients?.name;
                    formattedResults.push({
                        id: n.id,
                        title: `Sessão: ${pName || 'Paciente'}`,
                        subtitle: `Nota de ${format(new Date(n.created_at), "dd/MM/yyyy")}`,
                        type: 'note',
                        url: `/notas?noteId=${n.id}`
                    });
                });

                appointments?.forEach(a => formattedResults.push({
                    id: a.id,
                    title: `Consulta: ${a.patient_name}`,
                    subtitle: format(new Date(a.start_time), "dd 'de' MMMM", { locale: ptBR }),
                    type: 'appointment',
                    url: `/agenda/${a.id}`
                }));

                finance?.forEach(f => formattedResults.push({
                    id: f.id,
                    title: f.description,
                    subtitle: `Lançamento: R$ ${f.amount.toLocaleString('pt-BR')}`,
                    type: 'finance',
                    url: `/financeiro`
                }));

                reminders?.forEach(r => formattedResults.push({
                    id: r.id,
                    title: r.title,
                    subtitle: `Lembrete p/ ${format(new Date(r.due_date), "dd/MM")}`,
                    type: 'reminder',
                    url: `/dashboard`
                }));

                personalNotes?.forEach(pn => formattedResults.push({
                    id: pn.id,
                    title: pn.title,
                    subtitle: 'Nota Pessoal / Protocolo',
                    type: 'personal_note',
                    url: `/notas?noteId=${pn.id}`
                }));

                aiMessages?.forEach(m => formattedResults.push({
                    id: m.id,
                    title: m.content.substring(0, 40) + '...',
                    subtitle: 'Histórico Synapse AI',
                    type: 'ai',
                    url: `/synapse-ai`
                }));

                setResults(formattedResults);
            } catch (err) {
                console.error("Search error:", err);
            } finally {
                setLoading(false);
            }
        }, 400);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const handleSelect = (url: string) => {
        setOpen(false);
        navigate(url);
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((prev) => (prev + 1) % results.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((prev) => (prev - 1 + results.length) % results.length);
        } else if (e.key === "Enter" && results[activeIndex]) {
            handleSelect(results[activeIndex].url);
        } else if (e.key === "Escape") {
            setOpen(false);
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[140] flex items-start justify-center pt-[15vh] px-4 pointer-events-auto">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-md"
                    />

                    {/* Command Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className="w-full max-w-2xl bg-popover/80 dark:bg-popover/40 backdrop-blur-[40px] border border-border/20 rounded-[40px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] dark:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9)] overflow-hidden relative z-50 flex flex-col"
                        onKeyDown={onKeyDown}
                    >


                        {/* Search Input Area */}
                        <div className="flex items-center px-6 py-6 border-b border-border/10 gap-4 relative z-10">
                            <Search className="w-5 h-5 text-muted-foreground" />
                            <input
                                ref={inputRef}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Pressione ⌘K e busque qualquer informação..."
                                className="flex-1 bg-transparent border-none text-foreground text-lg placeholder:text-muted-foreground/50 focus:ring-0 outline-none font-medium"
                                autoFocus
                            />
                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary/30 border border-border/20 shadow-inner">
                                <Command className="w-3 h-3 text-muted-foreground" />
                                <span className="text-[10px] font-black text-muted-foreground">K</span>
                            </div>
                        </div>

                        {/* Results Area */}
                        <div className="max-h-[480px] overflow-y-auto custom-scrollbar p-2 relative z-10">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
                                    <Loader2 className="w-6 h-6 animate-spin text-foreground/20" strokeWidth={3} />
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Mapeando base de dados...</span>
                                </div>
                            ) : results.length > 0 ? (
                                <div className="space-y-1 p-1">
                                    {results.map((result, index) => (
                                        <motion.button
                                            key={result.id + index}
                                            layout
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            whileHover={{ scale: 1.005, backgroundColor: "var(--secondary-hover, rgba(255,255,255,0.03))" }}
                                            whileTap={{ scale: 0.99 }}
                                            onMouseDown={(e) => {
                                                e.preventDefault(); // Prevent input blur
                                                handleSelect(result.url);
                                            }}
                                            onMouseEnter={() => setActiveIndex(index)}
                                            className={cn(
                                                "w-full flex items-center justify-between p-4 rounded-[20px] transition-all duration-300 group text-left relative overflow-hidden",
                                                activeIndex === index
                                                    ? "bg-secondary shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] translate-x-1"
                                                    : "hover:bg-secondary/50"
                                            )}
                                        >
                                            <div className="flex items-center gap-4 relative z-10">
                                                <div className={cn(
                                                    "w-11 h-11 rounded-2xl flex items-center justify-center border transition-all duration-500 shadow-lg",
                                                    activeIndex === index
                                                        ? "bg-foreground text-background border-foreground scale-110"
                                                        : "bg-secondary/30 border-border/20 text-muted-foreground"
                                                )}>
                                                    <TypeIcon type={result.type} active={activeIndex === index} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className={cn(
                                                        "text-[15px] font-bold transition-colors leading-tight",
                                                        activeIndex === index ? "text-foreground" : "text-muted-foreground"
                                                    )}>
                                                        {result.title}
                                                    </span>
                                                    <span className={cn(
                                                        "text-[9px] uppercase tracking-[0.2em] font-black mt-1 transition-colors",
                                                        activeIndex === index ? "text-foreground/40" : "text-muted-foreground/60"
                                                    )}>
                                                        {result.subtitle}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className={cn(
                                                "flex items-center gap-2 transition-all duration-500",
                                                activeIndex === index ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
                                            )}>
                                                <span className="text-[10px] font-black uppercase text-foreground/20 tracking-widest hidden sm:block">Acessar</span>
                                                <ArrowRight className="w-4 h-4 text-foreground" />
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>
                            ) : query.length >= 2 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                                    <div className="w-16 h-16 rounded-[24px] bg-secondary/30 border border-border/20 flex items-center justify-center">
                                        <Search className="w-6 h-6 text-muted-foreground/40" strokeWidth={1.5} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground font-bold">Nenhum rastro encontrado</p>
                                        <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest">Tente termos mais genéricos para "{query}"</p>
                                    </div>
                                    <button
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            handleSelect(`/synapse-ai?q=${encodeURIComponent(query)}`);
                                        }}
                                        className="mt-4 px-6 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest hover:bg-primary/20 transition-all"
                                    >
                                        Perguntar ao Synapse AI
                                    </button>
                                </div>
                            ) : (
                                <div className="py-8 px-6 space-y-10">
                                    <div className="space-y-5">
                                        <div className="flex items-center gap-3">
                                            <div className="h-px flex-1 bg-border/10" />
                                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40">Sugestões de Atividade</p>
                                            <div className="h-px flex-1 bg-border/10" />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {[
                                                { label: 'Pacientes Ativos', icon: User },
                                                { label: 'Consultas Pendentes', icon: Calendar },
                                                { label: 'Histórico Synapse', icon: Sparkles },
                                                { label: 'Relatórios Financeiros', icon: DollarSign }
                                            ].map(sugg => (
                                                <motion.button
                                                    key={sugg.label}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        setQuery(sugg.label);
                                                    }}
                                                    className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/30 border border-border/10 hover:bg-secondary/60 hover:border-border/30 text-[13px] text-muted-foreground font-bold transition-all group"
                                                >
                                                    <sugg.icon className="w-4 h-4 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
                                                    {sugg.label}
                                                </motion.button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-6 border-t border-border/10 text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.3em] select-none">
                                        <div className="flex items-center gap-6">
                                            <span className="flex items-center gap-2"><ArrowKey /> Navegar</span>
                                            <span className="flex items-center gap-2"><EnterKey /> Executar</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <motion.span
                                                animate={{ opacity: [1, 0.4, 1] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                                className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                                            />
                                            Omni-Search Ativo
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

const TypeIcon = ({ type, active }: { type: SearchResult['type'], active: boolean }) => {
    const size = 18;
    const props = { size, strokeWidth: active ? 2.5 : 1.5 };
    switch (type) {
        case 'patient': return <User {...props} />;
        case 'note': return <FileText {...props} />;
        case 'appointment': return <Calendar {...props} />;
        case 'finance': return <DollarSign {...props} />;
        case 'ai': return <Sparkles {...props} />;
        case 'reminder': return <CheckSquare {...props} />;
        case 'personal_note': return <StickyNote {...props} />;
        default: return <FileText {...props} />;
    }
};

const ArrowKey = () => (
    <div className="flex gap-1">
        <div className="px-1.5 py-1 rounded bg-secondary/30 border border-border/20 text-[9px]">↑</div>
        <div className="px-1.5 py-1 rounded bg-secondary/30 border border-border/20 text-[9px]">↓</div>
    </div>
);

const EnterKey = () => (
    <div className="px-2 py-1 rounded bg-secondary/30 border border-border/20 text-[9px]">ENTER</div>
);
