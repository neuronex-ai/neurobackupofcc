import { describe, expect, it } from "vitest";
import { toUserFacingError } from "@/lib/user-facing-error";

describe("toUserFacingError", () => {
  it("hides Edge Function implementation details", () => {
    const result = toUserFacingError(
      new Error("Failed to send a request to the Edge Function"),
      "payment",
    );

    expect(result.code).toBe("NETWORK_UNAVAILABLE");
    expect(result.message).not.toContain("Edge Function");
    expect(result.message).toContain("conexão");
  });

  it("uses a contextual fallback without exposing database errors", () => {
    const result = toUserFacingError(
      new Error("relation public.secret_table does not exist"),
      "balance",
    );

    expect(result.message).toContain("saldo");
    expect(result.message).not.toContain("secret_table");
  });
});
