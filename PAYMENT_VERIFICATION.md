# Razorpay continuation checks

## Completed
- Applied server-derived checkout totals using stored order items, shipping destination, coupon scope and use limits.
- Linked gateway orders before checkout; retries reuse the stored gateway order.
- Callback and webhook confirmation require the matching gateway order, captured payment, exact amount and INR.
- Added unique payment/order linkage indexes and confirmation-eligible email checks.
- Deployed create-razorpay-order, verify-razorpay-payment, razorpay-webhook, send-order-notification and finalize-cod-order.
- Added 11 passing policy tests covering captured success, failure, cancellation, retry eligibility, duplicate eligibility, wrong linkage, invalid signature, wrong amount, authorization without capture and notification eligibility.

## Observed checks
- Deployed create-razorpay-order rejects a nonexistent order with HTTP 404.
- Deployed verify-razorpay-payment rejects malformed input with HTTP 400.
- Webhook signing secret is securely saved; the deployed endpoint rejects an unsigned request with HTTP 400, Invalid signature.
- Guest product-to-cart-to-checkout navigation works for product 52; delivery fields and Pay Securely are visible, without runtime errors.
- Latest observed app checks report build OK.

## Not yet verified
- The policy tests are not real Razorpay transactions or full handler integration tests.
- No live charge was submitted; success, failure, cancellation, retries and duplicate callbacks still require gateway end-to-end checks.
- Razorpay event setup and successful signed-event delivery are not verified; the secret is saved in Lovable Cloud and must match the Razorpay webhook configuration.
- Customer/admin inbox delivery is unverified. The existing sender uses onboarding@resend.dev, which may restrict recipients until a sending domain is verified.
- Real Razorpay captured-payment delivery remains unverified; inventory now deducts at verified completion rather than online draft creation.

## Payment/inventory correction
- Pending and failed online orders keep total and size stock unchanged. COD deducts at placement.
- Completion atomically locks products, rechecks availability and deducts once; duplicate completion does not deduct again. Cancellation restores only inventory actually deducted.
- The database prevents processing/shipping/delivery of unpaid online orders and prevents admin clients from manually marking Razorpay payments completed.
- Trusted checkout/payment functions can update protected fields; failure/cancellation attempts remain pending_payment without clearing the cart.
- Thank-you success copy, purchase tracking and cart clearing require a confirmed receipt.
- A privileged, rollback-isolated database regression exercised real guest-order creation, failed-attempt recording, pending/failed size stock, completed-payment deduction, duplicate completion, cancellation restoration and COD. It passed; no fixture rows remain.
- Six legacy unshipped unpaid Razorpay orders were changed to pending_payment and their previously deducted stock restored. Already shipped/delivered unpaid orders were deliberately not changed because physical fulfillment and gateway reconciliation must be checked first.
- Browser reproduced the old unverified success heading, then confirmed it is absent after the fix. No live charge or real inbox delivery was performed.