import { Appointment } from "@/types";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  MessageSquare,
  NotebookPen,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useCallback, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateAppointment } from "@/hooks/use-update-appointment";
import { useGenerateSessionProntuario } from "@/hooks/use-generate-session-prontuario";
import { toast } from "sonner";
import { JitsiMeet, JitsiRef } from "@/components/teleconsulta/JitsiMeet";
import { useJitsiToken } from "@/hooks/use-jitsi-token";
import { useAuth } from "@/components/auth/SessionContextProvider";
import { MobileTeleconsultationLobby } from "./MobileTeleconsultationLobby";
import { usePatientById } from "@/hooks/use-patient-by-id";

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

  const jitsiRef = useRef<JitsiRef>(null);
  const { user } = useAuth();
  const therapistName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Terapeuta";

  const { mutate: updateAppointment, isPending: isUpdatingAppointment } = useUpdateAppointment();
  const { mutate: generateProntuario, isPending: isGeneratingProntuario } = useGenerateSessionProntuario();

  const patientId = activeAppointment.patient_id;
  const { data: patient } = usePatientById(patientId || '');
  const appointmentId = activeAppointment.id;
  const isOnline = activeAppointment.type === "online";
  const meetLink = `${window.location.origin}/join/${appointmentId}`;

  const jitsiRoomName = `${JITSI_APP_ID}/${appointmentId}`;
  const { data: jitsiToken, error: jitsiError, isLoading: isLoadingToken } = useJitsiToken(jitsiRoomName);

  // Persistence
  useEffect(() => {
    const savedTranscript = localStorage.getItem(`transcript_${appointmentId}`);
    const savedNotes = localStorage.getItem(`notes_${appointmentId}`);
    if (savedTranscript) {
      try { setJitsiTranscript(JSON.parse(savedTranscript)); } catch (e) { console.error(e); }
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
            }
          );
        },
        onError: () => {
          updateAppointment(
            { id: appointmentId, updates: { status: "attended" } },
            { onSuccess: () => { onSessionEnd(); } }
          );
        },
      }
    );
  }, [isGeneratingProntuario, jitsiTranscript, sessionNotes, patientId, appointmentId, updateAppointment, generateProntuario, onSessionEnd]);

  const handleTranscriptUpdate = useCallback((transcript: { participant: { name: string }; text: string }) => {
    setJitsiTranscript((prev) => [...prev, `${transcript.participant.name}: ${transcript.text}`]);
  }, []);

  const handleMuteStatusChanged = useCallback(({ audio, video }: { audio: boolean; video: boolean }) => {
    setIsAudioEnabled(!audio);
    setIsVideoEnabled(!video);
  }, []);

  const handleConferenceJoined = useCallback(() => {
    setHasJoined(true);
    setShowLobby(false);
  }, []);

  const handleJoin = () => {
    if (isOnline) {
      setShowLobby(false);
      // Jitsi will auto-join when showLobby becomes false and JitsiMeet is rendered
    } else {
      setShowLobby(false);
      setHasJoined(true);
    }
  };

  const isProcessing = isUpdatingAppointment || isGeneratingProntuario;

  if (showLobby) {
    return (
      <MobileTeleconsultationLobby
        patientName={activeAppointment.patient_name || 'Paciente'}
        patient={patient}
        appointmentId={appointmentId}
        meetLink={meetLink}
        therapistName={therapistName}
        isLoadingToken={isLoadingToken}
        onJoin={handleJoin}
        onBack={onSessionEnd}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-background z-[100] flex flex-col overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background to-card z-0" />

      <div className="flex-1 relative overflow-hidden z-10">
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
                    onMeetingEnd={handleEndSession}
                    onTranscriptUpdate={handleTranscriptUpdate}
                    onMuteStatusChanged={handleMuteStatusChanged}
                    onConferenceJoined={handleConferenceJoined}
                  />
                ) : jitsiError ? (
                  <div className="h-full flex flex-col items-center justify-center gap-4 px-10 text-center text-rose-500">
                    <AlertCircle className="h-10 w-10 opacity-50" />
                    <p className="text-sm font-medium leading-relaxed">Erro de conexão: {jitsiError.message}</p>
                    <Button variant="outline" onClick={() => window.location.reload()} className="mt-4 border-rose-500/20 text-rose-500">Recarregar</Button>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center gap-4 px-10 text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-xs uppercase font-black tracking-widest text-muted-foreground">Iniciando conexão segura...</p>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center h-full w-full text-foreground/40 gap-6 px-8">
                  <div className="w-24 h-24 bg-foreground/[0.04] rounded-[32px] flex items-center justify-center border border-border/10 shadow-2xl relative">
                    <div className="absolute inset-0 bg-foreground/5 blur-2xl rounded-full" />
                    <NotebookPen className="h-10 w-10 text-foreground/60 relative z-10" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-bold text-foreground tracking-tight">Presencial</h3>
                    <p className="text-xs text-muted-foreground font-light leading-relaxed">
                      Sessão offline. Utilize a aba de anotações para registrar o atendimento e gerar o prontuário.
                    </p>
                  </div>
                </div>
              )}

              {/* Rec Indicator */}
              {hasJoined && jitsiTranscript.length > 0 && (
                <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-background/40 backdrop-blur-xl px-4 py-2 rounded-full border border-border/10 flex items-center gap-2 pointer-events-none z-50">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
                  <span className="text-[10px] font-black tracking-widest text-foreground/90">TRANSCREVENDO</span>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="notes"
              className="absolute inset-0 bg-background p-6 flex flex-col pt-16"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-foreground tracking-tight">Anotações Clínicas</h3>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Sessão: {activeAppointment.patient_name}</p>
                </div>
                <div className="text-[9px] font-black uppercase tracking-widest text-foreground/80 bg-foreground/[0.04] px-3 py-1.5 rounded-full border border-border/10">
                  Sincronizado
                </div>
              </div>

              <Textarea
                placeholder="Comece a digitar os pontos principais da sessão..."
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                className="flex-1 bg-foreground/[0.02] border-border/10 focus:border-border/20 focus:ring-0 resize-none text-base text-foreground/90 p-5 rounded-[24px] placeholder:text-foreground/20 leading-relaxed shadow-inner"
              />

              <div className="h-[200px] bg-background/60 backdrop-blur-xl rounded-[24px] p-5 flex flex-col gap-3 mt-6 border border-border/10 shadow-2xl">
                <div className="flex items-center gap-2 pb-3 border-b border-border/10">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                    Live Context (IA)
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto text-xs text-muted-foreground/80 space-y-3 pr-2 scrollbar-none">
                  {jitsiTranscript.length > 0 ? (
                    jitsiTranscript
                      .slice(-10)
                      .map((line, i) => (
                        <p key={i} className="leading-relaxed pl-3 border-l border-border/10">{line}</p>
                      ))
                  ) : (
                    <div className="flex items-center justify-center h-full text-white/10 text-[10px] uppercase font-black tracking-widest">
                      Aguardando sinal claro...
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Controls Bar */}
      <div className="relative z-[110] px-6 pb-10">
        <div className="bg-card/80 backdrop-blur-3xl border border-border/20 p-3 rounded-[32px] shadow-2xl flex justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="icon"
              className={cn(
                "h-12 w-12 rounded-2xl transition-all border",
                !isAudioEnabled ? "bg-rose-500/10 border-rose-500/20 text-rose-500" : "bg-foreground/[0.04] border-border/10 text-foreground/70"
              )}
              onClick={() => jitsiRef.current?.toggleAudio()}
            >
              {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </Button>

            <Button
              variant="secondary"
              size="icon"
              className={cn(
                "h-12 w-12 rounded-2xl transition-all border",
                !isVideoEnabled ? "bg-rose-500/10 border-rose-500/20 text-rose-500" : "bg-foreground/[0.04] border-border/10 text-foreground/70"
              )}
              onClick={() => jitsiRef.current?.toggleVideo()}
            >
              {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </Button>
          </div>

          <Button
            size="icon"
            className={cn(
              "w-16 h-16 rounded-[28px] bg-rose-500 hover:bg-rose-600 shadow-[0_20px_40px_rgba(244,63,94,0.3)] transition-all active:scale-90 flex items-center justify-center",
              isProcessing && "opacity-50"
            )}
            onClick={handleEndSession}
            disabled={isProcessing}
          >
            {isProcessing ? <Loader2 className="w-6 h-6 animate-spin text-background" /> : <Phone className="w-8 h-8 fill-background text-background" />}
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="icon"
              className={cn(
                "h-12 w-12 rounded-2xl transition-all border",
                view === "notes" ? "bg-foreground text-background border-foreground shadow-lg" : "bg-foreground/[0.04] border-border/10 text-foreground/70"
              )}
              onClick={() => setView(view === "video" ? "notes" : "video")}
            >
              {view === "video" ? <NotebookPen className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </Button>

            <Button
              variant="secondary"
              size="icon"
              className="h-12 w-12 rounded-2xl border border-border/10 bg-foreground/[0.04] text-foreground/70"
              onClick={() => jitsiRef.current?.toggleChat()}
            >
              <MessageSquare className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
