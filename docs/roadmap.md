# Guddi Silai — Roadmap

> Status: **Updated** against `docs/requirements.pdf` (primary source). Foundation is complete (Phase 0).
> Phase order follows core requirements first; recommended extras (§65–§74) are grouped and deferred
> (Open Question #6 determines v1 scope).
>
> **Market benchmark note (Sept 2026):** roadmap reviewed against live Indian ethnic-wear/blouse stores
> (Aachho, Binks, Pernia's, AZA, Katansi, Anvi Couture, Shobitam, Sumissura, TheBlouseStore, AdityanDesign).
> Core roadmap already matches ~80% of their UX; gaps are captured in Phase 21 (add-ons & blouse style
> options) and the payment-vendor decision in Phase 11 / ADR 017.

## Phase 0 — Repository / Tooling (COMPLETE)
- [x] Monorepo (pnpm workspaces), TS strict, ESLint/Prettier/EditorConfig
- [x] React + Vite + Tailwind, Express + TS, Prisma + MongoDB, shared types, health check, docs
- [x] Architecture + Requirements Analysis (validated against requirements.pdf)

## Phase 1 — Domain / Database Foundation
- [ ] Final Prisma schema per `docs/database-design.md` (products, variants, catalogues, **two inventories**,
        users, orders, carts, wishlist, coupons, **offers**, reviews, enquiries, RBAC, analytics, measurements,
        notifications)
- [ ] Product capability registry + shared types
- [ ] Categories/sub-categories, colors, sizes, fibers (with price), embroidery reference data
- [ ] Admin-configurable measurement fields + instruction versioning
- [ ] Migration (`prisma db push`) on approval

## Phase 2 — Authentication + Guest Identity (§30, §82)
- [x] Guest session (browse/cart/guest checkout) — guest identity/JWT issued server-side; browse/cart/checkout in Phases 4–10
- [x] Google OAuth
- [x] Guest cart + saved-measurement merge on login
- [x] JWT + guest identity; `authorize()` RBAC middleware; admin roles

## Phase 3 — Product / Catalog (backend + admin) (COMPLETE)
- [x] Product + variant CRUD (§45 fields incl. designId, category, sub-category, type, price, discount, colors,
        sizes, fiber, embroidery, images, videos/GIF, stock, SKU, tags, SEO)
- [x] Category / sub-category / color / size / fiber (with price) / embroidery CRUD (not hard-coded)
- [x] Powerful search (§31: name, design ID, category, color, fiber, embroidery)
- [x] Filters (§32) + sort (§33) + cursor pagination/infinite scroll
- [x] Public catalog frontend (`/products`): search, filters, sort, infinite scroll, product detail (`/products/:slug`)
- [x] Admin frontend (`/admin`): login, catalogue reference CRUD, product + variant management
- [x] Sample catalogue + products seeded via `prisma db:seed`

## Phase 4 — Product Browsing (frontend)
- [x] Homepage with direct product feed + infinite scroll (§2, §5) — cursor pagination
- [x] Mobile-first layout + bottom navigation (§55)
- [ ] Responsive image grid (WebP/AVIF, lazy load, CDN) (§56)

## Phase 5 — Product Details
- [x] Product gallery with thumbnails (§7)
- [x] Desktop image zoom controls and wheel zoom; mobile pinch/double-tap remains pending (§8)
- [x] Detail info incl. design ID, price/discount/final, availability, fabric, embroidery, color, size,
        stitching, care (§9)
- [x] Like, Add to Cart, WhatsApp Enquiry, Share (§9) — capability-driven per type (§46/§83)
- [x] Product title, description, canonical URL, and Product structured data (§57–§58)

## Phase 6 — Wishlist (§26)
- [x] Guest wishlist → browser-local storage
- [x] Authenticated wishlist → database API
- [ ] Wishlist page (image/name/price/availability, Move to Cart, Remove) — local saved designs are available; Move to Cart remains pending

## Phase 7 — Cart (§27–§28)
- [ ] Two separated sections: Ready-to-Buy | Customize-with-Measurement
- [ ] Mixed cart (ready + custom), measurement status (✓/⚠), Complete Measurement button
- [ ] Server-authoritative prices/discounts/inventory/totals; split order summary
- [ ] Guest + auth cart + merge

## Phase 8 — Customization (§13–§17)
- [ ] Fiber selection popup (list + price) + filters (color/fiber/embroidery) + visual swatches (§14–§16)
- [ ] Customize flow: design confirm → fiber → measurement → order summary (§17)
- [ ] Fiber inventory check for availability (§48)
- [ ] Customization price (fiber price + ...) — **pending price-formula Open Question #1**

## Phase 9 — Measurements (§18–§23, §74)
- [ ] Admin-configurable fields + instructions + example image + GIF/video + unit (§19–§21)
- [ ] Measurement validation (§22) + inches/cm + auto-conversion (§21)
- [ ] Save My Measurements (auth) / temp for guests (§23)
- [ ] Measurement recheck + confirm before payment (§74, recommended)
- [ ] Order-time measurement snapshot + instruction version (§44)

## Phase 10 — Checkout (§29)
- [x] Simple checkout (name, mobile, email-optional, address, city, state, pincode) — guest allowed
- [ ] Order summary split; (recommended) Pincode check, Order Notes

## Phase 11 — Payments (§82, §63) — **DECISION: Razorpay (ADR 017)**
- [x] India-focused gateway — **Razorpay chosen** for a small-business/startup budget (₹0 setup/AMC, pay-per-transaction
        ~2% + GST, T+2). Already integrated in `apps/api/src/payments` (order create/verify/webhook, HMAC-verified, idempotent)
- [x] Create/verify/webhook (signature-verified, idempotent)
- [x] Payment method/status/transaction ID on order (§43)
- [ ] UPI-first checkout (UPI = 0% TDR per RBI → keeps blended cost ~0.6–1%) + **COD toggle** for trust
- [ ] (Deferred until COD volume grows) **GoKwik Smart COD / KwikCheckout** for RTO protection; **Cashfree**
        (~1.6–1.9%, T+1) documented as fallback gateway; **Instamojo links** for WhatsApp-driven sales

## Phase 12 — Orders (§35, §42–§44)
- [x] Order lifecycle with enforced sequential PDF statuses: Placed → Confirmed → Processing → Stitching → Quality Check → Packed →
        Shipped → Delivered (+ Cancelled/Returned/Failed)
- [ ] My Orders (order id, date, products, amount, payment status, order status)
- [ ] Admin order management + filters + custom-order detail (measurements + version)
- [ ] Order snapshots (embedded item + measurement snapshots)
- [x] In-app notifications on order placement and admin status changes for customers/admins (§51)
- [ ] External delivery channels (§51)

## Phase 13 — Inventory (§47–§48)
- [x] READY_MADE stock per (color×size) + SKU + out-of-stock combos (§47)
- [x] **Fiber inventory** per (fiber×color) for customization (§48)
- [x] Decrement on order (+ audit); low-stock query and admin adjustments (§51)
- [x] Customer-facing "Only X left" indicator from real stock (§67)

## Phase 14 — Admin Panel (§36–§64)
- [x] Analytics event summary dashboard foundation (visitors, product views, cart adds, wishlist adds, orders,
        payments, searches, tracked products)
- [ ] Analytics dashboard (overview, visitor, user activity, product, customer, cart, funnel, date filter,
        charts, CSV/Excel export) (§36–§41, §59–§61)
- [ ] Product/category/inventory (incl. fiber)/orders/coupons/offers/reviews/enquiries/notifications management
- [ ] RBAC enforcement (Super Admin, Order Manager, Product Manager, Stitching Manager, Analyst) + admin activity logs (§62–§64)

## Phase 15 — Reviews / Coupons / Offers
- [x] Reviews for ready-to-buy (rating, text, photo URL) + admin moderation (§34)
- [x] Coupon creation/application/removal with server-side validation and order snapshots (§49)
- [x] Offer active-listing and admin create/deactivate foundation (§50)
- [ ] Apply product/category/festival offers to cart totals and order snapshots (§50)

## Phase 16 — Analytics Events (§76–§78)
- [x] Event ingestion for the required event set + product view start/end
- [ ] View-time, unique views, zoom/wishlist/cart counts, funnel, cart abandonment (§77–§78)
- [ ] Optional GA4 feed (§82)

## Phase 17 — SEO / Performance (§56–§58)
- [x] Product SEO metadata, canonical URLs, and structured data
- [ ] Sitemap, robots, OG/social previews
- [ ] Performance: WebP/AVIF, CDN, lazy loading, responsive images, compression, browser caching
- [ ] (O) prerender/SSR decision for crawlability

## Phase 18 — Security Hardening (§63)
- [ ] Rate limiting, CSRF, secure password hashing, JWT/session hardening
- [ ] Payment webhook verification, admin activity logs
- [ ] Privacy/legal for IP/location analytics

## Phase 19 — Testing
- [ ] Unit (pricing, cart totals, inventory, measurement snapshots)
- [ ] Integration (API), E2E (ready/customize/showcase flows), accessibility/usability audit (Indian-user-friendly)

## Phase 20 — Deployment
- [ ] CI/CD, environments, monitoring & logging, load testing, backups

## Phase 21 — Add-ons & Blouse Style Options (market benchmark 2026)
> From a review of live Indian ethnic-wear/blouse stores (Aachho, Binks, Katansi, Shobitam, Anvi Couture,
> Sumissura, TheBlouseStore, AdityanDesign). These are the features competing stores have that the core
> roadmap does not — the "add-ons / extra items / customize the blouse" ideas.
- [ ] **Add-on services at checkout** (Katansi/AdityanDesign/Shobitam style): Fall & Pico (saree edge finish),
        Blouse Stitching of my-own/matching fabric, Petticoat, Tassels, matching Blouse Piece — selectable as
        order add-ons; shown in order summary + admin detail
- [ ] **In-blouse style options for CUSTOMIZE** (Anvi/Sumissura style): neckline (round/V/halter/off-shoulder),
        sleeve style + length (elbow/3-4th/full/sleeveless), back design, embroidery placement, fitting
        preference (body-fit / regular-fit / comfort-fit)
- [ ] **"Pair with / Complete the look"** cross-sell (jewellery, dupatta, petticoat) + Accessorize section
- [ ] **Shop-by-Occasion pages** (bridal / festive / party / daily) + festive campaign landing pages
        (Diwali, Holi, Onam — Binks-style collections)
- [ ] **READY_MADE blouse size-guide page** (measurement-based fit chart) linked from product pages (Binks
        XS–8XL proprietary fits, Anvi "all sizes welcome")
- [ ] **Extend facet filters** with Sleeve, Neckline, Occasion, Technique (Aachho-style sidebar — gold standard
        for this category)

## Recommended Extra Features (backlog; §65–§74)
- [ ] Recently Viewed (§65), Continue Shopping (§66), Low-stock indicator (§67), Similar Designs (§68),
        Trending Blouses (§69), WhatsApp floating + Call button (§70–§71), Pincode check (§72), Order Notes
        (§73), Measurement Recheck (§74). Scope decided by Open Question #6.

> **Ordering note:** Fiber inventory (Phase 13) is a prerequisite to full CUSTOMIZE availability checks
> (Phase 8), so both are scheduled around the customization flow. Phases 8–9 (customize + measurements) are
> prerequisites for CUSTOMIZE items in Phase 7 cart and Phase 10 checkout. Phase 21 (add-ons & blouse style)
> builds on the mixed cart (Phase 7) + checkout (Phase 10) + payments decision (Phase 11 / ADR 017).
