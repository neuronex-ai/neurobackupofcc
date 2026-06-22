import { useCallback, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useGeminiVoice } from "@/hooks/use-gemini-voice";
import type { GeminiLiveStatus } from "@/lib/gemini-live-client";
import {
  executeSynapseInterfaceAction,
  normalizeSynapseClientAction,
} from "@/lib/synapse-interface-actions";

type ClientToolMap = Record<string, (params: unknown) => Promise<unknown> | unknown>;

interface UseGeminiLiveOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: string) => void;
  onClientAction?: (action: unknown) => void;
}

export function useGeminiLive(options?: UseGeminiLiveOptions) {
  const navigate = useNavigate();
  const connectedRef = useRef(false);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const voice = useGeminiVoice({
    token: null,
    language: "pt-BR",
    systemInstruction: "Voce e o Synapse por voz global da NeuroNex. Responda em portugues brasileiro com frases curtas e naturais, usando ferramentas quando precisar de dados reais.",
    onClientAction: (rawAction) => {
      optionsRef.current?.onClientAction?.(rawAction);
      const action = normalizeSynapseClientAction(rawAction);
      if (!action) return;

      // Do not disconnect or pause the session. Navigation and speech can overlap,
      // and the cascade automatically returns to listening after processing/TTS.
      void executeSynapseInterfaceAction(action, {
        navigate,
        channel: "voice",
      });
    },
  });

  const status = useMemo<GeminiLiveStatus>(() => {
    if (voice.error) return "error";
    if (voice.isConnected) return "connected";
    if (voice.isProcessing) return "connecting";
    return "disconnected";
  }, [voice.error, voice.isConnected, voice.isProcessing]);

  useEffect(() => {
    if (voice.error) optionsRef.current?.onError?.(voice.error);
  }, [voice.error]);

  useEffect(() => {
    if (voice.isConnected && !connectedRef.current) {
      connectedRef.current = true;
      optionsRef.current?.onConnect?.();
      return;
    }

    if (!voice.isConnected && connectedRef.current) {
      connectedRef.current = false;
      optionsRef.current?.onDisconnect?.();
    }
  }, [voice.isConnected]);

  const voiceStartSession = voice.startSession;
  const voiceEndSession = voice.endSession;

  const startSession = useCallback(async (_args?: { clientTools?: ClientToolMap }) => {
    await voiceStartSession();
  }, [voiceStartSession]);

  const endSession = useCallback(async () => {
    voiceEndSession();
  }, [voiceEndSession]);

  return {
    status,
    isSpeaking: voice.isSpeaking,
    getInputVolume: voice.getAudioVolume,
    startSession,
    endSession,
  };
}
