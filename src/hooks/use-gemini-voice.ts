import { useCallback } from "react";
import { useSynapseCascadeVoice } from "@/hooks/use-synapse-cascade-voice";

type ClientAction = { type?: string; payload?: unknown; data?: unknown };

interface UseGeminiVoiceOptions {
  token: string | null;
  model?: string;
  systemInstruction?: string;
  voiceName?: string;
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

  const startSession = useCallback(async (_override?: {
    token?: string;
    model?: string;
    voiceName?: string;
  }) => {
    await cascade.startSession();
  }, [cascade.startSession]);

  return {
    ...cascade,
    startSession,
  };
}
