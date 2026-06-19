import { useAuth } from '@/components/auth/SessionContextProvider';
import type { JitsiRef } from '@/components/teleconsulta/JitsiMeet';
import { useAI } from '@/context/AIContext';
import { useGenerateSessionProntuario } from '@/hooks/use-generate-session-prontuario';
import { useJitsiToken } from '@/hooks/use-jitsi-token';
import type { MediaDeviceChoice } from '@/hooks/use-media-readiness';
import { usePatientById } from '@/hooks/use-patient-by-id';
import { useResilientSessionNotes } from '@/hooks/use-resilient-session-notes';
import { useSessionCapture } from '@/hooks/use-session-capture';
import { useUpdateAppointment } from '@/hooks/use-update-appointment';
import { supabase } from '@/integrations/supabase/client';
import type { Appointment, SessionNote } from '@/types';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

export type DesktopSessionCompletionMode = 'idle' | 'generating' | 'saving';

const JITSI_APP_ID = 'vpaas-magic-cookie-dc267e44c7014498a3a128625367fc67';
const TRANSCRIPTION_NOTICE_VERSION = '2026-06-teleconsultation-transcription-v1';

export const formatSessionElapsed = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
};

export const useDesktopClinicalSession = (
  activeAppointment: Appointment,
  patientName: string,
  onSessionEnd: () => void,
) => {
  const [showLobby, setShowLobby] = useState(true);
  const [hasJoined, setHasJoined] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [mediaSettings, setMediaSettings] = useState<MediaDeviceChoice | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewTranscript, setReviewTranscript] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewSummaryNote, setReviewSummaryNote] = useState<SessionNote | null>(null);
  const [completionMode, setCompletionMode] = useState<DesktopSessionCompletionMode>('idle');
  const [completionError, setCompletionError] = useState<string | null>(null);

  const jitsiRef = useRef<JitsiRef>(null);
  const joinedAtRef = useRef<number | null>(null);
  const reviewRequestedRef = useRef(false);

  const { toggleFocusMode, isFocusMode } = useAI();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const therapistName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Terapeuta';
  const therapistAvatar = user?.user_metadata?.avatar_url || '';
  const patientId = activeAppointment.patient_id;
  const appointmentId = activeAppointment.id;
  const isOnlineSession = activeAppointment.type === 'online';
  const roomName = `${JITSI_APP_ID}/${appointmentId}`;
  const effectiveMeetLink = `${window.location.origin}/join/${appointmentId}`;

  const { data: patient } = usePatientById(patientId || '');
  const {
    data: jitsiToken,
    error: jitsiError,
    isLoading: isLoadingToken,
  } = useJitsiToken(roomName, { enabled: isOnlineSession });
  const { mutateAsync: updateAppointment, isPending: isUpdatingAppointment } = useUpdateAppointment();
  const { mutateAsync: generateProntuario, isPending: isGeneratingProntuario } = useGenerateSessionProntuario();
  const notesDraft = useResilientSessionNotes(appointmentId);
  const capture = useSessionCapture({
    appointmentId,
    patientId,
    modality: isOnlineSession ? 'online' : 'in_person',
    therapistName,
  });

  const {
    transcriptId,
    transcriptText,
    segments,
    record,
    captureState,
    syncState,
    pendingCount,
    consentStatus,
    isOnline: hasNetwork,
    lastError,
    interimText,
    isCaptureEnabled,
    speechSupported,
    ensureTranscript,
    grantConsent,
    declineConsent,
    startCapture,
    pauseCapture,
    resumeCapture,
    appendJitsiSegment,
    finalizeCapture,
    retrySync,
    markReviewed,
    linkSummaryNote,
    clearRecovery,
  } = capture;

  const isProcessing = completionMode !== 'idle' || isUpdatingAppointment || isGeneratingProntuario;
  const captureAvailable = isOnlineSession || speechSupported;

  const captureLabel = useMemo(() => {
    if (consentStatus === 'declined') return 'Sessão sem transcrição';
    if (consentStatus === 'revoked') return 'Consentimento revogado';
    if (consentStatus === 'pending') return 'Consentimento pendente';
    if (captureState === 'finalizing') return 'Finalizando captura';
    if (captureState === 'completed') return 'Transcrição concluída';
    if (captureState === 'paused') return 'Captura pausada';
    if (isCaptureEnabled) return 'Transcrevendo';
    return 'Captura pronta';
  }, [captureState, consentStatus, isCaptureEnabled]);

  const syncLabel = useMemo(() => {
    if (!hasNetwork || syncState === 'offline') return 'Offline protegido';
    if (syncState === 'syncing') return 'Sincronizando';
    if (syncState === 'error') return 'Falha de sincronização';
    if (pendingCount > 0 || syncState === 'pending') return `${pendingCount || 1} pendente`;
    if (syncState === 'synced') return 'Sincronizado';
    return 'Recuperação ativa';
  }, [hasNetwork, pendingCount, syncState]);

  const persistTranscriptionDecision = useCallback(async (enabled: boolean) => {
    await updateAppointment({
      id: appointmentId,
      updates: {
        metadata: {
          teleconsultationTranscription: {
            enabled,
            decidedAt: new Date().toISOString(),
            decidedBy: user?.id,
            noticeVersion: TRANSCRIPTION_NOTICE_VERSION,
          },
        },
      },
    });
  }, [appointmentId, updateAppointment, user?.id]);

  useEffect(() => {
    if (!isOnlineSession && !hasJoined) return;
    if (!joinedAtRef.current) joinedAtRef.current = Date.now();
    const timer = window.setInterval(() => {
      if (joinedAtRef.current) {
        setElapsedSeconds(Math.floor((Date.now() - joinedAtRef.current) / 1000));
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [hasJoined]);

  useEffect(() => {
    if (!hasJoined) return;
    void ensureTranscript().catch((error) => {
      toast.error(error instanceof Error ? error.message : 'Não foi possível preparar a transcrição.');
    });
    setShowConsent(consentStatus === 'pending');
  }, [consentStatus, ensureTranscript, hasJoined, isOnlineSession]);

  const handleJoinSession = useCallback((selection: MediaDeviceChoice) => {
    setMediaSettings(selection);
    setIsAudioEnabled(selection.audioEnabled);
    setIsVideoEnabled(selection.videoEnabled);
    setShowLobby(false);
    if (!isOnlineSession) setHasJoined(true);
  }, [isOnlineSession]);

  const handleGrantConsent = useCallback(async (
    method: Parameters<typeof grantConsent>[0],
    notes?: string,
  ) => {
    try {
      await persistTranscriptionDecision(true);
      await grantConsent(method, notes);
      if (!isOnlineSession && !speechSupported) {
        setShowConsent(false);
        toast.warning('Transcrição presencial indisponível. A sessão seguirá com anotações protegidas.');
        return;
      }
      await startCapture();
      setShowConsent(false);
      toast.success('Consentimento registrado e captura iniciada.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível iniciar a captura.');
    }
  }, [grantConsent, isOnlineSession, persistTranscriptionDecision, speechSupported, startCapture]);

  const handleDeclineConsent = useCallback(async (notes?: string) => {
    try {
      await persistTranscriptionDecision(false);
      await declineConsent(notes);
      setShowConsent(false);
      toast.info('A sessão continuará sem transcrição.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível registrar a decisão.');
    }
  }, [declineConsent, persistTranscriptionDecision]);

  const handleToggleCapture = useCallback(async () => {
    if (consentStatus !== 'granted') {
      setShowConsent(true);
      return;
    }
    if (!captureAvailable) {
      toast.error('Transcrição presencial indisponível neste navegador.');
      return;
    }
    try {
      if (isCaptureEnabled) await pauseCapture();
      else if (captureState === 'paused' || record?.status === 'recording') await resumeCapture();
      else await startCapture();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível alterar a captura.');
    }
  }, [captureAvailable, captureState, consentStatus, isCaptureEnabled, pauseCapture, record?.status, resumeCapture, startCapture]);

  const toggleAudio = useCallback(() => {
    jitsiRef.current?.toggleAudio();
    setIsAudioEnabled((current) => !current);
  }, []);

  const toggleVideo = useCallback(() => {
    jitsiRef.current?.toggleVideo();
    setIsVideoEnabled((current) => !current);
  }, []);

  const toggleScreenShare = useCallback(() => {
    jitsiRef.current?.toggleScreenShare();
    setIsScreenSharing((current) => !current);
  }, []);

  const requestReview = useCallback(async () => {
    if (reviewRequestedRef.current) return;
    reviewRequestedRef.current = true;
    setCompletionError(null);
    setReviewSummaryNote(null);
    try {
      let finalTranscript = transcriptText;
      let finalTranscriptId = transcriptId;
      if (consentStatus === 'granted' && captureState !== 'completed') {
        const result = await finalizeCapture();
        finalTranscript = result.text;
        finalTranscriptId = result.transcriptId;
      }
      const finalNotes = notesDraft.notes;
      setReviewTranscript(finalTranscript);
      setReviewNotes(finalNotes);
      setReviewOpen(true);
      if (isOnlineSession && hasJoined) jitsiRef.current?.executeCommand('hangup');
      if (!patientId) {
        setCompletionError('Paciente não vinculado. Não foi possível gerar o resumo clínico.');
        return;
      }
      if (!hasNetwork) {
        setCompletionError('Reconecte-se para gerar o resumo clínico pendente.');
        return;
      }
      setCompletionMode('generating');
      await retrySync();
      if (finalTranscriptId) await markReviewed();
      const result = await generateProntuario({
        patientId,
        appointmentId,
        notes: finalNotes,
        chatHistory: finalTranscript,
        reviewMode: 'pending',
        sourceTranscriptId: finalTranscriptId,
      });
      const summaryNote = result.sessionNote || null;
      setReviewSummaryNote(summaryNote);
      if (finalTranscriptId && summaryNote?.id) await linkSummaryNote(summaryNote.id);
      setCompletionMode('idle');
    } catch (error) {
      reviewRequestedRef.current = false;
      setCompletionMode('idle');
      const message = error instanceof Error ? error.message : 'Não foi possível preparar a revisão.';
      setCompletionError(message);
      toast.error(message);
    }
  }, [appointmentId, captureState, consentStatus, finalizeCapture, generateProntuario, hasJoined, hasNetwork, isOnlineSession, linkSummaryNote, markReviewed, notesDraft.notes, patientId, retrySync, transcriptId, transcriptText]);

  const finishSession = useCallback(async (
    draftPending: boolean,
    summaryNoteId?: string,
  ) => {
    await updateAppointment({
      id: appointmentId,
      updates: {
        status: 'attended',
        metadata: {
          ...(activeAppointment.metadata || {}),
          sessionTranscriptId: transcriptId,
          sessionSummaryNoteId: summaryNoteId || null,
          sessionDraftPending: draftPending,
          sessionDraftNotes: draftPending ? reviewNotes : null,
          sessionCompletedAt: new Date().toISOString(),
        },
      },
    });
    await Promise.all([clearRecovery(), notesDraft.clearDraft()]);
    if (isFocusMode) toggleFocusMode();
    setReviewOpen(false);
    onSessionEnd();
  }, [activeAppointment.metadata, appointmentId, clearRecovery, isFocusMode, notesDraft, onSessionEnd, reviewNotes, toggleFocusMode, transcriptId, updateAppointment]);

  const confirmSummaryNote = useCallback(async (noteId: string) => {
    if (!user?.id) throw new Error('Usuário não autenticado.');
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('session_notes')
      .update({
        review_status: 'confirmed',
        confirmed_at: now,
        confirmed_by: user.id,
        locked_at: now,
      })
      .eq('id', noteId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    const note = data as SessionNote;
    setReviewSummaryNote(note);
    if (note.patient_id) {
      queryClient.invalidateQueries({ queryKey: ['sessionNotes', note.patient_id] });
      queryClient.invalidateQueries({ queryKey: ['pendingSessionReviews', note.patient_id] });
      queryClient.invalidateQueries({ queryKey: ['patientTimeline', note.patient_id] });
      queryClient.invalidateQueries({ queryKey: ['patientSessionSummary'] });
    }
    return note;
  }, [queryClient, user?.id]);

  const completeWithAi = useCallback(async () => {
    if (!patientId || !hasNetwork) return;
    setCompletionMode('generating');
    setCompletionError(null);
    try {
      if (!reviewSummaryNote?.id) return;
      setCompletionMode('saving');
      const confirmedNote = await confirmSummaryNote(reviewSummaryNote.id);
      await finishSession(false, confirmedNote.id);
      toast.success('Sessão concluída e resumo confirmado.');
      return;
      await retrySync();
      if (transcriptId) await markReviewed();
      const result = await generateProntuario({
        patientId,
        appointmentId,
        notes: reviewNotes,
        chatHistory: reviewTranscript,
      });
      const summaryNoteId = result.sessionNote?.id;
      if (transcriptId && summaryNoteId) await linkSummaryNote(summaryNoteId);
      await finishSession(false, summaryNoteId);
      toast.success('Sessão concluída e rascunho clínico gerado.');
    } catch (error) {
      setCompletionError(error instanceof Error ? error.message : 'Não foi possível concluir a sessão.');
    } finally {
      setCompletionMode('idle');
    }
  }, [appointmentId, finishSession, generateProntuario, hasNetwork, linkSummaryNote, markReviewed, patientId, retrySync, reviewNotes, reviewTranscript, transcriptId]);

  const completeWithoutAi = useCallback(async () => {
    if (!hasNetwork) return;
    setCompletionMode('saving');
    setCompletionError(null);
    try {
      if (!reviewSummaryNote?.id) return;
      await finishSession(true, reviewSummaryNote.id);
      toast.warning('Sessão concluída. O resumo ficou pendente por até 48h.');
      return;
      await retrySync();
      if (transcriptId) await markReviewed();
      await finishSession(true);
      toast.warning('Sessão concluída e rascunho preservado para depois.');
    } catch (error) {
      setCompletionError(error instanceof Error ? error.message : 'Não foi possível salvar a conclusão.');
    } finally {
      setCompletionMode('idle');
    }
  }, [finishSession, hasNetwork, markReviewed, retrySync, transcriptId]);

  const confirmGeneratedSummary = useCallback(async () => {
    if (!reviewSummaryNote?.id || !hasNetwork) return;
    setCompletionMode('saving');
    setCompletionError(null);
    try {
      const confirmedNote = await confirmSummaryNote(reviewSummaryNote.id);
      await finishSession(false, confirmedNote.id);
      toast.success('Sessão concluída e resumo confirmado.');
    } catch (error) {
      setCompletionError(error instanceof Error ? error.message : 'Não foi possível confirmar o resumo.');
    } finally {
      setCompletionMode('idle');
    }
  }, [confirmSummaryNote, finishSession, hasNetwork, reviewSummaryNote?.id]);

  const preserveGeneratedSummaryForLater = useCallback(async () => {
    if (!reviewSummaryNote?.id || !hasNetwork) return;
    setCompletionMode('saving');
    setCompletionError(null);
    try {
      await finishSession(true, reviewSummaryNote.id);
      toast.warning('Sessão concluída. O resumo ficou pendente por até 48h.');
    } catch (error) {
      setCompletionError(error instanceof Error ? error.message : 'Não foi possível salvar a pendência.');
    } finally {
      setCompletionMode('idle');
    }
  }, [finishSession, hasNetwork, reviewSummaryNote?.id]);

  void completeWithAi;
  void completeWithoutAi;

  return {
    user,
    patient,
    patientId,
    patientName,
    appointmentId,
    activeAppointment,
    therapistName,
    therapistAvatar,
    isOnlineSession,
    roomName,
    effectiveMeetLink,
    jitsiToken,
    jitsiError,
    isLoadingToken,
    jitsiRef,
    reviewRequestedRef,
    showLobby,
    hasJoined,
    showConsent,
    mediaSettings,
    isScreenSharing,
    isAudioEnabled,
    isVideoEnabled,
    isChatOpen,
    showInviteModal,
    elapsedSeconds,
    reviewOpen,
    reviewTranscript,
    reviewNotes,
    reviewSummaryNote,
    completionMode,
    completionError,
    isFocusMode,
    isProcessing,
    notesDraft,
    segments,
    captureState,
    syncState,
    hasNetwork,
    lastError,
    interimText,
    isCaptureEnabled,
    speechSupported,
    captureAvailable,
    captureLabel,
    syncLabel,
    appendJitsiSegment,
    retrySync,
    handleJoinSession,
    handleGrantConsent,
    handleDeclineConsent,
    handleToggleCapture,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    toggleFocusMode,
    requestReview,
    completeWithAi: confirmGeneratedSummary,
    completeWithoutAi: preserveGeneratedSummaryForLater,
    setHasJoined,
    setShowLobby,
    setIsAudioEnabled,
    setIsVideoEnabled,
    setIsChatOpen,
    setShowInviteModal,
    setReviewTranscript,
    setReviewNotes,
  };
};
