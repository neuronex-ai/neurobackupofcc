import { useCallback, useEffect, useMemo, useRef } from "react";
import { useSynapseCascadeVoice } from "@/hooks/use-synapse-cascade-voice";
import type { GeminiLiveStatus } from "@/lib/gemini-live-client";

type ClientToolMap = Record<string, (params: unknown) => Promise<unknown> | unknown>;

interface UseGeminiLiveOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: string) => void;
}

export function useGeminiLive(options?: UseGeminiLiveOptions) {
  const connectedRef = useRef(false);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const cascade = useSynapseCascadeVoice();

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
