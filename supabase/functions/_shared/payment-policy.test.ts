import { describe, expect, test } from "bun:test";
import { canNotifyOrder, signaturesMatch, validateCapturedPayment } from "./payment-policy";

const order = { razorpay_order_id: "order_fixture", final_amount: 1200, payment_status: "pending", status: "pending_payment", payment_method: "razorpay" };
const payment = { id: "pay_fixture", order_id: "order_fixture", amount: 120000, currency: "INR", status: "captured" };
describe("Razorpay confirmation rules", () => {
  test("captured payment for the correct order passes", () => expect(() => validateCapturedPayment(order, payment)).not.toThrow());
  test("failed payment cannot confirm", () => expect(() => validateCapturedPayment(order, { ...payment, status: "failed" })).toThrow());
  test("cancelled order cannot confirm", () => expect(() => validateCapturedPayment({ ...order, status: "cancelled" }, payment)).toThrow());
  test("retry after cancelled attempt can confirm", () => expect(() => validateCapturedPayment({ ...order, payment_status: "cancelled" }, payment)).not.toThrow());
  test("duplicate captured confirmation keeps the same valid linkage", () => expect(() => validateCapturedPayment({ ...order, payment_status: "completed", status: "processing" }, payment)).not.toThrow());
  test("webhook payment for another order cannot confirm", () => expect(() => validateCapturedPayment(order, { ...payment, order_id: "order_other" })).toThrow());
  test("bad signatures are rejected", () => expect(signaturesMatch("a".repeat(64), "b".repeat(64))).toBe(false));
  test("wrong amount cannot confirm", () => expect(() => validateCapturedPayment(order, { ...payment, amount: 119999 })).toThrow());
  test("authorization without capture cannot confirm", () => expect(() => validateCapturedPayment(order, { ...payment, status: "authorized" })).toThrow());
  test("unpaid online order cannot send confirmation", () => expect(canNotifyOrder(order)).toBe(false));
  test("confirmed COD can notify without online payment", () => expect(canNotifyOrder({ ...order, payment_method: "cod", status: "processing" })).toBe(true));
});