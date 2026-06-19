import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard";
import { useConfirmSessionReview, usePendingSessionReviews } from "@/hooks/use-session-notes";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNowStrict, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle, CheckCircle2, Clock3, FileText, Loader2 } from "lucide-react";

interface PatientPendingSessionReviewsTabProps {
  patientId: string;
}

export const PatientPendingSessionReviewsTab = ({ patientId }: PatientPendingSessionReviewsTabProps) => {
  const { data: pendingReviews, isLoading } = usePendingSessionReviews(patientId);
  const confirmReview = useConfirmSessionReview(patientId);

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!pendingReviews?.length) {
    return (
      <GlassCard className="!rounded-[30px] !border-dashed !border-zinc-200/70 !bg-white/52 !py-20 !text-center dark:!border-white/[0.085] dark:!bg-[#0b0b0d]">
        <FileText className="mx-auto mb-4 h-8 w-8 text-muted-foreground/45" />
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
          Nenhuma revisão pendente
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      {pendingReviews.map((note) => {
        const summary = note.ai_summary;
        const dueAt = note.review_due_at ? new Date(note.review_due_at) : null;
        const expired = dueAt ? isPast(dueAt) : false;
        const dueLabel = dueAt
          ? formatDistanceToNowStrict(dueAt, { addSuffix: true, locale: ptBR })
          : "em até 48h";

        return (
          <GlassCard
            key={note.id}
            className="!rounded-[28px] !border-zinc-200/70 !bg-white/70 !p-5 !shadow-[0_22px_58px_-46px_rgba(24,24,27,0.45)] dark:!border-white/[0.085] dark:!bg-[#0b0b0d]"
            innerClassName="space-y-5"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.15em]",
                      expired
                        ? "border-rose-500/20 bg-rose-500/10 text-rose-500"
                        : "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-300",
                    )}
                  >
                    {expired ? <AlertTriangle className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
                    {expired ? "Prazo vencido" : `Pendente ${dueLabel}`}
                  </span>
                  <span className="rounded-full border border-border/45 bg-background/70 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground dark:border-white/10">
                    {format(new Date(note.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
                <h3 className="mt-4 text-xl font-black tracking-[-0.035em] text-foreground">
                  Resumo de sessão aguardando confirmação
                </h3>
              </div>

              <Button
                type="button"
                disabled={confirmReview.isPending}
                onClick={() => confirmReview.mutate(note.id)}
                className="h-11 shrink-0 rounded-2xl bg-foreground px-5 text-[10px] font-black uppercase tracking-[0.14em] text-background"
              >
                {confirmReview.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Confirmar resumo
              </Button>
            </div>

            <div className="rounded-[22px] border border-border/40 bg-background/60 p-4 dark:border-white/10">
              <p className="whitespace-pre-wrap text-sm leading-7 text-foreground/85">
                {summary?.summary || note.notes || "Resumo pendente sem texto principal."}
              </p>
            </div>

            {summary?.topics?.length ? (
              <div className="flex flex-wrap gap-2">
                {summary.topics.slice(0, 5).map((topic) => (
                  <span
                    key={topic}
                    className="rounded-full border border-border/45 bg-background/70 px-3 py-1.5 text-[10px] font-bold text-muted-foreground dark:border-white/10"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            ) : null}
          </GlassCard>
        );
      })}
    </div>
  );
};
