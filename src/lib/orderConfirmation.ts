export type OrderConfirmation = {
  payment_method: string | null;
  payment_status: string | null;
  status: string;
};

export function isOrderConfirmed(order: OrderConfirmation): boolean {
  if (["pending", "pending_payment", "cancelled", "returned"].includes(order.status)) return false;
  return order.payment_method === "cod" || order.payment_status === "completed";
}