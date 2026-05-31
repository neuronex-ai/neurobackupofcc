"use client";

import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { ChevronRight, Clock, FileText, MoreHorizontal, Sparkles } from "lucide-react";

interface SessionNoteCardProps {
  note: {
    id: string;
    created_at: string;
    notes: string;
    ai_summary?: any;
  };
  onClick?: () => void;
}

export const SessionNoteCard = ({ note, onClick }: SessionNoteCardProps) => {
  const date = new Date(note.created_at);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
      onClick={onClick}
      className="group relative cursor-pointer"
    >
      {/* Glow Effect on Hover */}
      <div className="absolute -inset-0.5 bg-gradient-to-b from-white/10 to-transparent rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-xl" />
      
      <div className="relative flex flex-col h-full bg-[#0A0A0A]/80 backdrop-blur-3xl border border-white/[0.04] group-hover:border-white/10 p-7 rounded-[32px] overflow-hidden transition-all duration-500 shadow-2xl">
        {/* Subtle Micro-texture */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.03),transparent)] pointer-events-none" />
        
        <header className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center group-hover:bg-white/10 transition-all duration-500 group-hover:scale-110">
              <FileText className="h-5 w-5 text-zinc-400 group-hover:text-white transition-colors" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-1 group-hover:text-zinc-400 transition-colors">
                Sessão Realizada
              </span>
              <h3 className="text-lg font-light text-white tracking-tight">
                {format(date, "dd 'de' MMMM", { locale: ptBR })}
              </h3>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white/5 text-zinc-600 hover:text-white opacity-0 group-hover:opacity-100 transition-all duration-500">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </header>

        <div className="flex-1 space-y-4">
          <p className="text-zinc-500 text-sm leading-relaxed line-clamp-3 font-light group-hover:text-zinc-300 transition-colors">
            {note.notes || "Sem observações detalhadas nesta sessão."}
          </p>

          {note.ai_summary && (
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2 group-hover:bg-white/[0.04] transition-all duration-500">
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-emerald-500/80">
                <Sparkles className="h-3 w-3" />
                <span>Insight da IA</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">
                {typeof note.ai_summary === 'string' ? note.ai_summary : note.ai_summary.summary}
              </p>
            </div>
          )}
        </div>

        <footer className="mt-8 pt-6 border-t border-white/[0.03] flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
            <Clock className="h-3 w-3" />
            <span>{format(date, "HH:mm")}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-white uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-700">
            Detalhes <ChevronRight className="h-3 w-3" />
          </div>
        </footer>
      </div>
    </motion.div>
  );
};