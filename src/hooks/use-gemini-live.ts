import { useCallback, useEffect, useRef, useState } from 'react';
import { GeminiLiveClient, GeminiLiveStatus } from '@/lib/gemini-live-client';
import { useVoiceConfig } from './use-voice-config';

type ClientToolMap = Record<string, (params: unknown) => Promise<unknown> | unknown>;

interface UseGeminiLiveOptions {
    onConnect?: () => void;
    onDisconnect?: () => void;
    onError?: (error: string) => void;
}

export function useGeminiLive(options?: UseGeminiLiveOptions) {
    const [status, setStatus] = useState<GeminiLiveStatus>('disconnected');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const clientRef = useRef<GeminiLiveClient | null>(null);
    const volumeRef = useRef(0);
    const { voiceName, refresh } = useVoiceConfig();

    const startSession = useCallback(async ({ clientTools }: { clientTools?: ClientToolMap }) => {
        if (clientRef.current?.getStatus() === 'connected') return;
        const voiceConfig = await refresh();

        let toolDeclarations: unknown[] = [];
        try {
            const mod = await import('@/lib/gemini-voice-tools.json');
            const loaded = mod.default || mod;
            toolDeclarations = Array.isArray(loaded) ? loaded : [];
        } catch {
            toolDeclarations = [];
        }

        const client = new GeminiLiveClient({
            token: voiceConfig.token,
            model: voiceConfig.model,
            voiceName: voiceConfig.voiceName || voiceName,
            systemInstruction: 'Voce e o Synapse, a IA medica avancada do sistema NeuroNex Desktop. Fale num tom caloroso, eficiente e profissional. Auxilie o usuario em acoes clinicas, seja concisa.',
            tools: toolDeclarations.length ? toolDeclarations : undefined,
            onStatusChange: (newStatus) => {
                setStatus(newStatus);
                if (newStatus === 'connected') options?.onConnect?.();
                if (newStatus === 'disconnected') options?.onDisconnect?.();
            },
            onSpeechStatusChange: setIsSpeaking,
            onVolumeChange: (volume) => {
                volumeRef.current = volume;
            },
            onToolCall: async (name, params) => {
                const tool = clientTools?.[name];
                if (!tool) return { error: `Tool ${name} handler not found in client` };
                return tool(params);
            },
            onError: (error) => {
                options?.onError?.(error.message);
            },
        });

        clientRef.current = client;
        await client.connect();
    }, [options, refresh, voiceName]);

    const endSession = useCallback(async () => {
        clientRef.current?.disconnect();
        clientRef.current = null;
    }, []);

    const getInputVolume = useCallback(() => volumeRef.current, []);

    useEffect(() => () => {
        clientRef.current?.disconnect();
    }, []);

    return {
        status,
        isSpeaking,
        getInputVolume,
        startSession,
        endSession,
    };
}
