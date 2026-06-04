# High-Impact Improvements — Phase 1

Focusing on changes that protect the store, increase conversion, and make admin work easier. Grouped into 4 ship-ready batches you can approve individually or all at once.

---

## Batch 1 — Security & SEO foundation (do first, low risk)

**Why first:** Protects customer data and improves Google rankings. No UI risk.

1. **Run backend security scan** and fix any RLS / GRANT gaps it reports (reviews, orders, addresses tables are the most likely culprits after recent changes).
2. **Product structured data (JSON-LD)** on `ProductDetail.tsx`:
   - `Product` schema with `name`, `image`, `description`, `sku`, `brand: Vastra`
   - `offers` → price, priceCurrency (INR/USD based on PricingContext), availability from `stockQuantity`
   - `aggregateRating` when `reviews > 0` (uses the rating we already auto-calc)
   - `review` array for the latest 3 reviews
3. **Dynamic sitemap**: replace static `public/sitemap.xml` with a build-time generator that pulls all active products + blog slugs from the DB.
4. **Per-page canonical + OG image** audit using existing `SEO.tsx` — fill gaps on Collections, Blog, Product pages.

---

## Batch 2 — Admin dashboard reorganization + analytics

**Why:** Dashboard now has 12 quick-action buttons in one flat grid. Hard to scan.

1. **Group quick actions** into 4 labeled sections:
   - **Catalog** — Products, Categories, Banners, Popup Ads
   - **Sales** — Orders, Payments, Coupons
   - **Customers** — Customers, Admins, Chat, Messages
   - **Marketing** — Subscriptions
2. **Add a charts row** above the stats grid using Recharts (already a likely dep — will check):
   - Revenue last 30 days (line)
   - Orders by status (donut)
   - Top 5 products by units sold (bar)
3. **Low-stock alert card** — lists products with `stock_quantity <= 3` linking to edit page.
4. Keep the existing 5 stat cards; just re-style header spacing for breathing room.

---

## Batch 3 — Product page conversion & trust

**Why:** This is the page where money is made. Small additions, big lift.

1. **Stock urgency badge** — show "Only N left" when `stockQuantity <= 5` (warm gold pill, matches brand).
2. **Verified-purchase review filters** — toggle chips: "All / With photos / 5★ / 4★ / 3★ ↓" on `ReviewList.tsx`.
3. **Review sort** — Most recent (default) / Highest rated / Most helpful (helpful voting deferred to Batch 4).
4. **Image lazy loading + responsive `srcset`** on product gallery and product cards — biggest perf win for mobile.
5. **Sticky "Add to Cart" bar on mobile** when the main CTA scrolls out of view (matches existing mobile bottom nav pattern, sits above it).

---

## Batch 4 — Review engagement (optional follow-up)

1. **Helpful / Not helpful voting** on reviews — new `review_votes` table (user_id, review_id, vote), one vote per user per review, count cached on `reviews.helpful_count`.
2. **Auto review-reminder email** 3 days post-delivery using the existing email infra — single transactional template linking to the product, deduped via `idempotencyKey = order_item_id`.

---

## Technical notes

- **Security**: only act on real scanner findings; do not blanket-rewrite policies.
- **SEO**: structured data lives in `<Helmet>` as `<script type="application/ld+json">`. No new deps.
- **Sitemap**: a small Node script in `scripts/generate-sitemap.ts` invoked from `vite build` via `package.json`. Reads Supabase using the anon key and `is_active = true`.
- **Charts**: confirm Recharts is installed (shadcn `chart.tsx` already exists, so likely yes). Queries go through new `useAdminAnalytics` hook with React Query, 5-min stale time.
- **Sticky CTA**: pure CSS + `IntersectionObserver` on the desktop CTA — no layout shift.
- **Review votes**: new migration with table + GRANTs + RLS (one vote per user per review). `helpful_count` updated via trigger.

---

## Files touched (estimate)

- `supabase/migrations/<ts>_review_votes.sql` (Batch 4)
- `src/pages/ProductDetail.tsx`, `src/components/SEO.tsx` (Batch 1, 3)
- `src/pages/admin/Dashboard.tsx`, new `src/components/admin/AdminCharts.tsx`, new `src/hooks/useAdminAnalytics.ts` (Batch 2)
- `src/components/reviews/ReviewList.tsx` (Batch 3, 4)
- `src/components/MediaCarousel.tsx`, `src/components/ProductCard.tsx` (Batch 3 lazy-load)
- `scripts/generate-sitemap.ts`, `package.json`, `vercel.json` (Batch 1)
- One new transactional email template + trigger (Batch 4)

---

## Out of scope (kept for later phases)

Abandoned cart emails, PWA/offline, wishlist sharing, loyalty/referrals, bundle upsell, WhatsApp order confirmation, push notifications, bulk CSV product import.

---

**Recommendation:** Approve **Batch 1 + 2 + 3** together — they're independent and ship in one go. Batch 4 needs the review-votes migration which is best done as its own follow-up. Reply with which batches to execute (e.g. "1,2,3" or "all").