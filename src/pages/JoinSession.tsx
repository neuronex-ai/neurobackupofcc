import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { JitsiMeet, JitsiRef } from '@/components/teleconsulta/JitsiMeet';
import { useJitsiToken } from '@/hooks/use-jitsi-token';
import { Loader2, Video, AlertCircle, Mic, MicOff, VideoIcon, VideoOff, Monitor, MessageSquare, PhoneOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const JITSI_APP_ID = "vpaas-magic-cookie-dc267e44c7014498a3a128625367fc67";

const JoinSession = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const [guestName, setGuestName] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  // Control states
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const jitsiRef = useRef<JitsiRef>(null);

  const jitsiRoomName = `${JITSI_APP_ID}/${appointmentId}`;

  const { data: jitsiToken, isLoading, error, refetch } = useJitsiToken(jitsiRoomName, {
    enabled: false,
    retry: 1,
    guestName // Pass the guest name state
  });

  const handleJoin = () => {
    if (guestName.trim()) {
      setIsJoining(true);
      toast.loading("Conectando à sala...");
      refetch();
    } else {
      toast.error("Por favor, insira seu nome para entrar.");
    }
  };

  useEffect(() => {
    if (jitsiToken) {
      toast.dismiss();
      toast.success("Conectado! Entrando na sessão.");
    }
    if (error) {
      toast.dismiss();
      toast.error("Não foi possível entrar na sala. Verifique o link ou tente novamente.");
      setIsJoining(false);
    }
  }, [jitsiToken, error]);

  const handleMeetingEnd = () => {
    toast.info("Sessão encerrada.");
    navigate('/');
  };

  const handleToggleAudio = () => {
    jitsiRef.current?.toggleAudio();
    setIsMuted(!isMuted);
  };

  const handleToggleVideo = () => {
    jitsiRef.current?.toggleVideo();
    setIsVideoOff(!isVideoOff);
  };

  const handleToggleScreenShare = () => {
    jitsiRef.current?.toggleScreenShare();
    setIsScreenSharing(!isScreenSharing);
  };

  const handleToggleChat = () => {
    jitsiRef.current?.toggleChat();
  };

  const handleLeave = () => {
    jitsiRef.current?.executeCommand('hangup');
    handleMeetingEnd();
  };

  if (isJoining && jitsiToken) {
    return (
      <div className="w-full h-screen bg-background relative">
        {/* Jitsi Video */}
        <JitsiMeet
          ref={jitsiRef}
          roomName={jitsiRoomName}
          jwt={jitsiToken}
          userName={guestName}
          onMeetingEnd={handleMeetingEnd}
        />

        {/* Patient Control Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
          <div className="flex items-center justify-center gap-3">
            {/* Microphone Toggle */}
            <Button
              onClick={handleToggleAudio}
              variant="outline"
              size="icon"
              className={cn(
                "h-12 w-12 rounded-full border-2 transition-all",
                isMuted
                  ? "bg-red-500/20 border-red-500 text-red-400 hover:bg-red-500/30"
                  : "bg-white/10 border-white/20 text-white hover:bg-white/20"
              )}
              title={isMuted ? "Ativar microfone" : "Desativar microfone"}
            >
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>

            {/* Camera Toggle */}
            <Button
              onClick={handleToggleVideo}
              variant="outline"
              size="icon"
              className={cn(
                "h-12 w-12 rounded-full border-2 transition-all",
                isVideoOff
                  ? "bg-red-500/20 border-red-500 text-red-400 hover:bg-red-500/30"
                  : "bg-white/10 border-white/20 text-white hover:bg-white/20"
              )}
              title={isVideoOff ? "Ativar cmera" : "Desativar cmera"}
            >
              {isVideoOff ? <VideoOff className="h-5 w-5" /> : <VideoIcon className="h-5 w-5" />}
            </Button>

            {/* Screen Share Toggle */}
            <Button
              onClick={handleToggleScreenShare}
              variant="outline"
              size="icon"
              className={cn(
                "h-12 w-12 rounded-full border-2 transition-all",
                isScreenSharing
                  ? "bg-primary/20 border-primary text-primary hover:bg-primary/30"
                  : "bg-white/10 border-white/20 text-white hover:bg-white/20"
              )}
              title={isScreenSharing ? "Parar compartilhamento" : "Compartilhar tela"}
            >
              <Monitor className="h-5 w-5" />
            </Button>

            {/* Chat Toggle */}
            <Button
              onClick={handleToggleChat}
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full border-2 bg-white/10 border-white/20 text-white hover:bg-white/20 transition-all"
              title="Abrir chat"
            >
              <MessageSquare className="h-5 w-5" />
            </Button>

            {/* Leave Call */}
            <Button
              onClick={handleLeave}
              variant="destructive"
              size="icon"
              className="h-12 w-12 rounded-full bg-red-600 hover:bg-red-500 text-white border-0 ml-4"
              title="Sair da sessão"
            >
              <PhoneOff className="h-5 w-5" />
            </Button>
          </div>

          {/* Control Labels */}
          <div className="flex items-center justify-center gap-3 mt-2 text-[10px] text-white/50 font-medium uppercase tracking-wider">
            <span className="w-12 text-center">Mic</span>
            <span className="w-12 text-center">Cmera</span>
            <span className="w-12 text-center">Tela</span>
            <span className="w-12 text-center">Chat</span>
            <span className="w-12 text-center ml-4">Sair</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border/10 rounded-2xl p-8 space-y-6 text-center shadow-2xl animate-fade-in relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />

        <Video className="w-12 h-12 mx-auto text-primary" />
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Entrar na Sessão</h1>
        <p className="text-muted-foreground">
          Você foi convidado para uma teleconsulta. Por favor, insira seu nome para participar.
        </p>

        {isJoining && isLoading ? (
          <div className="flex flex-col items-center justify-center gap-4 pt-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Verificando acesso...</p>
          </div>
        ) : (
          <div className="space-y-4 pt-4">
            <Input
              type="text"
              placeholder="Seu nome completo"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              className="h-12 bg-secondary/20 border-border/10 text-foreground text-center text-base focus:bg-secondary/10 hover:bg-secondary/10 transition-colors placeholder:text-muted-foreground/50"
            />
            <Button onClick={handleJoin} disabled={!guestName.trim() || isJoining} className="w-full h-12 text-sm font-bold uppercase tracking-wider shadow-lg shadow-primary/10">
              {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : "Entrar na Sala"}
            </Button>
          </div>
        )}
        {error && !isJoining && (
          <div className="flex items-center gap-2 text-rose-500 text-sm p-3 bg-rose-500/10 rounded-lg border border-rose-500/10">
            <AlertCircle className="w-4 h-4" />
            <span>Falha ao conectar. Tente novamente.</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinSession;