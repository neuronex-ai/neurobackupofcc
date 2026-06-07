import { useAuth } from "@/components/auth/SessionContextProvider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAI } from "@/context/AIContext";
import { useGenerateSessionProntuario } from "@/hooks/use-generate-session-prontuario";
import { useJitsiToken } from "@/hooks/use-jitsi-token";
import { usePatientById } from "@/hooks/use-patient-by-id";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useUpdateAppointment } from "@/hooks/use-update-appointment";
import { cn, getInitials } from "@/lib/utils";
import { Appointment } from "@/types";
import { AlertCircle, Chrome, Loader2, Mic, NotebookPen, Play, Video as VideoIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { InvitePatientModal } from "./InvitePatientModal";
import { JitsiMeet, JitsiRef } from "./JitsiMeet";
import { PreJoinActions } from "./PreJoinActions";
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
    onSessionEnd
}: ActiveSessionPanelProps) => {
    const [sessionNotes, setSessionNotes] = useState("");
    const [transcriptLines, setTranscriptLines] = useState<string[]>([]);
    const [hasJoined, setHasJoined] = useState(false);

    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isChrome, setIsChrome] = useState(true);

    const [isChatOpen, setIsChatOpen] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);

    const jitsiRef = useRef<JitsiRef>(null);

    const { toggleFocusMode, isFocusMode } = useAI();
    const { user } = useAuth();

    const { mutate: updateAppointment, isPending: isUpdatingAppointment } = useUpdateAppointment();
    const { mutate: generateProntuario, isPending: isGeneratingProntuario } = useGenerateSessionProntuario();

    const patientId = activeAppointment.patient_id;
    const { data: patient } = usePatientById(patientId || '');
    const appointmentId = activeAppointment.id;
    const isOnline = activeAppointment.type === 'online';

    const jitsiRoomName = `${JITSI_APP_ID}/${appointmentId}`;

    const {
        data: jitsiToken,
        error: jitsiError,
        isLoading: isLoadingToken
    } = useJitsiToken(jitsiRoomName);

    const effectiveMeetLink = `${window.location.origin}/join/${appointmentId}`;

    // --- BROWSER CHECK ---
    useEffect(() => {
        const isChromium = !!(window as any).chrome;
        setIsChrome(isChromium);
        if (!isChromium) {
            toast.warning("Recomendamos usar Google Chrome para transcrição em tempo real.", {
                duration: 10000,
            });
        }
    }, []);

    // --- PERSISTENCE LOGIC ---
    useEffect(() => {
        // Load from local storage on mount
        const savedTranscript = localStorage.getItem(`transcript_${appointmentId}`);
        const savedNotes = localStorage.getItem(`notes_${appointmentId}`);

        if (savedTranscript) {
            try {
                setTranscriptLines(JSON.parse(savedTranscript));
                toast.success("Histórico da sessão recuperado.");
            } catch (e) { console.error("Error parsing saved transcript"); }
        }
        if (savedNotes) setSessionNotes(savedNotes);
    }, [appointmentId]);

    useEffect(() => {
        // Save to local storage on change
        if (hasJoined) {
            localStorage.setItem(`transcript_${appointmentId}`, JSON.stringify(transcriptLines));
        }
    }, [transcriptLines, appointmentId, hasJoined]);

    useEffect(() => {
        if (hasJoined) {
            localStorage.setItem(`notes_${appointmentId}`, sessionNotes);
        }
    }, [sessionNotes, appointmentId, hasJoined]);

    // --- CLEANUP ---
    const clearLocalData = () => {
        localStorage.removeItem(`transcript_${appointmentId}`);
        localStorage.removeItem(`notes_${appointmentId}`);
    };

    const getTherapistInfo = () => {
        if (!user) return { name: 'Terapeuta', avatar: '' };
        const meta = user.user_metadata;
        return {
            name: meta?.full_name || user.email?.split('@')[0] || 'Terapeuta',
            avatar: meta?.avatar_url || ''
        };
    };

    const { name: therapistName, avatar: therapistAvatar } = getTherapistInfo();

    const handleLocalSpeechResult = useCallback((text: string) => {
        setTranscriptLines(prev => [...prev, `Você: ${text}`]);
    }, []);

    const {
        startListening: startTranscription,
        stopListening: stopTranscription,
    } = useSpeechRecognition({ onResult: handleLocalSpeechResult });

    const handleJoinSession = () => {
        setHasJoined(true);
        // Only start transcription if supported
        if ((window as any).webkitSpeechRecognition) {
            setTimeout(() => {
                startTranscription();
            }, 1000);
        }
    };

    const handleEndSession = useCallback(() => {
        if (isGeneratingProntuario) return;
        stopTranscription();
        toast.info("Finalizando e gerando resumo IA...");

        const fullTranscript = transcriptLines.join('\n');

        generateProntuario({
            patientId: patientId || '',
            appointmentId,
            notes: sessionNotes,
            chatHistory: fullTranscript,
        }, {
            onSuccess: () => {
                updateAppointment({ id: appointmentId, updates: { status: 'attended' } }, {
                    onSuccess: () => {
                        if (isFocusMode) toggleFocusMode();
                        toast.success("Sessão salva com sucesso!");
                        clearLocalData(); // Clear backup
                        onSessionEnd();
                    },
                });
            },
            onError: () => {
                // Fallback: Just mark as completed if AI fails, but don't lose data
                updateAppointment({ id: appointmentId, updates: { status: 'attended' } }, {
                    onSuccess: () => {
                        if (isFocusMode) toggleFocusMode();
                        toast.warning("Sessão salva, mas IA indisponível. Dados mantidos.");
                        // We DON'T clear local data on error so user can recover manually if needed
                        onSessionEnd();
                    },
                });
            }
        });
    }, [isGeneratingProntuario, transcriptLines, sessionNotes, patientId, appointmentId, updateAppointment, generateProntuario, onSessionEnd, isFocusMode, toggleFocusMode, stopTranscription]);

    const handleJitsiTranscriptUpdate = useCallback((entry: { participant: { name: string }, text: string }) => {
        const myName = therapistName;
        if (entry.participant.name !== myName && entry.participant.name !== 'Eu') {
            setTranscriptLines(prev => [...prev, `${entry.participant.name}: ${entry.text}`]);
        }
    }, [therapistName]);

    const toggleAudio = useCallback(() => {
        jitsiRef.current?.toggleAudio();
        setIsAudioEnabled(prev => !prev);
    }, []);

    const toggleVideo = useCallback(() => {
        jitsiRef.current?.toggleVideo();
        setIsVideoEnabled(prev => !prev);
    }, []);

    const toggleScreenShare = useCallback(() => {
        jitsiRef.current?.toggleScreenShare();
        setIsScreenSharing(prev => !prev);
    }, []);

    const renderLobby = () => (
        <div className="desktop-apple-shell relative flex h-full w-full items-center justify-center overflow-hidden rounded-[30px]">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none" />
            <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-emerald-500/[0.03] blur-[150px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-500/[0.03] blur-[120px] rounded-full pointer-events-none" />

            {/* Main Content */}
            <div className="z-10 flex flex-col lg:flex-row items-center gap-16 max-w-3xl w-full px-12 animate-fade-up">

                {/* Left: Session Details */}
                <div className="flex-1 space-y-8">
                    {!isChrome && (
                        <Alert className="bg-amber-500/10 border-amber-500/20 text-amber-500 rounded-2xl">
                            <Chrome className="h-4 w-4" />
                            <AlertTitle className="font-bold">Navegador não recomendado</AlertTitle>
                            <AlertDescription className="text-xs opacity-90">
                                A transcrição automática funciona melhor no Google Chrome.
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-600 dark:text-zinc-400">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Sala Pronta
                        </div>
                        <h2 className="text-4xl font-bold text-foreground tracking-tight leading-[1.1]">
                            Sessão com<br />
                            <span className="text-foreground/70">{patientName}</span>
                        </h2>
                        <p className="text-sm text-muted-foreground font-light max-w-xs leading-relaxed">
                            Ambiente seguro com criptografia ponta-a-ponta e transcrição inteligente.
                        </p>
                    </div>

                    {/* Device Status */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/50 dark:bg-black/20 border border-black/5 dark:border-white/5 backdrop-blur-md">
                            <Mic className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Microfone</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/50 dark:bg-black/20 border border-black/5 dark:border-white/5 backdrop-blur-md">
                            <VideoIcon className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Cmera</span>
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="flex items-center gap-4 pt-2">
                        {isLoadingToken ? (
                            <Button disabled className="h-14 px-10 rounded-2xl bg-foreground/[0.04] text-muted-foreground border border-border/10">
                                <Loader2 className="w-5 h-5 mr-3 animate-spin" />Preparando Sala...
                            </Button>
                        ) : (
                            <Button onClick={handleJoinSession} className="h-14 px-10 rounded-2xl bg-foreground text-background hover:bg-foreground/90 font-bold text-xs uppercase tracking-[0.2em] shadow-2xl shadow-foreground/10 transition-all hover:scale-[1.02] active:scale-95">
                                <Play className="w-5 h-5 mr-3 fill-current" /> Iniciar Sessão
                            </Button>
                        )}
                    </div>

                    <PreJoinActions
                        appointmentId={appointmentId}
                        patient={patient}
                        meetLink={effectiveMeetLink}
                        therapistName={therapistName}
                    />
                </div>

                {/* Right: Patient Avatar Card */}
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-foreground/[0.03] blur-[60px] rounded-full scale-125 pointer-events-none" />
                        <div className="relative w-44 h-44 rounded-[40px] border-[3px] border-white/20 dark:border-white/10 ring-1 ring-black/5 dark:ring-white/5 shadow-2xl p-1.5 bg-white/20 dark:bg-white/5 backdrop-blur-2xl">
                            <Avatar className="w-full h-full rounded-[34px]">
                                <AvatarFallback className="bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-5xl font-light rounded-[34px]">
                                    {getInitials(patientName)}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 border-4 border-white dark:border-[#0A0A0C] rounded-full shadow-lg shadow-emerald-500/20" />
                    </div>
                    <div className="text-center space-y-1">
                        <p className="text-sm font-bold text-foreground tracking-tight">{patientName}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                            {isOnline ? 'Teleconsulta' : 'Presencial'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderVideoArea = () => {
        if (!isOnline) {
            return (
                <div className="flex flex-col items-center justify-center h-full w-full bg-white/40 dark:bg-[#050505]/40 backdrop-blur-[60px] relative overflow-hidden">
                    {/* Background Effects */}
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/[0.03] blur-[150px] rounded-full pointer-events-none" />

                    <div className="z-10 flex flex-col items-center gap-8 animate-fade-up">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-emerald-500/10 dark:bg-emerald-500/5 blur-3xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                            <div className="w-40 h-40 bg-zinc-900/5 dark:bg-white/5 backdrop-blur-2xl rounded-[40px] border border-zinc-900/10 dark:border-white/10 flex items-center justify-center shadow-xl relative z-10 transition-transform duration-500 hover:scale-[1.02]">
                                <NotebookPen className="h-14 w-14 text-zinc-900 dark:text-white opacity-80" />
                            </div>
                            <div className="absolute -bottom-3 -right-3">
                                <span className="relative flex h-8 w-8">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-8 w-8 bg-emerald-500 border-4 border-white dark:border-black items-center justify-center shadow-lg">
                                        <Mic className="w-3 h-3 text-white fill-current" />
                                    </span>
                                </span>
                            </div>
                        </div>

                        <div className="text-center space-y-3 relative z-10">
                            <h3 className="text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">Sessão Presencial</h3>
                            <p className="text-base text-zinc-500 dark:text-zinc-400 font-light max-w-sm mx-auto leading-relaxed">
                                A sessão está acontecendo no consultório físico. A transcrição inteligente permanece ativa.
                            </p>
                        </div>

                        <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Transcrição e Análise em Tempo Real</span>
                        </div>
                    </div>
                </div>
            );
        }
        if (!hasJoined) return renderLobby();
        if (jitsiError) return <div className="flex flex-col items-center justify-center h-full text-rose-500 gap-4 bg-card rounded-[24px] border border-rose-500/20"><AlertCircle className="h-10 w-10" /><p className="font-bold">Falha na autenticação da sala</p></div>;
        if (jitsiToken) return <JitsiMeet ref={jitsiRef} roomName={jitsiRoomName} jwt={jitsiToken} userName={therapistName} userEmail={user?.email} userAvatarUrl={therapistAvatar} subject={patientName || 'Consulta'} onMeetingEnd={handleEndSession} onTranscriptUpdate={handleJitsiTranscriptUpdate} />;
        return null;
    };

    const isProcessing = isUpdatingAppointment || isGeneratingProntuario;

    return (
        <>
            <div className="desktop-page-canvas fixed inset-0 z-[100] flex flex-col overflow-hidden">
                <div className="flex-1 flex w-full h-full p-6 gap-6">
                    <div className={cn("relative transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col h-full", isFocusMode ? "w-full" : "flex-1")}>
                        <div className="desktop-apple-shell relative flex-1 overflow-hidden rounded-[30px]">
                            {renderVideoArea()}
                            <RiskAlert riskScore={patient?.risk_score || 0} />

                            {/* Saving Indicator */}
                            {transcriptLines.length > 0 && hasJoined && (
                                <div className="absolute top-6 right-6 z-20 flex items-center gap-2.5 bg-background/40 backdrop-blur-xl px-4 py-2 rounded-full border border-border/10 text-[10px] font-bold uppercase tracking-widest text-emerald-500 shadow-2xl">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
                                    Gravando
                                </div>
                            )}
                        </div>

                        {hasJoined && (
                            <div className="absolute bottom-6 left-0 right-0 z-40 animate-in slide-in-from-bottom-10 fade-in duration-700 pointer-events-none">
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
                                    onToggleChat={() => setIsChatOpen(prev => !prev)}
                                    isChatOpen={isChatOpen}
                                    onOpenInvite={() => setShowInviteModal(true)}
                                />
                            </div>
                        )}

                        {hasJoined && isOnline && user && (
                            <SessionChat
                                isOpen={isChatOpen}
                                onClose={() => setIsChatOpen(false)}
                                appointmentId={appointmentId}
                                currentUserId={user.id}
                                currentUserName={therapistName}
                            />
                        )}
                    </div>

                    <div className={cn("w-[400px] xl:w-[440px] 2xl:w-[480px] flex flex-col gap-6 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]", isFocusMode ? "translate-x-[110%] w-0 absolute right-0 opacity-0" : "opacity-100")}>
                        {patientId && <WorkspaceTabs patientId={patientId} patientName={patientName} />}
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
