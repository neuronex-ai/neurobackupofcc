"use client";

import {
    lazy,
    Suspense,
    useState,
    useMemo,
    useEffect,
    useCallback,
    type UIEvent,
} from "react";
import { cn } from "@/lib/utils";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence, type Transition } from "framer-motion";

import { usePersonalNotes } from "@/hooks/use-personal-notes";
import { useReminders } from "@/hooks/use-reminders";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

// Sub-components
import { NotesSidebar } from "@/components/notes/NotesSidebar";
import { NotesListPanel } from "@/components/notes/NotesListPanel";
import { TaskBoard } from "@/components/notes/TaskBoard";
import { NeuroView } from "@/components/notes/NeuroView";
import { NeuroFlow } from "@/components/notes/NeuroFlow";
import { NeuroFlowVault } from "@/components/notes/NeuroFlowVault";
import { NeuroPulse } from "@/components/notes/NeuroPulse";
import { FilesManager } from "@/components/notes/FilesManager";
import { NotionPagesPanel } from "@/components/notes/NotionPagesPanel";

import { useIsMobile } from "@/hooks/use-mobile";
import { MobileNotes } from "@/mobile/pages/MobileNotes";

const NoteEditor = lazy(() =>
    import("@/components/notes/NoteEditor").then((module) => ({ default: module.NoteEditor }))
);

const NOTES_LAYOUT_STORAGE_KEY = "neuronex:notes-layout";
const NOTES_PAGE_SIZE = 40;
const NOTES_LOAD_MORE_OFFSET = 160;

const loadLayoutPreference = () => {
    try {
        if (typeof window === "undefined") {
            return { sidebarCollapsed: false, listCollapsed: false };
        }

        const stored = window.localStorage.getItem(NOTES_LAYOUT_STORAGE_KEY);

        if (!stored) {
            return { sidebarCollapsed: false, listCollapsed: false };
        }

        const parsed = JSON.parse(stored);

        return {
            sidebarCollapsed: Boolean(parsed.sidebarCollapsed),
            listCollapsed: Boolean(parsed.listCollapsed),
        };
    } catch {
        return { sidebarCollapsed: false, listCollapsed: false };
    }
};

const NoteEditorSkeleton = () => (
    <div className="flex h-full min-h-0 flex-col animate-pulse overflow-hidden">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.05] px-7 [.light_&]:border-zinc-200/60">
            <div className="h-8 w-40 rounded-xl bg-white/[0.04] [.light_&]:bg-zinc-100" />
            <div className="flex gap-2">
                <div className="h-8 w-8 rounded-xl bg-white/[0.04] [.light_&]:bg-zinc-100" />
                <div className="h-8 w-20 rounded-xl bg-white/[0.04] [.light_&]:bg-zinc-100" />
            </div>
        </div>

        <div className="mx-auto w-full max-w-[820px] flex-1 space-y-7 overflow-hidden px-12 py-12">
            <div className="h-12 w-2/3 rounded-2xl bg-white/[0.045] [.light_&]:bg-zinc-100" />
            <div className="h-px bg-white/[0.05] [.light_&]:bg-zinc-200" />
            <div className="space-y-4">
                <div className="h-4 w-full rounded bg-white/[0.035] [.light_&]:bg-zinc-100" />
                <div className="h-4 w-11/12 rounded bg-white/[0.035] [.light_&]:bg-zinc-100" />
                <div className="h-4 w-4/5 rounded bg-white/[0.035] [.light_&]:bg-zinc-100" />
            </div>
        </div>
    </div>
);

