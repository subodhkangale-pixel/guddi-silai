# Guddi Silai — API Architecture (Design)

> Status: **Design only.** Validated against `docs/requirements.pdf`. No endpoints are implemented yet.
> Base path `/api/v1`. JSON over HTTP.

---

## 0. Cross-Cutting Conventions

### 0.1 Authentication (R §30, §82)
- **AuthN**: JWT for authenticated users (Google OAuth primarily, guest-first). Guest identity via an
  anonymous browser/session key. Login is **optional**; content is never behind login (§30).
- **AuthZ**: RBAC via `AdminRole`/`Permission` for admin; ownership scoping for user data.
- Never trust client values for price, discount, inventory, payment status, order totals, permissions.

### 0.2 Validation
- Zod at route boundary. Measurement validation per §22 (reject invalid, e.g., Bust 500).

### 0.3 Pagination
- Offset for admin grids; **cursor pagination for the homepage infinite-scroll feed** (§5) and append-only logs.

### 0.4 Error handling
- Existing `AppError`/`errorHandler`; validation → 400 with details.

### 0.5 Security (R §63)
- Admin authentication, RBAC, secure password hashing, JWT/session, rate limiting, input validation, XSS, CSRF
  where applicable, payment webhook verification, admin activity logs, and privacy/legal handling for
  IP/location data collection.

---

## 1. /auth — Authentication + Guest Identity (R §30, §82)

Options: **Continue as Guest**, **Continue with Google**. Login optional.
- `POST /auth/guest` — issue guest session (browse/cart).
- `POST /auth/google` — Google OAuth exchange (account create/login + link).
- `POST /auth/merge` — merge guest cart (and, where relevant, saved measurements) into account.
- (O) Email/password registration only if required (PDF shows Google + guest only).

Guest wishlist is **browser-local** (§26), so no server guest-wishlist API is needed (client handles it).

---

## 2. /admin — RBAC (R §62–§64)

- Permissions grouped into roles: **Super Admin**, **Order Manager**, **Product Manager**, **Stitching Manager**,
  **Analyst** (§62). Role→permission model per ADR-013.
- Central `authorize()` permission middleware; **admin activity logging** on every sensitive mutation (§64).
- Sub-areas: users/roles, activity logs, products, categories, inventory (including **fiber inventory** §48),
  orders, coupons/offers, reviews moderation, enquiries, notifications, analytics dashboards + export.

---

## 3. /products (R §31–§33, §45)

- `GET /products` — paginated/cursor listing, filters (§32: category, price range, color, fabric, embroidery,
  availability incl. Upcoming), sort (§33: Newest, Most Popular, Price low→high/high→low, Most Liked, Most
  Viewed, Best Rated), **search** (§31: name, design ID, category, color, fiber, embroidery).
- `GET /products/:slug` — detail incl. gallery, variants/options, SEO, WhatsApp/share info.
- Admin: product + variant CRUD with §45 fields (designId, category, sub-category, type, price, discount,
  colors, sizes, fiber, embroidery, images, videos/GIF, stock, SKU, tags, SEO).

---

## 4. /categories, /subcategories, /colors, /sizes, /fibers, /embroidery

- `GET` public (active reference data).
- `/fibers` include per-fiber price (§16: Silk ₹299, etc.) + availability.
- Admin CRUD with soft delete; categories not hard-coded (§4).
- (O) Sub-category depth semantics.

---

## 5. /inventory (R §47–§48)

- **Ready-made**: read stock per (color×size) variant; availability; unavailable combos returned as out-of-stock.
- **Fiber inventory**: stock/availability per (fiber×color) for the customize flow (§48).
- Admin: manage both; low-stock alerts (§51) and "Only X left" indicator from real stock (§67).

---

## 6. /measurements (R §18–§23)

- `GET /measurements/fields` — active fields incl. instructions, example image, GIF/video, unit, required
  (public — drives the measurement form).
- Authenticated: `GET/POST/PATCH/DELETE /measurements/profiles` — saved profiles (§23).
- Guests: measurements handled in the cart/order session (temp), not a server profile.
- Admin: `POST/PATCH /measurements/fields` — configure fields + instruction version.
- Validation: reject invalid (§22); unit inches/cm + auto-conversion (§21).

---

## 7. /wishlist (R §26)

- Authenticated: `GET/POST/DELETE /wishlist` (DB-backed).
- Guest: **browser-local** (no server API).
- Wishlist display data (image/name/price/availability) served via `/products` as needed; "Move to Cart" supported.

