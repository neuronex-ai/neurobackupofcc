import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Info,
  Landmark,
  LockKeyhole,
  ReceiptText,
  UserRound,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  BillConsultation,
  BillPaymentMode,
} from "@/hooks/use-neurofinance-bill-payments";
import { useNeuroFinanceTariffs } from "@/hooks/use-neurofinance-tariffs";
import { cn, formatCurrency } from "@/lib/utils";

interface BillPaymentReviewCardProps {
  consultation: BillConsultation;
  onBack: () => void;
  onConfirm: (decision: {
    paymentMode: BillPaymentMode;
    scheduleDate?: string | null;
  }) => void;
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

function tomorrowIso() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function BillPaymentReviewCard({
  consultation,
  onBack,
  onConfirm,
}: BillPaymentReviewCardProps) {
  const { data: tariffs } = useNeuroFinanceTariffs();
  const tariff = tariffs?.find((item) => item.code === "bill_payment");
  const initialMode = consultation.recommendedMode || (consultation.canSchedule ? "scheduled" : "now");
  const [paymentMode, setPaymentMode] = useState<BillPaymentMode>(initialMode);
  const [scheduleDate, setScheduleDate] = useState(consultation.defaultScheduleDate || "");

  useEffect(() => {
    setPaymentMode(consultation.recommendedMode || (consultation.canSchedule ? "scheduled" : "now"));
    setScheduleDate(consultation.defaultScheduleDate || "");
  }, [consultation]);

  const minimumFutureScheduleDate = useMemo(() => {
    const tomorrow = tomorrowIso();
    return consultation.minimumScheduleDate && consultation.minimumScheduleDate > tomorrow
      ? consultation.minimumScheduleDate
      : tomorrow;
  }, [consultation.minimumScheduleDate]);

  const hasBalance = consultation.availableBalance != null &&
    consultation.availableBalance >= consultation.requiredBalance;
  const canContinue = paymentMode === "now"
    ? consultation.canPayNow
    : consultation.canSchedule && Boolean(scheduleDate);

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
      detail: consultation.minimumScheduleDate
        ? `Primeira data operacional: ${formatDate(consultation.minimumScheduleDate)}`
        : "Data validada pela instituição",
    },
  ];

  return (
    <section className="mx-auto max-w-4xl overflow-hidden rounded-[32px] border border-zinc-200/70 bg-white/75 shadow-[0_35px_90px_-55px_rgba(0,0,0,0.55)] backdrop-blur-3xl dark:border-white/[0.08] dark:bg-[#09090b]/80">
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
                Confira e escolha quando pagar
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                Os dados foram consultados diretamente na Asaas e ficarão congelados após o PIN.
              </p>
            </div>
          </div>
          <ReceiptText className="hidden h-6 w-6 text-zinc-300 md:block" />
        </div>
      </div>

      <div className="p-6 md:p-8">
        <div className="grid gap-3 md:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-[26px] bg-zinc-950 p-6 text-white shadow-2xl dark:bg-white dark:text-zinc-950">
            <p className="text-[9px] font-black uppercase tracking-[0.25em] opacity-50">Total necessário</p>
            <p className="mt-3 text-4xl font-black tracking-[-0.05em]">{formatCurrency(consultation.requiredBalance)}</p>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-wider opacity-50">
              Boleto {formatCurrency(consultation.value)}
              {consultation.fee > 0 ? ` + taxa ${formatCurrency(consultation.fee)}` : " · sem taxa"}
            </p>
          </div>
          <div className={cn(
            "rounded-[26px] border p-6",
            hasBalance
              ? "border-emerald-500/20 bg-emerald-500/[0.06]"
              : "border-amber-500/20 bg-amber-500/[0.07]",
          )}>
            <div className="flex items-center gap-2 text-zinc-500">
              <Wallet className="h-4 w-4" />
              <p className="text-[9px] font-black uppercase tracking-[0.2em]">Saldo disponível</p>
            </div>
            <p className="mt-3 text-2xl font-black text-zinc-950 dark:text-white">
              {consultation.availableBalance == null
                ? "Em atualização"
                : formatCurrency(consultation.availableBalance)}
            </p>
            {!hasBalance && consultation.balanceShortfall > 0 && (
              <p className="mt-2 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                Faltam {formatCurrency(consultation.balanceShortfall)}. O boleto deverá ser agendado.
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
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

        <div className="mt-6">
          <p className="mb-3 text-[9px] font-black uppercase tracking-[0.22em] text-zinc-400">
            Quando deseja pagar?
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <button
              type="button"
              disabled={!consultation.canPayNow}
              onClick={() => setPaymentMode("now")}
              className={cn(
                "rounded-[22px] border p-5 text-left transition-all disabled:cursor-not-allowed disabled:opacity-45",
                paymentMode === "now"
                  ? "border-zinc-950 bg-zinc-950 text-white shadow-xl dark:border-white dark:bg-white dark:text-zinc-950"
                  : "border-zinc-200 bg-white/70 text-zinc-950 dark:border-white/10 dark:bg-white/[0.025] dark:text-white",
              )}
            >
              <Clock3 className="h-5 w-5" />
              <p className="mt-4 text-sm font-black">Pagar agora</p>
              <p className={cn(
                "mt-1 text-[10px] leading-relaxed",
                paymentMode === "now" ? "opacity-65" : "text-zinc-500",
              )}>
                Usa o saldo disponível e solicita o processamento na primeira janela operacional.
              </p>
            </button>

            <button
              type="button"
              disabled={!consultation.canSchedule}
              onClick={() => setPaymentMode("scheduled")}
              className={cn(
                "rounded-[22px] border p-5 text-left transition-all disabled:cursor-not-allowed disabled:opacity-45",
                paymentMode === "scheduled"
                  ? "border-zinc-950 bg-zinc-950 text-white shadow-xl dark:border-white dark:bg-white dark:text-zinc-950"
                  : "border-zinc-200 bg-white/70 text-zinc-950 dark:border-white/10 dark:bg-white/[0.025] dark:text-white",
              )}
            >
              <CalendarClock className="h-5 w-5" />
              <p className="mt-4 text-sm font-black">Agendar pagamento</p>
              <p className={cn(
                "mt-1 text-[10px] leading-relaxed",
                paymentMode === "scheduled" ? "opacity-65" : "text-zinc-500",
              )}>
                Programe uma data futura até o vencimento e garanta o saldo antes do processamento.
              </p>
            </button>
          </div>

          {paymentMode === "scheduled" && consultation.canSchedule && (
            <div className="mt-3 rounded-[20px] border border-zinc-200/70 bg-zinc-50/70 p-4 dark:border-white/[0.07] dark:bg-white/[0.025]">
              <label className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400" htmlFor="bill-schedule-date">
                Data do pagamento
              </label>
              <Input
                id="bill-schedule-date"
                type="date"
                min={minimumFutureScheduleDate}
                max={consultation.dueDate || undefined}
                value={scheduleDate}
                onChange={(event) => setScheduleDate(event.target.value)}
                className="mt-2 h-12 rounded-[16px] border-zinc-200 bg-white dark:border-white/10 dark:bg-white/[0.04]"
              />
            </div>
          )}
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-[18px] border border-blue-500/15 bg-blue-500/[0.06] px-4 py-3 text-[10px] font-semibold leading-relaxed text-blue-900 dark:text-blue-200">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            {consultation.fee > 0
              ? `Taxa desta operação: ${formatCurrency(consultation.fee)}.`
              : `${tariff?.price_label || "Pagamento sem tarifa"}.`} Após a aprovação, o boleto é processado na data escolhida. Solicitações para hoje após 14h seguem no próximo dia útil, e a confirmação bancária pode ocorrer no mesmo dia ou no próximo dia útil.
          </p>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-[18px] border border-amber-500/15 bg-amber-500/[0.07] px-4 py-3 text-[10px] font-bold text-amber-800 dark:text-amber-200">
          <LockKeyhole className="h-4 w-4 shrink-0" />
          O pagamento ou agendamento só será enviado após a confirmação com seu PIN financeiro.
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
            disabled={!canContinue}
            onClick={() => onConfirm({
              paymentMode,
              scheduleDate: paymentMode === "scheduled" ? scheduleDate : null,
            })}
            className="h-13 rounded-[18px] bg-zinc-950 text-[10px] font-black uppercase tracking-[0.16em] text-white shadow-xl hover:bg-zinc-800 dark:bg-white dark:text-zinc-950"
          >
            {paymentMode === "scheduled" ? "Confirmar agendamento" : "Confirmar pagamento"}
          </Button>
        </div>
      </div>
    </section>
  );
}
