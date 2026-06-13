import { useAuth } from "@/components/auth/SessionContextProvider";
import { Button } from "@/components/ui/button";
import { useAI } from "@/context/AIContext";
import { useGenerateSessionProntuario } from "@/hooks/use-generate-session-prontuario";
import { useJitsiToken } from "@/hooks/use-jitsi-token";
import type { MediaDeviceChoice } from "@/hooks/use-media-readiness";
import { usePatientById } from "@/hooks/use-patient-by-id";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useUpdateAppointment } from "@/hooks/use-update-appointment";
import { cn } from "@/lib/utils";
import { Appointment } from "@/types";
import { AlertCircle, Mic, NotebookPen } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { DesktopTeleconsultationLobby } from "./DesktopTeleconsultationLobby";
import { InvitePatientModal } from "./InvitePatientModal";
import { JitsiMeet, JitsiRef } from "./JitsiMeet";
import { RiskAlert } from "./RiskAlert";
import { SessionChat } from "./SessionChat";
import { SessionControls } from "./SessionControls";
import { WorkspaceTabs } from "./WorkspaceTabs";

interface ActiveSessionPanelProps {
  activeAppointment: Appointment;
  patientName: string;
  onSessionEnd: () => void;
}

const JITSI_APP_ID = "vpaas-magic-cookie-dc267e44c7014498a3a128625367fc67";

