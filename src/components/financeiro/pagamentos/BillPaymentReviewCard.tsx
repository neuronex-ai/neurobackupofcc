import { CalendarDays, CheckCircle2, Landmark, LockKeyhole, ReceiptText, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { BillConsultation } from "@/hooks/use-neurofinance-bill-payments";
import { formatCurrency } from "@/lib/utils";

interface BillPaymentReviewCardProps {
  consultation: BillConsultation;
  onBack: () => void;
  onConfirm: () => void;
}

function maskDocument(value?: string | null) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 11) return `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`;
  if (digits.length === 14) return `**.${digits.slice(2, 5)}.${digits.slice(5, 8)}/****-${digits.slice(-2)}`;
  return value || "Não informado";
}

function formatDate(value?: string | null) {
  if (!value) return "Não informado";
  return new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR");
}

export function BillPaymentReviewCard({
  consultation,
  onBack,
  onConfirm,
}: BillPaymentReviewCardProps) {
  const rows = [
    {
      icon: UserRound,
      label: "Recebedor",
      value: consultation.beneficiaryName || "Não informado pela instituição",
      detail: maskDocument(consultation.beneficiaryDocument),
    },
    {
      icon: Landmark,
      label: "Instituição",
      value: consultation.bankName || (consultation.bankCode
        ? `Código bancário ${consultation.bankCode}`
        : "Não informada pela instituição"),
      detail: consultation.bankCode
        ? `Código COMPE ${consultation.bankCode}`
        : "Dado não retornado na consulta",
    },
    {
      icon: CalendarDays,
      label: "Vencimento",
      value: consultation.dueDate
        ? formatDate(consultation.dueDate)
        : "Não informado pela instituição",
      detail: consultation.scheduleDate
        ? `Pagamento programado para ${formatDate(consultation.scheduleDate)}`
        : "Pagamento no vencimento",
    },
  ];

  return (
    <section className="mx-auto max-w-3xl overflow-hidden rounded-[32px] border border-zinc-200/70 bg-white/75 shadow-[0_35px_90px_-55px_rgba(0,0,0,0.55)] backdrop-blur-3xl dark:border-white/[0.08] dark:bg-[#09090b]/80">
      <div className="border-b border-zinc-100 p-6 dark:border-white/5 md:p-8">
        <div className="flex items-start justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-400">
                Boleto localizado
              </p>
              <h3 className="mt-2 text-xl font-black tracking-tight text-zinc-950 dark:text-white">
                Confira antes de pagar
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                Os dados abaixo foram consultados diretamente na Asaas e serão protegidos até a confirmação.
              </p>
            </div>
          </div>
          <ReceiptText className="hidden h-6 w-6 text-zinc-300 md:block" />
        </div>
      </div>

      <div className="p-6 md:p-8">
        <div className="mb-6 rounded-[26px] bg-zinc-950 p-6 text-white shadow-2xl dark:bg-white dark:text-zinc-950">
          <p className="text-[9px] font-black uppercase tracking-[0.25em] opacity-50">Valor confirmado</p>
          <p className="mt-3 text-4xl font-black tracking-[-0.05em]">{formatCurrency(consultation.value)}</p>
          {consultation.fee > 0 && (
            <p className="mt-2 text-[10px] font-bold uppercase tracking-wider opacity-50">
              Taxa informada: {formatCurrency(consultation.fee)}
            </p>
          )}
        </div>

        <div className="grid gap-3">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center gap-4 rounded-[22px] border border-zinc-200/70 bg-zinc-50/70 p-4 dark:border-white/[0.07] dark:bg-white/[0.025]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] bg-white text-zinc-600 shadow-sm dark:bg-white/[0.06] dark:text-zinc-300">
                <row.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400">{row.label}</p>
                <p className="mt-1 truncate text-sm font-black text-zinc-950 dark:text-white">{row.value}</p>
                <p className="mt-0.5 text-[10px] font-semibold text-zinc-500">{row.detail}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-2 rounded-[18px] border border-amber-500/15 bg-amber-500/[0.07] px-4 py-3 text-[10px] font-bold text-amber-800 dark:text-amber-200">
          <LockKeyhole className="h-4 w-4 shrink-0" />
          O pagamento só será enviado após a confirmação com seu PIN financeiro.
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-[0.75fr_1.25fr]">
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            className="h-13 rounded-[18px] text-[10px] font-black uppercase tracking-[0.16em]"
          >
            Corrigir dados
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            className="h-13 rounded-[18px] bg-zinc-950 text-[10px] font-black uppercase tracking-[0.16em] text-white shadow-xl hover:bg-zinc-800 dark:bg-white dark:text-zinc-950"
          >
            Confirmar pagamento
          </Button>
        </div>
      </div>
    </section>
  );
}
