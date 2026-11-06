import { describe, expect, it } from "vitest";
import { isOrderConfirmed } from "./orderConfirmation";

describe("order confirmation", () => {
  it("pending online payment never confirms even with a legacy processing status", () => {
    expect(isOrderConfirmed({ payment_method: "razorpay", payment_status: "pending", status: "processing" })).toBe(false);
  });
  it("failed online payment never confirms", () => {
    expect(isOrderConfirmed({ payment_method: "razorpay", payment_status: "failed", status: "processing" })).toBe(false);
  });
  it("completed online payment confirms a processing order", () => {
    expect(isOrderConfirmed({ payment_method: "razorpay", payment_status: "completed", status: "processing" })).toBe(true);
  });
  it("COD remains confirmed at placement", () => {
    expect(isOrderConfirmed({ payment_method: "cod", payment_status: "pending", status: "processing" })).toBe(true);
  });
  it("cancelled orders cannot confirm", () => {
    expect(isOrderConfirmed({ payment_method: "razorpay", payment_status: "completed", status: "cancelled" })).toBe(false);
  });
});