import { describe, expect, it } from "vitest";

function fee(amount: number, percent: number, fixed: number) {
  return Math.round(amount * percent) + fixed;
}

describe("neurofinance simulator math", () => {
  it("calculates fixed plus percentual fee in cents", () => {
    expect(fee(15000, 0.0299, 49)).toBe(498);
  });

  it("grosses up when fee is passed to the client", () => {
    const amount = 70000;
    const charged = Math.ceil((amount + 49) / (1 - 0.0299));
    expect(charged).toBeGreaterThan(amount);
  });
});
