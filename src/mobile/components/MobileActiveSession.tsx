import { useAuth } from "@/components/auth/SessionContextProvider";
import { JitsiMeet, JitsiRef } from "@/components/teleconsulta/JitsiMeet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useGenerateSessionProntuario } from "@/hooks/use-generate-session-prontuario";
import type { MediaDeviceChoice } from "@/hooks/use-media-readiness";
import { useJitsiToken } from "@/hooks/use-jitsi-token";
import { usePatientById } from "@/hooks/use-patient-by-id";
import { useUpdateAppointment } from "@/hooks/use-update-appointment";
import { cn } from "@/lib/utils";
import { Appointment } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Loader2,
  MessageSquare,
  Mic,
  MicOff,
  NotebookPen,
  Phone,
  Video,
  VideoOff,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { MobileTeleconsultationLobby } from "./MobileTeleconsultationLobby";

interface MobileActiveSessionProps {
  activeAppointment: Appointment;
  onSessionEnd: () => void;
}

const JITSI_APP_ID = "vpaas-magic-cookie-dc267e44c7014498a3a128625367fc67";

export const MobileActiveSession = ({
  activeAppointment,
  onSessionEnd,
}: MobileActiveSessionProps) => {
  const [view, setView] = useState<"video" | "notes">("video");
  const [sessionNotes, setSessionNotes] = useState("");
  const [jitsiTranscript, setJitsiTranscript] = useState<string[]>([]);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [hasJoined, setHasJoined] = useState(false);
  const [showLobby, setShowLobby] = useState(true);
  const [mediaSettings, setMediaSettings] = useState<MediaDeviceChoice | null>(null);

  const jitsiRef = useRef<JitsiRef>(null);
  const { user } = useAuth();
  const therapistName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Terapeuta";

  const { mutate: updateAppointment, isPending: isUpdatingAppointment } = useUpdateAppointment();
  const { mutate: generateProntuario, isPending: isGeneratingProntuario } = useGenerateSessionProntuario();

  const patientId = activeAppointment.patient_id;
  const { data: patient } = usePatientById(patientId || "");
  const appointmentId = activeAppointment.id;
  const isOnline = activeAppointment.type === "online";
  const meetLink = `${window.location.origin}/join/${appointmentId}`;

  const jitsiRoomName = `${JITSI_APP_ID}/${appointmentId}`;
  const { data: jitsiToken, error: jitsiError, isLoading: isLoadingToken } = useJitsiToken(jitsiRoomName);

  useEffect(() => {
    const savedTranscript = localStorage.getItem(`transcript_${appointmentId}`);
    const savedNotes = localStorage.getItem(`notes_${appointmentId}`);
    if (savedTranscript) {
      try {
        setJitsiTranscript(JSON.parse(savedTranscript));
      } catch (error) {
        console.error(error);
      }
    }
    if (savedNotes) setSessionNotes(savedNotes);
  }, [appointmentId]);

  useEffect(() => {
    if (hasJoined) localStorage.setItem(`transcript_${appointmentId}`, JSON.stringify(jitsiTranscript));
  }, [jitsiTranscript, appointmentId, hasJoined]);

  useEffect(() => {
    if (hasJoined) localStorage.setItem(`notes_${appointmentId}`, sessionNotes);
  }, [sessionNotes, appointmentId, hasJoined]);

  const clearLocalData = () => {
    localStorage.removeItem(`transcript_${appointmentId}`);
    localStorage.removeItem(`notes_${appointmentId}`);
  };

  const handleEndSession = useCallback(() => {
    if (isGeneratingProntuario) return;
    toast.info("Finalizando e gerando resumo IA...");
    const fullTranscript = jitsiTranscript.join("\n");

    generateProntuario(
      {
        patientId: patientId || "",
        appointmentId,
        notes: sessionNotes,
        chatHistory: fullTranscript,
      },
      {
        onSuccess: () => {
          updateAppointment(
            { id: appointmentId, updates: { status: "attended" } },
            {
              onSuccess: () => {
                toast.success("Sessão salva com sucesso!");
                clearLocalData();
                onSessionEnd();
              },
            },
          );
        },
        onError: () => {
          updateAppointment(
            { id: appointmentId, updates: { status: "attended" } },
            { onSuccess: () => onSessionEnd() },
          );
        },
      },
    );
  }, [isGeneratingProntuario, jitsiTranscript, sessionNotes, patientId, appointmentId, updateAppointment, generateProntuario, onSessionEnd]);

  const handleTranscriptUpdate = useCallback((transcript: { participant: { name: string }; text: string }) => {
    setJitsiTranscript((previous) => [...previous, `${transcript.participant.name}: ${transcript.text}`]);
  }, []);

  const handleMuteStatusChanged = useCallback(({ audio, video }: { audio: boolean; video: boolean }) => {
    if (typeof audio === "boolean") setIsAudioEnabled(!audio);
    if (typeof video === "boolean") setIsVideoEnabled(!video);
  }, []);

  const handleConferenceJoined = useCallback(() => {
    setHasJoined(true);
    setShowLobby(false);
  }, []);

  const handleJoin = (selection: MediaDeviceChoice) => {
    setMediaSettings(selection);
    setIsAudioEnabled(selection.audioEnabled);
    setIsVideoEnabled(selection.videoEnabled);
    setShowLobby(false);
    if (!isOnline) setHasJoined(true);
  };

  const isProcessing = isUpdatingAppointment || isGeneratingProntuario;

  if (showLobby) {
    return (
      <MobileTeleconsultationLobby
        patientName={activeAppointment.patient_name || "Paciente"}
        patient={patient}
        appointmentId={appointmentId}
        appointmentStart={activeAppointment.start_time}
        meetLink={meetLink}
        therapistName={therapistName}
        isOnline={isOnline}
        isLoadingToken={isOnline && isLoadingToken}
        onJoin={handleJoin}
        onBack={onSessionEnd}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-background">
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-background to-card" />

      <div className="relative z-10 flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {view === "video" ? (
            <motion.div
              key="video"
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            >
              {isOnline ? (
                jitsiToken ? (
                  <JitsiMeet
                    ref={jitsiRef}
                    roomName={jitsiRoomName}
                    jwt={jitsiToken}
                    userName={therapistName}
                    mediaSettings={mediaSettings}
                    onMeetingEnd={handleEndSession}
                    onTranscriptUpdate={handleTranscriptUpdate}
                    onMuteStatusChanged={handleMuteStatusChanged}
                    onConferenceJoined={handleConferenceJoined}
                  />
                ) : jitsiError ? (
                  <div className="flex h-full flex-col items-center justify-center gap-4 px-10 text-center text-rose-500">
                    <AlertCircle className="h-10 w-10 opacity-50" />
                    <p className="text-sm font-medium leading-relaxed">Erro de conexão: {jitsiError.message}</p>
                    <Button variant="outline" onClick={() => window.location.reload()} className="mt-4 border-rose-500/20 text-rose-500">
                      Recarregar
                    </Button>
                  </div>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-4 px-10 text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Iniciando conexão segura...</p>
                  </div>
                )
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-6 px-8 text-foreground/40">
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-[32px] border border-border/10 bg-foreground/[0.04] shadow-2xl">
                    <div className="absolute inset-0 rounded-full bg-foreground/5 blur-2xl" />
                    <NotebookPen className="relative z-10 h-10 w-10 text-foreground/60" />
                  </div>
                  <div className="space-y-2 text-center">
                    <h3 className="text-xl font-bold tracking-tight text-foreground">Presencial</h3>
                    <p className="text-xs font-light leading-relaxed text-muted-foreground">
                      Sessão presencial iniciada. O motor compartilhado de transcrição será conectado na próxima etapa.
                    </p>
                  </div>
                </div>
              )}

              {hasJoined && jitsiTranscript.length > 0 ? (
                <div className="pointer-events-none absolute left-1/2 top-8 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-border/10 bg-background/40 px-4 py-2 backdrop-blur-xl">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                  <span className="text-[10px] font-black tracking-widest text-foreground/90">TRANSCREVENDO</span>
                </div>
              ) : null}
            </motion.div>
          ) : (
            <motion.div
              key="notes"
              className="absolute inset-0 flex flex-col bg-background p-6 pt-16"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-foreground">Anotações Clínicas</h3>
                  <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Sessão: {activeAppointment.patient_name}</p>
                </div>
                <div className="rounded-full border border-border/10 bg-foreground/[0.04] px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-foreground/80">
                  Sincronizado
                </div>
              </div>

              <Textarea
                placeholder="Comece a digitar os pontos principais da sessão..."
                value={sessionNotes}
                onChange={(event) => setSessionNotes(event.target.value)}
                className="flex-1 resize-none rounded-[24px] border-border/10 bg-foreground/[0.02] p-5 text-base leading-relaxed text-foreground/90 shadow-inner placeholder:text-foreground/20 focus:border-border/20 focus:ring-0"
              />

              <div className="mt-6 flex h-[200px] flex-col gap-3 rounded-[24px] border border-border/10 bg-background/60 p-5 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center gap-2 border-b border-border/10 pb-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Contexto ao vivo</span>
                </div>
                <div className="scrollbar-none flex-1 space-y-3 overflow-y-auto pr-2 text-xs text-muted-foreground/80">
                  {jitsiTranscript.length > 0 ? (
                    jitsiTranscript.slice(-10).map((line, index) => (
                      <p key={`${line}-${index}`} className="border-l border-border/10 pl-3 leading-relaxed">{line}</p>
                    ))
                  ) : (
                    <div className="flex h-full items-center justify-center text-[10px] font-black uppercase tracking-widest text-foreground/10">
                      Aguardando transcrição
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative z-[110] px-6 pb-10">
        <div className="flex items-center justify-between gap-2 rounded-[32px] border border-border/20 bg-card/80 p-3 shadow-2xl backdrop-blur-3xl">
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="icon"
              className={cn(
                "h-12 w-12 rounded-2xl border transition-all",
                !isAudioEnabled ? "border-rose-500/20 bg-rose-500/10 text-rose-500" : "border-border/10 bg-foreground/[0.04] text-foreground/70",
              )}
              onClick={() => jitsiRef.current?.toggleAudio()}
              disabled={!isOnline}
            >
              {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>

            <Button
              variant="secondary"
              size="icon"
              className={cn(
                "h-12 w-12 rounded-2xl border transition-all",
                !isVideoEnabled ? "border-rose-500/20 bg-rose-500/10 text-rose-500" : "border-border/10 bg-foreground/[0.04] text-foreground/70",
              )}
              onClick={() => jitsiRef.current?.toggleVideo()}
              disabled={!isOnline}
            >
              {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </Button>
          </div>

          <Button
            size="icon"
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-[28px] bg-rose-500 shadow-[0_20px_40px_rgba(244,63,94,0.3)] transition-all hover:bg-rose-600 active:scale-90",
              isProcessing && "opacity-50",
            )}
            onClick={handleEndSession}
            disabled={isProcessing}
          >
            {isProcessing ? <Loader2 className="h-6 w-6 animate-spin text-background" /> : <Phone className="h-8 w-8 fill-background text-background" />}
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="icon"
              className={cn(
                "h-12 w-12 rounded-2xl border transition-all",
                view === "notes" ? "border-foreground bg-foreground text-background shadow-lg" : "border-border/10 bg-foreground/[0.04] text-foreground/70",
              )}
              onClick={() => setView(view === "video" ? "notes" : "video")}
            >
              {view === "video" ? <NotebookPen className="h-5 w-5" /> : <Video className="h-5 w-5" />}
            </Button>

            <Button
              variant="secondary"
              size="icon"
              className="h-12 w-12 rounded-2xl border border-border/10 bg-foreground/[0.04] text-foreground/70"
              onClick={() => jitsiRef.current?.toggleChat()}
              disabled={!isOnline}
            >
              <MessageSquare className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
