import { Button } from "@/components/ui/button";
import { X, Mic, MicOff, RotateCcw, Volume2, Phone, PhoneOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import { VoiceSpiral } from "./VoiceSpiral";
import { useGeminiVoice } from "@/hooks/use-gemini-voice";
import { useVoiceConfig } from "@/hooks/use-voice-config";

interface DesktopVoiceOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DesktopVoiceOverlay = ({
  isOpen,
  onClose,
}: DesktopVoiceOverlayProps) => {
  const [displayText, setDisplayText] = useState("");

  const { token, model, voiceName, isLoading: voiceConfigLoading, refresh: refreshVoiceConfig } = useVoiceConfig();

  // Stable callbacks to prevent re-renders
  const handleSpeakingStart = useCallback(() => undefined, []);

  const handleSpeakingEnd = useCallback(() => undefined, []);

  const handleResponseText = useCallback((text: string) => {
    setDisplayText(prev => prev + text);
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
    error,
  } = useGeminiVoice({
    token,
    model,
    systemInstruction: `Você é o Synapse AI, um assistente de voz inteligente, empático e muito capaz para profissionais de saúde mental.
        
Você pode ajudar com:
- Gerenciamento de agenda e pacientes
- Consultas sobre prontuários e histórico
- Redação de documentos clínicos
- Análise financeira da clínica
- Dúvidas sobre boas práticas em psicologia/psiquiatria

Responda de forma conversacional, natural e concisa em português brasileiro. 
Seja prestativo, empático e profissional. Mantenha respostas curtas (1-3 frases) para manter a conversa fluida.`,
    voiceName,
    language: 'pt-BR',
    onSpeakingStart: handleSpeakingStart,
    onSpeakingEnd: handleSpeakingEnd,
    onResponseText: handleResponseText,
  });

  // Auto-start session when overlay opens
  useEffect(() => {
    if (isOpen && !isConnected && token) {
      startSession();
    }
  }, [isOpen, isConnected, token, startSession]);

  // End session when overlay closes
  useEffect(() => {
    if (!isOpen && isConnected) {
      endSession();
    }
  }, [isOpen, isConnected, endSession]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        endSession();
        setDisplayText("");
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [endSession, isOpen, onClose]);

  // Update display text based on state
  useEffect(() => {
    if (isSpeaking && lastResponse) {
      // Keep showing last response while speaking
    } else if (isListening && !isSpeaking && !isProcessing) {
      setDisplayText("Ouvindo você...");
    } else if (isProcessing) {
      setDisplayText("Pensando...");
    } else if (!isConnected && !error) {
      setDisplayText("Conectando...");
    } else if (error) {
      setDisplayText(`Erro: ${error}`);
    } else if (!lastResponse) {
      setDisplayText("Fale algo para começar");
    }
  }, [isListening, isSpeaking, isProcessing, isConnected, error, lastResponse]);

  // Close and cleanup
  const handleClose = useCallback(() => {
    endSession();
    setDisplayText("");
    onClose();
  }, [endSession, onClose]);

  // Reset conversation
  const handleReset = useCallback(() => {
    setDisplayText("");
    endSession();
    window.setTimeout(() => {
      refreshVoiceConfig()
        .then(() => startSession())
        .catch(() => undefined);
    }, 500);
  }, [endSession, refreshVoiceConfig, startSession]);

  // Get status indicator
  const getStatusConfig = () => {
    if (error) return { text: "Erro de conexão", color: "red" };
    if (isSpeaking) return { text: "Synapse está falando...", color: "purple" };
    if (isProcessing) return { text: "Processando...", color: "indigo" };
    if (isListening) return { text: "Ouvindo você...", color: "emerald" };
    if (isConnected) return { text: "Conectado", color: "white" };
    return { text: "Conectando...", color: "yellow" };
  };

  const status = getStatusConfig();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[100] flex flex-col bg-zinc-50 dark:bg-black"
        >
          {/* Full-screen Spiral Animation */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="w-full h-full max-w-[800px] max-h-[800px] opacity-80 dark:opacity-100 mix-blend-multiply dark:mix-blend-screen"
              style={{
                filter: isSpeaking
                  ? 'hue-rotate(-20deg) brightness(1.3)'
                  : isProcessing
                    ? 'hue-rotate(45deg) brightness(1.2)'
                    : isListening
                      ? 'brightness(1.1)'
                      : 'brightness(0.7)',
                transition: 'filter 0.3s ease',
              }}
            >
              <VoiceSpiral
                totalDots={800}
                dotRadius={2.5}
                duration={isSpeaking ? 1.5 : isProcessing ? 2 : 3}
                minOpacity={0.15}
                maxOpacity={isListening || isSpeaking ? 1 : 0.7}
                minScale={0.3}
                maxScale={isListening ? 2.5 : isSpeaking ? 2 : 1.5}
                getAudioVolume={getAudioVolume}
                isListening={isListening}
                isProcessing={isProcessing || isSpeaking}
                useMultipleColors={true}
                colors={
                  isSpeaking
                    ? ['#a855f7', '#c084fc', '#d8b4fe', '#e9d5ff'] // Purple for speaking
                    : ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe'] // Indigo default
                }
              />
            </motion.div>
          </div>

          {/* Ambient glow effect */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at center, rgba(99, 102, 241, ${0.05 + audioIntensity * 0.15}) 0%, transparent 50%)`,
              transition: 'background 0.1s ease',
            }}
          />

          {/* Top Bar - Status & Close */}
          <div className="relative z-50 flex items-center justify-between p-6">
            {/* Status Indicator */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-full border backdrop-blur-md transition-all",
                status.color === "purple" && "bg-purple-500/10 border-purple-500/30 text-purple-400",
                status.color === "emerald" && "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
                status.color === "indigo" && "bg-indigo-500/10 border-indigo-500/30 text-indigo-400",
                status.color === "red" && "bg-red-500/10 border-red-500/30 text-red-400",
                status.color === "yellow" && "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
                status.color === "white" && "bg-white/5 border-white/10 text-white/60",
              )}>
                {isSpeaking ? (
                  <div className="flex items-center gap-0.5 h-4">
                    {[...Array(5)].map((_, i) => (
                      <motion.span
                        key={i}
                        className="w-0.5 bg-purple-400 rounded-full"
                        animate={{
                          height: [8, 16, 8],
                        }}
                        transition={{
                          duration: 0.5,
                          repeat: Infinity,
                          delay: i * 0.1,
                        }}
                      />
                    ))}
                  </div>
                ) : isListening ? (
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse [animation-delay:0.2s]" />
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse [animation-delay:0.4s]" />
                  </div>
                ) : isProcessing ? (
                  <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {status.text}
                </span>
              </div>
            </motion.div>

            {/* Close Button */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-12 w-12 rounded-full bg-black/5 hover:bg-black/10 text-zinc-600 hover:text-zinc-900 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white/70 dark:hover:text-white border border-black/10 dark:border-white/10 transition-all hover:scale-110 backdrop-blur-md"
              >
                <X className="h-5 w-5" />
              </Button>
            </motion.div>
          </div>

          {/* Center Content - Response Text */}
          <div className="flex-1 flex items-center justify-center px-8 relative z-20">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="max-w-3xl text-center"
            >
              <AnimatePresence mode="wait">
                <motion.p
                  key={displayText.slice(0, 30)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={cn(
                    "transition-all duration-300 leading-relaxed",
                    isSpeaking
                      ? "text-2xl md:text-3xl font-medium text-zinc-900 dark:text-white/90"
                      : isListening
                        ? "text-xl md:text-2xl font-light text-zinc-700 dark:text-white/70"
                        : isProcessing
                          ? "text-lg font-medium text-indigo-400 animate-pulse"
                          : "text-sm font-bold uppercase tracking-[0.3em] text-zinc-400 dark:text-white/30"
                  )}
                >
                  {displayText || "Inicie a conversa"}
                </motion.p>
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Bottom Action Bar */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
            className="relative z-50 pb-10"
          >
            <div className="flex items-center justify-center gap-6">
              {/* Reset Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleReset}
                className="h-14 w-14 rounded-full bg-black/5 hover:bg-black/10 text-zinc-500 hover:text-zinc-800 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white/50 dark:hover:text-white border border-black/10 dark:border-white/10 transition-all hover:scale-105 backdrop-blur-md"
                title="Reiniciar conversa"
              >
                <RotateCcw className="h-5 w-5" />
              </Button>

              {/* Main Action Button */}
              <Button
                onClick={toggleListening}
                disabled={isProcessing || voiceConfigLoading || !token}
                className={cn(
                  "h-20 w-20 rounded-full transition-all duration-300 shadow-2xl",
                  isListening
                    ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/40"
                    : isConnected
                      ? "bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-white/90 dark:text-black hover:scale-105"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white"
                )}
              >
                {isListening ? (
                  <MicOff className="h-8 w-8" />
                ) : isConnected ? (
                  <Mic className="h-8 w-8" />
                ) : (
                  <Phone className="h-7 w-7" />
                )}
              </Button>

              {/* End Call Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-14 w-14 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 transition-all hover:scale-105 backdrop-blur-md"
                title="Encerrar chamada"
              >
                <PhoneOff className="h-5 w-5" />
              </Button>
            </div>

            {/* Bottom Hint */}
            <div className="flex justify-center mt-6">
              <div className="flex items-center gap-3 text-zinc-400 dark:text-white/20 text-[10px] uppercase tracking-widest font-medium px-5 py-2 rounded-full">
                <span>ESC para fechar</span>
                <span className="w-1 h-1 bg-zinc-300 dark:bg-white/20 rounded-full" />
                <span>Fale naturalmente</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
