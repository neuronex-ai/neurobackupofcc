import { describe, expect, it } from "vitest";

import {
  mapFinancialEntryToReceivable,
  mergeReceivables,
} from "../use-receivables-calendar";
import type { FinancialEntry } from "../use-financial-entries";

const baseEntry: FinancialEntry = {
  id: "entry-1",
  clinic_id: null,
  professional_id: "user-1",
  patient_id: "patient-1",
  appointment_id: null,
  type: "income",
  title: "Sessão",
  description: "Sessão clínica",
  category_id: null,
  amount: 250,
  due_date: "2026-06-12",
  competence_date: "2026-06-12",
  paid_at: null,
  status: "pending",
  payment_method: "manual",
  origin: "manual",
  neurofinance_transaction_id: null,
  neurofinance_charge_id: null,
  legacy_transaction_id: null,
  idempotency_key: null,
  reversal_of_entry_id: null,
  reversal_reason: null,
  cancelled_at: null,
  cancelled_reason: null,
  metadata: {},
  created_at: "2026-06-01T12:00:00Z",
  updated_at: "2026-06-01T12:00:00Z",
  patients: { name: "Ana", email: null },
};

describe("receivables calendar mapping", () => {
  it("keeps agenda entries editable and derives overdue status", () => {
    const item = mapFinancialEntryToReceivable(
      { ...baseEntry, origin: "appointment", appointment_id: "appointment-1" },
      "2026-06-15",
    );

    expect(item).toMatchObject({
      source: "agenda",
      editable: true,
      status: "overdue",
      patientName: "Ana",
    });
  });

  it("removes the managerial duplicate linked to a NeuroFinance charge", () => {
    const items = mergeReceivables(
      [baseEntry],
      [{
        id: "payment-1",
        financial_entry_id: "entry-1",
        patient_id: "patient-1",
        gross_amount: 25000,
        description: "Cobrança NeuroFinance",
        payment_method_type: "pix",
        status: "pending",
        normalized_status: "pending",
        funds_status: "pending",
        estimated_credit_at: "2026-06-20T12:00:00Z",
        expires_at: null,
        paid_at: null,
        confirmed_at: null,
        available_at: null,
        updated_at: "2026-06-01T12:00:00Z",
        patients: { name: "Ana" },
      }],
      "2026-06-09",
    );

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      source: "neurofinance",
      editable: false,
      amount: 250,
    });
  });
});
