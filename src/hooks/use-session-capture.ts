import { useSessionTranscript } from '@/hooks/use-session-transcript-engine';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import type {
  SessionTranscriptConsentMethod,
  SessionTranscriptModality,
} from '@/hooks/use-jitsi-token';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseSessionCaptureOptions {
  appointmentId: string;
  patientId?: string | null;
  modality: SessionTranscriptModality;
  therapistName: string;
  language?: string;
}

export const useSessionCapture = ({
  appointmentId,
  patientId,
  modality,
  therapistName,
  language = 'pt-BR',
}: UseSessionCaptureOptions) => {
  const transcript = useSessionTranscript({
    appointmentId,
    patientId,
    modality,
    provider: modality === 'online' ? 'jitsi' : 'browser_speech',
    language,
  });
  const [interimText, setInterimText] = useState('');
  const captureEnabledRef = useRef(false);

  const appendLocalSpeech = useCallback((text: string) => {
    if (!captureEnabledRef.current) return;
    void transcript.appendSegment({
      source: 'browser_speech',
      speakerLabel: therapistName,
      text,
    });
  }, [therapistName, transcript]);

  const speech = useSpeechRecognition({
    lang: language,
    continuous: true,
    onResult: appendLocalSpeech,
    onInterimResult: setInterimText,
  });

  const grantConsent = useCallback(async (
    method: SessionTranscriptConsentMethod = 'verbal',
    notes?: string,
  ) => {
    await transcript.recordConsent('granted', method, notes);
  }, [transcript]);

  const declineConsent = useCallback(async (notes?: string) => {
    captureEnabledRef.current = false;
    speech.stopListening();
    await transcript.recordConsent('declined', 'verbal', notes);
  }, [speech, transcript]);

  const startCapture = useCallback(async () => {
    await transcript.start();
    captureEnabledRef.current = true;
    if (modality === 'in_person' && speech.isSupported) speech.startListening();
  }, [modality, speech, transcript]);

  const pauseCapture = useCallback(async () => {
    captureEnabledRef.current = false;
    speech.stopListening();
    setInterimText('');
    await transcript.pause();
  }, [speech, transcript]);

  const resumeCapture = useCallback(async () => {
    await transcript.resume();
    captureEnabledRef.current = true;
    if (modality === 'in_person' && speech.isSupported) speech.startListening();
  }, [modality, speech, transcript]);

  const appendJitsiSegment = useCallback((entry: {
    participant: { name: string };
    text: string;
  }) => {
    if (!captureEnabledRef.current || modality !== 'online') return;
    void transcript.appendSegment({
      source: 'jitsi',
      speakerLabel: entry.participant.name || 'Participante',
      text: entry.text,
    });
  }, [modality, transcript]);

  const finalizeCapture = useCallback(async () => {
    captureEnabledRef.current = false;
    speech.stopListening();
    setInterimText('');
    return transcript.finalize();
  }, [speech, transcript]);

  const revokeConsent = useCallback(async (notes?: string) => {
    captureEnabledRef.current = false;
    speech.stopListening();
    setInterimText('');
    await transcript.recordConsent('revoked', 'verbal', notes);
  }, [speech, transcript]);

  useEffect(() => () => {
    captureEnabledRef.current = false;
    speech.stopListening();
  }, [speech]);

  return {
    ...transcript,
    interimText,
    speechSupported: speech.isSupported,
    speechError: speech.lastError,
    isListening: speech.isListening,
    grantConsent,
    declineConsent,
    revokeConsent,
    startCapture,
    pauseCapture,
    resumeCapture,
    appendJitsiSegment,
    finalizeCapture,
  };
};
