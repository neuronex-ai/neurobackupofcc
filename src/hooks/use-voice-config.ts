import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VoiceConfig {
    token: string;
    expiresAt: string;
    newSessionExpiresAt: string;
    model: string;
    voiceName: string;
}

const DEFAULT_MODEL = 'gemini-3.1-flash-live-preview';
const DEFAULT_VOICE = 'Kore';

const normalizeVoiceConfigError = (caught: unknown) => {
    const rawMessage = caught instanceof Error ? caught.message : 'Nao foi possivel preparar o modo voz.';
    if (
        rawMessage.includes('FunctionsHttpError') ||
        rawMessage.includes('Failed to fetch') ||
        rawMessage.includes('<!DOCTYPE') ||
        rawMessage.includes('Unexpected token')
    ) {
        return 'Nao consegui gerar a credencial temporaria de voz. Verifique sua sessao e tente novamente.';
    }
    return rawMessage;
};

export function useVoiceConfig() {
    const [token, setToken] = useState<string | null>(null);
    const [expiresAt, setExpiresAt] = useState<string | null>(null);
    const [newSessionExpiresAt, setNewSessionExpiresAt] = useState<string | null>(null);
    const [model, setModel] = useState(DEFAULT_MODEL);
    const [voiceName, setVoiceName] = useState(DEFAULT_VOICE);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const { data, error: invokeError } = await supabase.functions.invoke<VoiceConfig>('get-voice-config', {
                method: 'POST',
            });

            if (invokeError) throw new Error(invokeError.message);
            if (!data?.token) throw new Error('Token de voz indisponivel.');

            setToken(data.token);
            setExpiresAt(data.expiresAt);
            setNewSessionExpiresAt(data.newSessionExpiresAt);
            setModel(data.model || DEFAULT_MODEL);
            setVoiceName(data.voiceName || DEFAULT_VOICE);
            return data;
        } catch (caught) {
            const message = normalizeVoiceConfigError(caught);
            setError(message);
            throw new Error(message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        token,
        expiresAt,
        newSessionExpiresAt,
        model,
        voiceName,
        isLoading,
        error,
        refresh,
    };
}
