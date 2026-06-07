"use client";

import { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import { usePersonalNotes } from "@/hooks/use-personal-notes";
import { useReminders } from "@/hooks/use-reminders";
import { Navbar } from "@/components/layout/Navbar";
import { CommandMenu } from "@/components/layout/CommandMenu";
import { Button } from "@/components/ui/button";
import { Plus, LayoutPanelLeft, ListFilter } from "lucide-react";

// Sub-components
import { NotesSidebar } from "@/components/notes/NotesSidebar";
import { NotesListPanel } from "@/components/notes/NotesListPanel";
import { TaskBoard } from "@/components/notes/TaskBoard";
import { NoteEditor } from "@/components/notes/NoteEditor";
import { NeuroView } from "@/components/notes/NeuroView";
import { NeuroFlow } from "@/components/notes/NeuroFlow";
import { NeuroFlowVault } from "@/components/notes/NeuroFlowVault";
import { NeuroPulse } from "@/components/notes/NeuroPulse";
import { FilesManager } from "@/components/notes/FilesManager";
import { NotionPagesPanel } from "@/components/notes/NotionPagesPanel";

import { NeuroViewSearch } from "@/components/notes/NeuroViewSearch";

import { useIsMobile } from "@/hooks/use-mobile";
import { MobileNotes } from "@/mobile/pages/MobileNotes";

export default function Notes() {
    const isMobile = useIsMobile();
    const [searchParams] = useSearchParams();
    const noteIdParam = searchParams.get('noteId');

    // State
    const [viewMode, setViewMode] = useState<'notes' | 'tasks' | 'neuroview' | 'neuroflow' | 'neuropulse' | 'files' | 'notion'>('notes');
    const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
    const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedNotionPageId, setSelectedNotionPageId] = useState<string | null>(null);
    const [isListCollapsed, setIsListCollapsed] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const { notes, createNote, updateNote, deleteNote, isLoading: isLoadingNotes } = usePersonalNotes();
    const { reminders, toggleReminder, deleteReminder, createReminder, updateReminderCategory, updateReminder } = useReminders();

    useEffect(() => {
        if (noteIdParam && notes) {
            const targetNote = notes.find(n => n.id === noteIdParam);
            if (targetNote) {
                setSelectedNoteId(noteIdParam);
                setViewMode('notes');
            }
        }
    }, [noteIdParam, notes]);

    useEffect(() => {
        const handleNeuroFlowNavigate = (event: CustomEvent) => {
            const { flowId } = event.detail;
            if (flowId) {
                setSelectedFlowId(flowId);
                setViewMode('neuroflow');
            }
        };

        window.addEventListener('neuroflow:navigate' as any, handleNeuroFlowNavigate);
        return () => {
            window.removeEventListener('neuroflow:navigate' as any, handleNeuroFlowNavigate);
        };
    }, []);

    // Ctrl+Shift+K for NeuroView Search
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setIsSearchOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const filteredNotes = useMemo(() => {
        if (!notes) return [];
        return notes.filter(n => {
            const matchesModule = selectedModuleId ? n.module_id === selectedModuleId : true;
            const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                n.content.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesModule && matchesSearch;
        });
    }, [notes, selectedModuleId, searchQuery]);

    if (isMobile) return <MobileNotes />;

    const handleCreateNote = async () => {
        try {
            const newNote = await createNote({
                title: "Nova Nota",
                content: "",
                module_id: selectedModuleId,
                reference_date: new Date().toISOString(),
                tags: [],
                patient_id: null
            });
            if (newNote) {
                setSelectedNoteId(newNote.id);
                setViewMode('notes');
                if (isListCollapsed) setIsListCollapsed(false);
            }
        } catch (e) { console.error(e); }
    };

    const activeNote = notes?.find(n => n.id === selectedNoteId);

    const renderMainContent = () => {
        const motionProps = {
            initial: { opacity: 0, y: 10 },
            animate: { opacity: 1, y: 0 },
            exit: { opacity: 0, y: -10 },
            transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] as any }
        };

        switch (viewMode) {
            case 'files': return <motion.div {...motionProps} className="flex-1 h-full"><FilesManager /></motion.div>;
            case 'notion': return <motion.div {...motionProps} className="flex-1 h-full"><NotionPagesPanel selectedPageId={selectedNotionPageId} onSelectNotionPage={setSelectedNotionPageId} /></motion.div>;
            case 'tasks': return (
                <motion.div {...motionProps} className="flex-1 overflow-hidden" style={{ minHeight: 0, minWidth: 0, height: '100%' }}>
                    <TaskBoard
                        tasks={reminders || []}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        onToggle={(id, status) => toggleReminder({ id, is_completed: status })}
                        onDelete={deleteReminder}
                        onCreate={(title, date, category) => createReminder({ title, due_date: date.toISOString(), is_completed: false, category })}
                        onUpdateCategory={(id, category) => updateReminderCategory({ id, category })}
                        onUpdate={(id, updates) => updateReminder({ id, updates })}
                        isListCollapsed={isListCollapsed}
                    />
                </motion.div>
            );
            case 'neuroview': return <motion.div {...motionProps} className="flex-1 h-full min-w-0 overflow-hidden"><NeuroView /></motion.div>;
            case 'neuroflow': return <motion.div {...motionProps} className="flex-1 h-full">{selectedFlowId ? <NeuroFlow flowId={selectedFlowId} onBack={() => setSelectedFlowId(null)} /> : <NeuroFlowVault onOpenFlow={setSelectedFlowId} />}</motion.div>;
            case 'neuropulse': return <motion.div {...motionProps} className="flex-1 h-full"><NeuroPulse /></motion.div>;
            default:
                return (
                    <div className="flex-1 flex h-full overflow-hidden relative">
                        <AnimatePresence>
                            {(!isListCollapsed && !isFocusMode) && (
                                <motion.div
                                    initial={{ width: 0, opacity: 0 }}
                                    animate={{ width: 380, opacity: 1 }}
                                    exit={{ width: 0, opacity: 0 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    className="shrink-0 border-r border-zinc-200/50 dark:border-white/[0.05] bg-zinc-50/10 dark:bg-black/10 flex flex-col overflow-hidden relative"
                                >
                                    <div className="w-[380px] h-full relative z-10">
                                        <NotesListPanel
                                            searchQuery={searchQuery}
                                            setSearchQuery={setSearchQuery}
                                            items={filteredNotes}
                                            selectedId={selectedNoteId}
                                            onSelect={setSelectedNoteId}
                                            onCreate={handleCreateNote}
                                            onDeleteNote={(id) => { deleteNote(id); if (selectedNoteId === id) setSelectedNoteId(null); }}
                                            isLoading={isLoadingNotes}
                                        />
                                    </div>
                                    <div className="absolute inset-0 premium-noise opacity-[0.02] pointer-events-none" />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex-1 min-w-0 bg-transparent relative flex flex-col group/editor">
                            <AnimatePresence mode="wait">
                                {activeNote ? (
                                    <motion.div key={activeNote.id} {...motionProps} className="flex-1 flex flex-col h-full relative z-10">
                                        <NoteEditor
                                            note={activeNote}
                                            onUpdate={(id, updates) => updateNote({ id, updates })}
                                            onDelete={(id) => { deleteNote(id); setSelectedNoteId(null); }}
                                            isFocusMode={isFocusMode}
                                            onToggleFocus={() => setIsFocusMode(!isFocusMode)}
                                        />
                                    </motion.div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-center relative z-10 p-12 space-y-12 animate-in fade-in duration-1000">
                                        <div className="relative group/gate">
                                            <div className="absolute inset-0 bg-zinc-900/5 dark:bg-white/5 blur-[120px] rounded-full scale-150 opacity-0 group-hover/gate:opacity-100 transition-opacity duration-1000" />
                                            <div className="w-40 h-40 rounded-[64px] bg-white/40 dark:bg-black/40 border border-zinc-200/50 dark:border-white/[0.05] flex items-center justify-center shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] relative z-10 backdrop-blur-3xl overflow-hidden group/icon">
                                                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06] premium-noise pointer-events-none" />
                                                <img src="/favicon-dark.png" alt="NeuroNex" className="h-16 w-16 dark:hidden transition-all duration-1000 group-hover/gate:scale-110" />
                                                <img src="/favicon-light.png" alt="NeuroNex" className="h-16 w-16 hidden dark:block transition-all duration-1000 group-hover/gate:scale-110" />
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <h3 className="text-6xl font-black tracking-tighter text-zinc-900 dark:text-zinc-100 leading-none">NeuroDrive</h3>
                                            <p className="text-[10px] font-black uppercase tracking-[0.6em] text-zinc-400 dark:text-zinc-500 max-w-xs leading-relaxed mx-auto">Sinfonia de dados para mentes complexas.</p>
                                        </div>
                                        <Button onClick={handleCreateNote} className="h-16 px-12 rounded-[24px] bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black font-black text-[11px] uppercase tracking-[0.3em] hover:opacity-90 transition-all shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] dark:shadow-[0_30px_60px_-15px_rgba(255,255,255,0.05)] active:scale-95 group/btn">
                                            <Plus className="h-4 w-4 mr-3 stroke-[3]" />
                                            Nova Nota
                                        </Button>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="h-screen w-screen flex flex-col overflow-hidden font-sans relative bg-[#fdfdfd] dark:bg-[#030303] text-zinc-900 dark:text-zinc-50 selection:bg-zinc-900/10 dark:selection:bg-white/10">
            {/* Master Texture Overlay */}
            <div className="absolute inset-0 premium-noise opacity-[0.03] dark:opacity-[0.06] pointer-events-none fixed z-[100] mix-blend-overlay" />

            {/* Ambient Background Glows */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-zinc-200/20 dark:bg-zinc-400/[0.03] blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2" />
            </div>

            <div className="relative z-40 w-full shrink-0">
                <Navbar />
                <CommandMenu />
            </div>

            {/* Layout Controls Dock - Aligned with Navbar Content */}
            {!isFocusMode && (
                <div className="fixed top-[22px] left-8 z-[100] flex items-center gap-1.5 p-1 rounded-2xl bg-white/40 dark:bg-black/20 border border-zinc-200/50 dark:border-white/[0.05] backdrop-blur-3xl shadow-[0_8px_32px_-12px_rgba(0,0,0,0.05)] transition-all duration-500 hover:border-zinc-300 dark:hover:border-white/10 group/dock">
                    <button
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className={cn(
                            "h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-300",
                            isSidebarCollapsed
                                ? "text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
                                : "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black shadow-lg scale-[1.05]"
                        )}
                        title={isSidebarCollapsed ? "Expandir Menu" : "Recolher Menu"}
                    >
                        <LayoutPanelLeft className="h-4 w-4" strokeWidth={isSidebarCollapsed ? 1.5 : 2.5} />
                    </button>
                    <div className="w-px h-4 bg-zinc-200/50 dark:bg-white/5 mx-0.5" />
                    <button
                        onClick={() => setIsListCollapsed(!isListCollapsed)}
                        className={cn(
                            "h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-300",
                            isListCollapsed
                                ? "text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
                                : "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black shadow-lg scale-[1.05]"
                        )}
                        title={isListCollapsed ? "Expandir Lista" : "Recolher Lista"}
                    >
                        <ListFilter className="h-4 w-4" strokeWidth={isListCollapsed ? 1.5 : 2.5} />
                    </button>
                </div>
            )}

            <div className="flex-1 flex items-stretch h-full w-full relative z-10 px-5 pb-5 pt-3 max-w-[2200px] mx-auto overflow-hidden">
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    className="flex-1 flex overflow-hidden shadow-[0_36px_90px_-24px_rgba(0,0,0,0.12)] dark:shadow-[0_36px_90px_-24px_rgba(0,0,0,0.42)] bg-zinc-10 dark:bg-zinc-950 border border-white dark:border-white/[0.05] ring-1 ring-black/[0.02] dark:ring-0 backdrop-blur-3xl rounded-[34px] relative group/main-window"
                >
                    <div className="absolute inset-0 premium-noise opacity-[0.02] dark:opacity-[0.04] pointer-events-none" />
                    <AnimatePresence>
                        {(!isSidebarCollapsed && !isFocusMode) && (
                            <motion.div
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: 244, opacity: 1 }}
                                exit={{ width: 0, opacity: 0 }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="hidden lg:flex shrink-0 border-r border-black/[0.05] dark:border-white/[0.05] bg-zinc-50/30 dark:bg-black/10 overflow-hidden relative"
                            >
                                <div className="absolute inset-0 premium-noise opacity-[0.02] pointer-events-none" />
                                <div className="w-[244px] h-full relative z-10">
                                    <NotesSidebar
                                        viewMode={viewMode}
                                        setViewMode={setViewMode}
                                        selectedModuleId={selectedModuleId}
                                        onSelectModule={setSelectedModuleId}
                                        onMoveNoteToModule={(id, modId) => updateNote({ id, updates: { module_id: modId } })}
                                        onCreateNote={handleCreateNote}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex-1 flex overflow-hidden relative bg-transparent">
                        <AnimatePresence mode="wait">
                            {renderMainContent()}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>

            {/* NeuroView Search (Ctrl+K) */}
            <NeuroViewSearch
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                onSelectNote={(noteId) => {
                    setSelectedNoteId(noteId);
                    setViewMode('notes');
                }}
            />
        </div>
    );
}
