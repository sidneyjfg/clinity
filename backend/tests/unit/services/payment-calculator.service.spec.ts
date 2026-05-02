import { describe, expect, it } from "vitest";

import { PaymentCalculatorService } from "../../../src/services/payment-calculator.service";

describe("PaymentCalculatorService", () => {
  it("applies online discount and fixed Stripe Connect 10% platform fee", () => {
    const service = new PaymentCalculatorService();

    const result = service.calculate("online", 20000, {
      commissionRateBps: 5000,
      onlineDiscountBps: 500,
    });

    expect(result).toEqual({
      paymentType: "online",
      originalAmountCents: 20000,
      discountedAmountCents: 19000,
      onlineDiscountCents: 1000,
      platformCommissionRateBps: 1000,
      platformCommissionCents: 1900,
      providerNetAmountCents: 17100,
      paymentStatus: "pending",
    });
  });

  it("does not apply discount for presential payment and keeps the fixed 10% fee", () => {
    const service = new PaymentCalculatorService();

    const result = service.calculate("presential", 20000, {
      commissionRateBps: 1000,
      onlineDiscountBps: 500,
    });

    expect(result.discountedAmountCents).toBe(20000);
    expect(result.onlineDiscountCents).toBe(0);
    expect(result.platformCommissionCents).toBe(2000);
    expect(result.providerNetAmountCents).toBe(18000);
    expect(result.paymentStatus).toBe("pending_local");
  });
});
