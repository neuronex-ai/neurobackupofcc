import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckSquare,
  Folder,
  Layers3,
  Network,
  NotebookPen,
  Smartphone,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { MobileFoldersView } from "@/mobile/components/notes/MobileFoldersView";
import { MobileNeuroView } from "@/mobile/components/notes/MobileNeuroView";
import { MobileNoteEditorView } from "@/mobile/components/notes/MobileNoteEditorView";
import { MobileNotesListView } from "@/mobile/components/notes/MobileNotesListView";
import { MobileTasksView } from "@/mobile/components/notes/MobileTasksView";
import { usePersonalNotes } from "@/hooks/use-personal-notes";
import { cn } from "@/lib/utils";

type LegacyNotesView = "folders" | "all" | "tasks" | "neuroview";

const navItems = [
  { id: "folders", label: "Pastas", icon: Folder },
  { id: "all", label: "Notas", icon: NotebookPen },
  { id: "tasks", label: "Tarefas", icon: CheckSquare },
  { id: "neuroview", label: "NeuroView", icon: Network },
] as const;

export default function LegacyMobileNotes() {
  const { notes = [] } = usePersonalNotes();
  const [view, setView] = useState<LegacyNotesView>("folders");
  const [folderId, setFolderId] = useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  const visibleNotes = useMemo(() => {
    if (!folderId) return notes;
    return notes.filter((note) => note.module_id === folderId);
  }, [folderId, notes]);

  const openFolder = (id: string | "all" | "tasks" | "neuroview" | "neuroflow" | "neuropulse") => {
    if (id === "tasks") {
      setView("tasks");
      setFolderId(null);
      return;
    }

    if (id === "neuroview" || id === "neuroflow" || id === "neuropulse") {
      setView("neuroview");
      setFolderId(null);
      return;
    }

    setView("all");
    setFolderId(id === "all" ? null : id);
  };

  const renderPhoneSurface = () => {
    if (selectedNoteId) {
      return (
        <MobileNoteEditorView
          noteId={selectedNoteId}
          onClose={() => setSelectedNoteId(null)}
        />
      );
    }

    if (view === "folders") {
      return (
        <MobileFoldersView
          onSelectFolder={openFolder}
          currentFolderId={folderId || "all"}
          totalNotesCount={notes.length}
          tasksCount={0}
        />
      );
    }

    if (view === "tasks") {
      return <MobileTasksView />;
    }

    if (view === "neuroview") {
      return <MobileNeuroView onBack={() => setView("folders")} />;
    }

    return (
      <div className="flex h-full min-h-0 flex-col bg-background">
        <div className="flex shrink-0 items-center justify-between border-b border-border/40 px-5 py-4">
          <button
            type="button"
            onClick={() => {
              setFolderId(null);
              setView("folders");
            }}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/45 bg-card text-foreground"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="text-right">
            <p className="text-[8px] font-black uppercase tracking-[0.18em] text-muted-foreground">
              Mobile antigo
            </p>
            <p className="text-sm font-black">Notas</p>
          </div>
        </div>
        <MobileNotesListView
          notes={visibleNotes}
          onNoteSelect={setSelectedNoteId}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_16%_0%,hsl(var(--foreground)/0.06),transparent_30%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.2))]" />

      <main className="relative mx-auto grid min-h-screen w-full max-w-[1380px] gap-8 px-5 py-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:px-10">
        <aside className="flex flex-col justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
              <Smartphone className="h-4 w-4" />
              Notas mobile
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
              Interface antiga
            </h1>

            <div className="mt-6 grid gap-2">
              {navItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setSelectedNoteId(null);
                    setFolderId(null);
                    setView(id);
                  }}
                  className={cn(
                    "flex h-12 items-center justify-between rounded-2xl border px-4 text-left text-sm font-semibold transition-colors",
                    view === id
                      ? "border-foreground bg-foreground text-background"
                      : "border-border/45 bg-card/70 text-foreground hover:bg-muted/60 dark:border-white/10 dark:bg-white/[0.035]",
                  )}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    {label}
                  </span>
                  {id === "all" ? (
                    <span className="text-xs opacity-60">{notes.length}</span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-border/45 bg-card/72 p-5 dark:border-white/10 dark:bg-white/[0.035]">
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground">
              <Layers3 className="h-4 w-4" />
              Rota isolada
            </div>
            <Button asChild variant="outline" className="mt-4 h-11 w-full rounded-2xl">
              <Link to="/notas">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Notas atuais
              </Link>
            </Button>
          </div>
        </aside>

        <section className="flex min-h-[720px] items-center justify-center">
          <div className="h-[820px] w-full max-w-[430px] overflow-hidden rounded-[46px] border border-border/50 bg-background shadow-[0_34px_120px_-58px_rgba(0,0,0,0.9)] ring-8 ring-foreground/[0.035] dark:border-white/10 dark:ring-white/[0.035]">
            {renderPhoneSurface()}
          </div>
        </section>
      </main>
    </div>
  );
}
