import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSynapse } from '@/context/SynapseProvider';
import { useAuth } from '@/components/auth/SessionContextProvider';
import { useAI } from '@/context/AIContext';
import {
    useChatSessions,
    useCreateChatSession,
    useSendChatMessage,
    useSessionMessages,
    useDeleteChatSession,
} from '@/hooks/use-ai-chat';
import { Message } from '@/types';
import {
    executeSynapseInterfaceAction,
    normalizeSynapseClientAction,
} from '@/lib/synapse-interface-actions';

// ─── Synapse Chat Hook ────────────────────────────────────────────────
// Text and voice share sessions, memory, tools and the same structured
// interface-action executor. Only their presentation differs.

const SYNAPSE_SESSION_TITLE = 'Synapse Global';

export const useSynapseChat = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { activeSessionId, setActiveSessionId, setExecState, addTimelineEntry } = useSynapse();
    const { currentContext, contextSummary, activePatientId } = useAI();

    const { data: sessions } = useChatSessions();
    const createSession = useCreateChatSession();
    const sendMessage = useSendChatMessage();
    const { data: messages, isLoading: messagesLoading } = useSessionMessages(activeSessionId);

    const isInitializing = useRef(false);
    const lastPatientIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (activePatientId) lastPatientIdRef.current = activePatientId;
    }, [activePatientId]);

    useEffect(() => {
        if (!user || isInitializing.current || activeSessionId) return;

        if (sessions) {
            const existing = sessions.find((session) => session.title === SYNAPSE_SESSION_TITLE);
            if (existing) {
                setActiveSessionId(existing.id);
                return;
            }

            isInitializing.current = true;
            createSession.mutate(SYNAPSE_SESSION_TITLE, {
                onSuccess: (newSession) => {
                    setActiveSessionId(newSession.id);
                    isInitializing.current = false;
                },
                onError: () => {
                    isInitializing.current = false;
                },
            });
        }
    }, [user, sessions, activeSessionId, setActiveSessionId, createSession]);

    const send = useCallback(
        (message: string) => {
            if (!activeSessionId || !message.trim()) return;

            setExecState('thinking');
            addTimelineEntry({
                label: message,
                state: 'thinking',
                detail: `Contexto: ${currentContext}`,
            });

            sendMessage.mutate(
                {
                    message,
                    sessionId: activeSessionId,
                    context: {
                        route: currentContext,
                        summary: contextSummary,
                        patientId: activePatientId || lastPatientIdRef.current,
                        channel: 'text',
                        source: 'synapse-shell',
                    },
                },
                {
                    onSuccess: async (data) => {
                        const action = normalizeSynapseClientAction(data?.clientAction);

                        if (action) {
                            setExecState('executing');
                            addTimelineEntry({
                                label: 'Synapse está utilizando sua tela',
                                state: 'executing',
                                toolId: action.action,
                                detail: action.reason || 'Executando ação estruturada.',
                            });

                            const result = await executeSynapseInterfaceAction(action, {
                                navigate,
                                channel: 'text',
                            });

                            setExecState(result.success ? 'success' : result.cancelled ? 'idle' : 'error');
                            addTimelineEntry({
                                label: result.success
                                    ? 'Ação de interface concluída'
                                    : result.cancelled
                                      ? 'Ação cancelada'
                                      : 'Não foi possível concluir a ação',
                                state: result.success ? 'success' : result.cancelled ? 'idle' : 'error',
                                toolId: action.action,
                                detail: result.message,
                            });
                        } else {
                            setExecState('success');
                            addTimelineEntry({
                                label: data?.response?.slice(0, 80) || 'Resposta recebida',
                                state: 'success',
                            });
                        }

                        window.setTimeout(() => setExecState('idle'), 2200);
                    },
                    onError: (error) => {
                        setExecState('error');
                        addTimelineEntry({
                            label: error.message || 'Erro ao processar',
                            state: 'error',
                        });
                        window.setTimeout(() => setExecState('idle'), 3000);
                    },
                },
            );
        },
        [
            activeSessionId,
            currentContext,
            contextSummary,
            activePatientId,
            setExecState,
            addTimelineEntry,
            sendMessage,
            navigate,
        ],
    );

    const deleteSession = useDeleteChatSession();

    const clearSession = useCallback(() => {
        if (!activeSessionId) return;
        deleteSession.mutate(activeSessionId, {
            onSuccess: () => setActiveSessionId(null),
        });
    }, [activeSessionId, deleteSession, setActiveSessionId]);

    return {
        send,
        clearSession,
        messages: (messages || []) as Message[],
        isSending: sendMessage.isPending,
        messagesLoading,
        sessionReady: !!activeSessionId,
    };
};
