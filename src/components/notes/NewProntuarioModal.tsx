"use client";

import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mic, FileText, X, Loader2, Check, Edit3, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/SessionContextProvider";
import { supabase } from "@/integrations/supabase/client";

interface NewProntuarioModalProps {
  children?: React.ReactNode;
  patientId?: string;
  patientName?: string;
}

export const NewProntuarioModal = ({ children, patientId, patientName }: NewProntuarioModalProps) => {
  const { session } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'select' | 'record' | 'text' | 'result'>('select');
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingText, setRecordingText] = useState("");

  const startRecording = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMode('text');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'pt-BR';
    let finalTranscript = '';

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setRecordingText(finalTranscript + interim);
    };

    recognition.onerror = () => {
      setIsRecording(false);
      setMode('text');
      setInputText(recordingText);
    };

    recognition.onend = () => {
      setIsRecording(false);
      if (finalTranscript.trim()) {
        setInputText(finalTranscript.trim());
        setMode('text');
      }
    };

    (window as any).__currentRecognition = recognition;
    recognition.start();
    setIsRecording(true);
    setMode('record');
  }, [recordingText]);

  const stopRecording = useCallback(() => {
    const recognition = (window as any).__currentRecognition;
    if (recognition) {
      recognition.stop();
      (window as any).__currentRecognition = null;
    }
    setIsRecording(false);
    setInputText(recordingText);
    setMode('text');
  }, [recordingText]);

  const generateProntuario = async () => {
    if (!inputText.trim() || !session?.access_token) return;

    setIsProcessing(true);
    try {
      const { data } = await supabase.functions.invoke('generate-session-prontuario', {
        body: {
          notes: inputText,
          patientId: patientId || null,
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      const generated = data?.prontuario || data?.response || data?.text || "Não foi possível gerar o prontuário.";
      setResult(generated);
      setMode('result');
    } catch (error) {
      console.error("Error generating prontuário:", error);
      setResult("Erro ao gerar o prontuário. Tente novamente.");
      setMode('result');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setMode('select');
    setInputText("");
    setResult(null);
    setRecordingText("");
    if (isRecording) stopRecording();
  };

  return (
    <>
      <div onClick={() => setIsOpen(true)} className="w-full inline-flex md:w-auto h-full">
        {children}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-lg" onClick={handleClose} />

            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-lg mx-4 bg-white dark:bg-[#0A0A0B] border border-zinc-200 dark:border-white/10 rounded-[32px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-8 py-5 border-b border-zinc-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-950 dark:bg-white flex items-center justify-center shadow-lg">
                    <FileText className="h-4.5 w-4.5 text-white dark:text-zinc-900" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-black dark:text-white tracking-tight">Prontuário Rápido</p>
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
                      {patientName || 'Geração por IA'}
                    </p>
                  </div>
                </div>
                <button onClick={handleClose} className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-400 hover:text-black dark:hover:text-white transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-8">
                {/* Mode Select */}
                {mode === 'select' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <p className="text-[12px] text-zinc-500 font-medium mb-6">Como deseja registrar a sessão?</p>
                    <button
                      onClick={startRecording}
                      className="w-full p-6 rounded-2xl border border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-white/[0.02] hover:bg-zinc-100 dark:hover:bg-white/[0.05] transition-all flex items-center gap-5 group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Mic className="h-5 w-5 text-red-500" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-black dark:text-white">Gravar Agora</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">Fale e a IA transcreve automaticamente</p>
                      </div>
                    </button>
                    <button
                      onClick={() => setMode('text')}
                      className="w-full p-6 rounded-2xl border border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-white/[0.02] hover:bg-zinc-100 dark:hover:bg-white/[0.05] transition-all flex items-center gap-5 group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Edit3 className="h-5 w-5 text-blue-500" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-black dark:text-white">Colar Texto</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">Cole suas anotações ou transcrição</p>
                      </div>
                    </button>
                  </motion.div>
                )}

                {/* Recording */}
                {mode === 'record' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-6 py-8">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center animate-pulse">
                        <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center">
                          <Mic className="h-7 w-7 text-red-500" />
                        </div>
                      </div>
                      <div className="absolute inset-0 rounded-full border-2 border-red-500/30 animate-ping" />
                    </div>
                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-[0.3em] animate-pulse">Gravando...</p>
                    {recordingText && (
                      <p className="text-xs text-zinc-500 text-center max-w-sm leading-relaxed bg-zinc-50 dark:bg-white/5 p-4 rounded-2xl border border-zinc-100 dark:border-white/5">
                        {recordingText}
                      </p>
                    )}
                    <Button onClick={stopRecording} variant="outline" className="rounded-xl px-6 gap-2">
                      <Square className="h-3 w-3 fill-current" /> Parar Gravação
                    </Button>
                  </motion.div>
                )}

                {/* Text Input */}
                {mode === 'text' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Cole ou digite as suas anotações da sessão aqui. A IA gerará o prontuário automaticamente..."
                      className="w-full h-48 p-5 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 rounded-2xl text-sm text-black dark:text-white placeholder:text-zinc-300 dark:placeholder:text-zinc-700 resize-none focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 transition-all font-medium"
                      autoFocus
                    />
                    <Button
                      onClick={generateProntuario}
                      disabled={!inputText.trim() || isProcessing}
                      className="w-full h-12 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-xs uppercase tracking-[0.2em] disabled:opacity-40"
                    >
                      {isProcessing ? (
                        <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Gerando Prontuário...</>
                      ) : (
                        <><FileText className="h-4 w-4 mr-2" /> Gerar Prontuário com IA</>
                      )}
                    </Button>
                  </motion.div>
                )}

                {/* Result */}
                {mode === 'result' && result && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <Check className="h-4 w-4 text-emerald-500" />
                      </div>
                      <p className="text-sm font-bold text-black dark:text-white">Prontuário Gerado</p>
                    </div>
                    <div className="max-h-64 overflow-y-auto custom-scrollbar p-5 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 rounded-2xl text-[13px] text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap font-medium">
                      {result}
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={handleClose}
                        variant="outline"
                        className="flex-1 h-10 rounded-xl text-xs font-bold"
                      >
                        Fechar
                      </Button>
                      <Button
                        onClick={() => {
                          navigator.clipboard.writeText(result);
                          handleClose();
                        }}
                        className="flex-1 h-10 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold"
                      >
                        Copiar & Fechar
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
