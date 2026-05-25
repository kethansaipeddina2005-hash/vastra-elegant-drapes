## Goal

Send a detailed email to **kethansaipeddina2005@gmail.com** whenever:
1. A new order is placed
2. A customer requests a return

Each email includes: order #, customer name/email/phone, full shipping address, all line items, totals, payment method, payment status, and order status.

## Note on "replacement"

The current schema has no replacement flow — only returns (`status: return_requested` → `returned` + refund). I'll wire the same notification to fire for return requests. If you actually want a separate "replacement" workflow added (new status, admin UI, customer trigger), that's a bigger change — happy to scope it next if you want it.

## Changes

### 1. `supabase/functions/send-order-notification/index.ts`
- Add `kethansaipeddina2005@gmail.com` to the `to:` array (alongside existing `kethan2311@gmail.com`).
- No template changes — it already includes order #, customer info, address, items, payment status/method, totals.

### 2. New edge function: `send-return-notification`
- Triggered when a customer clicks "Request Return" on `src/pages/account/Orders.tsx`.
- Recipients: `kethan2311@gmail.com` + `kethansaipeddina2005@gmail.com`.
- Pulls order, order_items, product names, and shipping address server-side (using service role) from the order ID — so the client can't forge contents.
- Email body: subject `Return requested — Order #XXXX`, plus the same detail block used by order notifications, with a "Return requested on <date>" header and the reason (if provided).
- HTML-escapes all user fields (same helper pattern already used in `send-order-notification`).

### 3. `src/pages/account/Orders.tsx`
- After the existing `update({ status: 'return_requested' })` succeeds, invoke `send-return-notification` with `{ orderId }`. Failure to email does not block the status update (logged, toast still shows success).

### 4. Memory update
- Update `mem://integrations/email-notifications` to record that admin notifications go to both `kethan2311@gmail.com` and `kethansaipeddina2005@gmail.com`, and that return requests now also trigger an admin email.

## Out of scope (ask if you want these)
- Adding a true replacement workflow (new order status, customer UI, admin handling).
- Notifying the customer (these are admin-only emails).
- Switching to Lovable Emails / branded domain — current setup uses Resend with the existing `RESEND_API_KEY` secret; keeping that.
