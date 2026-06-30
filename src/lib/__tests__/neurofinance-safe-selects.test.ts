import { describe, expect, it } from "vitest";
import {
  FINANCIAL_ACCOUNT_SAFE_SELECT,
  FORBIDDEN_FINANCIAL_ACCOUNT_FIELDS,
  FORBIDDEN_NB_PAYMENT_FIELDS,
  FORBIDDEN_NB_PAYOUT_FIELDS,
  NB_PAYMENTS_SAFE_SELECT,
  NB_PAYOUTS_SAFE_SELECT,
} from "../neurofinance-safe-selects";

function selectedFields(select: string) {
  return new Set(select.split(",").map((field) => field.trim()).filter(Boolean));
}

describe("NeuroFinance safe read contracts", () => {
  it("does not expose sensitive financial account fields", () => {
    const fields = selectedFields(FINANCIAL_ACCOUNT_SAFE_SELECT);
    for (const forbidden of FORBIDDEN_FINANCIAL_ACCOUNT_FIELDS) {
      expect(fields.has(forbidden)).toBe(false);
    }
  });

  it("does not expose provider payment internals", () => {
    const fields = selectedFields(NB_PAYMENTS_SAFE_SELECT);
    for (const forbidden of FORBIDDEN_NB_PAYMENT_FIELDS) {
      expect(fields.has(forbidden)).toBe(false);
    }
  });

  it("does not expose provider payout internals", () => {
    const fields = selectedFields(NB_PAYOUTS_SAFE_SELECT);
    for (const forbidden of FORBIDDEN_NB_PAYOUT_FIELDS) {
      expect(fields.has(forbidden)).toBe(false);
    }
  });
});
