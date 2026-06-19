import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { SessionNote } from '@/types';
import { formatDistanceToNowStrict } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  Loader2,
  Sparkles,
  WifiOff,
} from 'lucide-react';
import { useMemo, useState } from 'react';

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
  summaryNote?: SessionNote | null;
  onGenerate: () => void;
  onPreserve: () => void;
}

const formatSummaryList = (items?: string[]) =>
  items?.filter(Boolean).slice(0, 5) ?? [];

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
  summaryNote,
  onGenerate,
  onPreserve,
}: DesktopSessionReviewDialogProps) => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const summary = summaryNote?.ai_summary;
  const topics = formatSummaryList(summary?.topics);
  const nextSteps = formatSummaryList(summary?.next_steps);
  const dueLabel = useMemo(() => {
    if (!summaryNote?.review_due_at) return '48h';
    return formatDistanceToNowStrict(new Date(summaryNote.review_due_at), {
      addSuffix: true,
      locale: ptBR,
    });
  }, [summaryNote?.review_due_at]);
  const isGenerating = completionMode === 'generating';
  const canFinish = Boolean(summaryNote?.id) && hasNetwork && !isProcessing;

  return (
    <Dialog open={open} onOpenChange={() => undefined}>
      <DialogContent
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
        className="flex max-h-[min(760px,calc(100dvh-2rem))] w-[min(860px,calc(100vw-2rem))] max-w-none flex-col overflow-hidden rounded-[28px] border-border/45 bg-background/98 p-0 shadow-2xl backdrop-blur-3xl dark:border-white/10"
      >
        <DialogHeader className="border-b border-border/35 px-6 py-5 text-center dark:border-white/10 sm:px-8">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-500">
            <Sparkles className="h-5 w-5" />
          </div>
          <p className="text-[9px] font-black uppercase tracking-[0.22em] text-muted-foreground">
            Revisao profissional obrigatoria
          </p>
          <DialogTitle className="mt-2 text-2xl font-black tracking-[-0.045em] sm:text-3xl">
            Concluir sessao com {patientName}
          </DialogTitle>
          <DialogDescription className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed">
            O resumo de sessao se mantera pendente por 48h apos a sessao. Depois desse prazo, sera confirmado automaticamente pelo sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-8">
          {isGenerating ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[24px] border border-border/40 bg-card/70 p-8 text-center dark:border-white/10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <h3 className="mt-5 text-lg font-black tracking-[-0.03em]">Gerando resumo pendente</h3>
              <p className="mt-2 max-w-md text-sm font-medium leading-relaxed text-muted-foreground">
                A IA esta organizando a transcricao e suas anotacoes em um rascunho clinico para revisao.
              </p>
            </div>
          ) : summary ? (
            <div className="space-y-4">
              <section className="rounded-[24px] border border-border/40 bg-card/75 p-5 shadow-sm dark:border-white/10">
                <div className="flex flex-wrap items-center justify-center gap-2 text-center">
                  <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.15em] text-amber-600 dark:text-amber-300">
                    <Clock3 className="h-3.5 w-3.5" />
                    Pendente {dueLabel}
                  </span>
                  {summary.sentiment ? (
                    <span className="rounded-full border border-border/50 bg-background/75 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground dark:border-white/10">
                      {summary.sentiment}
                    </span>
                  ) : null}
                </div>

                <div className="mx-auto mt-5 max-w-2xl text-center">
                  <p className="whitespace-pre-wrap text-sm leading-7 text-foreground/88 sm:text-base">
                    {summary.summary || 'Resumo gerado sem texto principal.'}
                  </p>
                </div>
              </section>

              {(topics.length > 0 || nextSteps.length > 0) ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {topics.length > 0 ? (
                    <section className="rounded-[22px] border border-border/40 bg-card/55 p-4 dark:border-white/10">
                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground">Temas abordados</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {topics.map((topic) => (
                          <span key={topic} className="rounded-full border border-border/45 bg-background/70 px-3 py-1.5 text-[11px] font-bold text-foreground/80 dark:border-white/10">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  {nextSteps.length > 0 ? (
                    <section className="rounded-[22px] border border-border/40 bg-card/55 p-4 dark:border-white/10">
                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground">Proximos focos</p>
                      <ul className="mt-3 space-y-2">
                        {nextSteps.map((step) => (
                          <li key={step} className="flex gap-2 text-xs font-semibold leading-relaxed text-foreground/80">
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                            {step}
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}
                </div>
              ) : null}

              <section className="rounded-[22px] border border-border/40 bg-muted/35 p-4 text-center dark:border-white/10">
                <p className="text-xs font-semibold leading-relaxed text-muted-foreground">
                  Apos a confirmacao, o resumo passa a integrar o prontuario/registro clinico e deixa de ser editavel pela rotina comum. Retificacao ou exclusao devem seguir fluxo administrativo conforme LGPD e obrigacoes eticas e legais de guarda profissional.
                </p>
              </section>
            </div>
          ) : (
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[24px] border border-border/40 bg-card/70 p-8 text-center dark:border-white/10">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
              <h3 className="mt-5 text-lg font-black tracking-[-0.03em]">Resumo ainda nao disponivel</h3>
              <p className="mt-2 max-w-md text-sm font-medium leading-relaxed text-muted-foreground">
                A sessao so pode ser concluida depois que o resumo pendente for gerado e salvo.
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => setDetailsOpen((current) => !current)}
            className="mt-4 flex w-full items-center justify-between rounded-[18px] border border-border/40 bg-card/55 px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground transition hover:bg-card dark:border-white/10"
          >
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Dados revisaveis da sessao
            </span>
            <ChevronDown className={`h-4 w-4 transition ${detailsOpen ? 'rotate-180' : ''}`} />
          </button>

          {detailsOpen ? (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-[18px] border border-border/40 bg-background/70 p-4 dark:border-white/10">
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                  Transcricao ({segmentsCount} trechos)
                </p>
                <pre className="mt-3 max-h-44 whitespace-pre-wrap overflow-auto text-xs leading-relaxed text-muted-foreground">
                  {transcript || 'Nenhuma transcricao capturada.'}
                </pre>
              </div>
              <div className="rounded-[18px] border border-border/40 bg-background/70 p-4 dark:border-white/10">
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-muted-foreground">Anotacoes</p>
                <pre className="mt-3 max-h-44 whitespace-pre-wrap overflow-auto text-xs leading-relaxed text-muted-foreground">
                  {notes || 'Nenhuma anotacao adicional.'}
                </pre>
              </div>
            </div>
          ) : null}

          {!hasNetwork ? (
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-amber-500/10 px-4 py-3 text-xs font-semibold text-amber-700 dark:text-amber-300">
              <WifiOff className="h-4 w-4 shrink-0" />
              Reconecte-se para concluir a sessao. O conteudo permanece protegido localmente.
            </div>
          ) : null}

          {error ? (
            <div className="mt-4 rounded-2xl bg-rose-500/10 px-4 py-3 text-xs font-semibold text-rose-500">
              {error}
            </div>
          ) : null}
        </div>

        <div className="grid gap-3 border-t border-border/35 bg-background/95 px-5 py-4 dark:border-white/10 sm:grid-cols-2 sm:px-8">
          <Button
            type="button"
            variant="outline"
            disabled={!canFinish}
            onClick={onPreserve}
            className="h-12 rounded-2xl border-border/50 text-[10px] font-black uppercase tracking-[0.14em] dark:border-white/10"
          >
            {completionMode === 'saving' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Confirmar depois
          </Button>
          <Button
            type="button"
            disabled={!canFinish || !canGenerate}
            onClick={onGenerate}
            className="h-12 rounded-2xl bg-foreground text-[10px] font-black uppercase tracking-[0.14em] text-background"
          >
            {completionMode === 'saving' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Confirmo resumo gerado
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
