import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();

const productionNbPaymentsColumns = new Set([
  "id",
  "user_id",
  "patient_id",
  "appointment_id",
  "financial_account_id",
  "provider",
  "payment_method_type",
  "status",
  "gross_amount",
  "platform_fee_amount",
  "net_amount",
  "currency",
  "description",
  "pix_qr_code",
  "pix_copy_paste",
  "checkout_url",
  "refund_amount",
  "paid_at",
  "expires_at",
  "metadata",
  "created_at",
  "updated_at",
  "dispute_status",
  "dispute_id",
  "dispute_reason",
  "dispute_amount",
  "boleto_url",
  "boleto_pdf",
  "provider_payment_id",
  "provider_status",
  "normalized_status",
  "funds_status",
  "installments",
  "channel",
  "fee_rule_id",
  "estimated_fee_amount",
  "actual_fee_amount",
  "confirmed_at",
  "available_at",
  "estimated_credit_at",
  "reconciliation_status",
  "reconciled_at",
  "anticipable",
  "anticipated",
  "installment_id",
  "provider_due_date",
  "financial_entry_id",
  "nfse_provider",
  "nfse_reference",
  "nfse_status",
  "nfse_number",
  "nfse_verification_code",
  "nfse_pdf_url",
  "nfse_xml_url",
  "nfse_status_description",
  "nfse_payload",
  "nfse_authorized_at",
  "nfse_synced_at",
  "nfse_error_message",
]);

function extractSelectForTable(source: string, tableName: string) {
  const pattern = new RegExp(
    String.raw`\.from\(["']${tableName}["']\)\s*[\r\n]+\s*\.select\(["']([^"']+)["']\)`,
    "g",
  );
  return Array.from(source.matchAll(pattern), (match) => match[1]);
}

function splitColumns(select: string) {
  return select
    .split(",")
    .map((column) => column.trim())
    .filter(Boolean)
    .filter((column) => !column.includes(":") && !column.includes("("));
}

describe("Edge Function schema selects", () => {
  it("keeps patient-portal-current nb_payments select compatible with production schema", () => {
    const source = readFileSync(
      resolve(repoRoot, "supabase/functions/patient-portal-current/index.ts"),
      "utf8",
    );

    const selects = extractSelectForTable(source, "nb_payments");
    expect(selects.length).toBeGreaterThan(0);

    const unknownColumns = selects.flatMap((select) =>
      splitColumns(select).filter((column) => !productionNbPaymentsColumns.has(column)),
    );

    expect(unknownColumns).toEqual([]);
  });
});
