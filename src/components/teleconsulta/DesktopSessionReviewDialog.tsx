import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  FileText,
  Loader2,
  NotebookPen,
  Sparkles,
  WifiOff,
} from 'lucide-react';
import { useEffect, useState } from 'react';

type CompletionMode = 'idle' | 'generating' | 'saving';

interface DesktopSessionReviewDialogProps {
  open: boolean;
  patientName: string;
  transcript: string;
  notes: string;
  segmentsCount: number;
  hasNetwork: boolean;
  canGenerate: boolean;
  isProcessing: boolean;
  completionMode: CompletionMode;
  error?: string | null;
  onTranscriptChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onGenerate: () => void;
  onPreserve: () => void;
}

export const DesktopSessionReviewDialog = ({
  open,
  patientName,
  transcript,
  notes,
  segmentsCount,
  hasNetwork,
  canGenerate,
  isProcessing,
  completionMode,
  error,
  onTranscriptChange,
  onNotesChange,
  onGenerate,
  onPreserve,
}: DesktopSessionReviewDialogProps) => {
  const [reviewConfirmed, setReviewConfirmed] = useState(false);

  useEffect(() => {
    if (open) setReviewConfirmed(false);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={() => undefined}>
      <DialogContent
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
        className="max-h-[92vh] w-[min(1180px,94vw)] max-w-none overflow-hidden rounded-[34px] border-border/45 bg-background/96 p-0 shadow-2xl backdrop-blur-3xl dark:border-white/10"
      >
        <DialogHeader className="border-b border-border/35 px-7 py-6 dark:border-white/10">
          <div className="flex items-start justify-between gap-6 text-left">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Revisão profissional obrigatória</p>
              <DialogTitle className="mt-2 text-3xl font-black tracking-[-0.05em]">Concluir sessão com {patientName}</DialogTitle>
              <DialogDescription className="mt-2 max-w-3xl leading-relaxed">
                Corrija os trechos e as anotações antes de gerar qualquer rascunho clínico. O conteúdo bruto não é enviado automaticamente ao prontuário.
              </DialogDescription>
            </div>
            <div className="grid shrink-0 grid-cols-2 gap-2">
              <div className="rounded-2xl bg-muted/55 px-4 py-3 text-center">
                <p className="text-[8px] font-black uppercase tracking-[0.13em] text-muted-foreground">Trechos</p>
                <p className="mt-1 text-xl font-black">{segmentsCount}</p>
              </div>
              <div className="rounded-2xl bg-muted/55 px-4 py-3 text-center">
                <p className="text-[8px] font-black uppercase tracking-[0.13em] text-muted-foreground">Notas</p>
                <p className="mt-1 text-xl font-black">{notes.trim().length}</p>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 grid-cols-2 gap-5 overflow-hidden px-7 py-5">
          <section className="flex min-h-[440px] flex-col rounded-[26px] border border-border/40 bg-card/70 p-4 dark:border-white/10">
            <div className="flex items-center gap-2 px-1 pb-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-[9px] font-black uppercase tracking-[0.17em] text-muted-foreground">Transcrição revisável</span>
            </div>
            <Textarea
              value={transcript}
              onChange={(event) => onTranscriptChange(event.target.value)}
              placeholder="Nenhuma transcrição foi capturada."
              className="min-h-0 flex-1 resize-none rounded-[20px] border-border/35 bg-background/65 p-4 text-sm leading-relaxed dark:border-white/8"
            />
          </section>

          <section className="flex min-h-[440px] flex-col rounded-[26px] border border-border/40 bg-card/70 p-4 dark:border-white/10">
            <div className="flex items-center gap-2 px-1 pb-3">
              <NotebookPen className="h-4 w-4 text-muted-foreground" />
              <span className="text-[9px] font-black uppercase tracking-[0.17em] text-muted-foreground">Anotações revisáveis</span>
            </div>
            <Textarea
              value={notes}
              onChange={(event) => onNotesChange(event.target.value)}
              placeholder="Adicione observações clínicas antes da conclusão."
              className="min-h-0 flex-1 resize-none rounded-[20px] border-border/35 bg-background/65 p-4 text-sm leading-relaxed dark:border-white/8"
            />
          </section>
        </div>

        <div className="border-t border-border/35 px-7 py-5 dark:border-white/10">
          <button
            type="button"
            onClick={() => setReviewConfirmed((current) => !current)}
            className={cn(
              'flex w-full items-start gap-3 rounded-[20px] border p-4 text-left transition',
              reviewConfirmed
                ? 'border-emerald-500/30 bg-emerald-500/10'
                : 'border-border/45 bg-card/55 dark:border-white/10',
            )}
          >
            <CheckCircle2 className={cn('mt-0.5 h-5 w-5 shrink-0', reviewConfirmed ? 'text-emerald-500' : 'text-muted-foreground')} />
            <span className="text-xs font-semibold leading-relaxed">
              Confirmo que revisei o conteúdo e que qualquer material gerado por IA continuará sendo apenas um rascunho sujeito à validação profissional.
            </span>
          </button>

          {!hasNetwork ? (
            <div className="mt-3 flex items-center gap-3 rounded-2xl bg-amber-500/10 px-4 py-3 text-xs font-semibold text-amber-700 dark:text-amber-400">
              <WifiOff className="h-4 w-4 shrink-0" />
              Reconecte-se para concluir. O conteúdo permanece protegido localmente.
            </div>
          ) : null}

          {error ? <p className="mt-3 rounded-2xl bg-rose-500/10 px-4 py-3 text-xs font-semibold text-rose-500">{error}</p> : null}

          <div className="mt-4 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={!reviewConfirmed || isProcessing || !hasNetwork}
              onClick={onPreserve}
              className="h-12 rounded-2xl px-6 text-[9px] font-black uppercase tracking-[0.14em]"
            >
              {completionMode === 'saving' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Concluir e preservar para depois
            </Button>
            <Button
              type="button"
              disabled={!reviewConfirmed || !canGenerate || isProcessing || !hasNetwork}
              onClick={onGenerate}
              className="h-12 rounded-2xl bg-foreground px-7 text-[9px] font-black uppercase tracking-[0.16em] text-background"
            >
              {completionMode === 'generating' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Gerar rascunho e concluir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
