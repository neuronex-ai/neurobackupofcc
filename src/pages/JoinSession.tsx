import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MessageSquare,
  Mic,
  MicOff,
  Monitor,
  PhoneOff,
  ShieldCheck,
  Video,
  VideoIcon,
  VideoOff,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { JitsiMeet, JitsiRef } from '@/components/teleconsulta/JitsiMeet';
import { useJitsiToken } from '@/hooks/use-jitsi-token';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SessionJoinInfo {
  transcriptionEnabled: boolean;
  noticeText: string | null;
  noticeVersion: string | null;
}

const JITSI_APP_ID = 'vpaas-magic-cookie-dc267e44c7014498a3a128625367fc67';
const TRANSCRIPTION_NOTICE =
  'Esta teleconsulta será transcrita pela plataforma NeuroNex AI para apoiar a elaboração do registro clínico. Você pode solicitar ao seu psicólogo acesso às informações pertinentes, correção e avaliação de eliminação quando aplicável, observadas as obrigações legais, éticas e de guarda do prontuário/registro documental.';

const buildJoinInfoFromMetadata = (metadata: unknown): SessionJoinInfo => {
  const source = metadata && typeof metadata === 'object' ? metadata as Record<string, any> : {};
  const transcription = source.teleconsultationTranscription && typeof source.teleconsultationTranscription === 'object'
    ? source.teleconsultationTranscription as Record<string, any>
    : {};
  const enabled = transcription.enabled === true;

  return {
    transcriptionEnabled: enabled,
    noticeText: enabled ? TRANSCRIPTION_NOTICE : null,
    noticeVersion: enabled ? transcription.noticeVersion || '2026-06-teleconsultation-transcription-v1' : null,
  };
};

