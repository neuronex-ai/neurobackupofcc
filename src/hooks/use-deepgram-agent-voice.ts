import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PcmAudioPlayer } from "@/lib/pcm-audio-player";

type ClientAction = { type?: string; payload?: unknown; data?: unknown };

interface StartOverride {
  token?: string | null;
  model?: string;
  voiceName?: string;
  gatewayUrl?: string | null;
  provider?: string | null;
  sessionId?: string | null;
}

interface Options {
  gatewayUrl?: string | null;
  sessionId?: string | null;
  systemInstruction?: string;
  language?: string;
  onSessionIdChange?: (id: string) => void;
  onTranscript?: (text: string, isFinal: boolean) => void;
  onResponseText?: (text: string) => void;
  onClientAction?: (action: ClientAction) => void;
  onSpeakingStart?: () => void;
  onSpeakingEnd?: () => void;
  onAudioIntensity?: (intensity: number) => void;
}

const DEFAULT_GATEWAY_URL = "ws://localhost:8789/v1/synapse/voice";

const clean = (value: unknown, max = 5000) => String(value ?? "").trim().slice(0, max);

const gatewayUrlFromEnv = () => {
  const configured = import.meta.env.VITE_SYNAPSE_VOICE_GATEWAY_URL;
  if (configured) return configured;
  if (typeof window !== "undefined" && window.location.protocol === "https:") return "";
  return DEFAULT_GATEWAY_URL;
};

const parseMessage = (value: unknown) => {
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const eventText = (event: Record<string, unknown>) => clean(
  event.content || event.text || event.transcript || event.message,
  20000,
);

const eventRole = (event: Record<string, unknown>) => clean(
  event.role || event.speaker || (event.channel as Record<string, unknown> | undefined)?.role,
  40,
).toLowerCase();

export function useDeepgramAgentVoice({
  gatewayUrl,
  sessionId,
  systemInstruction,
  language = "pt-BR",
  onSessionIdChange,
  onTranscript,
  onResponseText,
  onClientAction,
  onSpeakingStart,
  onSpeakingEnd,
  onAudioIntensity,
}: Options = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [audioIntensity, setAudioIntensity] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [lastResponse, setLastResponse] = useState("");
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const workletRef = useRef<AudioWorkletNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const silentGainRef = useRef<GainNode | null>(null);
  const playerRef = useRef<PcmAudioPlayer | null>(null);
  const activeRef = useRef(false);
  const readyRef = useRef(false);
  const listeningRef = useRef(false);
  const volumeRef = useRef(0);
  const sessionIdRef = useRef<string | null>(sessionId || null);
  const callbacksRef = useRef({
    onSessionIdChange,
    onTranscript,
    onResponseText,
    onClientAction,
    onSpeakingStart,
    onSpeakingEnd,
    onAudioIntensity,
  });

  callbacksRef.current = {
    onSessionIdChange,
    onTranscript,
    onResponseText,
    onClientAction,
    onSpeakingStart,
    onSpeakingEnd,
    onAudioIntensity,
  };

  useEffect(() => {
    sessionIdRef.current = sessionId || sessionIdRef.current;
  }, [sessionId]);

  const setLevel = useCallback((level: number) => {
    volumeRef.current = level;
    setAudioIntensity(level);
    callbacksRef.current.onAudioIntensity?.(level);
  }, []);

  const stopPlayback = useCallback(() => {
    playerRef.current?.stop();
    setIsSpeaking(false);
  }, []);

  const cleanupInput = useCallback(async () => {
    workletRef.current?.port.close();
    workletRef.current?.disconnect();
    sourceRef.current?.disconnect();
    silentGainRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (inputContextRef.current && inputContextRef.current.state !== "closed") {
      await inputContextRef.current.close();
    }
    workletRef.current = null;
    sourceRef.current = null;
    silentGainRef.current = null;
    streamRef.current = null;
    inputContextRef.current = null;
    setLevel(0);
  }, [setLevel]);

  const ensurePlayer = useCallback(() => {
    if (!playerRef.current) {
      playerRef.current = new PcmAudioPlayer(
        24000,
        () => {
          setIsSpeaking(true);
          setIsProcessing(false);
          callbacksRef.current.onSpeakingStart?.();
        },
        () => {
          setIsSpeaking(false);
          callbacksRef.current.onSpeakingEnd?.();
        },
      );
    }
    return playerRef.current;
  }, []);

  const closeEverything = useCallback(async () => {
    activeRef.current = false;
    readyRef.current = false;
    listeningRef.current = false;
    const ws = wsRef.current;
    wsRef.current = null;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "stop" }));
      ws.close(1000, "client_end");
    } else if (ws && ws.readyState === WebSocket.CONNECTING) {
      ws.close();
    }
    await cleanupInput();
    await playerRef.current?.close();
    playerRef.current = null;
    setIsConnected(false);
    setIsListening(false);
    setIsProcessing(false);
    setIsSpeaking(false);
  }, [cleanupInput]);

  const startInput = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Microfone indisponivel neste dispositivo.");
    }
    if (!("AudioWorkletNode" in window)) {
      throw new Error("AudioWorklet nao esta disponivel neste navegador.");
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    const context = new AudioContext({ sampleRate: 16000 });
    await context.audioWorklet.addModule("/worklets/deepgram-agent-recorder.js");

    const source = context.createMediaStreamSource(stream);
    const worklet = new AudioWorkletNode(context, "deepgram-agent-recorder", {
      processorOptions: { targetSampleRate: 16000, frameMs: 40 },
    });
    const silentGain = context.createGain();
    silentGain.gain.value = 0;

    worklet.port.onmessage = (event: MessageEvent) => {
      const payload = event.data as { type?: string; audio?: ArrayBuffer; level?: number };
      if (payload.type !== "audio" || !payload.audio) return;
      setLevel(Number(payload.level || 0));
      const ws = wsRef.current;
      if (!activeRef.current || !readyRef.current || !listeningRef.current) return;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      ws.send(payload.audio);
    };

    source.connect(worklet);
    worklet.connect(silentGain);
    silentGain.connect(context.destination);

    streamRef.current = stream;
    inputContextRef.current = context;
    sourceRef.current = source;
    workletRef.current = worklet;
    silentGainRef.current = silentGain;
  }, [setLevel]);

  const persistSessionId = useCallback((id: string) => {
    if (!id || sessionIdRef.current === id) return;
    sessionIdRef.current = id;
    callbacksRef.current.onSessionIdChange?.(id);
  }, []);

  const handleDeepgramEvent = useCallback((event: Record<string, unknown>) => {
    const type = clean(event.type, 80);

    if (type === "SettingsApplied") {
      readyRef.current = true;
      setIsConnected(true);
      setIsProcessing(false);
      setIsListening(listeningRef.current);
      return;
    }

    if (type === "UserStartedSpeaking" || type === "AgentAudioInterrupted") {
      stopPlayback();
      setIsProcessing(false);
      return;
    }

    if (type === "AgentThinking" || type === "FunctionCallRequest") {
      setIsProcessing(true);
      return;
    }

    if (type === "AgentStartedSpeaking") {
      setIsProcessing(false);
      return;
    }

    if (type === "AgentAudioDone") {
      setIsProcessing(false);
      return;
    }

    if (type === "ConversationText") {
      const text = eventText(event);
      if (!text) return;
      const role = eventRole(event);
      if (role === "user" || role === "human") {
        setTranscript(text);
        callbacksRef.current.onTranscript?.(text, true);
        return;
      }
      if (role === "assistant" || role === "agent" || role === "ai") {
        setLastResponse(text);
        callbacksRef.current.onResponseText?.(text);
      }
    }
  }, [stopPlayback]);

  const handleGatewayMessage = useCallback((payload: Record<string, unknown>) => {
    const type = clean(payload.type, 80);

    if (type === "gateway_status") {
      const status = clean(payload.status, 80);
      if (typeof payload.sessionId === "string") persistSessionId(payload.sessionId);
      if (status === "ready") {
        readyRef.current = true;
        setIsConnected(true);
        setIsProcessing(false);
        setIsListening(listeningRef.current);
      } else if (["connecting_deepgram", "waiting_welcome", "settings_sent"].includes(status)) {
        setIsProcessing(true);
      }
      return;
    }

    if (type === "gateway_error") {
      const message = clean(payload.error || "Nao foi possivel continuar a voz.", 1000);
      setError(message);
      setIsProcessing(false);
      return;
    }

    if (type === "deepgram_event" && payload.event && typeof payload.event === "object") {
      handleDeepgramEvent(payload.event as Record<string, unknown>);
      return;
    }

    if (type === "barge_in") {
      stopPlayback();
      setIsProcessing(false);
      return;
    }

    if (type === "function_status") {
      const status = clean(payload.status, 80);
      const message = clean(payload.message, 500);
      setIsProcessing(["started", "progress", "cancelling", "complement"].includes(status));
      if (message) {
        setLastResponse(message);
        callbacksRef.current.onResponseText?.(message);
      }
      return;
    }

    if (type === "client_action" && payload.action && typeof payload.action === "object") {
      callbacksRef.current.onClientAction?.(payload.action as ClientAction);
    }
  }, [handleDeepgramEvent, persistSessionId, stopPlayback]);

  const handleBinaryAudio = useCallback(async (value: Blob | ArrayBuffer) => {
    const buffer = value instanceof Blob ? await value.arrayBuffer() : value;
    ensurePlayer().enqueue(buffer);
  }, [ensurePlayer]);

  const startSession = useCallback(async (override?: StartOverride) => {
    await closeEverything();
    activeRef.current = true;
    readyRef.current = false;
    listeningRef.current = true;
    setIsListening(false);
    setIsProcessing(true);
    setError(null);
    setTranscript("");
    setLastResponse("");

    const targetGatewayUrl = override?.gatewayUrl || gatewayUrl || gatewayUrlFromEnv();
    if (!targetGatewayUrl) {
      throw new Error("Gateway de voz nao configurado. Defina VITE_SYNAPSE_VOICE_GATEWAY_URL.");
    }

    const { data: authData } = await supabase.auth.getSession();
    const accessToken = authData.session?.access_token || override?.token || "";
    if (!accessToken) throw new Error("Sessao invalida.");

    const ws = new WebSocket(targetGatewayUrl);
    ws.binaryType = "arraybuffer";
    wsRef.current = ws;

    ws.onmessage = (event) => {
      if (typeof event.data === "string") {
        const payload = parseMessage(event.data);
        if (payload) handleGatewayMessage(payload);
        return;
      }
      if (event.data instanceof Blob || event.data instanceof ArrayBuffer) {
        void handleBinaryAudio(event.data);
      }
    };

    ws.onclose = () => {
      readyRef.current = false;
      setIsConnected(false);
      setIsListening(false);
      setIsProcessing(false);
    };

    await new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => reject(new Error("Timeout ao conectar no gateway de voz.")), 12000);

      ws.onopen = () => {
        window.clearTimeout(timeout);
        ws.send(JSON.stringify({
          type: "start",
          authorization: `Bearer ${accessToken}`,
          sessionId: override?.sessionId || sessionIdRef.current || undefined,
          systemInstruction,
          language,
          context: { route: "voice", source: "deepgram-agent" },
        }));
        void startInput().catch((caught) => {
          setError(caught instanceof Error ? caught.message : "Falha ao iniciar microfone.");
          void closeEverything();
        });
        resolve();
      };
      ws.onerror = () => {
        window.clearTimeout(timeout);
        reject(new Error("Falha ao conectar no gateway de voz."));
      };
    });
  }, [closeEverything, gatewayUrl, handleBinaryAudio, handleGatewayMessage, language, sessionIdRef, startInput, systemInstruction]);

  const endSession = useCallback(() => {
    void closeEverything();
  }, [closeEverything]);

  const toggleListening = useCallback(() => {
    if (!activeRef.current) {
      void startSession();
      return;
    }
    const next = !listeningRef.current;
    listeningRef.current = next;
    setIsListening(next && readyRef.current);
    if (!next) setLevel(0);
  }, [setLevel, startSession]);

  const sendTextMessage = useCallback((text: string) => {
    const message = clean(text, 2000);
    if (!message) return;
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: "inject_user_message", message }));
    setTranscript(message);
    callbacksRef.current.onTranscript?.(message, true);
  }, []);

  useEffect(() => () => {
    void closeEverything();
  }, [closeEverything]);

  return {
    isConnected,
    isSpeaking,
    isListening,
    isProcessing,
    audioIntensity,
    getAudioVolume: () => volumeRef.current,
    transcript,
    lastResponse,
    startSession,
    endSession,
    toggleListening,
    sendTextMessage,
    error,
    provider: "deepgram-agent" as const,
    inputProvider: "deepgram-flux" as const,
    outputProvider: "deepgram-cartesia" as const,
  };
}
