import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { usePersonalNotes } from "@/hooks/use-personal-notes";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, Hash, Loader2, Plus, StickyNote, Trash2 } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";


const stripHtml = (html: string) => {
    if (typeof document === 'undefined') return html;
    try {
        const tmp = document.createElement("DIV");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    } catch (e) {
        return html;
    }
}

const NoteItem = ({ note, onDelete }: { note: any, onDelete: (id: string) => void }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const dateStr = note.reference_date
        ? format(new Date(note.reference_date), "dd/MM/yyyy")
        : format(new Date(note.created_at), "dd/MM/yyyy");

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mb-3 relative group"
        >
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn(
                    "relative cursor-pointer overflow-hidden rounded-2xl border transition-colors duration-300",
                    isExpanded
                        ? "border-border bg-background/80 shadow-sm dark:bg-white/[0.055]"
                        : "bg-transparent border-transparent hover:bg-zinc-100 dark:hover:bg-white/[0.04] hover:border-zinc-200/50 dark:hover:border-white/10 h-14 flex items-center group/card"
                )}
            >
                <div className={cn("flex items-center justify-between w-full px-6", isExpanded ? "pt-8 pb-3 items-start" : "")}>
                    <div className="flex items-center gap-5 min-w-0 flex-1">
                        <div className={cn("h-2 w-2 rounded-full transition-transform duration-300", isExpanded ? "scale-125 bg-foreground" : "bg-muted-foreground/35")} />
                        <h3 className={cn("font-black transition-colors truncate text-xs tracking-tight",
                            isExpanded
                                ? "text-zinc-900 dark:text-white uppercase tracking-widest"
                                : "text-zinc-500 dark:text-zinc-500 group-hover/card:text-zinc-900 dark:group-hover/card:text-zinc-100"
                        )}>
                            {note.title || "Nota Clínica"}
                        </h3>
                    </div>

                    {!isExpanded && (
                        <div className="text-[9px] font-black text-zinc-400 dark:text-zinc-600 bg-zinc-100/50 dark:bg-white/5 px-4 py-1.5 rounded-full border border-zinc-200/50 dark:border-white/5 whitespace-nowrap ml-4 tabular-nums shadow-sm">
                            {dateStr}
                        </div>
                    )}
                </div>

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            className="px-8 pb-8"
                        >
                            <div className="flex items-center gap-5 mb-8">
                                <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-2 bg-zinc-100 dark:bg-white/5 px-4 py-2 rounded-xl border border-zinc-200/40 dark:border-white/5 shadow-sm">
                                    <Calendar className="h-3.5 w-3.5" /> {dateStr}
                                </span>
                                <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                    <Hash className="h-3.5 w-3.5 opacity-50" /> Particular
                                </span>
                            </div>

                            <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed font-medium whitespace-pre-wrap mt-2">
                                {stripHtml(note.content)}
                            </p>

                            <div className="flex justify-end mt-10 pt-8 border-t border-zinc-100 dark:border-white/5">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(note.id);
                                    }}
                                    className="h-11 px-6 text-[10px] font-black uppercase tracking-[0.25em] text-rose-500 hover:text-white hover:bg-rose-500 rounded-2xl transition-all active:scale-95 shadow-sm"
                                >
                                    <Trash2 className="w-4 h-4 mr-3" /> Excluir Registro
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export function SideNotes() {
    const { id: patientId } = useParams<{ id: string }>();
    const { notes: allNotes = [], isLoading = false, createNote, deleteNote } = usePersonalNotes();
    const notes = Array.isArray(allNotes) ? allNotes.filter(n => n.patient_id === patientId) : [];

    const [isAdding, setIsAdding] = useState(false);
    const [newNote, setNewNote] = useState({ title: '', content: '' });
    const [isSaving, setIsSaving] = useState(false);

    const handleAddNote = async () => {
        if (!newNote.content.trim() || !patientId) return;
        setIsSaving(true);
        try {
            await createNote({
                patient_id: patientId,
                title: newNote.title || 'Nova Nota',
                content: newNote.content,
                reference_date: new Date().toISOString(),
                tags: ['rápida', 'prontuário']
            });
            setIsAdding(false);
            setNewNote({ title: '', content: '' });
            toast.success("Nota gravada com sucesso");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao gravar nota");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[24px] border border-border/70 bg-card/68 shadow-[0_18px_48px_-38px_rgba(15,23,42,0.55)] backdrop-blur-xl dark:bg-white/[0.025]">
            {/* Header */}
            <div className="relative z-20 flex-none border-b border-border/60 bg-background/35 p-6 backdrop-blur-md">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-foreground text-background shadow-sm">
                            <StickyNote className="h-4.5 w-4.5" />
                        </div>
                        <div>
                            <h2 className="mb-1.5 text-sm font-bold leading-none tracking-tight text-foreground">Notas rápidas</h2>
                            <p className="text-[9px] font-bold uppercase tracking-[0.22em] leading-none text-muted-foreground">Arquivo pessoal</p>
                        </div>
                    </div>
                    <Button
                        size="icon"
                        onClick={() => setIsAdding(!isAdding)}
                        className={cn(
                            "h-10 w-10 rounded-xl transition-all duration-300 shadow-sm active:scale-95",
                            isAdding
                                ? "bg-rose-500 hover:bg-rose-600 text-white rotate-45"
                                : "bg-zinc-100 dark:bg-white/[0.06] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-900 dark:hover:bg-white hover:text-white dark:hover:text-zinc-900 border border-zinc-200 dark:border-white/10"
                        )}
                    >
                        <Plus className="w-6 h-6 stroke-[3]" />
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="custom-scrollbar relative z-10 flex-1 overflow-y-auto overscroll-contain p-5 [scrollbar-gutter:stable]">
                <AnimatePresence mode="popLayout">
                    {isAdding && (
                        <motion.div
                            key="add-note-form"
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            className="relative z-20 mb-6"
                        >
                            <div className="flex flex-col gap-5 rounded-2xl border border-border/70 bg-muted/35 p-5 shadow-sm ring-1 ring-black/[0.02] transition-shadow duration-300 focus-within:shadow-md dark:ring-white/[0.03]">
                                <Input
                                    placeholder="Título do registro..."
                                    value={newNote.title}
                                    onChange={e => setNewNote({ ...newNote, title: e.target.value })}
                                    className="bg-white dark:bg-white/[0.03] border-none p-6 h-14 text-sm font-black text-zinc-900 dark:text-white placeholder:text-zinc-300 dark:placeholder:text-zinc-800 rounded-2xl focus-visible:ring-0 shadow-inner"
                                />
                                <Textarea
                                    placeholder="Escreva livremente sobre a sessão ou insights..."
                                    value={newNote.content}
                                    onChange={e => setNewNote({ ...newNote, content: e.target.value })}
                                    className="bg-white dark:bg-white/[0.03] border-none p-6 min-h-[180px] text-sm font-medium text-zinc-800 dark:text-zinc-300 placeholder:text-zinc-300 dark:placeholder:text-zinc-800 rounded-2xl focus-visible:ring-0 resize-none leading-relaxed shadow-inner"
                                />
                                <div className="flex justify-end pt-2">
                                    <Button
                                        size="sm"
                                        onClick={handleAddNote}
                                        disabled={isSaving}
                                    className="h-11 rounded-xl bg-foreground px-7 text-[10px] font-bold uppercase tracking-[0.2em] text-background shadow-sm transition-transform active:scale-95"
                                    >
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-3" /> : <SaveIcon className="w-4 h-4 mr-3" />}
                                        {isSaving ? "GRAVANDO..." : "SALVAR NOTA"}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {isLoading ? (
                        <div className="space-y-6">
                            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-14 bg-zinc-100 dark:bg-white/[0.03] rounded-3xl animate-pulse" />)}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {notes && notes.map((note, _idx) => (
                                <NoteItem key={note.id} note={note} onDelete={deleteNote} />
                            ))}
                        </div>
                    )}
                </AnimatePresence>

                {!isLoading && notes && notes.length === 0 && !isAdding && (
                    <div className="text-center py-24 flex flex-col items-center">
                        <div className="w-24 h-24 rounded-full bg-zinc-50 dark:bg-white/[0.015] flex items-center justify-center mb-10 shadow-inner ring-1 ring-zinc-100 dark:ring-white/5 opacity-50">
                            <StickyNote className="w-10 h-10 text-zinc-300 dark:text-zinc-800" />
                        </div>
                        <p className="text-[11px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.4em] mb-4">Arquivo Vazio</p>
                        <p className="text-[10px] text-zinc-400/60 dark:text-zinc-700 mt-1 max-w-[200px] mx-auto leading-relaxed font-bold uppercase tracking-widest">Suas anotações privadas e insights clínicos aparecerão aqui.</p>
                    </div>
                )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white dark:from-[#080809] to-transparent pointer-events-none z-10 opacity-90" />
        </div>
    );
}

const SaveIcon = ({ className }: { className?: string }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><path d="M7 3v5h8"/></svg>
);
