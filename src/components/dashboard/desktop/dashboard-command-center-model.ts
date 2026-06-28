import { isAfter, isSameDay } from "date-fns";

import type { Appointment } from "@/types";
import { getAppointmentKind } from "@/lib/appointment-metadata";
import { isCancelledAppointmentStatus } from "@/lib/appointment-status";

export type DashboardNotificationSeverity = "success" | "info" | "warning" | "destructive";

export type DashboardNotification = {
  id: string;
  title: string;
  message: string;
  severity: DashboardNotificationSeverity;
  priority?: string | null;
  category?: string | null;
  actionUrl?: string | null;
  createdAt?: string | null;
  isRead?: boolean;
};

export type AttentionQueueItem = {
  id: string;
  label: string;
  title: string;
  description: string;
  actionUrl: string;
  tone: "default" | "warning" | "destructive";
  source: "notification" | "patients" | "finance";
};

export type ManagerialMetrics = {
  result?: number | null;
  receivable?: number | null;
};

export type NeurofinanceSnapshot = {
  available_balance?: number | null;
  pending_receivables?: number | null;
};

export type FinancialSignal = {
  statusLabel: string;
  statusTone: "default" | "success" | "warning";
  ctaLabel: string;
  ctaPath: string;
  result: number;
  receivable: number;
  bankBalanceCents: number | null;
  bankPendingCents: number | null;
};

const severityRank: Record<DashboardNotificationSeverity, number> = {
  destructive: 0,
  warning: 1,
  info: 2,
  success: 3,
};

const priorityRank = (priority?: string | null) => {
  const value = priority?.toLowerCase();
  if (value === "urgent") return 0;
  if (value === "high") return 1;
  if (value === "normal") return 2;
  return 3;
};

export const getActiveAppointments = (appointments?: Appointment[] | null) =>
  [...(appointments || [])]
    .filter((appointment) => !isCancelledAppointmentStatus(appointment.status, appointment.notes))
    .sort((left, right) => new Date(left.start_time).getTime() - new Date(right.start_time).getTime());

export const getTodayAppointments = (appointments: Appointment[], today: Date) =>
  appointments.filter((appointment) => isSameDay(new Date(appointment.start_time), today));

export const isSessionAppointment = (appointment?: Appointment | null) =>
  Boolean(appointment) && getAppointmentKind(appointment!) === "session";

export const isOnlineAppointment = (appointment?: Appointment | null) =>
  Boolean(appointment) && (appointment!.type === "online" || appointment!.type === "teleconsulta" || Boolean(appointment!.google_meet_link));

export const getNextSession = (appointments: Appointment[], now: Date) =>
  appointments.find((appointment) => isSessionAppointment(appointment) && isAfter(new Date(appointment.end_time), now));

export const buildAttentionQueue = ({
  notifications,
  pendingPatients,
  financialConnected,
  financialLoading = false,
  limit = 5,
}: {
  notifications?: DashboardNotification[] | null;
  pendingPatients: number;
  financialConnected: boolean;
  financialLoading?: boolean;
  limit?: number;
}): AttentionQueueItem[] => {
  const notificationItems = [...(notifications || [])]
    .filter((notification) => !notification.isRead && notification.severity !== "success")
    .sort((left, right) => {
      const bySeverity = severityRank[left.severity] - severityRank[right.severity];
      if (bySeverity !== 0) return bySeverity;

      const byPriority = priorityRank(left.priority) - priorityRank(right.priority);
      if (byPriority !== 0) return byPriority;

      return new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime();
    })
    .slice(0, 3)
    .map<AttentionQueueItem>((notification) => ({
      id: `notification-${notification.id}`,
      label: notification.category || "Sistema",
      title: notification.title,
      description: notification.message,
      actionUrl: notification.actionUrl || "/dashboard",
      tone: notification.severity === "destructive" ? "destructive" : notification.severity === "warning" ? "warning" : "default",
      source: "notification",
    }));

  const items = [...notificationItems];

  if (pendingPatients > 0) {
    items.push({
      id: "pending-patients",
      label: "Pacientes",
      title: "Pacientes em atencao",
      description: `${pendingPatients} cadastro${pendingPatients === 1 ? "" : "s"} ou retorno${pendingPatients === 1 ? "" : "s"} aguardando revisao.`,
      actionUrl: "/pacientes",
      tone: "warning",
      source: "patients",
    });
  }

  if (!financialLoading && !financialConnected) {
    items.push({
      id: "financial-activation",
      label: "Financeiro",
      title: "Ativar NeuroFinance",
      description: "Conclua a ativacao para acompanhar recebimentos e cobrancas.",
      actionUrl: "/financeiro/neurofinance",
      tone: "warning",
      source: "finance",
    });
  }

  return items.slice(0, limit);
};

export const buildFinancialSignal = ({
  financialConnected,
  financialLoading = false,
  managerial,
  neuroSnapshot,
}: {
  financialConnected: boolean;
  financialLoading?: boolean;
  managerial?: ManagerialMetrics | null;
  neuroSnapshot?: NeurofinanceSnapshot | null;
}): FinancialSignal => ({
  statusLabel: financialLoading ? "Verificando" : financialConnected ? "NeuroFinance conectado" : "Ativacao pendente",
  statusTone: financialLoading ? "default" : financialConnected ? "success" : "warning",
  ctaLabel: financialConnected ? "Abrir conta" : "Ativar",
  ctaPath: "/financeiro/neurofinance",
  result: Number(managerial?.result || 0),
  receivable: Number(managerial?.receivable || 0),
  bankBalanceCents: financialConnected ? Number(neuroSnapshot?.available_balance || 0) : null,
  bankPendingCents: financialConnected ? Number(neuroSnapshot?.pending_receivables || 0) : null,
});
