# Guddi Silai — Roadmap

> Status: **Updated** against `docs/requirements.pdf` (primary source). Foundation is complete (Phase 0).
> Phase order follows core requirements first; recommended extras (§65–§74) are grouped and deferred
> (Open Question #6 determines v1 scope).

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
- [ ] Guest session (browse/cart/guest checkout)
- [ ] Google OAuth
- [ ] Guest cart + saved-measurement merge on login
- [ ] JWT + guest identity; `authorize()` RBAC middleware; admin roles

## Phase 3 — Product / Catalog (backend + admin)
- [ ] Product + variant CRUD (§45 fields incl. designId, category, sub-category, type, price, discount, colors,
        sizes, fiber, embroidery, images, videos/GIF, stock, SKU, tags, SEO)
- [ ] Category / sub-category / color / size / fiber (with price) / embroidery CRUD (not hard-coded)
- [ ] Powerful search (§31: name, design ID, category, color, fiber, embroidery)
- [ ] Filters (§32) + sort (§33) + cursor pagination/infinite scroll

## Phase 4 — Product Browsing (frontend)
- [ ] Homepage with direct product feed + infinite scroll (§2, §5) — cursor pagination
- [ ] Mobile-first layout + bottom navigation (§55)
- [ ] Responsive image grid (WebP/AVIF, lazy load, CDN) (§56)

## Phase 5 — Product Details
- [ ] Product gallery (front/back/side/sleeve/fabric/embroidery/model + thumbnails) (§7)
- [ ] Mobile-style image zoom (pinch/double-tap/drag; desktop wheel/buttons) (§8)
- [ ] Detail info incl. design ID, price/discount/final, availability, fabric, embroidery, color, size,
        stitching, care (§9)
- [ ] Like, Add to Cart, Buy Now, WhatsApp Enquiry, Share (§9) — capability-driven per type (§46/§83)
- [ ] SEO metadata + structured data + social preview (§57–§58)

## Phase 6 — Wishlist (§26)
- [ ] Guest wishlist → browser-local storage
- [ ] Authenticated wishlist → database
- [ ] Wishlist page (image/name/price/availability, Move to Cart, Remove)

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
- [ ] Simple checkout (name, mobile, email-optional, address, city, state, pincode) — guest allowed
- [ ] Order summary split; (recommended) Pincode check, Order Notes

## Phase 11 — Payments (§82, §63)
- [ ] India-focused gateway (Razorpay or chosen provider — Open Question #5)
- [ ] Create/verify/webhook (signature-verified, idempotent)
- [ ] Payment method/status/transaction ID on order (§43)

## Phase 12 — Orders (§35, §42–§44)
- [ ] Order lifecycle with PDF statuses: Placed → Confirmed → Processing → Stitching → Quality Check → Packed →
        Shipped → Delivered (+ Cancelled/Returned/Failed)
- [ ] My Orders (order id, date, products, amount, payment status, order status)
- [ ] Admin order management + filters + custom-order detail (measurements + version)
- [ ] Order snapshots (embedded item + measurement snapshots)
- [ ] Notifications (customer + admin) (§51)

## Phase 13 — Inventory (§47–§48)
- [ ] READY_MADE stock per (color×size) + SKU + out-of-stock combos (§47)
- [ ] **Fiber inventory** per (fiber×color) for customization (§48)
- [ ] Decrement on order (+ audit); low-stock alerts (§51); (recommended) "Only X left" indicator (§67)

## Phase 14 — Admin Panel (§36–§64)
- [ ] Analytics dashboard (overview, visitor, user activity, product, customer, cart, funnel, date filter,
        charts, CSV/Excel export) (§36–§41, §59–§61)
- [ ] Product/category/inventory (incl. fiber)/orders/coupons/offers/reviews/enquiries/notifications management
- [ ] RBAC enforcement (Super Admin, Order Manager, Product Manager, Stitching Manager, Analyst) + admin activity logs (§62–§64)

## Phase 15 — Reviews / Coupons / Offers
- [ ] Reviews for ready-to-buy (rating, text, photo) + admin moderation (§34)
- [ ] Coupons (§49) + Offers/product-category-festival discounts (§50)

## Phase 16 — Analytics Events (§76–§78)
- [ ] Event ingestion for the full required set + product view start/end
- [ ] View-time, unique views, zoom/wishlist/cart counts, funnel, cart abandonment (§77–§78)
- [ ] Optional GA4 feed (§82)

## Phase 17 — SEO / Performance (§56–§58)
- [ ] SEO metadata, canonical unique URLs, structured data, sitemap, robots, OG/social previews
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

## Recommended Extra Features (backlog; §65–§74)
- [ ] Recently Viewed (§65), Continue Shopping (§66), Low-stock indicator (§67), Similar Designs (§68),
        Trending Blouses (§69), WhatsApp floating + Call button (§70–§71), Pincode check (§72), Order Notes
        (§73), Measurement Recheck (§74). Scope decided by Open Question #6.

> **Ordering note:** Fiber inventory (Phase 13) is a prerequisite to full CUSTOMIZE availability checks
> (Phase 8), so both are scheduled around the customization flow. Phases 8–9 (customize + measurements) are
> prerequisites for CUSTOMIZE items in Phase 7 cart and Phase 10 checkout.
