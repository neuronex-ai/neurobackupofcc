import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VoiceConfig {
    token: string;
    expiresAt: string;
    newSessionExpiresAt: string;
    model: string;
    voiceName: string;
}

export function useVoiceConfig() {
    const [token, setToken] = useState<string | null>(null);
    const [expiresAt, setExpiresAt] = useState<string | null>(null);
    const [newSessionExpiresAt, setNewSessionExpiresAt] = useState<string | null>(null);
    const [model, setModel] = useState('gemini-3.1-flash-live-preview');
    const [voiceName, setVoiceName] = useState('Kore');
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
            if (!data?.token) throw new Error('Token de voz indisponível.');

            setToken(data.token);
            setExpiresAt(data.expiresAt);
            setNewSessionExpiresAt(data.newSessionExpiresAt);
            setModel(data.model || 'gemini-3.1-flash-live-preview');
            setVoiceName(data.voiceName || 'Kore');
            return data;
        } catch (caught) {
            const message = caught instanceof Error ? caught.message : 'Não foi possível preparar o modo voz.';
            setError(message);
            throw new Error(message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh().catch(() => {
            if (typeof window !== 'undefined') {
                setIsLoading(false);
            }
        });
    }, [refresh]);

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
