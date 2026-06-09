import { useQuery } from "@tanstack/react-query";
import { endOfDay, format, isAfter, parseISO, startOfDay } from "date-fns";

import { useAuth } from "@/components/auth/SessionContextProvider";
import { supabase } from "@/integrations/supabase/client";
import type { FinancialEntry, FinancialEntryStatus } from "@/hooks/use-financial-entries";

export type ReceivableSource = "neurofinance" | "agenda" | "manual";
export type ReceivableStatus = FinancialEntryStatus | "processing" | "confirmed";

export interface ReceivableCalendarItem {
  id: string;
  source: ReceivableSource;
  sourceId: string;
  financialEntryId: string | null;
  patientName: string | null;
  description: string;
  amount: number;
  date: string;
  status: ReceivableStatus;
  editable: boolean;
  paymentMethod: string | null;
}

interface NeuroFinanceReceivable {
  id: string;
  financial_entry_id: string | null;
  patient_id: string | null;
  gross_amount: number;
  description: string | null;
  payment_method_type: string | null;
  status: string;
  normalized_status: string | null;
  funds_status: string | null;
  estimated_credit_at: string | null;
  expires_at: string | null;
  paid_at: string | null;
  confirmed_at: string | null;
  available_at: string | null;
  updated_at: string;
  patients?: { name: string | null } | null;
}

const OPEN_FINANCIAL_STATUSES: FinancialEntryStatus[] = ["planned", "pending", "overdue"];
const OPEN_NEUROFINANCE_STATUSES = new Set(["pending", "processing", "confirmed"]);

const toDateKey = (value: string) => value.slice(0, 10);

function financialEntryDate(entry: FinancialEntry) {
  if (entry.status === "paid") {
    return entry.paid_at?.slice(0, 10) || entry.due_date || entry.competence_date;
  }
  return entry.due_date || entry.competence_date;
}

function effectiveEntryStatus(entry: FinancialEntry, today: string): FinancialEntryStatus {
  if (
    entry.status !== "paid" &&
    entry.status !== "cancelled" &&
    entry.due_date &&
    entry.due_date < today
  ) {
    return "overdue";
  }
  return entry.status;
}

export function mapFinancialEntryToReceivable(
  entry: FinancialEntry,
  today = format(new Date(), "yyyy-MM-dd"),
): ReceivableCalendarItem | null {
  if (
    entry.type !== "income" ||
    entry.status === "cancelled" ||
    entry.origin === "neurofinance" ||
    entry.neurofinance_charge_id ||
    entry.neurofinance_transaction_id
  ) {
    return null;
  }

  const date = financialEntryDate(entry);
  if (!date) return null;

  return {
    id: `financial-entry:${entry.id}`,
    source: entry.origin === "appointment" ? "agenda" : "manual",
    sourceId: entry.id,
    financialEntryId: entry.id,
    patientName: entry.patients?.name || null,
    description: entry.description || entry.title,
    amount: Number(entry.amount || 0),
    date: toDateKey(date),
    status: effectiveEntryStatus(entry, today),
    editable: true,
    paymentMethod: entry.payment_method,
  };
}

export function mapNeuroFinancePaymentToReceivable(
  payment: NeuroFinanceReceivable,
): ReceivableCalendarItem | null {
  const normalizedStatus = String(payment.normalized_status || payment.status || "").toLowerCase();
  const isPaid = normalizedStatus === "paid" || payment.funds_status === "available";
  const isOpen = OPEN_NEUROFINANCE_STATUSES.has(normalizedStatus);

  if (!isPaid && !isOpen) return null;

  const date = isPaid
    ? payment.available_at || payment.paid_at || payment.confirmed_at
    : payment.estimated_credit_at || payment.expires_at;

  if (!date) return null;

  return {
    id: `neurofinance:${payment.id}`,
    source: "neurofinance",
    sourceId: payment.id,
    financialEntryId: payment.financial_entry_id,
    patientName: payment.patients?.name || null,
    description: payment.description || (isPaid ? "Cobrança recebida" : "Cobrança a receber"),
    amount: Number(payment.gross_amount || 0) / 100,
    date: toDateKey(date),
    status: isPaid ? "paid" : (normalizedStatus as ReceivableStatus),
    editable: false,
    paymentMethod: payment.payment_method_type,
  };
}

