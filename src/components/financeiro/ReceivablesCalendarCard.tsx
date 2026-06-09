"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowRight,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  Receipt,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  type ReceivableCalendarItem,
  type ReceivableSource,
  type ReceivableStatus,
  useReceivablesCalendar,
} from "@/hooks/use-receivables-calendar";
import { useUpdateFinancialEntry } from "@/hooks/use-financial-entries";

type CalendarMode = "receivables" | "payments";

interface ReceivablesCalendarCardProps {
  onOpenFutureStatement: () => void;
}

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

const SOURCE_LABELS: Record<ReceivableSource, string> = {
  neurofinance: "NeuroFinance",
  agenda: "Agenda",
  manual: "Manual",
};

const STATUS_LABELS: Record<ReceivableStatus, string> = {
  planned: "Planejado",
  pending: "Pendente",
  processing: "Processando",
  confirmed: "Confirmado",
  paid: "Pago",
  overdue: "Vencido",
  cancelled: "Cancelado",
};

const STATUS_STYLES: Record<ReceivableStatus, string> = {
  planned: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  pending: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  processing: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  confirmed: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  paid: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  overdue: "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300",
  cancelled: "border-zinc-500/20 bg-zinc-500/10 text-zinc-600 dark:text-zinc-300",
};

const currency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function sameDate(left: Date, right: Date) {
  return format(left, "yyyy-MM-dd") === format(right, "yyyy-MM-dd");
}

function selectionBounds(selectedDates: Date[]) {
  if (selectedDates.length === 0) return null;
  const sorted = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());
  return {
    start: format(sorted[0], "yyyy-MM-dd"),
    end: format(sorted[sorted.length - 1], "yyyy-MM-dd"),
  };
}

