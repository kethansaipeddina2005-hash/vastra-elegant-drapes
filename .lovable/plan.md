# Stock restore + checkout re-validation

Two related fixes so inventory stays accurate end-to-end.

## 1. Auto-restore stock when an order is cancelled or returned

Today a DB trigger decrements `products.stock_quantity` on every new `order_items` row, but stock is **never** added back when an order is cancelled or returned. Result: oversold-looking inventory and false "Out of Stock" badges.

**Migration:**
- New SECURITY DEFINER function `restore_product_stock_for_order(order_id uuid)` that loops the order's items and increments `products.stock_quantity` by each item's qty.
- New trigger `restore_stock_on_order_status_change` on `AFTER UPDATE OF status ON public.orders`:
  - If `OLD.status NOT IN ('cancelled','returned')` AND `NEW.status IN ('cancelled','returned')` → call restore function.
  - Guard with a per-order `stock_restored boolean DEFAULT false` column on `orders` so toggling status twice (e.g. returned → cancelled) never double-restores.
- Add `stock_restored` column (default false), set true inside the restore function.
- Revoke EXECUTE from PUBLIC / anon / authenticated on the new function.

No change to the existing decrement trigger.

## 2. Block checkout when cart qty > current stock

Race: user adds 2 to cart, admin/another buyer reduces stock to 1, user proceeds to pay. Today nothing blocks them.

**`src/pages/Checkout.tsx`:**
- Before creating the Razorpay order / COD finalize call, fetch live `id, stock_quantity, name` for every `cart` item id in one query.
- If any item has `stock_quantity < cart qty`:
  - Show a destructive toast listing the affected products and the max available.
  - Auto-clamp cart quantities via `updateQuantity` (already in CartContext) or remove if stock = 0.
  - Abort the payment step; user stays on checkout to review.
- Run this re-check on Checkout mount too so the totals shown already reflect reality.

## 3. Low-stock surfacing (small UX nicety, same scope)

- `ProductCard`: when `1 ≤ stockQuantity ≤ 3`, show an amber "Only N left" badge (reusing existing badge slot, hidden when out of stock).

## Technical details

- Files touched:
  - new `supabase/migrations/<ts>_restore_stock_on_cancel_return.sql`
  - `src/pages/Checkout.tsx` (pre-payment stock check)
  - `src/components/ProductCard.tsx` (low-stock badge)
- No edge-function changes.
- No change to existing decrement trigger or `order_items` schema.
- The new orders column `stock_restored` is internal; no UI surfaces it.

Confirm and I'll switch to build mode and ship it.
