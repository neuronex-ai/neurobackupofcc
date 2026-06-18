import { useCallback, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSynapseCascadeVoice } from "@/hooks/use-synapse-cascade-voice";
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

  const cascade = useSynapseCascadeVoice({
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
    if (cascade.error) return "error";
    if (cascade.isConnected) return "connected";
    if (cascade.isProcessing) return "connecting";
    return "disconnected";
  }, [cascade.error, cascade.isConnected, cascade.isProcessing]);

  useEffect(() => {
    if (cascade.error) optionsRef.current?.onError?.(cascade.error);
  }, [cascade.error]);

  useEffect(() => {
    if (cascade.isConnected && !connectedRef.current) {
      connectedRef.current = true;
      optionsRef.current?.onConnect?.();
      return;
    }

    if (!cascade.isConnected && connectedRef.current) {
      connectedRef.current = false;
      optionsRef.current?.onDisconnect?.();
    }
  }, [cascade.isConnected]);

  const startSession = useCallback(async (_args?: { clientTools?: ClientToolMap }) => {
    await cascade.startSession();
  }, [cascade.startSession]);

  const endSession = useCallback(async () => {
    cascade.endSession();
  }, [cascade.endSession]);

  return {
    status,
    isSpeaking: cascade.isSpeaking,
    getInputVolume: cascade.getAudioVolume,
    startSession,
    endSession,
  };
}