---

## 8. /cart (R §27–§28)

Server-authoritative cart, guest + auth, **two separated sections** (Ready-to-Buy | Customize).
- `GET /cart` — items + authoritative totals; sections + measurement status (✓/⚠).
- `POST /cart/items` — READY_MADE (variantId + qty) OR CUSTOMIZE (product + fiberId + color [+ measurements]).
- `PATCH /cart/items/:id`, `DELETE /cart/items/:id`, `DELETE /cart`.
- `POST /cart/items/:id/measurements` — set/complete measurements for a CUSTOMIZE item (updates status).
- `POST /cart/apply-coupon`, `DELETE /cart/coupon`.
- Mixed cart + split order summary supported. Server recomputes prices (incl. fiber price), inventory
  (ready + fiber), discount, totals.
- Guest cart merges into account on login (§30).

---

## 9. /orders (R §35, §42–§44)

- `POST /orders` — place order; snapshot items (incl. measurements + instruction version for custom); decrement
  ready + fiber inventory.
- `GET /orders` / `GET /orders/:id` — My Orders (order id, date, products, amount, payment status, order status
  §35).
- `GET /orders/:id/track` — status tracking.
- Admin: `GET/PATCH /orders` with status filters (All, New, Confirmed, Processing, Stitching, Packed, Shipped,
  Delivered, Cancelled, Returned, Failed §42); order detail incl. custom-order measurements + version (§44);
  `POST /orders/:id/cancel`, refund.
- Order-status transitions use the exact PDF labels (§35/§42) — see database-design §9.2.

---

## 10. /payments (R §82, §63)

- India-focused gateway (Razorpay/another suitable provider — provider is an open decision detail).
- `POST /payments/create`, `POST /payments/verify`, `POST /payments/webhook` (signature-verified, idempotent).
- Payment method/status/transaction ID recorded on the order (§43). Never trust client payment status/amounts.

---

## 11. /reviews (R §34)

- Reviews/ratings for **ready-to-buy** products; rating + text + photo review.
- `GET /products/:slug/reviews`, `POST /reviews` (authenticated, buyer), admin `PATCH /reviews/:id` (approve/delete).

---

## 12. /coupons & /offers (R §49–§50)

- Admin CRUD for coupons (§49: percent/fixed, min order, max discount, category/product, expiry, usage limit).
- Admin CRUD for offers (§50: product discount, category discount, festival sale, limited-time).
- Application evaluated server-side at cart/checkout.

---

## 13. /enquiries (R §24, §75)

- WhatsApp enquiry via deep link + auto-generated message (§24) — client-side generation from current product URL.
- `POST /enquiries` (optional persistence) + admin `GET/PATCH /enquiries` (§24, §75). (O) whether to persist all
  deep-link enquiries as records.

---

## 14. /analytics (R §36–§41, §59–§61, §76–§78)

- `POST /analytics/events` — ingest the required event set (§76) + `PRODUCT_VIEW_START`/`PRODUCT_VIEW_END` (§77),
  with device/location/traffic embedded.
- Admin dashboards (Analyst role): overview (§36/§59), visitor (§37), user activity (§38), product (§39),
  customer (§40), cart (§41), funnel (§78), date filter (§60), CSV/Excel export (§61).

---

## 15. /notifications (R §51)

- Send customer notifications (order placed/confirmed/stitching started/shipped/delivered) and admin
  notifications (new order, new customer, payment received, low stock, new enquiry). Transport is an open detail
  (see Open Questions).

---

## 16. Auth/Authorization summary

| Area | Auth | Minimum permission |
|------|------|--------------------|
| /auth | public/self | — |
| /products, /categories, /subcategories, /colors, /sizes, /fibers, /embroidery, /measurements/fields | public read | admin for writes |
| /inventory | public read (availability) | admin `inventory:*` |
| /wishlist | authenticated (guest=browser) | self |
| /cart | guest or auth | self |
| /orders | auth (guest→account at checkout) | own; admin `order:*` |
| /payments | order owner / webhook sig | self; admin |
| /reviews | auth to write | self; admin (approve/delete) |
| /coupons, /offers | admin write; session apply | `coupon:*` / `offer:*` |
| /enquiries | optional | admin |
| /analytics/events | guest/auth token | — |
| /analytics/* | admin | `reports:view` (Analyst) |
| /admin/users, /roles | admin | `admin:manage` (Super Admin) |
| /notifications | admin | configured per role |
