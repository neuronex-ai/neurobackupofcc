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

// ─── Synapse Chat Hook ────────────────────────────────────────────────
// Thin wrapper that manages a persistent global Synapse chat session
// across all routes. Auto-creates a session on first use, resumes it
// on subsequent renders.

const SYNAPSE_SESSION_TITLE = 'Synapse Global';

export const useSynapseChat = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { activeSessionId, setActiveSessionId, setExecState, setShellState, addTimelineEntry } = useSynapse();
    const { currentContext, contextSummary, activePatientId } = useAI();

    const { data: sessions } = useChatSessions();
    const createSession = useCreateChatSession();
    const sendMessage = useSendChatMessage();
    const { data: messages, isLoading: messagesLoading } = useSessionMessages(activeSessionId);

    const isInitializing = useRef(false);
    const lastPatientIdRef = useRef<string | null>(null);

    // Track last active patient ID to prevent context loss on navigation
    useEffect(() => {
        if (activePatientId) {
            lastPatientIdRef.current = activePatientId;
        }
    }, [activePatientId]);

    // ── Auto-resolve or create a global Synapse session ──────────────
    useEffect(() => {
        if (!user || isInitializing.current) return;
        if (activeSessionId) return; // Already have one

        // Try to find an existing Synapse Global session
        if (sessions) {
            const existing = sessions.find((s) => s.title === SYNAPSE_SESSION_TITLE);
            if (existing) {
                setActiveSessionId(existing.id);
                return;
            }

            // None found — create one
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

    // ── Send Message ────────────────────────────────────────────────
    const send = useCallback(
        (message: string) => {
            if (!activeSessionId || !message.trim()) return;

            // Update execution state
            setExecState('thinking');
            addTimelineEntry({ label: message, state: 'thinking', detail: `Contexto: ${currentContext}` });

            sendMessage.mutate(
                {
                    message,
                    sessionId: activeSessionId,
                    context: {
                        route: currentContext,
                        summary: contextSummary,
                        patientId: activePatientId || lastPatientIdRef.current,
                        source: 'synapse-shell',
                    },
                },
                {
                    onSuccess: (data) => {
                        setExecState('success');

                        // Handle client actions
                        if (data?.clientAction) {
                            const { type, data: actionData } = data.clientAction;

                            let tlLabel = `Ação executada: ${type}`;
                            let tlDetail = actionData ? 'Operação concluída com sucesso.' : '';
                            let tlPath: string | undefined = undefined;

                            switch (type) {
                                case 'navigation_action':
                                    tlLabel = `Navegação automática solicitada`;
                                    tlDetail = `Destino: ${actionData?.path}`;
                                    tlPath = actionData?.path?.startsWith('/') ? actionData.path : `/${actionData.path}`;
                                    break;
                                case 'patient_created':
                                    tlLabel = `Novo paciente cadastrado: ${actionData?.name || ''}`;
                                    tlPath = actionData?.id ? `/pacientes/${actionData.id}` : '/pacientes';
                                    tlDetail = 'Ficha criada com sucesso.';
                                    break;
                                case 'appointment_scheduled':
                                    tlLabel = `Consulta agendada para ${actionData?.patientName || 'paciente'}`;
                                    tlPath = '/agenda';
                                    tlDetail = actionData?.start_time ? new Date(actionData.start_time).toLocaleString('pt-BR') : 'Agendamento confirmado.';
                                    break;
                                case 'note_created':
                                    tlLabel = `Registro clínico salvo`;
                                    tlPath = actionData?.patientId ? `/pacientes/${actionData.patientId}?tab=prontuario` : undefined;
                                    tlDetail = 'Evolução registrada no prontuário.';
                                    break;
                                case 'transaction_created':
                                    tlLabel = `Transação financeira registrada`;
                                    tlPath = '/financeiro';
                                    tlDetail = `Valor: R$ ${actionData?.amount || '0,00'}`;
                                    break;
                                case 'patient_insights':
                                    tlLabel = `Insights clínicos gerados`;
                                    tlDetail = 'Análise de IA concluída.';
                                    break;
                                case 'medical_articles_list':
                                    tlLabel = `Busca na literatura médica concluída`;
                                    tlDetail = `${actionData?.articles?.length || 0} artigos encontrados para "${actionData?.query || ''}".`;
                                    break;
                                case 'cid10_results':
                                    tlLabel = `Busca de CID-10 concluída`;
                                    tlDetail = `${actionData?.results?.length || 0} resultados encontrados para "${actionData?.query || ''}".`;
                                    break;
                            }

                            addTimelineEntry({
                                label: tlLabel,
                                state: 'success',
                                detail: tlDetail,
                                actionPath: tlPath
                            });

                            // Execute navigation action
                            if (type === 'navigation_action' && actionData?.path) {
                                const targetPath = actionData.path.startsWith('/') ? actionData.path : `/${actionData.path}`;
                                console.log('[Synapse] Navigating to:', targetPath);

                                // Minimize panel first, then navigate after animation
                                setShellState('pill');
                                setTimeout(() => {
                                    navigate(targetPath);
                                    setExecState('idle');
                                }, 350);
                                return; // Skip the default idle timeout below
                            }
                        } else {
                            addTimelineEntry({
                                label: data?.response?.slice(0, 80) || 'Resposta recebida',
                                state: 'success',
                            });
                        }

                        // Reset to idle after brief success indicator
                        setTimeout(() => setExecState('idle'), 2500);
                    },
                    onError: (err) => {
                        setExecState('error');
                        addTimelineEntry({
                            label: err.message || 'Erro ao processar',
                            state: 'error',
                        });
                        setTimeout(() => setExecState('idle'), 3000);
                    },
                }
            );
        },
        [activeSessionId, currentContext, contextSummary, activePatientId, setExecState, setShellState, addTimelineEntry, sendMessage, navigate]
    );

    // ── Clear Session ───────────────────────────────────────────────
    const deleteSession = useDeleteChatSession();

    const clearSession = useCallback(() => {
        if (!activeSessionId) return;
        deleteSession.mutate(activeSessionId, {
            onSuccess: () => {
                setActiveSessionId(null); // clears it so the effect recreates a new one
            }
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
