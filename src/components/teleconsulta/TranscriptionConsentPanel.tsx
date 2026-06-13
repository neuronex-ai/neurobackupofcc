import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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

const consentOptions: Array<{ value: SessionTranscriptConsentMethod; label: string }> = [
  { value: 'verbal', label: 'Consentimento verbal' },
  { value: 'written', label: 'Consentimento escrito' },
  { value: 'digital', label: 'Consentimento digital' },
];

export const TranscriptionConsentPanel = ({
  patientName,
  compact = false,
  isPending = false,
  onGrant,
  onDecline,
}: TranscriptionConsentPanelProps) => {
  const [method, setMethod] = useState<SessionTranscriptConsentMethod>('verbal');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState<'grant' | 'decline' | null>(null);

  const submitGrant = async () => {
    setSubmitting('grant');
    try {
      await onGrant(method, notes.trim() || undefined);
    } finally {
      setSubmitting(null);
    }
  };

  const submitDecline = async () => {
    setSubmitting('decline');
    try {
      await onDecline(notes.trim() || undefined);
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <section
      className={compact
        ? 'rounded-[26px] border border-border/45 bg-card/95 p-5 shadow-2xl backdrop-blur-2xl dark:border-white/10'
        : 'rounded-[32px] border border-border/45 bg-card/95 p-6 shadow-2xl backdrop-blur-2xl dark:border-white/10'}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.19em] text-muted-foreground">Consentimento clínico</p>
          <h2 className="mt-1 text-lg font-black tracking-[-0.035em] text-foreground">Autorizar transcrição da sessão</h2>
          <p className="mt-2 text-xs font-medium leading-relaxed text-muted-foreground">
            Registre a decisão de {patientName}. A sessão continua normalmente quando não houver autorização.
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        {consentOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setMethod(option.value)}
            className={`min-h-11 rounded-2xl border px-3 text-left text-[10px] font-black uppercase tracking-[0.1em] transition ${
              method === option.value
                ? 'border-foreground bg-foreground text-background'
                : 'border-border/45 bg-background/55 text-muted-foreground dark:border-white/10'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <Textarea
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder="Observação opcional sobre o consentimento"
        className="mt-3 min-h-20 resize-none rounded-2xl border-border/45 bg-background/60 text-xs dark:border-white/10"
      />

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Button
          type="button"
          disabled={isPending || submitting !== null}
          onClick={submitGrant}
          className="h-12 rounded-2xl bg-foreground text-[9px] font-black uppercase tracking-[0.16em] text-background"
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Confirmar autorização
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isPending || submitting !== null}
          onClick={submitDecline}
          className="h-12 rounded-2xl border-border/50 text-[9px] font-black uppercase tracking-[0.14em] dark:border-white/10"
        >
          <MicOff className="mr-2 h-4 w-4" />
          Continuar sem transcrição
        </Button>
      </div>
    </section>
  );
};
