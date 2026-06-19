import { Button } from '@/components/ui/button';
import type { SessionTranscriptConsentMethod } from '@/hooks/use-jitsi-token';
import { CheckCircle2, MicOff, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

interface TranscriptionConsentPanelProps {
  patientName: string;
  compact?: boolean;
  isPending?: boolean;
  onGrant: (method: SessionTranscriptConsentMethod, notes?: string) => Promise<void> | void;
  onDecline: (notes?: string) => Promise<void> | void;
}

export const TranscriptionConsentPanel = ({
  patientName,
  compact = false,
  isPending = false,
  onGrant,
  onDecline,
}: TranscriptionConsentPanelProps) => {
  const [submitting, setSubmitting] = useState<'grant' | 'decline' | null>(null);

  const submitGrant = async () => {
    setSubmitting('grant');
    try {
      await onGrant('digital', 'Transcrição autorizada pelo profissional no início da teleconsulta.');
    } finally {
      setSubmitting(null);
    }
  };

  const submitDecline = async () => {
    setSubmitting('decline');
    try {
      await onDecline('Profissional optou por conduzir a sessão sem transcrição.');
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <section
      className={
        compact
          ? 'rounded-[26px] border border-border/45 bg-card/95 p-5 text-center shadow-2xl backdrop-blur-2xl dark:border-white/10'
          : 'rounded-[30px] border border-border/45 bg-card/95 p-6 text-center shadow-2xl backdrop-blur-2xl dark:border-white/10 sm:p-8'
      }
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 shadow-[0_18px_45px_-30px_rgba(16,185,129,0.8)] dark:text-emerald-300">
        <ShieldCheck className="h-6 w-6" />
      </div>

      <p className="mt-5 text-[9px] font-black uppercase tracking-[0.22em] text-muted-foreground">
        Consentimento clínico
      </p>
      <h2 className="mx-auto mt-2 max-w-lg text-2xl font-black tracking-[-0.045em] text-foreground sm:text-3xl">
        Transcrever teleconsulta?
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-sm font-medium leading-relaxed text-muted-foreground">
        Registre a decisão antes de capturar qualquer áudio. Se a transcrição for ativada, {patientName} será informado antes de entrar na sala.
      </p>

      <div className="mx-auto mt-6 grid max-w-xl gap-3 sm:grid-cols-2">
        <Button
          type="button"
          disabled={isPending || submitting !== null}
          onClick={submitDecline}
          variant="outline"
          className="h-12 rounded-2xl border-border/50 text-[10px] font-black uppercase tracking-[0.14em] dark:border-white/10"
        >
          <MicOff className="mr-2 h-4 w-4" />
          Não transcrever
        </Button>
        <Button
          type="button"
          disabled={isPending || submitting !== null}
          onClick={submitGrant}
          className="h-12 rounded-2xl bg-foreground text-[10px] font-black uppercase tracking-[0.14em] text-background"
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Transcrever teleconsulta
        </Button>
      </div>

      <p className="mx-auto mt-5 max-w-lg text-[11px] font-semibold leading-relaxed text-muted-foreground/75">
        A sessão continua normalmente se a transcrição não for ativada.
      </p>
    </section>
  );
};