export function ReceivablesCalendarCard({ onOpenFutureStatement }: ReceivablesCalendarCardProps) {
  const [mode, setMode] = useState<CalendarMode>("receivables");
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const queryClient = useQueryClient();
  const updateEntry = useUpdateFinancialEntry();

  const gridStart = startOfWeek(startOfMonth(visibleMonth), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(visibleMonth), { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const { data: items = [], isLoading } = useReceivablesCalendar(gridStart, gridEnd);

  const itemsByDate = useMemo(() => {
    return items.reduce<Record<string, ReceivableCalendarItem[]>>((result, item) => {
      (result[item.date] ||= []).push(item);
      return result;
    }, {});
  }, [items]);

  const selectedBounds = selectionBounds(selectedDates);
  const filteredItems = useMemo(() => {
    if (!selectedBounds) return [];
    return items.filter((item) => item.date >= selectedBounds.start && item.date <= selectedBounds.end);
  }, [items, selectedBounds]);

  const selectedTotal = filteredItems.reduce((total, item) => total + item.amount, 0);

  const handleDayClick = (day: Date) => {
    setSelectedDates((current) => {
      const selectedIndex = current.findIndex((selected) => sameDate(selected, day));
      if (selectedIndex >= 0) {
        return current.filter((_, index) => index !== selectedIndex);
      }
      if (current.length >= 2) return [day];
      return [...current, day].sort((a, b) => a.getTime() - b.getTime());
    });
  };

  const navigateMonth = (direction: "previous" | "next") => {
    setVisibleMonth((current) => direction === "previous" ? subMonths(current, 1) : addMonths(current, 1));
    setSelectedDates([]);
  };

  const updateStatus = async (item: ReceivableCalendarItem, status: ReceivableStatus) => {
    if (!item.editable || !item.financialEntryId) return;

    try {
      await updateEntry.mutateAsync({
        id: item.financialEntryId,
        status: status as "planned" | "pending" | "paid" | "overdue" | "cancelled",
        paidAt: status === "paid" ? new Date() : null,
        cancelledAt: status === "cancelled" ? new Date() : null,
      });
      await queryClient.invalidateQueries({ queryKey: ["receivables-calendar"] });
      toast.success("Status do recebimento atualizado.");
    } catch {
      // O hook já apresenta a mensagem de erro.
    }
  };

  const selectedPeriodLabel = selectedBounds
    ? selectedBounds.start === selectedBounds.end
      ? format(parseISO(selectedBounds.start), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
      : `${format(parseISO(selectedBounds.start), "dd/MM/yyyy")} a ${format(parseISO(selectedBounds.end), "dd/MM/yyyy")}`
    : "";

  return (
    <section className="relative overflow-hidden rounded-[40px] border border-zinc-200/60 bg-white/70 p-5 shadow-[0_28px_80px_-52px_rgba(0,0,0,0.55)] backdrop-blur-2xl dark:border-white/[0.06] dark:bg-white/[0.018] md:p-8">
      <div className="premium-noise pointer-events-none absolute inset-0 opacity-[0.018] dark:opacity-[0.04]" />
      <div className="relative z-10">
        <div className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.38em] text-zinc-400">Planejamento financeiro</p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-zinc-950 dark:text-white">
              Calendário Financeiro
            </h2>
          </div>

          <div className="flex w-full rounded-full border border-zinc-200 bg-zinc-100/80 p-1 dark:border-white/[0.06] dark:bg-black/30 xl:w-auto">
            {([
              { id: "receivables", label: "Calendário de Recebimentos" },
              { id: "payments", label: "Calendário de Pagamentos" },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMode(tab.id)}
                className={cn(
                  "flex-1 rounded-full px-5 py-2.5 text-[9px] font-black uppercase tracking-[0.14em] transition-all xl:flex-none",
                  mode === tab.id
                    ? "bg-zinc-950 text-white shadow-lg dark:bg-white dark:text-black"
                    : "text-zinc-500 hover:text-zinc-950 dark:hover:text-white",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {mode === "payments" ? (
          <div className="flex min-h-[520px] flex-col items-center justify-center rounded-[32px] border border-dashed border-zinc-200 bg-zinc-50/60 px-8 text-center dark:border-white/10 dark:bg-white/[0.015]">
            <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-zinc-950 text-white shadow-xl dark:bg-white dark:text-black">
              <CalendarClock className="h-7 w-7" />
            </div>
            <div className="mt-6 flex items-center gap-2">
              <h3 className="text-lg font-black uppercase tracking-tight text-zinc-950 dark:text-white">
                Calendário de Pagamentos
              </h3>
              <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[8px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-300">
                Em breve
              </span>
            </div>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-zinc-500">
              Os pagamentos agendados via NeuroFinance e Asaas aparecerão aqui assim que a integração for liberada.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-[32px] border border-zinc-200/70 bg-white p-4 dark:border-white/[0.06] dark:bg-black/20 md:p-6">
              <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => navigateMonth("previous")}
                    className="rounded-full border border-zinc-200 dark:border-white/10"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="min-w-44 text-center">
                    <p className="text-lg font-black capitalize tracking-tight text-zinc-950 dark:text-white">
                      {format(visibleMonth, "MMMM yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => navigateMonth("next")}
                    className="rounded-full border border-zinc-200 dark:border-white/10"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-[9px] font-black uppercase tracking-widest text-zinc-500">
                  <span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-emerald-500" /> Recebidos</span>
                  <span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-blue-500" /> Previstos</span>
                  <span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-red-500" /> Vencidos</span>
                </div>
              </div>

              <div className="grid grid-cols-7 border-b border-zinc-100 pb-3 dark:border-white/5">
                {WEEKDAYS.map((weekday) => (
                  <div key={weekday} className="text-center text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">
                    {weekday}
                  </div>
                ))}
              </div>

              {isLoading ? (
                <div className="flex min-h-[420px] items-center justify-center">
                  <Loader2 className="h-7 w-7 animate-spin text-zinc-300" />
                </div>
              ) : (
                <div className="mt-3 grid grid-cols-7 gap-1.5 md:gap-2">
                  {calendarDays.map((day) => {
                    const dateKey = format(day, "yyyy-MM-dd");
                    const dayItems = itemsByDate[dateKey] || [];
                    const selected = selectedDates.some((selectedDate) => sameDate(selectedDate, day));
                    const inSelectedRange = selectedBounds &&
                      dateKey >= selectedBounds.start &&
                      dateKey <= selectedBounds.end;
                    const paidTotal = dayItems.filter((item) => item.status === "paid").reduce((total, item) => total + item.amount, 0);
                    const pendingTotal = dayItems.filter((item) => item.status !== "paid").reduce((total, item) => total + item.amount, 0);
                    const hasOverdue = dayItems.some((item) => item.status === "overdue");

                    return (
                      <button
                        key={dateKey}
                        type="button"
                        onClick={() => handleDayClick(day)}
                        className={cn(
                          "group/day relative min-h-24 rounded-[18px] border p-2 text-left transition-all md:min-h-28 md:p-3",
                          isSameMonth(day, visibleMonth)
                            ? "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-md dark:border-white/[0.055] dark:bg-white/[0.02]"
                            : "border-transparent bg-zinc-50/50 text-zinc-300 dark:bg-white/[0.008] dark:text-zinc-700",
                          inSelectedRange && "border-zinc-400 bg-zinc-100/80 dark:border-white/20 dark:bg-white/[0.06]",
                          selected && "bg-zinc-950 text-white ring-2 ring-zinc-950 ring-offset-2 dark:bg-white dark:text-black dark:ring-white dark:ring-offset-zinc-950",
                        )}
                      >
                        <span className={cn(
                          "text-xs font-black",
                          !selected && isSameDay(day, new Date()) && "text-blue-600 dark:text-blue-400",
                        )}>
                          {format(day, "d")}
                        </span>

                        {dayItems.length > 0 && (
                          <div className="mt-3 space-y-1.5">
                            {paidTotal > 0 && (
                              <p className={cn("truncate text-[8px] font-black text-emerald-600 dark:text-emerald-400", selected && "text-emerald-300 dark:text-emerald-700")}>
                                + {currency(paidTotal)}
                              </p>
                            )}
                            {pendingTotal > 0 && (
                              <p className={cn("truncate text-[8px] font-black text-blue-600 dark:text-blue-400", selected && "text-blue-300 dark:text-blue-700")}>
                                {currency(pendingTotal)} previsto
                              </p>
                            )}
                            <div className="flex items-center gap-1.5 pt-1">
                              {paidTotal > 0 && <i className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                              {pendingTotal > 0 && <i className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
                              {hasOverdue && <i className="h-1.5 w-1.5 rounded-full bg-red-500" />}
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {selectedBounds && (
              <div className="mt-6 overflow-hidden rounded-[32px] border border-zinc-200/70 bg-white dark:border-white/[0.06] dark:bg-black/20">
                <div className="flex flex-col gap-4 border-b border-zinc-100 p-5 dark:border-white/5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.25em] text-zinc-400">Recebimentos no período</p>
                    <div className="mt-1 flex flex-wrap items-baseline gap-3">
                      <h3 className="text-base font-black text-zinc-950 dark:text-white">{selectedPeriodLabel}</h3>
                      <span className="text-xs font-bold text-zinc-400">{currency(selectedTotal)}</span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onOpenFutureStatement}
                    className="rounded-full border-zinc-200 px-5 text-[9px] font-black uppercase tracking-widest dark:border-white/10"
                  >
                    Extrato <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </Button>
                </div>

                {filteredItems.length === 0 ? (
                  <div className="flex min-h-48 flex-col items-center justify-center px-6 text-center">
                    <Receipt className="h-7 w-7 text-zinc-300" />
                    <p className="mt-3 text-xs font-black uppercase tracking-widest text-zinc-500">Nenhum recebimento neste período</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-zinc-100 hover:bg-transparent dark:border-white/5">
                        <TableHead className="text-[9px] font-black uppercase tracking-widest">Origem</TableHead>
                        <TableHead className="text-[9px] font-black uppercase tracking-widest">Paciente</TableHead>
                        <TableHead className="text-[9px] font-black uppercase tracking-widest">Cobrança</TableHead>
                        <TableHead className="text-[9px] font-black uppercase tracking-widest">Status</TableHead>
                        <TableHead className="text-[9px] font-black uppercase tracking-widest">Data</TableHead>
                        <TableHead className="text-right text-[9px] font-black uppercase tracking-widest">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredItems.map((item) => (
                        <TableRow key={item.id} className="border-zinc-100 dark:border-white/5">
                          <TableCell>
                            <span className={cn(
                              "inline-flex rounded-full border px-2.5 py-1 text-[8px] font-black uppercase tracking-widest",
                              item.source === "neurofinance"
                                ? "border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-black"
                                : "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300",
                            )}>
                              {SOURCE_LABELS[item.source]}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                            {item.patientName || "Não informado"}
                          </TableCell>
                          <TableCell>
                            <p className="max-w-56 truncate text-xs font-black text-zinc-950 dark:text-white">{item.description}</p>
                            <p className="mt-1 text-[8px] font-bold uppercase tracking-widest text-zinc-400">
                              {item.paymentMethod || "Método não informado"}
                            </p>
                          </TableCell>
                          <TableCell>
                            {item.editable ? (
                              <Select
                                value={item.status}
                                onValueChange={(status) => updateStatus(item, status as ReceivableStatus)}
                                disabled={updateEntry.isPending}
                              >
                                <SelectTrigger className={cn(
                                  "h-9 w-36 rounded-full border px-3 text-[9px] font-black uppercase tracking-wider",
                                  STATUS_STYLES[item.status],
                                )}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="planned">Planejado</SelectItem>
                                  <SelectItem value="pending">Pendente</SelectItem>
                                  <SelectItem value="paid">Pago</SelectItem>
                                  <SelectItem value="overdue">Vencido</SelectItem>
                                  <SelectItem value="cancelled">Cancelado</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className={cn(
                                "inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-[8px] font-black uppercase tracking-widest",
                                STATUS_STYLES[item.status],
                              )}>
                                <Clock3 className="h-3 w-3" />
                                {STATUS_LABELS[item.status]}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs font-bold text-zinc-500">
                            {format(parseISO(item.date), "dd/MM/yyyy")}
                          </TableCell>
                          <TableCell className="text-right text-sm font-black text-zinc-950 dark:text-white">
                            {currency(item.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            )}

            {!selectedBounds && (
              <div className="mt-5 flex items-center justify-center gap-2 rounded-[22px] border border-dashed border-zinc-200 px-5 py-4 text-center dark:border-white/10">
                <Sparkles className="h-4 w-4 text-zinc-400" />
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-400">
                  Selecione um dia ou duas datas para consultar um intervalo
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
