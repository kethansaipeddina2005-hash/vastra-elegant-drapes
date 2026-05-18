
# Add International Payment Gateway (Stripe)

Per project rules: Razorpay/COD handle India, **Stripe** handles international. UPI stays India-only (and is being phased out per memory).

## Approach

Use the user's own Stripe account (BYOK) since the project already follows that pattern with Razorpay keys. Stripe will be triggered automatically when the buyer's `pricingRegion` is `foreign` (USD) — matching the existing `PricingContext` logic.

## Changes

### 1. Secrets
Add via `add_secret`:
- `STRIPE_SECRET_KEY` (sk_live_... or sk_test_...)
- `STRIPE_WEBHOOK_SECRET` (for payment verification webhook)

Publishable key (`pk_...`) will be returned from the create-session function so it stays out of the repo.

### 2. New Edge Functions
- `supabase/functions/create-stripe-session/index.ts` — authenticates user, creates a Stripe Checkout Session in USD using the order's line items, stores `stripe_session_id` on the order, returns the hosted checkout URL.
- `supabase/functions/verify-stripe-payment/index.ts` — called on return from Stripe success URL; retrieves the session, verifies `payment_status === 'paid'`, updates the order to `payment_status=completed`, `status=processing`, triggers existing `send-order-notification`.

Register both in `supabase/config.toml`.

### 3. Database
Migration to add `stripe_session_id text` and `stripe_payment_intent_id text` columns to `orders` (nullable).

### 4. Frontend (`src/pages/Checkout.tsx`)
- Read `pricingRegion` from `PricingContext`.
- If `foreign`: show **Stripe (International Card Payment)** as the only online option (plus COD if allowed for international — confirm in question below). Hide Razorpay.
- If `india`: keep current Razorpay + COD (unchanged).
- On "Place Order" with Stripe selected → create order row → invoke `create-stripe-session` → `window.location = checkoutUrl`.
- `PaymentSuccess.tsx`: detect `?session_id=...` query param → call `verify-stripe-payment` before showing success.
- `PaymentFailure.tsx`: handle Stripe cancel redirect.

### 5. Admin
`src/pages/admin/Payments.tsx` — display `stripe_session_id` when present (read-only, alongside existing Razorpay ID).

## Technical Notes
- Amounts sent to Stripe use `foreignPrice` (USD) × 100 (cents).
- Success URL: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&order_id=<id>`
- Cancel URL: `${origin}/payment-failure?order_id=<id>`
- Stripe SDK loaded server-side only via `npm:stripe@17` in the edge function — no client-side Stripe.js needed since we use hosted Checkout.
- CORS headers included on both functions.

## Clarifying questions
1. Use BYOK (your own Stripe account & keys) or do you want me to enable Lovable's built-in seamless Stripe (no account needed)?
2. Should COD be available for international orders, or Stripe-only?
