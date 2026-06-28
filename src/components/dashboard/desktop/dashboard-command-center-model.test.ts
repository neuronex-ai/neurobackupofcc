import { describe, expect, it } from "vitest";

import type { Appointment } from "@/types";
import {
  buildAttentionQueue,
  buildFinancialSignal,
  getActiveAppointments,
  getNextSession,
  getTodayAppointments,
  isOnlineAppointment,
} from "./dashboard-command-center-model";

const appointment = (overrides: Partial<Appointment>): Appointment => ({
  id: "apt-1",
  user_id: "user-1",
  patient_id: "patient-1",
  start_time: "2026-06-28T12:00:00.000Z",
  end_time: "2026-06-28T13:00:00.000Z",
  type: "presencial",
  status: "scheduled",
  notes: null,
  location: null,
  created_at: "2026-06-20T00:00:00.000Z",
  metadata: null,
  patient_name: "Paciente Teste",
  ...overrides,
});

describe("dashboard command center model", () => {
  it("handles an empty agenda", () => {
    const active = getActiveAppointments([]);

    expect(active).toEqual([]);
    expect(getTodayAppointments(active, new Date("2026-06-28T10:00:00.000Z"))).toEqual([]);
    expect(getNextSession(active, new Date("2026-06-28T10:00:00.000Z"))).toBeUndefined();
  });

  it("finds the next online session", () => {
    const active = getActiveAppointments([
      appointment({
        id: "past",
        start_time: "2026-06-28T08:00:00.000Z",
        end_time: "2026-06-28T09:00:00.000Z",
        type: "online",
      }),
      appointment({
        id: "future",
        start_time: "2026-06-28T14:00:00.000Z",
        end_time: "2026-06-28T15:00:00.000Z",
        type: "online",
        google_meet_link: "https://meet.google.com/test",
      }),
    ]);

    const next = getNextSession(active, new Date("2026-06-28T10:00:00.000Z"));

    expect(next?.id).toBe("future");
    expect(isOnlineAppointment(next)).toBe(true);
  });

  it("finds the next presencial session", () => {
    const next = getNextSession(
      [
        appointment({
          id: "presencial",
          start_time: "2026-06-28T11:00:00.000Z",
          end_time: "2026-06-28T12:00:00.000Z",
          type: "presencial",
        }),
      ],
      new Date("2026-06-28T10:00:00.000Z"),
    );

    expect(next?.id).toBe("presencial");
    expect(isOnlineAppointment(next)).toBe(false);
  });

  it("builds action items for pending patients and disconnected finance", () => {
    const queue = buildAttentionQueue({
      notifications: [],
      pendingPatients: 2,
      financialConnected: false,
    });

    expect(queue.map((item) => item.id)).toEqual(["pending-patients", "financial-activation"]);
    expect(queue[0].actionUrl).toBe("/pacientes");
    expect(queue[1].actionUrl).toBe("/financeiro/neurofinance");
  });

  it("prioritizes destructive unread notifications", () => {
    const queue = buildAttentionQueue({
      notifications: [
        {
          id: "info",
          title: "Info",
          message: "Mensagem informativa",
          severity: "info",
          isRead: false,
          createdAt: "2026-06-28T10:00:00.000Z",
        },
        {
          id: "error",
          title: "Erro",
          message: "Mensagem critica",
          severity: "destructive",
          priority: "urgent",
          isRead: false,
          createdAt: "2026-06-28T09:00:00.000Z",
        },
      ],
      pendingPatients: 0,
      financialConnected: true,
    });

    expect(queue[0].id).toBe("notification-error");
    expect(queue[0].tone).toBe("destructive");
  });

  it("returns the correct financial signal states", () => {
    expect(
      buildFinancialSignal({
        financialConnected: false,
        managerial: { result: 1200, receivable: 300 },
      }),
    ).toMatchObject({
      statusLabel: "Ativacao pendente",
      statusTone: "warning",
      bankBalanceCents: null,
    });

    expect(
      buildFinancialSignal({
        financialConnected: true,
        managerial: { result: 1200, receivable: 300 },
        neuroSnapshot: { available_balance: 50000, pending_receivables: 25000 },
      }),
    ).toMatchObject({
      statusLabel: "NeuroFinance conectado",
      statusTone: "success",
      bankBalanceCents: 50000,
      bankPendingCents: 25000,
    });
  });
});
