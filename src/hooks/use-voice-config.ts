import { useCallback } from 'react';

const LOCAL_CONFIG = {
    token: 'local-cascade',
    expiresAt: 'local',
    newSessionExpiresAt: 'local',
    model: 'groq-cascade',
    voiceName: 'device-pt-BR',
};

export function useVoiceConfig() {
    const refresh = useCallback(async () => LOCAL_CONFIG, []);

    return {
        token: null,
        expiresAt: null,
        newSessionExpiresAt: null,
        model: LOCAL_CONFIG.model,
        voiceName: LOCAL_CONFIG.voiceName,
        isLoading: false,
        error: null,
        refresh,
    };
}