export default function Notes() {
    const isMobile = useIsMobile();
    const [searchParams] = useSearchParams();
    const noteIdParam = searchParams.get("noteId");

    const [viewMode, setViewMode] = useState<
        "notes" | "tasks" | "neuroview" | "neuroflow" | "neuropulse" | "files" | "notion"
    >("notes");

    const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
    const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedNotionPageId, setSelectedNotionPageId] = useState<string | null>(null);

    const initialLayout = useMemo(loadLayoutPreference, []);
    const [isListCollapsed, setIsListCollapsed] = useState(initialLayout.listCollapsed);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(initialLayout.sidebarCollapsed);

    const [isFocusMode, setIsFocusMode] = useState(false);
    const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);

    const [visibleNotesCount, setVisibleNotesCount] = useState(NOTES_PAGE_SIZE);

    const {
        notes,
        createNote,
        updateNote,
        updateNoteAsync,
        deleteNote,
        isLoading: isLoadingNotes,
        isCreatingNote,
    } = usePersonalNotes();

    const {
        reminders,
        toggleReminder,
        deleteReminder,
        createReminder,
        updateReminderCategory,
        updateReminder,
    } = useReminders();

    useEffect(() => {
        if (noteIdParam && notes) {
            const targetNote = notes.find((note) => note.id === noteIdParam);

            if (targetNote) {
                setSelectedNoteId(noteIdParam);
                setViewMode("notes");
            }
        }
    }, [noteIdParam, notes]);

    useEffect(() => {
        const handleNeuroFlowNavigate = (event: Event) => {
            const { flowId } = (event as CustomEvent<{ flowId?: string }>).detail ?? {};

            if (flowId) {
                setSelectedFlowId(flowId);
                setViewMode("neuroflow");
            }
        };

        window.addEventListener("neuroflow:navigate", handleNeuroFlowNavigate);

        return () => {
            window.removeEventListener("neuroflow:navigate", handleNeuroFlowNavigate);
        };
    }, []);

    useEffect(() => {
        window.localStorage.setItem(
            NOTES_LAYOUT_STORAGE_KEY,
            JSON.stringify({
                sidebarCollapsed: isSidebarCollapsed,
                listCollapsed: isListCollapsed,
            })
        );
    }, [isListCollapsed, isSidebarCollapsed]);

    const filteredNotes = useMemo(() => {
        if (!notes) return [];

        const normalizedSearch = searchQuery.trim().toLowerCase();

        return notes.filter((note) => {
            const matchesModule = selectedModuleId ? note.module_id === selectedModuleId : true;

            if (!normalizedSearch) {
                return matchesModule;
            }

            const title = note.title?.toLowerCase() ?? "";
            const content = note.content?.toLowerCase() ?? "";

            const matchesSearch =
                title.includes(normalizedSearch) ||
                content.includes(normalizedSearch);

            return matchesModule && matchesSearch;
        });
    }, [notes, selectedModuleId, searchQuery]);

    const visibleNotes = useMemo(() => {
        return filteredNotes.slice(0, visibleNotesCount);
    }, [filteredNotes, visibleNotesCount]);

    const hasMoreNotes = visibleNotesCount < filteredNotes.length;

    useEffect(() => {
        setVisibleNotesCount(NOTES_PAGE_SIZE);
    }, [selectedModuleId, searchQuery, viewMode]);

    useEffect(() => {
        if (!selectedNoteId) return;

        const selectedIndex = filteredNotes.findIndex((note) => note.id === selectedNoteId);

        if (selectedIndex >= visibleNotesCount) {
            setVisibleNotesCount(
                Math.min(filteredNotes.length, selectedIndex + NOTES_PAGE_SIZE)
            );
        }
    }, [filteredNotes, selectedNoteId, visibleNotesCount]);

    const handleLoadMoreNotes = useCallback(() => {
        setVisibleNotesCount((current) =>
            Math.min(current + NOTES_PAGE_SIZE, filteredNotes.length)
        );
    }, [filteredNotes.length]);

    const handleNotesListScroll = useCallback(
        (event: UIEvent<HTMLDivElement>) => {
            if (!hasMoreNotes) return;

            const target = event.currentTarget;
            const distanceFromBottom =
                target.scrollHeight - target.scrollTop - target.clientHeight;

            if (distanceFromBottom <= NOTES_LOAD_MORE_OFFSET) {
                handleLoadMoreNotes();
            }
        },
        [hasMoreNotes, handleLoadMoreNotes]
    );

    if (isMobile) return <MobileNotes />;

    const handleCreateNote = async () => {
        if (isCreatingNote) return;

        try {
            const newNote = await createNote({
                title: "Nova Nota",
                content: "",
                module_id: selectedModuleId,
                reference_date: new Date().toISOString(),
                tags: [],
                patient_id: null,
            });

            if (newNote) {
                setSelectedNoteId(newNote.id);
                setViewMode("notes");
                setVisibleNotesCount((current) => Math.max(current, NOTES_PAGE_SIZE));

                if (isListCollapsed) {
                    setIsListCollapsed(false);
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    const activeNote = notes?.find((note) => note.id === selectedNoteId);

    const renderMainContent = () => {
        const contentTransition: Transition = {
            duration: 0.4,
            ease: [0.23, 1, 0.32, 1],
        };

        const motionProps = {
            initial: { opacity: 0, y: 10 },
            animate: { opacity: 1, y: 0 },
            exit: { opacity: 0, y: -10 },
            transition: contentTransition,
        };

        switch (viewMode) {
            case "files":
                return (
                    <motion.div {...motionProps} className="flex-1 h-full min-h-0 min-w-0 overflow-hidden">
                        <FilesManager />
                    </motion.div>
                );

            case "notion":
                return (
                    <motion.div {...motionProps} className="relative z-30 flex-1 h-full min-h-0 min-w-0 overflow-hidden">
                        <NotionPagesPanel
                            selectedPageId={selectedNotionPageId}
                            onSelectNotionPage={setSelectedNotionPageId}
                            onImportedNote={(noteId) => {
                                setSelectedNoteId(noteId);
                                setViewMode("notes");

                                if (isListCollapsed) {
                                    setIsListCollapsed(false);
                                }
                            }}
                        />
                    </motion.div>
                );

            case "tasks":
                return (
                    <motion.div
                        {...motionProps}
                        className="flex-1 overflow-hidden"
                        style={{ minHeight: 0, minWidth: 0, height: "100%" }}
                    >
                        <TaskBoard
                            tasks={reminders || []}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            onToggle={(id, status) => toggleReminder({ id, is_completed: status })}
                            onDelete={deleteReminder}
                            onCreate={(title, date, category) =>
                                createReminder({
                                    title,
                                    due_date: date.toISOString(),
                                    is_completed: false,
                                    category,
                                })
                            }
                            onUpdateCategory={(id, category) => updateReminderCategory({ id, category })}
                            onUpdate={(id, updates) => updateReminder({ id, updates })}
                            isListCollapsed={isListCollapsed}
                            onToggleListCollapsed={() => setIsListCollapsed((current) => !current)}
                        />
                    </motion.div>
                );

            case "neuroview":
                return (
                    <motion.div
                        {...motionProps}
                        className="relative flex-1 h-full min-h-0 min-w-0 overflow-hidden"
                    >
                        <NeuroView />
                    </motion.div>
                );

            case "neuroflow":
                return (
                    <motion.div
                        {...motionProps}
                        className="relative flex-1 h-full min-h-0 min-w-0 overflow-hidden"
                    >
                        {selectedFlowId ? (
                            <NeuroFlow flowId={selectedFlowId} onBack={() => setSelectedFlowId(null)} />
                        ) : (
                            <NeuroFlowVault onOpenFlow={setSelectedFlowId} />
                        )}
                    </motion.div>
                );

            case "neuropulse":
                return (
                    <motion.div {...motionProps} className="flex-1 h-full min-h-0 min-w-0 overflow-hidden">
                        <NeuroPulse />
                    </motion.div>
                );

            default:
                return (
                    <div className="flex-1 flex h-full min-h-0 min-w-0 overflow-hidden relative bg-transparent">
                        {!isFocusMode && (
                            <motion.div
                                initial={false}
                                animate={{ width: isListCollapsed ? 52 : 330 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 320,
                                    damping: 34,
                                    mass: 0.78,
                                }}
                                className="notes-retina-rail relative z-20 flex min-h-0 shrink-0 flex-col overflow-hidden border-r"
                            >
                                <div
                                    className={cn(
                                        "h-full min-h-0 relative z-10 overflow-hidden",
                                        isListCollapsed ? "w-[52px]" : "w-[330px]"
                                    )}
                                >
                                    <div
                                        className="notes-list-scroll notes-scroll-surface h-full min-h-0 max-h-full overflow-y-auto overflow-x-hidden overscroll-contain"
                                        onScroll={handleNotesListScroll}
                                        onWheelCapture={(event) => event.stopPropagation()}
                                    >
                                        <NotesListPanel
                                            searchQuery={searchQuery}
                                            setSearchQuery={setSearchQuery}
                                            items={visibleNotes}
                                            selectedId={selectedNoteId}
                                            onSelect={setSelectedNoteId}
                                            onCreate={handleCreateNote}
                                            onDeleteNote={(id) => {
                                                deleteNote(id);

                                                if (selectedNoteId === id) {
                                                    setSelectedNoteId(null);
                                                }
                                            }}
                                            isLoading={isLoadingNotes}
                                            isCollapsed={isListCollapsed}
                                            onToggleCollapsed={() => setIsListCollapsed((current) => !current)}
                                            isCreatingNote={isCreatingNote}
                                        />

                                        {hasMoreNotes && !isListCollapsed && (
                                            <div className="sticky bottom-0 z-30 flex justify-center border-t border-white/[0.04] bg-black/70 px-5 py-4 backdrop-blur-xl [.light_&]:border-zinc-200/70 [.light_&]:bg-white/80">
                                                <Button
                                                    type="button"
                                                    onClick={handleLoadMoreNotes}
                                                    className="h-10 rounded-2xl bg-white px-5 text-[10px] font-black uppercase tracking-[0.24em] text-black shadow-none transition-all hover:opacity-90 active:scale-95 [.light_&]:bg-zinc-950 [.light_&]:text-white"
                                                >
                                                    Carregar mais
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        <div className="flex-1 min-w-0 min-h-0 bg-transparent relative flex flex-col overflow-hidden group/editor">
                            <AnimatePresence mode="wait">
                                {activeNote ? (
                                    <motion.div
                                        key={activeNote.id}
                                        {...motionProps}
                                        className="flex-1 flex flex-col h-full min-h-0 relative z-10 bg-transparent overflow-hidden"
                                    >
                                        <Suspense fallback={<NoteEditorSkeleton />}>
                                            <NoteEditor
                                                note={activeNote}
                                                onUpdate={(id, updates) => updateNoteAsync({ id, updates })}
                                                onDelete={(id) => {
                                                    deleteNote(id);
                                                    setSelectedNoteId(null);
                                                }}
                                                isFocusMode={isFocusMode}
                                                onToggleFocus={() => setIsFocusMode(!isFocusMode)}
                                            />
                                        </Suspense>
                                    </motion.div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full min-h-0 text-center relative z-10 p-12 space-y-12 animate-in fade-in duration-1000 bg-transparent overflow-hidden">
                                        <div className="relative group/gate">
                                            <div className="relative z-10 flex h-40 w-40 items-center justify-center overflow-hidden rounded-[64px] border border-white/[0.05] bg-black/40 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.22)] backdrop-blur-3xl group/icon [.light_&]:border-zinc-200/50 [.light_&]:bg-white/40 [.light_&]:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)]">
                                                <div className="absolute inset-0 notes-retina-texture opacity-[0.4] pointer-events-none [.light_&]:opacity-[0.26]" />

                                                <img
                                                    src="/favicon-dark.png"
                                                    alt="NeuroNex"
                                                    className="h-16 w-16 dark:hidden transition-all duration-1000 group-hover/gate:scale-110"
                                                />

                                                <img
                                                    src="/favicon-light.png"
                                                    alt="NeuroNex"
                                                    className="h-16 w-16 hidden dark:block transition-all duration-1000 group-hover/gate:scale-110"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-6xl font-black tracking-tighter text-zinc-100 leading-none [.light_&]:text-zinc-900">
                                                NeuroDrive
                                            </h3>

                                            <p className="mx-auto max-w-xs text-[10px] font-black uppercase tracking-[0.6em] text-zinc-500 leading-relaxed">
                                                Sinfonia de dados para mentes complexas.
                                            </p>
                                        </div>

                                        <Button
                                            onClick={handleCreateNote}
                                            className="h-16 rounded-[24px] bg-zinc-100 px-12 text-[11px] font-black uppercase tracking-[0.3em] text-black shadow-[0_30px_60px_-15px_rgba(255,255,255,0.05)] transition-all hover:opacity-90 active:scale-95 group/btn [.light_&]:bg-zinc-900 [.light_&]:text-white [.light_&]:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)]"
                                        >
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
        <div className="relative z-0 flex h-full min-h-0 w-full flex-col overflow-hidden bg-transparent font-sans text-foreground selection:bg-white/10 [.light_&]:selection:bg-zinc-900/10">
            <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-[2200px] flex-1 items-stretch px-5 pb-5 pt-28">
                <div className="relative z-10 flex min-h-0 min-w-0 flex-1 overflow-hidden rounded-[30px] ring-1 ring-zinc-950/[0.025] dark:ring-white/[0.025]">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        className="group/main-window pointer-events-auto relative flex min-h-0 min-w-0 flex-1 overflow-hidden bg-transparent shadow-none"
                    >
                        {!isFocusMode && (
                            <motion.div
                                initial={false}
                                animate={{ width: isSidebarCollapsed ? 66 : 226 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 320,
                                    damping: 34,
                                    mass: 0.78,
                                }}
                                className="notes-retina-rail relative z-20 hidden min-h-0 shrink-0 overflow-hidden border-r lg:flex"
                            >
                                <div
                                    className={cn(
                                        "h-full min-h-0 relative z-10 overflow-hidden",
                                        isSidebarCollapsed ? "w-[66px]" : "w-[226px]"
                                    )}
                                >
                                    <NotesSidebar
                                        viewMode={viewMode}
                                        setViewMode={setViewMode}
                                        selectedModuleId={selectedModuleId}
                                        onSelectModule={setSelectedModuleId}
                                        onMoveNoteToModule={(id, modId) =>
                                            updateNote({
                                                id,
                                                updates: { module_id: modId },
                                            })
                                        }
                                        onCreateNote={handleCreateNote}
                                        isCollapsed={isSidebarCollapsed}
                                        onToggleCollapsed={() =>
                                            setIsSidebarCollapsed((current) => !current)
                                        }
                                        isCreatingNote={isCreatingNote}
                                    />
                                </div>
                            </motion.div>
                        )}

                        <div className="relative z-30 flex min-h-0 min-w-0 flex-1 overflow-hidden bg-transparent">
                            <AnimatePresence mode="wait">{renderMainContent()}</AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            </div>

            <style>{`
                .notes-scroll-surface {
                    scroll-behavior: auto !important;
                    overscroll-behavior: contain;
                    contain: layout paint;
                    transform: translateZ(0);
                    backface-visibility: hidden;
                }

                .notes-list-scroll {
                    min-height: 0 !important;
                    max-height: 100% !important;
                    scrollbar-gutter: stable;
                    -webkit-overflow-scrolling: touch;
                }

                .notes-list-scroll > * {
                    min-height: 0;
                }

                .notes-list-scroll::-webkit-scrollbar {
                    width: 6px;
                }

                .notes-list-scroll::-webkit-scrollbar-track {
                    background: transparent;
                }

                .notes-list-scroll::-webkit-scrollbar-thumb {
                    border-radius: 999px;
                    background: rgba(255, 255, 255, 0.12);
                }

                .light .notes-list-scroll::-webkit-scrollbar-thumb {
                    background: rgba(24, 24, 27, 0.16);
                }
            `}</style>
        </div>
    );
}