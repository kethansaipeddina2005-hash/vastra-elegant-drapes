export type PaymentOrder = {
  razorpay_order_id: string | null;
  final_amount: number | string;
  payment_status: string | null;
  status: string;
  payment_method: string | null;
};

export function validateCapturedPayment(order: PaymentOrder, payment: {
  id: string; order_id: string; amount: number; currency: string; status: string;
}): void {
  if (order.payment_method !== "razorpay") throw new Error("Not an online payment order");
  if (!order.razorpay_order_id || payment.order_id !== order.razorpay_order_id) throw new Error("Payment order mismatch");
  if (payment.status !== "captured") throw new Error("Payment has not been captured");
  if (payment.currency !== "INR" || payment.amount !== Math.round(Number(order.final_amount) * 100)) throw new Error("Payment amount mismatch");
  if (!["pending_payment", "processing"].includes(order.status)) throw new Error("Order cannot be confirmed");
}

export function canNotifyOrder(order: { payment_method: string | null; payment_status: string | null; status: string }): boolean {
  return order.status !== "pending_payment" && order.status !== "cancelled" &&
    (order.payment_method === "cod" || order.payment_status === "completed");
}

export function signaturesMatch(expected: string, supplied: string): boolean {
  if (!/^[a-f0-9]{64}$/.test(supplied) || expected.length !== supplied.length) return false;
  let difference = 0;
  for (let i = 0; i < expected.length; i++) difference |= expected.charCodeAt(i) ^ supplied.charCodeAt(i);
  return difference === 0;
}