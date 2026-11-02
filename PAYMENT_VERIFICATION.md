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
- Deployed webhook currently returns HTTP 500 because its signing secret is not configured.
- Guest product-to-cart-to-checkout navigation works for product 52; delivery fields and Pay Securely are visible, without runtime errors.
- Latest observed app checks report build OK.

## Not yet verified
- The policy tests are not real Razorpay transactions or full handler integration tests.
- No live charge was submitted; success, failure, cancellation, retries and duplicate callbacks still require gateway end-to-end checks.
- Webhook event setup and signature verification require the matching Razorpay webhook secret.
- Customer/admin inbox delivery is unverified. The existing sender uses onboarding@resend.dev, which may restrict recipients until a sending domain is verified.
- Failed/abandoned order inventory expiry and release remain a separate unresolved lifecycle concern; this continuation retains the existing reservation/restoration behavior.