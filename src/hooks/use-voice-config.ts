import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VoiceConfig {
    token: string | null;
    expiresAt: string | null;
    newSessionExpiresAt: string | null;
    model: string;
    voiceName: string;
    provider: string;
    gatewayUrl: string | null;
    sessionId: string | null;
    listenModel?: string;
    ttsProvider?: string;
    inputSampleRate?: number;
    outputSampleRate?: number;
}

const LOCAL_CONFIG: VoiceConfig = {
    token: 'local-cascade',
    expiresAt: 'local',
    newSessionExpiresAt: 'local',
    model: 'groq-cascade',
    voiceName: 'device-pt-BR',
    provider: 'legacy-cascade',
    gatewayUrl: null as string | null,
    sessionId: null as string | null,
};

export function useVoiceConfig() {
    const [config, setConfig] = useState<VoiceConfig>({
        ...LOCAL_CONFIG,
        provider: import.meta.env.VITE_SYNAPSE_VOICE_PROVIDER === 'legacy-cascade'
            ? 'legacy-cascade'
            : 'deepgram-agent',
        gatewayUrl: import.meta.env.VITE_SYNAPSE_VOICE_GATEWAY_URL || LOCAL_CONFIG.gatewayUrl,
        model: 'gpt-4o-mini',
        voiceName: 'cartesia-sonic',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async (): Promise<VoiceConfig> => {
        const forcedProvider = import.meta.env.VITE_SYNAPSE_VOICE_PROVIDER;
        if (forcedProvider === 'legacy-cascade') {
            setConfig(LOCAL_CONFIG);
            setError(null);
            return LOCAL_CONFIG;
        }

        setIsLoading(true);
        setError(null);
        try {
            const { data, error: invokeError } = await supabase.functions.invoke('synapse-voice-agent-session', {
                body: { includeSettings: false, context: { route: 'voice-config' } },
            });
            if (invokeError) throw invokeError;
            if (data?.error) throw new Error(String(data.error));

            const next: VoiceConfig = {
                token: null,
                expiresAt: String(data?.expiresAt || ''),
                newSessionExpiresAt: String(data?.expiresAt || ''),
                model: String(data?.model || 'gpt-4o-mini'),
                voiceName: String(data?.voiceName || 'cartesia-sonic'),
                provider: String(data?.provider || 'deepgram-agent'),
                gatewayUrl: typeof data?.gatewayUrl === 'string' ? data.gatewayUrl : import.meta.env.VITE_SYNAPSE_VOICE_GATEWAY_URL || null,
                sessionId: typeof data?.sessionId === 'string' ? data.sessionId : null,
                listenModel: typeof data?.listenModel === 'string' ? data.listenModel : undefined,
                ttsProvider: typeof data?.ttsProvider === 'string' ? data.ttsProvider : undefined,
                inputSampleRate: typeof data?.inputSampleRate === 'number' ? data.inputSampleRate : undefined,
                outputSampleRate: typeof data?.outputSampleRate === 'number' ? data.outputSampleRate : undefined,
            };
            setConfig(next);
            return next;
        } catch (caught) {
            const message = caught instanceof Error ? caught.message : 'Nao foi possivel preparar o agente de voz.';
            const gatewayFallback: VoiceConfig = {
                ...LOCAL_CONFIG,
                token: null,
                expiresAt: null,
                newSessionExpiresAt: null,
                model: 'gpt-4o-mini',
                voiceName: 'cartesia-sonic',
                provider: 'deepgram-agent',
                gatewayUrl: import.meta.env.VITE_SYNAPSE_VOICE_GATEWAY_URL || 'ws://localhost:8789/v1/synapse/voice',
            };

            if (import.meta.env.DEV || import.meta.env.VITE_SYNAPSE_VOICE_GATEWAY_URL) {
                console.warn('[Synapse Voice] Config remota indisponivel; usando gateway local.', message);
                setError(null);
                setConfig(gatewayFallback);
                return gatewayFallback;
            }

            const fallback: VoiceConfig = {
                ...LOCAL_CONFIG,
                provider: 'legacy-cascade',
            };
            setError(null);
            setConfig(fallback);
            return fallback;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        token: config.token,
        expiresAt: config.expiresAt,
        newSessionExpiresAt: config.newSessionExpiresAt,
        model: config.model,
        voiceName: config.voiceName,
        provider: config.provider,
        gatewayUrl: config.gatewayUrl,
        sessionId: config.sessionId,
        listenModel: config.listenModel,
        ttsProvider: config.ttsProvider,
        isLoading,
        error,
        refresh,
    };
}