export const ActiveSessionPanel = ({
  activeAppointment,
  patientName,
  onSessionEnd,
}: ActiveSessionPanelProps) => {
  const [sessionNotes, setSessionNotes] = useState("");
  const [transcriptLines, setTranscriptLines] = useState<string[]>([]);
  const [hasJoined, setHasJoined] = useState(false);
  const [mediaSettings, setMediaSettings] = useState<MediaDeviceChoice | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const jitsiRef = useRef<JitsiRef>(null);
  const { toggleFocusMode, isFocusMode } = useAI();
  const { user } = useAuth();

  const { mutate: updateAppointment, isPending: isUpdatingAppointment } = useUpdateAppointment();
  const { mutate: generateProntuario, isPending: isGeneratingProntuario } = useGenerateSessionProntuario();

  const patientId = activeAppointment.patient_id;
  const { data: patient } = usePatientById(patientId || "");
  const appointmentId = activeAppointment.id;
  const isOnline = activeAppointment.type === "online";
  const jitsiRoomName = `${JITSI_APP_ID}/${appointmentId}`;
  const {
    data: jitsiToken,
    error: jitsiError,
    isLoading: isLoadingToken,
  } = useJitsiToken(jitsiRoomName);
  const effectiveMeetLink = `${window.location.origin}/join/${appointmentId}`;

  useEffect(() => {
    const savedTranscript = localStorage.getItem(`transcript_${appointmentId}`);
    const savedNotes = localStorage.getItem(`notes_${appointmentId}`);

    if (savedTranscript) {
      try {
        setTranscriptLines(JSON.parse(savedTranscript));
        toast.success("Histórico da sessão recuperado.");
      } catch {
        console.error("Error parsing saved transcript");
      }
    }
    if (savedNotes) setSessionNotes(savedNotes);
  }, [appointmentId]);

  useEffect(() => {
    if (hasJoined) {
      localStorage.setItem(`transcript_${appointmentId}`, JSON.stringify(transcriptLines));
    }
  }, [transcriptLines, appointmentId, hasJoined]);

  useEffect(() => {
    if (hasJoined) {
      localStorage.setItem(`notes_${appointmentId}`, sessionNotes);
    }
  }, [sessionNotes, appointmentId, hasJoined]);

  const clearLocalData = () => {
    localStorage.removeItem(`transcript_${appointmentId}`);
    localStorage.removeItem(`notes_${appointmentId}`);
  };

  const getTherapistInfo = () => {
    if (!user) return { name: "Terapeuta", avatar: "" };
    const meta = user.user_metadata;
    return {
      name: meta?.full_name || user.email?.split("@")[0] || "Terapeuta",
      avatar: meta?.avatar_url || "",
    };
  };

  const { name: therapistName, avatar: therapistAvatar } = getTherapistInfo();

  const handleLocalSpeechResult = useCallback((text: string) => {
    setTranscriptLines((previous) => [...previous, `Você: ${text}`]);
  }, []);

  const {
    startListening: startTranscription,
    stopListening: stopTranscription,
  } = useSpeechRecognition({ onResult: handleLocalSpeechResult });

  const handleJoinSession = (selection: MediaDeviceChoice) => {
    setMediaSettings(selection);
    setIsAudioEnabled(selection.audioEnabled);
    setIsVideoEnabled(selection.videoEnabled);
    setHasJoined(true);

    if ((window as Window & { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition && selection.audioEnabled) {
      setTimeout(() => {
        startTranscription();
      }, 1000);
    }
  };

  const handleEndSession = useCallback(() => {
    if (isGeneratingProntuario) return;
    stopTranscription();
    toast.info("Finalizando e gerando resumo IA...");

    const fullTranscript = transcriptLines.join("\n");

    generateProntuario({
      patientId: patientId || "",
      appointmentId,
      notes: sessionNotes,
      chatHistory: fullTranscript,
    }, {
      onSuccess: () => {
        updateAppointment({ id: appointmentId, updates: { status: "attended" } }, {
          onSuccess: () => {
            if (isFocusMode) toggleFocusMode();
            toast.success("Sessão salva com sucesso!");
            clearLocalData();
            onSessionEnd();
          },
        });
      },
      onError: () => {
        updateAppointment({ id: appointmentId, updates: { status: "attended" } }, {
          onSuccess: () => {
            if (isFocusMode) toggleFocusMode();
            toast.warning("Sessão salva, mas IA indisponível. Dados mantidos.");
            onSessionEnd();
          },
        });
      },
    });
  }, [isGeneratingProntuario, stopTranscription, transcriptLines, patientId, appointmentId, sessionNotes, generateProntuario, updateAppointment, isFocusMode, toggleFocusMode, onSessionEnd]);

  const handleJitsiTranscriptUpdate = useCallback((entry: { participant: { name: string }; text: string }) => {
    if (entry.participant.name !== therapistName && entry.participant.name !== "Eu") {
      setTranscriptLines((previous) => [...previous, `${entry.participant.name}: ${entry.text}`]);
    }
  }, [therapistName]);

  const toggleAudio = useCallback(() => {
    jitsiRef.current?.toggleAudio();
    setIsAudioEnabled((previous) => !previous);
  }, []);

  const toggleVideo = useCallback(() => {
    jitsiRef.current?.toggleVideo();
    setIsVideoEnabled((previous) => !previous);
  }, []);

  const toggleScreenShare = useCallback(() => {
    jitsiRef.current?.toggleScreenShare();
    setIsScreenSharing((previous) => !previous);
  }, []);

  const renderLobby = () => (
    <DesktopTeleconsultationLobby
      patientName={patientName}
      patient={patient}
      appointmentId={appointmentId}
      appointmentStart={activeAppointment.start_time}
      meetLink={effectiveMeetLink}
      therapistName={therapistName}
      isOnline={isOnline}
      isLoadingToken={isOnline && isLoadingToken}
      onJoin={handleJoinSession}
    />
  );

  const renderVideoArea = () => {
    if (!hasJoined) return renderLobby();

    if (!isOnline) {
      return (
        <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-white/40 backdrop-blur-[60px] dark:bg-[#050505]/40">
          <div className="pointer-events-none absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/[0.03] blur-[150px]" />

          <div className="z-10 flex animate-fade-up flex-col items-center gap-8">
            <div className="group relative">
              <div className="absolute inset-0 scale-150 rounded-full bg-emerald-500/10 opacity-0 blur-3xl transition-opacity duration-1000 group-hover:opacity-100 dark:bg-emerald-500/5" />
              <div className="relative z-10 flex h-40 w-40 items-center justify-center rounded-[40px] border border-zinc-900/10 bg-zinc-900/5 shadow-xl backdrop-blur-2xl transition-transform duration-500 hover:scale-[1.02] dark:border-white/10 dark:bg-white/5">
                <NotebookPen className="h-14 w-14 text-zinc-900 opacity-80 dark:text-white" />
              </div>
              <div className="absolute -bottom-3 -right-3">
                <span className="relative flex h-8 w-8">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-full border-4 border-white bg-emerald-500 shadow-lg dark:border-black">
                    <Mic className="h-3 w-3 fill-current text-white" />
                  </span>
                </span>
              </div>
            </div>

            <div className="relative z-10 space-y-3 text-center">
              <h3 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">Sessão Presencial</h3>
              <p className="mx-auto max-w-sm text-base font-light leading-relaxed text-zinc-500 dark:text-zinc-400">
                O microfone foi verificado no pré-join. O motor persistente de transcrição será conectado na próxima etapa.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-6 py-3 backdrop-blur-md">
              <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Sessão em andamento</span>
            </div>
          </div>
        </div>
      );
    }

    if (jitsiError) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-4 rounded-[24px] border border-rose-500/20 bg-card text-rose-500">
          <AlertCircle className="h-10 w-10" />
          <p className="font-bold">Falha na autenticação da sala</p>
          <Button variant="outline" onClick={() => window.location.reload()} className="border-rose-500/20 text-rose-500">Recarregar</Button>
        </div>
      );
    }

    if (jitsiToken) {
      return (
        <JitsiMeet
          ref={jitsiRef}
          roomName={jitsiRoomName}
          jwt={jitsiToken}
          userName={therapistName}
          userEmail={user?.email}
          userAvatarUrl={therapistAvatar}
          subject={patientName || "Consulta"}
          mediaSettings={mediaSettings}
          onMeetingEnd={handleEndSession}
          onTranscriptUpdate={handleJitsiTranscriptUpdate}
        />
      );
    }

    return null;
  };

  const isProcessing = isUpdatingAppointment || isGeneratingProntuario;

  return (
    <>
      <div className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-background">
        <div className="flex h-full w-full flex-1 gap-6 p-6">
          <div className={cn("relative flex h-full flex-col transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]", isFocusMode ? "w-full" : "flex-1")}>
            <div className="relative flex-1 overflow-hidden rounded-[40px] border border-zinc-200 bg-zinc-50 shadow-2xl dark:border-white/10 dark:bg-black">
              {renderVideoArea()}
              <RiskAlert riskScore={patient?.risk_score || 0} />

              {transcriptLines.length > 0 && hasJoined ? (
                <div className="absolute right-6 top-6 z-20 flex items-center gap-2.5 rounded-full border border-border/10 bg-background/40 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-emerald-500 shadow-2xl backdrop-blur-xl">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
                  Gravando
                </div>
              ) : null}
            </div>

            {hasJoined ? (
              <div className="pointer-events-none absolute bottom-6 left-0 right-0 z-40 animate-in fade-in slide-in-from-bottom-10 duration-700">
                <SessionControls
                  isFocusMode={isFocusMode}
                  onToggleFocus={toggleFocusMode}
                  isProcessing={isProcessing}
                  onEndSession={handleEndSession}
                  isScreenSharing={isScreenSharing}
                  onToggleScreenShare={toggleScreenShare}
                  isOnline={isOnline}
                  isAudioEnabled={isAudioEnabled}
                  isVideoEnabled={isVideoEnabled}
                  onToggleAudio={toggleAudio}
                  onToggleVideo={toggleVideo}
                  meetLink={effectiveMeetLink}
                  onToggleChat={() => setIsChatOpen((previous) => !previous)}
                  isChatOpen={isChatOpen}
                  onOpenInvite={() => setShowInviteModal(true)}
                />
              </div>
            ) : null}

            {hasJoined && isOnline && user ? (
              <SessionChat
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                appointmentId={appointmentId}
                currentUserId={user.id}
                currentUserName={therapistName}
              />
            ) : null}
          </div>

          <div className={cn("flex w-[400px] flex-col gap-6 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] xl:w-[440px] 2xl:w-[480px]", isFocusMode ? "absolute right-0 w-0 translate-x-[110%] opacity-0" : "opacity-100")}>
            {patientId ? <WorkspaceTabs patientId={patientId} patientName={patientName} /> : null}
          </div>
        </div>
      </div>

      <InvitePatientModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        patient={patient}
        meetLink={effectiveMeetLink}
      />
    </>
  );
};
