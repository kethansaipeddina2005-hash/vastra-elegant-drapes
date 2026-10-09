import { supabase } from "@/integrations/supabase/client";

type Line = { id: number | string; price: number; quantity: number };

/**
 * Partner coupons only discount that partner's products. Returns the effective
 * whole-cart percent so the existing percent-based totals stay correct,
 * or null when the cart holds none of the partner's products.
 */
export async function effectiveCouponPercent(
  coupon: { discount_percent: number; partner_id?: string | null },
  lines: Line[],
): Promise<number | null> {
  if (!coupon.partner_id) return coupon.discount_percent;
  const ids = lines.map((l) => Number(l.id));
  if (!ids.length) return null;
  const { data } = await supabase.from("products").select("id, partner_id").in("id", ids);
  const mine = new Set((data || []).filter((p) => p.partner_id === coupon.partner_id).map((p) => p.id));
  const total = lines.reduce((s, l) => s + l.price * l.quantity, 0);
  const eligible = lines.filter((l) => mine.has(Number(l.id))).reduce((s, l) => s + l.price * l.quantity, 0);
  if (!eligible || !total) return null;
  return Math.max(1, Math.round((coupon.discount_percent * eligible) / total));
}
