import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const VOICE_CONFIG_URL = "https://krewdaklcyzqfxkkgvqr.supabase.co/functions/v1/get-voice-config";

interface VoiceConfig {
    key: string;
}

export function useVoiceConfig() {
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchConfig = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.access_token) {
                    setError('Not authenticated');
                    setIsLoading(false);
                    return;
                }

                const response = await fetch(VOICE_CONFIG_URL, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch voice config');
                }

                const data: VoiceConfig = await response.json();
                setApiKey(data.key);
            } catch (e: any) {
                console.error('[useVoiceConfig] Error:', e);
                setError(e.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchConfig();
    }, []);

    return { apiKey, isLoading, error };
}