const JoinSession = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const [guestName, setGuestName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinInfo, setJoinInfo] = useState<SessionJoinInfo | null>(null);
  const [isLoadingJoinInfo, setIsLoadingJoinInfo] = useState(true);
  const [joinInfoWarning, setJoinInfoWarning] = useState<string | null>(null);
  const [noticeAccepted, setNoticeAccepted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const jitsiRef = useRef<JitsiRef>(null);

  const jitsiRoomName = `${JITSI_APP_ID}/${appointmentId}`;
  const { data: jitsiToken, isLoading, error, refetch } = useJitsiToken(jitsiRoomName, {
    enabled: false,
    retry: 1,
    guestName,
  });

  const loadJoinInfo = useCallback(async () => {
    if (!appointmentId) return buildJoinInfoFromMetadata(null);
    setIsLoadingJoinInfo(true);
    setJoinInfoWarning(null);

    try {
      try {
        const { data, error: invokeError } = await supabase.functions.invoke<SessionJoinInfo>('get-session-join-info', {
          body: { appointmentId },
        });
        if (invokeError) throw new Error(invokeError.message);
        if (!data) throw new Error('Resposta vazia da validação de entrada.');
        setJoinInfo(data);
        if (!data.transcriptionEnabled) setNoticeAccepted(false);
        return data;
      } catch {
        const { data, error: fallbackError } = await supabase.functions.invoke<{ appointment?: { metadata?: unknown } }>('get-appointment-by-token', {
          body: { token: appointmentId },
        });
        if (fallbackError) throw new Error(fallbackError.message);
        const fallbackInfo = buildJoinInfoFromMetadata(data?.appointment?.metadata);
        setJoinInfo(fallbackInfo);
        if (!fallbackInfo.transcriptionEnabled) setNoticeAccepted(false);
        return fallbackInfo;
      }
    } catch {
      const safeFallback = buildJoinInfoFromMetadata(null);
      setJoinInfo(safeFallback);
      setJoinInfoWarning('Não foi possível validar o aviso de transcrição agora. A entrada na sala foi liberada para não interromper a sessão.');
      return safeFallback;
    } finally {
      setIsLoadingJoinInfo(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    void loadJoinInfo();
    const interval = window.setInterval(() => void loadJoinInfo(), 10000);
    return () => window.clearInterval(interval);
  }, [loadJoinInfo]);

  const handleJoin = async () => {
    if (!guestName.trim()) {
      toast.error('Por favor, insira seu nome para entrar.');
      return;
    }

    const latestJoinInfo = await loadJoinInfo();
    if (latestJoinInfo.transcriptionEnabled && !noticeAccepted) {
      toast.error('Leia e confirme ciência do aviso de transcrição antes de entrar.');
      return;
    }

    setIsJoining(true);
    toast.loading('Conectando à sala...');
    refetch();
  };

  useEffect(() => {
    if (jitsiToken) {
      toast.dismiss();
      toast.success('Conectado! Entrando na sessão.');
    }
    if (error) {
      toast.dismiss();
      toast.error('Não foi possível entrar na sala. Verifique o link ou tente novamente.');
      setIsJoining(false);
    }
  }, [jitsiToken, error]);

  const handleMeetingEnd = () => {
    toast.info('Sessão encerrada.');
    navigate('/');
  };

  const handleLeave = () => {
    jitsiRef.current?.executeCommand('hangup');
    handleMeetingEnd();
  };

  if (isJoining && jitsiToken) {
    return (
      <div className="relative h-screen w-full bg-background">
        <JitsiMeet
          ref={jitsiRef}
          roomName={jitsiRoomName}
          jwt={jitsiToken}
          userName={guestName}
          onMeetingEnd={handleMeetingEnd}
        />

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4">
          <div className="flex items-center justify-center gap-3">
            <Button
              onClick={() => {
                jitsiRef.current?.toggleAudio();
                setIsMuted((current) => !current);
              }}
              variant="outline"
              size="icon"
              className={cn(
                'h-12 w-12 rounded-full border-2 transition-all',
                isMuted
                  ? 'border-red-500 bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  : 'border-white/20 bg-white/10 text-white hover:bg-white/20',
              )}
              title={isMuted ? 'Ativar microfone' : 'Desativar microfone'}
            >
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>

            <Button
              onClick={() => {
                jitsiRef.current?.toggleVideo();
                setIsVideoOff((current) => !current);
              }}
              variant="outline"
              size="icon"
              className={cn(
                'h-12 w-12 rounded-full border-2 transition-all',
                isVideoOff
                  ? 'border-red-500 bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  : 'border-white/20 bg-white/10 text-white hover:bg-white/20',
              )}
              title={isVideoOff ? 'Ativar câmera' : 'Desativar câmera'}
            >
              {isVideoOff ? <VideoOff className="h-5 w-5" /> : <VideoIcon className="h-5 w-5" />}
            </Button>

            <Button
              onClick={() => {
                jitsiRef.current?.toggleScreenShare();
                setIsScreenSharing((current) => !current);
              }}
              variant="outline"
              size="icon"
              className={cn(
                'h-12 w-12 rounded-full border-2 transition-all',
                isScreenSharing
                  ? 'border-primary bg-primary/20 text-primary hover:bg-primary/30'
                  : 'border-white/20 bg-white/10 text-white hover:bg-white/20',
              )}
              title={isScreenSharing ? 'Parar compartilhamento' : 'Compartilhar tela'}
            >
              <Monitor className="h-5 w-5" />
            </Button>

            <Button
              onClick={() => jitsiRef.current?.toggleChat()}
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full border-2 border-white/20 bg-white/10 text-white transition-all hover:bg-white/20"
              title="Abrir chat"
            >
              <MessageSquare className="h-5 w-5" />
            </Button>

            <Button
              onClick={handleLeave}
              variant="destructive"
              size="icon"
              className="ml-4 h-12 w-12 rounded-full border-0 bg-red-600 text-white hover:bg-red-500"
              title="Sair da sessão"
            >
              <PhoneOff className="h-5 w-5" />
            </Button>
          </div>

          <div className="mt-2 flex items-center justify-center gap-3 text-[10px] font-medium uppercase tracking-wider text-white/50">
            <span className="w-12 text-center">Mic</span>
            <span className="w-12 text-center">Câmera</span>
            <span className="w-12 text-center">Tela</span>
            <span className="w-12 text-center">Chat</span>
            <span className="ml-4 w-12 text-center">Sair</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4 text-foreground">
      <div className="relative w-full max-w-md animate-fade-in space-y-6 overflow-hidden rounded-2xl border border-border/10 bg-card p-8 text-center shadow-2xl">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />

        <Video className="mx-auto h-12 w-12 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Entrar na Sessão</h1>
        <p className="text-muted-foreground">
          Você foi convidado para uma teleconsulta. Por favor, insira seu nome para participar.
        </p>

        {isLoadingJoinInfo ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-border/20 bg-secondary/20 px-4 py-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Validando dados da sessão...
          </div>
        ) : null}

        {joinInfo?.transcriptionEnabled ? (
          <div className="space-y-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-left">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-300" />
              <div>
                <p className="text-sm font-bold text-foreground">Aviso de transcrição</p>
                <p className="mt-2 text-xs font-medium leading-relaxed text-muted-foreground">
                  {joinInfo.noticeText}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant={noticeAccepted ? 'default' : 'outline'}
              onClick={() => setNoticeAccepted(true)}
              className="h-11 w-full rounded-xl text-[10px] font-bold uppercase tracking-wider"
            >
              {noticeAccepted ? <CheckCircle2 className="mr-2 h-4 w-4" /> : null}
              {noticeAccepted ? 'Aviso confirmado' : 'Li e entendi'}
            </Button>
          </div>
        ) : null}

        {joinInfoWarning ? (
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/10 bg-amber-500/10 p-3 text-left text-xs font-medium text-amber-700 dark:text-amber-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{joinInfoWarning}</span>
          </div>
        ) : null}

        {isJoining && isLoading ? (
          <div className="flex flex-col items-center justify-center gap-4 pt-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Verificando acesso...</p>
          </div>
        ) : (
          <div className="space-y-4 pt-4">
            <Input
              type="text"
              placeholder="Seu nome completo"
              value={guestName}
              onChange={(event) => setGuestName(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && handleJoin()}
              className="h-12 border-border/10 bg-secondary/20 text-center text-base text-foreground transition-colors placeholder:text-muted-foreground/50 hover:bg-secondary/10 focus:bg-secondary/10"
            />
            <Button
              onClick={handleJoin}
              disabled={!guestName.trim() || isJoining || isLoadingJoinInfo || (joinInfo?.transcriptionEnabled && !noticeAccepted)}
              className="h-12 w-full text-sm font-bold uppercase tracking-wider shadow-lg shadow-primary/10"
            >
              {isJoining ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Entrar na Sala'}
            </Button>
          </div>
        )}

        {error && !isJoining ? (
          <div className="flex items-center gap-2 rounded-lg border border-rose-500/10 bg-rose-500/10 p-3 text-sm text-rose-500">
            <AlertCircle className="h-4 w-4" />
            <span>Falha ao conectar. Tente novamente.</span>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default JoinSession;
