import { useCallback, useMemo, useState } from "react";
import { useDeepgramAgentVoice } from "@/hooks/use-deepgram-agent-voice";
import { useSynapseCascadeVoice } from "@/hooks/use-synapse-cascade-voice";

type ClientAction = { type?: string; payload?: unknown; data?: unknown };

interface UseGeminiVoiceOptions {
  token: string | null;
  model?: string;
  systemInstruction?: string;
  voiceName?: string;
  gatewayUrl?: string | null;
  provider?: string | null;
  language?: string;
  sessionId?: string | null;
  onSessionIdChange?: (sessionId: string) => void;
  onSpeakingStart?: () => void;
  onSpeakingEnd?: () => void;
  onTranscript?: (text: string, isFinal: boolean) => void;
  onResponseText?: (text: string) => void;
  onAudioIntensity?: (intensity: number) => void;
  onClientAction?: (action: ClientAction) => void;
}

export function useGeminiVoice(options: UseGeminiVoiceOptions) {
  const [usingFallback, setUsingFallback] = useState(false);
  const preferredProvider = options.provider || import.meta.env.VITE_SYNAPSE_VOICE_PROVIDER || "deepgram-agent";
  const shouldUseDeepgram = preferredProvider !== "legacy-cascade" && !usingFallback;

  const deepgram = useDeepgramAgentVoice({
    gatewayUrl: options.gatewayUrl,
    sessionId: options.sessionId,
    systemInstruction: options.systemInstruction,
    language: options.language,
    onSessionIdChange: options.onSessionIdChange,
    onSpeakingStart: options.onSpeakingStart,
    onSpeakingEnd: options.onSpeakingEnd,
    onTranscript: options.onTranscript,
    onResponseText: options.onResponseText,
    onAudioIntensity: options.onAudioIntensity,
    onClientAction: options.onClientAction,
  });

  const cascade = useSynapseCascadeVoice({
    sessionId: options.sessionId,
    onSessionIdChange: options.onSessionIdChange,
    onSpeakingStart: options.onSpeakingStart,
    onSpeakingEnd: options.onSpeakingEnd,
    onTranscript: options.onTranscript,
    onResponseText: options.onResponseText,
    onAudioIntensity: options.onAudioIntensity,
    onClientAction: options.onClientAction,
  });
  const deepgramStartSession = deepgram.startSession;
  const deepgramEndSession = deepgram.endSession;
  const cascadeStartSession = cascade.startSession;
  const cascadeEndSession = cascade.endSession;

  const startSession = useCallback(async (_override?: {
    token?: string | null;
    model?: string;
    voiceName?: string;
    gatewayUrl?: string | null;
    provider?: string | null;
    sessionId?: string | null;
  }) => {
    const provider = _override?.provider || preferredProvider;
    const fallbackEnabled = import.meta.env.VITE_SYNAPSE_VOICE_DISABLE_FALLBACK !== "true";

    if (provider === "legacy-cascade") {
      setUsingFallback(true);
      await cascadeStartSession();
      return;
    }

    setUsingFallback(false);
    try {
      await deepgramStartSession(_override);
    } catch (error) {
      if (!fallbackEnabled) throw error;
      console.warn("[Synapse Voice] Deepgram indisponivel; usando cascade legado.", error);
      setUsingFallback(true);
      await cascadeStartSession();
    }
  }, [cascadeStartSession, deepgramStartSession, preferredProvider]);

  const endSession = useCallback(() => {
    deepgramEndSession();
    cascadeEndSession();
    setUsingFallback(false);
  }, [cascadeEndSession, deepgramEndSession]);

  const active = shouldUseDeepgram ? deepgram : cascade;

  const provider = useMemo(() => {
    if (!shouldUseDeepgram) return cascade.provider;
    return deepgram.provider;
  }, [cascade.provider, deepgram.provider, shouldUseDeepgram]);

  return {
    ...active,
    startSession,
    endSession,
    provider,
  };
}
