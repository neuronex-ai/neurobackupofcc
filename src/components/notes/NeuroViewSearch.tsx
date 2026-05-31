"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Brain, FileText, User, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/SessionContextProvider";
import { cn } from "@/lib/utils";

interface SearchReference {
  noteId?: string;
  noteTitle?: string;
  patientName?: string;
  matchSnippet?: string;
  type: 'note' | 'session';
}

interface SearchResult {
  answer: string;
  references: SearchReference[];
}

interface NeuroViewSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectNote?: (noteId: string) => void;
}

export const NeuroViewSearch = ({ isOpen, onClose, onSelectNote }: NeuroViewSearchProps) => {
  const { session } = useAuth();
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery("");
      setResult(null);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleSearch = useCallback(async () => {
    if (!query.trim() || !session?.access_token) return;

    setIsSearching(true);
    setResult(null);

    try {
      const userId = session.user.id;

      // 1. Search personal_notes
      const searchTerms = query.split(' ').filter(t => t.length > 2).map(t => `%${t}%`);
      let noteMatches: any[] = [];

      for (const term of searchTerms.slice(0, 3)) {
        const { data } = await supabase
          .from('personal_notes')
          .select('id, title, content, tags, created_at')
          .eq('user_id', userId)
          .or(`title.ilike.${term},content.ilike.${term}`)
          .limit(10);
        if (data) noteMatches.push(...data);
      }

      // Deduplicate
      const seenIds = new Set<string>();
      noteMatches = noteMatches.filter(n => {
        if (seenIds.has(n.id)) return false;
        seenIds.add(n.id);
        return true;
      }).slice(0, 8);

      // 2. Search session_notes (AI summaries)
      let sessionMatches: any[] = [];
      for (const term of searchTerms.slice(0, 2)) {
        const { data } = await supabase
          .from('session_notes')
          .select('id, patient_id, ai_summary, created_at, patient:patient_id(name)')
          .eq('user_id', userId)
          .ilike('notes', term)
          .limit(5);
        if (data) sessionMatches.push(...data);
      }

      const seenSessionIds = new Set<string>();
      sessionMatches = sessionMatches.filter(n => {
        if (seenSessionIds.has(n.id)) return false;
        seenSessionIds.add(n.id);
        return true;
      }).slice(0, 5);

      // 3. Build context for AI
      const contextParts: string[] = [];
      const references: SearchReference[] = [];

      noteMatches.forEach(note => {
        const snippet = (note.content || '').substring(0, 200);
        contextParts.push(`[Nota: "${note.title || 'Sem título'}"]\n${snippet}`);
        references.push({
          noteId: note.id,
          noteTitle: note.title || 'Sem título',
          matchSnippet: snippet.substring(0, 80) + '...',
          type: 'note',
        });
      });

      sessionMatches.forEach(sn => {
        const patientName = Array.isArray(sn.patient) ? sn.patient[0]?.name : (sn.patient as any)?.name;
        const summaryText = typeof sn.ai_summary === 'string' ? sn.ai_summary : JSON.stringify(sn.ai_summary || '').substring(0, 200);
        contextParts.push(`[Prontuário - Paciente: ${patientName || 'Desconhecido'}]\n${summaryText}`);
        references.push({
          noteId: sn.id,
          patientName: patientName || 'Paciente',
          matchSnippet: summaryText.substring(0, 80) + '...',
          type: 'session',
        });
      });

      if (contextParts.length === 0) {
        setResult({
          answer: "Não encontrei nenhuma nota ou prontuário que corresponda à sua busca. Tente reformular com termos diferentes.",
          references: [],
        });
        return;
      }

      // 4. Call AI for conversational answer
      const { data: chatSession } = await supabase.functions.invoke('gemini-text-chat', {
        body: {
          message: `Você é o assistente do NeuroView (Segundo Cérebro). O profissional perguntou: "${query}"

Com base nas seguintes notas e prontuários dele, responda de forma conversacional, clara e útil em português. Cite as fontes relevantes.

${contextParts.join('\n\n---\n\n')}`,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const aiAnswer = chatSession?.response || chatSession?.text || "Não consegui processar a resposta. Tente novamente.";

      setResult({
        answer: aiAnswer,
        references: references.slice(0, 5),
      });
    } catch (error: any) {
      console.error("NeuroView Search Error:", error);
      setResult({
        answer: "Erro ao processar a busca. Verifique sua conexão e tente novamente.",
        references: [],
      });
    } finally {
      setIsSearching(false);
    }
  }, [query, session]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-xl"
          onClick={onClose}
        />

        {/* Search Panel */}
        <motion.div
          initial={{ opacity: 0, y: -30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl mx-4"
        >
          {/* Main Card */}
          <div className="bg-white dark:bg-[#0A0A0B] border border-zinc-200 dark:border-white/10 rounded-[32px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] overflow-hidden">
            {/* Search Input */}
            <form onSubmit={handleSubmit} className="relative">
              <div className="flex items-center px-8 py-2 border-b border-zinc-100 dark:border-white/5">
                <Brain className="h-5 w-5 text-zinc-300 dark:text-zinc-600 shrink-0 mr-4" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Pesquise com linguagem natural..."
                  className="flex-1 h-16 bg-transparent border-none text-base text-black dark:text-white placeholder:text-zinc-300 dark:placeholder:text-zinc-700 focus:outline-none font-medium"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => { setQuery(""); setResult(null); }}
                    className="p-2 text-zinc-300 hover:text-zinc-600 dark:text-zinc-700 dark:hover:text-zinc-400 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </form>

            {/* Results */}
            <AnimatePresence mode="wait">
              {isSearching && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-8 py-12 flex flex-col items-center gap-4"
                >
                  <div className="relative">
                    <Loader2 className="h-8 w-8 animate-spin text-zinc-300 dark:text-zinc-700" />
                    <Sparkles className="h-3 w-3 text-zinc-400 absolute -top-1 -right-1 animate-pulse" />
                  </div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.3em] animate-pulse">Buscando nas suas memórias...</p>
                </motion.div>
              )}

              {result && !isSearching && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="max-h-[50vh] overflow-y-auto custom-scrollbar"
                >
                  {/* AI Answer */}
                  <div className="px-8 py-6 border-b border-zinc-100 dark:border-white/5">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-xl bg-zinc-950 dark:bg-white flex items-center justify-center shrink-0 mt-0.5">
                        <Brain className="h-4 w-4 text-white dark:text-zinc-900" />
                      </div>
                      <p className="text-[13px] text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium whitespace-pre-wrap">{result.answer}</p>
                    </div>
                  </div>

                  {/* References */}
                  {result.references.length > 0 && (
                    <div className="px-8 py-5 space-y-2">
                      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-3">Fontes Encontradas</p>
                      {result.references.map((ref, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            if (ref.noteId && ref.type === 'note' && onSelectNote) {
                              onSelectNote(ref.noteId);
                              onClose();
                            }
                          }}
                          className={cn(
                            "w-full text-left flex items-center gap-4 p-4 rounded-2xl border border-zinc-100 dark:border-white/5 hover:bg-zinc-50 dark:hover:bg-white/[0.03] transition-all group",
                            ref.type === 'note' && onSelectNote ? 'cursor-pointer' : 'cursor-default'
                          )}
                        >
                          <div className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border",
                            ref.type === 'note'
                              ? "bg-blue-500/10 border-blue-500/20 text-blue-500"
                              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                          )}>
                            {ref.type === 'note' ? <FileText className="h-4 w-4" /> : <User className="h-4 w-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-bold text-black dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {ref.type === 'note' ? ref.noteTitle : `Prontuário — ${ref.patientName}`}
                            </p>
                            <p className="text-[10px] text-zinc-400 truncate mt-0.5">{ref.matchSnippet}</p>
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 text-zinc-300 group-hover:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer Hint */}
            {!isSearching && !result && (
              <div className="px-8 py-5 flex items-center justify-between text-zinc-300 dark:text-zinc-700">
                <span className="text-[9px] font-bold uppercase tracking-[0.2em]">Ctrl+K para abrir · Enter para buscar · Esc para fechar</span>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3" />
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em]">NeuroView AI</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
