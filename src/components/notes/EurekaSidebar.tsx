"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Lightbulb, X, Link2, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/SessionContextProvider";

export interface EurekaInsight {
  title: string;
  description: string;
  linkedNoteId?: string;
  linkedPatientName?: string;
  confidence: number;
}

interface EurekaSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  editorContent: string;
  patientId?: string;
}

export const EurekaSidebar = ({ isOpen, onClose, editorContent }: EurekaSidebarProps) => {
  const { session } = useAuth();
  const [insights, setInsights] = useState<EurekaInsight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastContentRef = useRef<string>("");

  // Debounced analysis: trigger 2s after user stops typing
  useEffect(() => {
    if (!isOpen || !editorContent || editorContent.length < 50) return;

    // Only re-analyze if content changed significantly
    const contentChanged = Math.abs(editorContent.length - lastContentRef.current.length) > 30 ||
      editorContent.substring(0, 100) !== lastContentRef.current.substring(0, 100);

    if (!contentChanged) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      lastContentRef.current = editorContent;
      await analyzeContent(editorContent);
    }, 2500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [editorContent, isOpen]);

  const analyzeContent = async (content: string) => {
    if (!session?.access_token) return;

    setIsAnalyzing(true);

    try {
      const userId = session.user.id;
      const excerpt = content.substring(0, 800);

      // Fetch recent notes for context
      const { data: notes } = await supabase
        .from('personal_notes')
        .select('id, title, content, tags')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(15);

      // Fetch recent session notes
      const { data: sessionNotes } = await supabase
        .from('session_notes')
        .select('id, notes, ai_summary, patient:patient_id(name)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      const historyContext: string[] = [];
      notes?.forEach(n => {
        historyContext.push(`[Nota: "${n.title || 'Sem título'}"] ${(n.content || '').substring(0, 150)}`);
      });
      sessionNotes?.forEach(sn => {
        const pName = Array.isArray(sn.patient) ? sn.patient[0]?.name : (sn.patient as any)?.name;
        const summary = typeof sn.ai_summary === 'string' ? sn.ai_summary : JSON.stringify(sn.ai_summary || '');
        historyContext.push(`[Prontuário - ${pName || '?'}] ${summary.substring(0, 150)}`);
      });

      const prompt = `Você é o Motor de Eureka do NeuroView. O profissional está escrevendo o seguinte texto agora:

"${excerpt}"

Aqui estão notas e prontuários anteriores dele:
${historyContext.join('\n')}

Identifique de 1 a 3 conexões, padrões ou insights entre o que ele está escrevendo agora e o histórico. Para cada insight retorne em JSON:
[{"title": "título curto", "description": "explicação de 1-2 frases", "linkedPatientName": "nome se relevante ou null", "confidence": 0.0 a 1.0}]

Retorne APENAS o JSON array, sem markdown, sem explicação extra.`;

      const { data: chatResult } = await supabase.functions.invoke('gemini-text-chat', {
        body: { message: prompt },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      const aiText = chatResult?.response || chatResult?.text || '[]';

      // Parse JSON from response
      const jsonMatch = aiText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed: EurekaInsight[] = JSON.parse(jsonMatch[0]);
        setInsights(parsed.filter(i => i.confidence > 0.3).slice(0, 3));
      }
    } catch (error) {
      console.error("Eureka analysis error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20, width: 0 }}
      animate={{ opacity: 1, x: 0, width: 360 }}
      exit={{ opacity: 0, x: 20, width: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="h-full border-l border-black/[0.05] dark:border-white/[0.05] bg-white/40 dark:bg-black/40 backdrop-blur-3xl flex flex-col overflow-hidden shrink-0 relative"
    >
      <div className="absolute inset-0 premium-noise opacity-[0.02] dark:opacity-[0.04] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/40 dark:from-white/[0.02] to-transparent pointer-events-none" />

      {/* Header */}
      <div className="px-6 py-5 border-b border-black/[0.05] dark:border-white/[0.05] flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-inner">
            <Lightbulb className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <p className="text-xs font-black text-black dark:text-white tracking-tight">Motor Eureka</p>
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
              {isAnalyzing ? "Analisando..." : `${insights.length} insight(s) encontrado(s)`}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-zinc-500 hover:text-black dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4 relative z-10">
        {isAnalyzing && insights.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-5">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full scale-150 animate-pulse" />
              <div className="w-16 h-16 rounded-3xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center relative z-10 shadow-lg">
                <Loader2 className="h-7 w-7 animate-spin text-amber-500" />
              </div>
              <Sparkles className="h-4 w-4 text-amber-400 absolute -top-2 -right-2 animate-pulse z-20" />
            </div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.25em] text-center max-w-[220px] animate-pulse leading-relaxed">
              Mapeando redes neurais e encontrando conexões no histórico...
            </p>
          </div>
        )}

        <AnimatePresence>
          {insights.map((insight, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.95 }}
              transition={{ delay: i * 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="p-5 rounded-3xl bg-white/60 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.05] shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-none space-y-4 group hover:border-amber-500/30 dark:hover:bg-white/[0.06] transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-black text-black dark:text-white leading-tight mb-1">{insight.title}</p>
                  <p className="text-[11.5px] text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">{insight.description}</p>
                </div>
              </div>

              {insight.linkedPatientName && (
                <div className="flex items-center gap-2 pl-[48px]">
                  <Link2 className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
                  <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.1em]">
                    Referência: {insight.linkedPatientName}
                  </span>
                </div>
              )}

              <div className="pl-[48px] pt-1">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 rounded-full bg-zinc-200 dark:bg-white/10 overflow-hidden shadow-inner">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 dark:from-amber-500 dark:to-emerald-400 transition-all duration-1000 ease-out"
                      style={{ width: `${Math.round(insight.confidence * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 tabular-nums tracking-widest">
                    {Math.round(insight.confidence * 100)}%
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {!isAnalyzing && insights.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-6 text-center opacity-60">
            <div className="w-20 h-20 rounded-[32px] bg-black/[0.02] dark:bg-white/5 border border-black/[0.05] dark:border-white/[0.05] flex items-center justify-center shadow-inner">
              <Lightbulb className="h-8 w-8 text-black/20 dark:text-white/20" strokeWidth={1} />
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-[0.2em]">Sem insights ainda</p>
              <p className="text-[11px] text-zinc-500 max-w-[220px] leading-relaxed mx-auto font-medium">
                Continue escrevendo e o Motor Eureka mapeará conexões surpreendentes no seu histórico.
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