export function mergeReceivables(
  financialEntries: FinancialEntry[],
  neuroFinancePayments: NeuroFinanceReceivable[],
  today = format(new Date(), "yyyy-MM-dd"),
) {
  const linkedFinancialEntryIds = new Set(
    neuroFinancePayments
      .map((payment) => payment.financial_entry_id)
      .filter((id): id is string => Boolean(id)),
  );

  const neuroFinanceItems = neuroFinancePayments
    .map(mapNeuroFinancePaymentToReceivable)
    .filter((item): item is ReceivableCalendarItem => Boolean(item));

  const managerialItems = financialEntries
    .filter((entry) => !linkedFinancialEntryIds.has(entry.id))
    .map((entry) => mapFinancialEntryToReceivable(entry, today))
    .filter((item): item is ReceivableCalendarItem => Boolean(item));

  return [...neuroFinanceItems, ...managerialItems].sort((a, b) =>
    a.date === b.date ? b.amount - a.amount : a.date.localeCompare(b.date),
  );
}

export function useReceivablesCalendar(startDate: Date, endDate: Date) {
  const { user } = useAuth();
  const userId = user?.id;
  const startKey = format(startOfDay(startDate), "yyyy-MM-dd");
  const endKey = format(endOfDay(endDate), "yyyy-MM-dd");

  return useQuery<ReceivableCalendarItem[], Error>({
    queryKey: ["receivables-calendar", userId, startKey, endKey],
    queryFn: async () => {
      if (!userId) return [];

      const paidStart = `${startKey}T00:00:00`;
      const paidEnd = `${endKey}T23:59:59`;

      const [paidEntriesResult, openEntriesResult, paymentsResult] = await Promise.all([
        supabase
          .from("financial_entries")
          .select("*, patients(name, email)")
          .eq("professional_id", userId)
          .eq("type", "income")
          .eq("status", "paid")
          .gte("paid_at", paidStart)
          .lte("paid_at", paidEnd)
          .limit(2500),
        supabase
          .from("financial_entries")
          .select("*, patients(name, email)")
          .eq("professional_id", userId)
          .eq("type", "income")
          .in("status", OPEN_FINANCIAL_STATUSES)
          .gte("due_date", startKey)
          .lte("due_date", endKey)
          .limit(2500),
        supabase
          .from("nb_payments")
          .select(`
            id,
            financial_entry_id,
            patient_id,
            gross_amount,
            description,
            payment_method_type,
            status,
            normalized_status,
            funds_status,
            estimated_credit_at,
            expires_at,
            paid_at,
            confirmed_at,
            available_at,
            updated_at,
            patients(name)
          `)
          .eq("user_id", userId)
          .in("normalized_status", ["pending", "processing", "confirmed", "paid"])
          .limit(2500),
      ]);

      if (paidEntriesResult.error) throw paidEntriesResult.error;
      if (openEntriesResult.error) throw openEntriesResult.error;
      if (paymentsResult.error) throw paymentsResult.error;

      const entries = [
        ...((paidEntriesResult.data || []) as FinancialEntry[]),
        ...((openEntriesResult.data || []) as FinancialEntry[]),
      ];

      const uniqueEntries = Array.from(new Map(entries.map((entry) => [entry.id, entry])).values());
      const merged = mergeReceivables(
        uniqueEntries,
        (paymentsResult.data || []) as unknown as NeuroFinanceReceivable[],
      );

      return merged.filter((item) => {
        const itemDate = parseISO(item.date);
        if (item.status === "paid" && isAfter(itemDate, endOfDay(new Date()))) return false;
        return item.date >= startKey && item.date <= endKey;
      });
    },
    enabled: Boolean(userId),
    staleTime: 60_000,
  });
}
