import { describe, expect, it } from "vitest";
import { findBoletoCandidate, normalizeBoletoInput, onlyDigits } from "../boleto";

describe("boleto helpers", () => {
  it("normalizes line input", () => {
    expect(onlyDigits("00190.00009 01234.567890 12345.678901 1 12340000015000")).toBe(
      "00190000090123456789012345678901112340000015000",
    );
  });

  it("detects barcode vs line", () => {
    expect(normalizeBoletoInput("1".repeat(44))).toMatchObject({ kind: "barcode", isValid: true });
    expect(normalizeBoletoInput("1".repeat(47))).toMatchObject({ kind: "identificationField", isValid: true });
  });

  it("finds boleto candidates in text", () => {
    expect(findBoletoCandidate(`boleto ${"9".repeat(47)} fim`)).toBe("9".repeat(47));
  });
});
