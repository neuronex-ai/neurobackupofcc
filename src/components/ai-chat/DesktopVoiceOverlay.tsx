import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Phone, PhoneOff, RefreshCcw, Sparkles, Volume2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useGeminiVoice } from "@/hooks/use-gemini-voice";
import { useVoiceConfig } from "@/hooks/use-voice-config";
import { VoiceSpiral } from "./VoiceSpiral";

interface DesktopVoiceOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const SYSTEM_INSTRUCTION = `Voce e o Synapse AI, um assistente de voz inteligente, empatico e muito capaz para profissionais de saude mental.

Voce pode ajudar com agenda, pacientes, prontuarios, documentos clinicos, financeiro da clinica e boas praticas em psicologia/psiquiatria.
Responda de forma conversacional, natural e concisa em portugues brasileiro. Mantenha respostas curtas para preservar a fluidez da conversa.`;

const friendlyError = (error: string | null) => {
  if (!error) return null;
  if (
    error.includes("HTML") ||
    error.includes("Unexpected token") ||
    error.includes("JSON") ||
    error.includes("credencial") ||
    error.includes("Live API")
  ) {
    return "Nao consegui abrir o canal de voz. Vou gerar uma nova credencial temporaria quando voce tentar novamente.";
  }
  return error;
};

export const DesktopVoiceOverlay = ({ isOpen, onClose }: DesktopVoiceOverlayProps) => {
  const [displayText, setDisplayText] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const autoStartedRef = useRef(false);

  const {
    isLoading: voiceConfigLoading,
    refresh: refreshVoiceConfig,
    error: voiceConfigError,
  } = useVoiceConfig();

  const handleResponseText = useCallback((text: string) => {
    setDisplayText((previous) => previous + text);
  }, []);

  const {
    isConnected,
    isSpeaking,
    isListening,
    isProcessing,
    audioIntensity,
    getAudioVolume,
    lastResponse,
    startSession,
    endSession,
    toggleListening,
    error: runtimeError,
  } = useGeminiVoice({
    token: null,
    systemInstruction: SYSTEM_INSTRUCTION,
    language: "pt-BR",
    onResponseText: handleResponseText,
  });

  const error = friendlyError(runtimeError || voiceConfigError);
  const isBusy = isStarting || voiceConfigLoading || isProcessing;

  const beginSession = useCallback(async () => {
    if (isConnected || isStarting) return;
    setIsStarting(true);
    setDisplayText("Preparando canal de voz...");
    try {
      const config = await refreshVoiceConfig();
      await startSession({
        token: config.token,
        model: config.model,
        voiceName: config.voiceName,
      });
    } catch (caught: unknown) {
      const message = caught instanceof Error ? caught.message : "Nao foi possivel iniciar o modo voz.";
      setDisplayText(friendlyError(message) || message);
    } finally {
      setIsStarting(false);
    }
  }, [isConnected, isStarting, refreshVoiceConfig, startSession]);

  useEffect(() => {
    if (!isOpen) {
      autoStartedRef.current = false;
      return;
    }

    if (!autoStartedRef.current) {
      autoStartedRef.current = true;
      void beginSession();
    }
  }, [beginSession, isOpen]);

  useEffect(() => {
    if (!isOpen && isConnected) {
      endSession();
    }
  }, [endSession, isConnected, isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !isOpen) return;
      endSession();
      setDisplayText("");
      onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [endSession, isOpen, onClose]);

  useEffect(() => {
    if (error) {
      setDisplayText(error);
      return;
    }

    if (isSpeaking && lastResponse) return;
    if (isListening && !isSpeaking && !isProcessing) {
      setDisplayText("Ouvindo voce...");
      return;
    }
    if (isProcessing || isStarting || voiceConfigLoading) {
      setDisplayText("Sincronizando voz...");
      return;
    }
    if (isConnected) {
      setDisplayText("Canal aberto. Fale naturalmente.");
      return;
    }
    setDisplayText("Toque para iniciar o Synapse por voz.");
  }, [error, isConnected, isListening, isProcessing, isSpeaking, isStarting, lastResponse, voiceConfigLoading]);

  const handleClose = useCallback(() => {
    endSession();
    autoStartedRef.current = false;
    setDisplayText("");
    onClose();
  }, [endSession, onClose]);

  const handleMainAction = useCallback(() => {
    if (!isConnected) {
      void beginSession();
      return;
    }
    toggleListening();
  }, [beginSession, isConnected, toggleListening]);

  const handleReset = useCallback(() => {
    endSession();
    setDisplayText("");
    window.setTimeout(() => void beginSession(), 180);
  }, [beginSession, endSession]);

  const status = error
    ? { label: "Requer atencao", tone: "danger" }
    : isSpeaking
      ? { label: "Respondendo", tone: "active" }
      : isListening
        ? { label: "Ouvindo", tone: "success" }
        : isBusy
          ? { label: "Conectando", tone: "neutral" }
          : isConnected
            ? { label: "Conectado", tone: "neutral" }
            : { label: "Synapse voz", tone: "neutral" };

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28 }}
          className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-zinc-50 text-zinc-950 dark:bg-[#030305] dark:text-white"
        >
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(255,255,255,0.24)_45%,rgba(255,255,255,0.04))] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.015)_42%,rgba(0,0,0,0))]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/70 dark:bg-white/12" />

          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="h-full max-h-[760px] w-full max-w-[760px] opacity-75 mix-blend-multiply dark:opacity-90 dark:mix-blend-screen"
              style={{
                filter: isSpeaking
                  ? "hue-rotate(-16deg) brightness(1.18)"
                  : isListening
                    ? "brightness(1.1)"
                    : error
                      ? "grayscale(0.6) brightness(0.75)"
                      : "brightness(0.82)",
                transition: "filter 0.25s ease",
              }}
            >
              <VoiceSpiral
                totalDots={760}
                dotRadius={2.4}
                duration={isSpeaking ? 1.45 : isProcessing ? 2 : 3}
                minOpacity={0.12}
                maxOpacity={isListening || isSpeaking ? 1 : 0.62}
                minScale={0.3}
                maxScale={isListening ? 2.35 : isSpeaking ? 1.9 : 1.35}
                getAudioVolume={getAudioVolume}
                isListening={isListening}
                isProcessing={isProcessing || isSpeaking}
                useMultipleColors
                colors={isSpeaking ? ["#f8fafc", "#c4b5fd", "#8b5cf6"] : ["#e5e7eb", "#a5b4fc", "#6366f1"]}
              />
            </motion.div>
          </div>

          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(circle at center, rgba(99,102,241,${0.03 + audioIntensity * 0.12}) 0%, transparent 52%)`,
              transition: "background 0.12s ease",
            }}
          />

          <header className="relative z-30 flex items-center justify-between p-6">
            <motion.div
              initial={{ y: -12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className={cn(
                "flex items-center gap-3 rounded-full border px-4 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-2xl",
                status.tone === "danger"
                  ? "border-rose-500/25 bg-rose-500/10 text-rose-500"
                  : status.tone === "success"
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                    : "border-black/10 bg-white/54 text-zinc-700 dark:border-white/10 dark:bg-white/[0.075] dark:text-white/70",
              )}
            >
              {status.tone === "success" ? (
                <span className="flex gap-1">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-current" />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-current [animation-delay:0.18s]" />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-current [animation-delay:0.32s]" />
                </span>
              ) : isSpeaking ? (
                <span className="flex h-4 items-center gap-0.5">
                  {[0, 1, 2, 3, 4].map((item) => (
                    <span
                      key={item}
                      className="w-0.5 rounded-full bg-current animate-[audio-wave_0.72s_ease-in-out_infinite]"
                      style={{ height: `${7 + item * 2}px`, animationDelay: `${item * 0.08}s` }}
                    />
                  ))}
                </span>
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
              <span className="text-xs font-black uppercase tracking-[0.18em]">{status.label}</span>
            </motion.div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-12 w-12 rounded-full border border-black/10 bg-white/54 text-zinc-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] backdrop-blur-2xl transition hover:bg-white/80 hover:text-zinc-950 dark:border-white/10 dark:bg-white/[0.075] dark:text-white/72 dark:hover:bg-white/12 dark:hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </header>

          <main className="relative z-20 flex flex-1 items-center justify-center px-8">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl text-center"
            >
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-[18px] border border-black/10 bg-white/42 text-zinc-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.065] dark:text-white/70">
                <Sparkles className="h-5 w-5" />
              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={displayText.slice(0, 42)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className={cn(
                    "mx-auto max-w-[48rem] leading-relaxed transition-all duration-300",
                    error
                      ? "text-base font-semibold text-rose-500"
                      : isSpeaking
                        ? "text-2xl font-semibold text-zinc-950 dark:text-white/92 md:text-3xl"
                        : isListening
                          ? "text-xl font-medium text-zinc-700 dark:text-white/72 md:text-2xl"
                          : "text-sm font-black uppercase tracking-[0.28em] text-zinc-500 dark:text-white/34",
                  )}
                >
                  {displayText || "Synapse por voz"}
                </motion.p>
              </AnimatePresence>
            </motion.div>
          </main>

          <footer className="relative z-30 pb-10">
            <motion.div
              initial={{ y: 28, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.08, type: "spring", stiffness: 220, damping: 24 }}
              className="flex items-center justify-center gap-5"
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={handleReset}
                disabled={isBusy}
                className="h-14 w-14 rounded-full border border-black/10 bg-white/50 text-zinc-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] backdrop-blur-2xl transition hover:bg-white/80 hover:text-zinc-950 disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.07] dark:text-white/55 dark:hover:bg-white/12 dark:hover:text-white"
                title="Reiniciar conversa"
              >
                <RefreshCcw className="h-5 w-5" />
              </Button>

              <Button
                onClick={handleMainAction}
                disabled={isBusy}
                className={cn(
                  "h-20 w-20 rounded-full border text-white shadow-[0_24px_64px_-30px_rgba(0,0,0,0.82),inset_0_1px_0_rgba(255,255,255,0.22)] transition active:scale-95 disabled:opacity-60",
                  error
                    ? "border-rose-400/30 bg-rose-500 hover:bg-rose-500/90"
                    : isListening
                      ? "border-white/20 bg-zinc-950 hover:bg-zinc-900 dark:bg-white dark:text-black dark:hover:bg-white/90"
                      : "border-white/15 bg-zinc-950 hover:bg-zinc-900 dark:bg-white dark:text-black dark:hover:bg-white/90",
                )}
              >
                {isListening ? <MicOff className="h-8 w-8" /> : isConnected ? <Mic className="h-8 w-8" /> : <Phone className="h-7 w-7" />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-14 w-14 rounded-full border border-rose-500/20 bg-rose-500/10 text-rose-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-2xl transition hover:bg-rose-500/15"
                title="Encerrar chamada"
              >
                <PhoneOff className="h-5 w-5" />
              </Button>
            </motion.div>

            <div className="mt-6 flex justify-center">
              <div className="rounded-full border border-black/5 bg-white/32 px-5 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:text-white/24">
                ESC para fechar - fale naturalmente
              </div>
            </div>
          </footer>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
