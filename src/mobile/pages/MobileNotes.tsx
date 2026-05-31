"use client";

import { usePersonalNotes } from "@/hooks/use-personal-notes";
import { PersonalNote } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Search, X } from "lucide-react";
import { useState } from "react";
import { MobileLayout } from "../components/MobileLayout";
import { MobileNoteEditor } from "../components/notes/MobileNoteEditor";
import { MobileNotesListView } from "../components/notes/MobileNotesListView";
import { Input } from "@/components/ui/input";

export const MobileNotes = () => {
    const { notes = [], createNote, updateNote, deleteNote } = usePersonalNotes();

    const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const selectedNote = (notes ?? []).find(n => n.id === selectedNoteId);

    const handleUpdateNote = (id: string, updates: Partial<PersonalNote>) => {
        updateNote({ id, updates });
    };

    const handleDeleteNote = (id: string) => {
        deleteNote(id);
        setSelectedNoteId(null);
    };

    const handleCreateNote = async () => {
        try {
            const newNote = await createNote({
                title: "Nova Nota",
                content: "",
                module_id: null,
                reference_date: new Date().toISOString(),
                tags: [],
                patient_id: null,
            });
            if (newNote) {
                setSelectedNoteId(newNote.id);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const filteredNotes = (notes ?? []).filter(note =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderHeader = () => (
        <div className="px-5 mb-4 relative z-50 w-full animate-fade-in">
            <div className="w-full h-[60px] flex items-center justify-between p-2 pl-4 pr-2 bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-300">
                {isSearchOpen ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex-1 flex items-center gap-2 w-full"
                    >
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                            <Input
                                autoFocus
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar nota..."
                                className="h-9 pl-9 bg-white/5 border-transparent rounded-full text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-0 text-sm"
                            />
                        </div>
                        <button
                            onClick={() => {
                                setIsSearchOpen(false);
                                setSearchQuery("");
                            }}
                            className="w-9 h-9 rounded-full text-zinc-400 hover:text-white flex items-center justify-center"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                ) : (
                    <>
                        <div className="flex flex-col justify-center h-full -space-y-0.5">
                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">Meus Registros</span>
                            <h1 className="text-base font-bold text-zinc-100 tracking-tight leading-none">Notas Rápidas</h1>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsSearchOpen(true)}
                                className="w-9 h-9 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-all active:scale-95"
                            >
                                <Search className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleCreateNote}
                                className="w-9 h-9 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );

    return (
        <MobileLayout className="px-0 min-h-screen bg-background" showNav={!selectedNoteId}>
            <div className="flex flex-col h-full pt-0">
                <AnimatePresence mode="wait">
                    {selectedNoteId && selectedNote ? (
                        <motion.div
                            key="editor-edit"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="flex-1 flex flex-col h-full"
                        >
                            <MobileNoteEditor
                                note={selectedNote}
                                onBack={() => setSelectedNoteId(null)}
                                onUpdate={handleUpdateNote}
                                onDelete={handleDeleteNote}
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col h-full"
                        >
                            {renderHeader()}
                            <MobileNotesListView
                                notes={filteredNotes}
                                onNoteSelect={setSelectedNoteId}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </MobileLayout>
    );
};