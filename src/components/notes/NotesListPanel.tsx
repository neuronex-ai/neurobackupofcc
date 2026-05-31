"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Search, Plus, Trash2, Sparkles, Clock, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

interface NotesListPanelProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  items: any[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDeleteNote: (id: string) => void;
  isLoading?: boolean;
}

export const NotesListPanel = ({
  searchQuery,
  setSearchQuery,
  items,
  selectedId,
  onSelect,
  onCreate,
  onDeleteNote,
  isLoading
}: NotesListPanelProps) => {

  const handleDragStart = (e: React.DragEvent, noteId: string) => {
    e.dataTransfer.setData("noteId", noteId);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="flex flex-col h-full w-full bg-transparent font-sans relative">
      <div className="absolute inset-0 premium-noise opacity-[0.02] pointer-events-none" />

      {/* Header Section */}
      <div className="px-6 pt-10 pb-6 shrink-0 space-y-8 relative z-10">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase">Notas</h2>
            <div className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-zinc-900 opacity-20" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400">
                {items.length} Registros
              </span>
            </div>
          </div>
          <button
            onClick={onCreate}
            className="h-12 w-12 rounded-2xl bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 flex items-center justify-center transition-all active:scale-95 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] group/btn"
          >
            <Plus className="h-6 w-6 stroke-[3] transition-transform duration-500 group-hover/btn:rotate-90" />
          </button>
        </div>

        <div className="relative group/search">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 transition-colors group-focus-within/search:text-zinc-900 dark:text-zinc-600 dark:group-focus-within/search:text-white" strokeWidth={1.5} />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrar pensamentos..."
            className="h-12 pl-12 bg-zinc-100 border-transparent focus:border-zinc-200 rounded-2xl text-[12px] font-bold placeholder:text-zinc-400 text-zinc-900 transition-all ring-inset focus-visible:ring-0 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-600 dark:focus:border-zinc-700"
          />
        </div>
      </div>

      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto px-4 pb-12 space-y-4 custom-scrollbar relative z-10">
        {isLoading ? (
          <div className="space-y-4 pt-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 rounded-[24px] bg-white/[0.01] border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center space-y-6 opacity-30 mt-10 animate-in fade-in zoom-in duration-1000">
            <div className="w-20 h-20 rounded-[32px] bg-white/[0.01] border border-white/5 flex items-center justify-center shadow-inner relative group/empty">
              <Sparkles className="h-8 w-8 text-zinc-700 transition-colors duration-1000 group-hover/empty:text-white" strokeWidth={1} />
              <div className="absolute inset-0 bg-white/5 blur-2xl rounded-full opacity-0 group-hover/empty:opacity-100 transition-opacity duration-1000" />
            </div>
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-600">Vazio Estrutural</p>
          </div>
        ) : (
          <AnimatePresence initial={false} mode="popLayout">
            {items.map((item) => {
              const isActive = selectedId === item.id;
              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={item.id}
                  draggable
                  onDragStart={(e: any) => handleDragStart(e, item.id)}
                  onClick={() => onSelect(item.id)}
                  className={cn(
                    "group relative p-5 rounded-[28px] cursor-pointer transition-all duration-500 border overflow-hidden",
                    isActive
                      ? "bg-zinc-900 text-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] border-transparent dark:bg-white dark:text-black dark:shadow-[0_30px_60px_-15px_rgba(255,255,255,0.1)]"
                      : "bg-white border-zinc-100 hover:border-zinc-200 hover:bg-zinc-50 text-zinc-400 shadow-sm dark:bg-black/20 dark:border-white/[0.05] dark:text-zinc-500 dark:hover:bg-white/[0.05] dark:hover:text-zinc-300"
                  )}
                >
                  {isActive && (
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <FileText className="h-12 w-12 text-white dark:text-black" strokeWidth={0.5} />
                    </div>
                  )}

                  <div className="flex flex-col gap-3 relative z-10">
                    <div className="flex items-center justify-between">
                      <h3 className={cn(
                        "text-[14px] font-black leading-tight tracking-tight line-clamp-1 transition-colors",
                        isActive ? "text-white dark:text-black" : "text-zinc-900 group-hover:text-zinc-900 dark:text-zinc-200 dark:group-hover:text-white"
                      )}>
                        {item.title || "Indefinido"}
                      </h3>
                      {isActive && <div className="h-1.5 w-1.5 rounded-full bg-white/40 dark:bg-black/20" />}
                    </div>

                    <p className={cn(
                      "text-[11px] leading-relaxed line-clamp-2 font-bold tracking-tight opacity-60",
                      isActive ? "text-zinc-300 dark:text-zinc-600" : "text-zinc-500 dark:text-zinc-500"
                    )}>
                      {item.content?.replace(/<[^>]*>/g, '').slice(0, 120) || "Sinopse ausente..."}
                    </p>

                    <div className={cn(
                      "flex items-center justify-between mt-2 pt-3 border-t",
                      isActive ? "border-white/10 dark:border-black/5" : "border-zinc-100 dark:border-white/5"
                    )}>
                      <div className={cn(
                        "flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.2em]",
                        isActive ? "text-zinc-400 dark:text-zinc-500" : "text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-600 dark:group-hover:text-zinc-400"
                      )}>
                        <Clock className="h-3 w-3" />
                        {item.reference_date ? format(new Date(item.reference_date), "dd MMM", { locale: ptBR }) : "Agora"}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Deletar permanentemente?")) onDeleteNote(item.id);
                        }}
                        className={cn(
                          "opacity-0 group-hover:opacity-100 transition-all p-2 rounded-xl",
                          isActive ? "hover:bg-white/10 text-white/40 hover:text-white dark:hover:bg-black/10 dark:text-black/40 dark:hover:text-black" : "hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 dark:hover:bg-white/10 dark:hover:text-white"
                        )}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 0px; }
        .custom-scrollbar:hover::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
};