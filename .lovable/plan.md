## Verified-purchase reviews

Only customers who have a **delivered** order containing the product can rate/review it. Each delivered order unlocks one review for that product (so repeat buyers can review again per order). Average rating + count on products keeps auto-updating via the existing `update_product_rating` trigger — no change needed there.

### 1. Database (migration)

- Add `order_item_id uuid` column to `public.reviews` (nullable for backward compat with existing reviews).
- Drop the current unique-per-user constraint (if any) and add `UNIQUE (user_id, product_id, order_item_id)` so one review per order line, but multiple orders allowed.
- New SECURITY DEFINER function `public.user_can_review_product(_user_id uuid, _product_id int, _order_item_id uuid)` returning boolean — true only if that `order_items` row belongs to an order with `user_id = _user_id`, `status = 'delivered'`, and `product_id` matches.
- Replace the `reviews` INSERT policy with one that requires `auth.uid() = user_id AND public.user_can_review_product(auth.uid(), product_id, order_item_id)`.
- Keep existing SELECT/UPDATE/DELETE policies.

### 2. Frontend

**`src/components/reviews/ProductReviews.tsx`**
- Fetch the current user's delivered `order_items` for this product (id + order created_at) that don't yet have a review.
- Pass the list to `ReviewForm` as "reviewable orders".
- If user not logged in → show login CTA (existing behavior).
- If logged in but no eligible delivered order → show muted notice: "Only customers who purchased and received this product can write a review."
- Hide the "Write a Review" toggle entirely when no eligible orders remain.

**`src/components/reviews/ReviewForm.tsx`**
- Accept `reviewableOrders: { orderItemId, orderNumber, deliveredAt }[]`.
- If >1, show a small select: "Reviewing your order #ORD-…". If exactly 1, auto-select and show as a read-only line.
- Include `order_item_id` in the insert payload.
- On duplicate (unique-violation 23505) → toast "You've already reviewed this order."

### 3. Out of scope

- Existing reviews (pre-change) are untouched; their `order_item_id` stays NULL and they remain visible.
- No admin UI changes. Rating math unchanged.

### Files

- new `supabase/migrations/<ts>_verified_purchase_reviews.sql`
- `src/components/reviews/ProductReviews.tsx`
- `src/components/reviews/ReviewForm.tsx`

Confirm and I'll switch to build mode.