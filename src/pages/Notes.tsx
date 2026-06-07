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
                                    className="relative flex shrink-0 flex-col overflow-hidden border-r border-white/[0.05] bg-black/10 [.light_&]:border-zinc-200/50 [.light_&]:bg-zinc-50/10"
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
                                            <div className="absolute inset-0 scale-150 rounded-full bg-white/5 blur-[120px] opacity-0 transition-opacity duration-1000 group-hover/gate:opacity-100 [.light_&]:bg-zinc-900/5" />
                                            <div className="relative z-10 flex h-40 w-40 items-center justify-center overflow-hidden rounded-[64px] border border-white/[0.05] bg-black/40 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.22)] backdrop-blur-3xl group/icon [.light_&]:border-zinc-200/50 [.light_&]:bg-white/40 [.light_&]:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)]">
                                                <div className="absolute inset-0 premium-noise opacity-[0.06] pointer-events-none [.light_&]:opacity-[0.03]" />
                                                <img src="/favicon-dark.png" alt="NeuroNex" className="h-16 w-16 dark:hidden transition-all duration-1000 group-hover/gate:scale-110" />
                                                <img src="/favicon-light.png" alt="NeuroNex" className="h-16 w-16 hidden dark:block transition-all duration-1000 group-hover/gate:scale-110" />
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <h3 className="text-6xl font-black tracking-tighter text-zinc-100 leading-none [.light_&]:text-zinc-900">NeuroDrive</h3>
                                            <p className="mx-auto max-w-xs text-[10px] font-black uppercase tracking-[0.6em] text-zinc-500 leading-relaxed">Sinfonia de dados para mentes complexas.</p>
                                        </div>
                                        <Button onClick={handleCreateNote} className="h-16 rounded-[24px] bg-zinc-100 px-12 text-[11px] font-black uppercase tracking-[0.3em] text-black shadow-[0_30px_60px_-15px_rgba(255,255,255,0.05)] transition-all hover:opacity-90 active:scale-95 group/btn [.light_&]:bg-zinc-900 [.light_&]:text-white [.light_&]:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)]">
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
        <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-[#030303] font-sans text-zinc-50 selection:bg-white/10 [.light_&]:bg-[#fdfdfd] [.light_&]:text-zinc-900 [.light_&]:selection:bg-zinc-900/10">
            {/* Master Texture Overlay */}
            <div className="fixed inset-0 z-[100] premium-noise opacity-[0.06] pointer-events-none mix-blend-overlay [.light_&]:opacity-[0.03]" />

            {/* Ambient Background Glows */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute right-0 top-0 h-[600px] w-[800px] -translate-y-1/2 translate-x-1/2 rounded-full bg-zinc-400/[0.03] blur-[150px] [.light_&]:bg-zinc-200/20" />
            </div>

            <div className="relative z-40 w-full shrink-0">
                <Navbar />
                <CommandMenu />
            </div>

            {/* Layout Controls Dock - Aligned with Navbar Content */}
            {!isFocusMode && (
                <div className="group/dock fixed left-8 top-[22px] z-[100] flex items-center gap-1.5 rounded-2xl border border-white/[0.05] bg-black/20 p-1 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.25)] backdrop-blur-3xl transition-all duration-500 hover:border-white/10 [.light_&]:border-zinc-200/50 [.light_&]:bg-white/40 [.light_&]:shadow-[0_8px_32px_-12px_rgba(0,0,0,0.05)] [.light_&]:hover:border-zinc-300">
                    <button
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className={cn(
                            "h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-300",
                            isSidebarCollapsed
                                ? "text-zinc-500 hover:bg-white/5 hover:text-white [.light_&]:text-zinc-400 [.light_&]:hover:bg-zinc-100 [.light_&]:hover:text-zinc-900"
                                : "scale-[1.05] bg-zinc-100 text-black shadow-lg [.light_&]:bg-zinc-900 [.light_&]:text-white"
                        )}
                        title={isSidebarCollapsed ? "Expandir Menu" : "Recolher Menu"}
                    >
                        <LayoutPanelLeft className="h-4 w-4" strokeWidth={isSidebarCollapsed ? 1.5 : 2.5} />
                    </button>
                    <div className="mx-0.5 h-4 w-px bg-white/5 [.light_&]:bg-zinc-200/50" />
                    <button
                        onClick={() => setIsListCollapsed(!isListCollapsed)}
                        className={cn(
                            "h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-300",
                            isListCollapsed
                                ? "text-zinc-500 hover:bg-white/5 hover:text-white [.light_&]:text-zinc-400 [.light_&]:hover:bg-zinc-100 [.light_&]:hover:text-zinc-900"
                                : "scale-[1.05] bg-zinc-100 text-black shadow-lg [.light_&]:bg-zinc-900 [.light_&]:text-white"
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
                    className="group/main-window relative flex flex-1 overflow-hidden rounded-[34px] border border-white/[0.05] bg-zinc-950 shadow-[0_36px_90px_-24px_rgba(0,0,0,0.42)] backdrop-blur-3xl [.light_&]:border-white [.light_&]:bg-zinc-50 [.light_&]:shadow-[0_36px_90px_-24px_rgba(0,0,0,0.12)] [.light_&]:ring-1 [.light_&]:ring-black/[0.02]"
                >
                    <div className="absolute inset-0 premium-noise opacity-[0.04] pointer-events-none [.light_&]:opacity-[0.02]" />
                    <AnimatePresence>
                        {(!isSidebarCollapsed && !isFocusMode) && (
                            <motion.div
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: 244, opacity: 1 }}
                                exit={{ width: 0, opacity: 0 }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="relative hidden shrink-0 overflow-hidden border-r border-white/[0.05] bg-black/10 lg:flex [.light_&]:border-black/[0.05] [.light_&]:bg-zinc-50/30"
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
