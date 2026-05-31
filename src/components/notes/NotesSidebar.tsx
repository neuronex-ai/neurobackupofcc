"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Share2,
  Fingerprint,
  Plus,
  Folder,
  FolderOpen,
  StickyNote,
  ListTodo,
  Trash2
} from "lucide-react";
import { useNoteModules } from "@/hooks/use-note-modules";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface NotesSidebarProps {
  viewMode: 'notes' | 'tasks' | 'notion' | 'neuroview' | 'neuroflow' | 'neuropulse' | 'files';
  setViewMode: (mode: any) => void;
  selectedModuleId: string | null;
  onSelectModule: (id: string | null) => void;
  onMoveNoteToModule?: (noteId: string, moduleId: string) => void;
  onCreateNote?: () => void;
}

export const NotesSidebar = ({
  viewMode,
  setViewMode,
  selectedModuleId,
  onSelectModule,
  onMoveNoteToModule,
  onCreateNote,
}: NotesSidebarProps) => {
  const { modules, createModule, deleteModule } = useNoteModules();
  const [dragOverModuleId, setDragOverModuleId] = useState<string | null>(null);

  const handleCreateModule = async () => {
    const name = prompt("Nome da nova pasta:");
    if (name) {
      await createModule(name);
    }
  };

  const handleDrop = (e: React.DragEvent, moduleId: string) => {
    e.preventDefault();
    const noteId = e.dataTransfer.getData("noteId");
    if (noteId && onMoveNoteToModule) {
      onMoveNoteToModule(noteId, moduleId);
      toast.success("Nota movida com sucesso.");
    }
    setDragOverModuleId(null);
  };

  const handleDragOver = (e: React.DragEvent, moduleId: string) => {
    e.preventDefault();
    setDragOverModuleId(moduleId);
  };


  const renderItem = (item: { id: string; label: string; icon: any; mode: string }) => {
    const isActive = viewMode === item.mode && !selectedModuleId;
    return (
      <button
        key={item.id}
        onClick={() => { setViewMode(item.mode); onSelectModule(null); }}
        className={cn(
          "w-full flex items-center justify-between group px-4 py-2.5 rounded-xl transition-all duration-500 relative overflow-hidden",
          isActive
            ? "bg-zinc-900 text-white shadow-[0_15px_30px_-10px_rgba(0,0,0,0.15)] dark:bg-white dark:text-black dark:shadow-[0_15px_30px_-10px_rgba(255,255,255,0.1)]"
            : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-500 dark:hover:text-zinc-200 dark:hover:bg-white/5"
        )}
      >
        <div className="flex items-center gap-4 relative z-10">
          <item.icon className={cn("h-4 w-4 shrink-0 transition-all duration-500", isActive ? "scale-110" : "opacity-40 group-hover:opacity-100")} strokeWidth={isActive ? 2.5 : 1.5} />
          <span className="text-[10px] font-black uppercase tracking-[0.25em] whitespace-nowrap">{item.label}</span>
        </div>
        {isActive && (
          <motion.div
            layoutId="active-pill"
            className="absolute right-2 h-1.5 w-1.5 rounded-full bg-white/40 dark:bg-black/40"
          />
        )}
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full w-full bg-transparent font-sans relative">
      <div className="absolute inset-0 premium-noise opacity-[0.03] pointer-events-none" />

      {/* Brand Header */}
      <div className="px-8 pt-10 pb-6 relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-1.5 w-1.5 rounded-full bg-zinc-900 dark:bg-white shadow-[0_0_15px_rgba(0,0,0,0.2)] dark:shadow-[0_0_15px_rgba(255,255,255,0.2)] animate-pulse" />
          <h2 className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.5em]">NeuroDrive</h2>
        </div>
        <div className="h-px w-full bg-gradient-to-r from-zinc-200 via-zinc-100 to-transparent dark:from-zinc-800 dark:via-zinc-800/50 dark:to-transparent mt-4" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-8 pb-10 custom-scrollbar relative z-10">

        {/* New Note Button with favicon */}
        <div className="px-2">
          <button
            onClick={onCreateNote}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-black shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group"
          >
            {/* Favicon - dark on light mode, white on dark mode */}
            <img
              src="/favicon-dark.png"
              alt="NeuroNex"
              className="h-5 w-5 dark:hidden"
            />
            <img
              src="/favicon-light.png"
              alt="NeuroNex"
              className="h-5 w-5 hidden dark:block"
            />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Nova Nota</span>
            <Plus className="h-3.5 w-3.5 ml-auto opacity-50 group-hover:opacity-100 transition-opacity" strokeWidth={2.5} />
          </button>

        </div>

        {/* ─── SEGUNDO CÉREBRO ─── */}
        <div className="space-y-2">
          <h3 className="px-4 text-[8px] font-black uppercase tracking-[0.4em] text-zinc-400 dark:text-zinc-600 mb-4">Sincronia</h3>
          <div className="space-y-1">
            {[
              { id: 'notes', label: 'Notas', icon: StickyNote, mode: 'notes' },
              { id: 'tasks', label: 'Tarefas', icon: ListTodo, mode: 'tasks' },
              { id: 'files', label: 'Drive', icon: FolderOpen, mode: 'files' },
            ].map(renderItem)}
          </div>

          {/* Pastas */}
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between px-4 group/folder-header">
              <span className="text-[8px] font-black uppercase tracking-[0.4em] text-zinc-400 dark:text-zinc-600">Módulos</span>
              <button
                onClick={handleCreateModule}
                className="opacity-0 group-hover/folder-header:opacity-100 p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 transition-all"
              >
                <Plus className="h-3.5 w-3.5 stroke-[3]" />
              </button>
            </div>

            <div className="space-y-1">
              {modules?.map((module) => {
                const isActive = selectedModuleId === module.id;
                const isDragOver = dragOverModuleId === module.id;
                return (
                  <button
                    key={module.id}
                    onClick={() => { onSelectModule(module.id); setViewMode('notes'); }}
                    onDragOver={(e) => handleDragOver(e, module.id)}
                    onDragLeave={() => setDragOverModuleId(null)}
                    onDrop={(e) => handleDrop(e, module.id)}
                    className={cn(
                      "w-full flex items-center justify-between group px-4 py-2.5 rounded-xl transition-all duration-500 border select-none",
                      isActive
                        ? "bg-zinc-100 text-zinc-900 border-zinc-200 shadow-sm dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700"
                        : isDragOver
                          ? "bg-zinc-200 border-zinc-300 text-zinc-900 dark:bg-zinc-800 dark:border-zinc-600 dark:text-white"
                          : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 border-transparent dark:text-zinc-500 dark:hover:text-zinc-300 dark:hover:bg-white/5"
                    )}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <Folder className={cn("h-3.5 w-3.5 shrink-0 transition-all duration-500", isActive ? "text-zinc-900" : "opacity-30 group-hover:opacity-100")} strokeWidth={isActive ? 2.5 : 1.5} />
                      <span className="text-[10px] font-bold tracking-tight truncate uppercase">{module.name}</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); if (confirm("Excluir este módulo?")) deleteModule(module.id); }}
                      className={cn(
                        "opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all",
                        isActive ? "hover:bg-zinc-200 text-zinc-400 hover:text-zinc-900" : "hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900"
                      )}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─── REDES NEURAIS ─── */}
        <div className="space-y-2">
          <h3 className="px-4 text-[8px] font-black uppercase tracking-[0.4em] text-zinc-400 dark:text-zinc-600 mb-4">Inteligência</h3>
          <div className="space-y-1">
            {[
              { id: 'neuroview', label: 'NeuroView', icon: Share2, mode: 'neuroview' },
              { id: 'neuroflow', label: 'NeuroFlow', icon: Share2, mode: 'neuroflow' },
              { id: 'neuropulse', label: 'NeuroPulse', icon: Fingerprint, mode: 'neuropulse' },
            ].map(renderItem)}
          </div>
        </div>

      </div>
    </div>
  );
};