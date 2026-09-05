# Guddi Silai — API Architecture (Design)

> Status: **Design + implemented foundation.** Validated against `docs/requirements.pdf`.
> The authentication, product/catalogue, cart, order, and payment sections are implemented foundations.
> Inventory, wishlist persistence, coupons, reviews, analytics, and notification endpoints remain planned.
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

### 1.1 Implemented — Authentication foundation (Phase 2)

Email/password authentication, guest sessions, Google OAuth, and guest→account merge are implemented.
All endpoints JSON over `/api/v1/auth`. Auth uses **Bearer JWT** returned in the response body; the client
attaches it as `Authorization: Bearer <token>`.

- `POST /auth/register` — create an account. Body (Zod):
  `{ name: string (2–120), email: email, password: string (8–128) }`.
  Returns `201` with `{ data: { token, expiresIn, user } }`. `409` if the email already exists.
  Password is stored only as a bcrypt hash; the hash is never returned.
- `POST /auth/login` — authenticate. Body (Zod): `{ email: email, password: string (1–128) }`.
  Returns `200` with `{ data: { token, expiresIn, user } }`. On bad credentials returns a generic
  `401 "Invalid email or password"` (does not reveal whether the account exists).
- `GET /auth/me` — requires `Bearer` JWT. Returns `200` with `{ data: { user } }` for the current user
  (id, name, email, mobile, avatar, createdAt). `401` if unauthenticated.
- `POST /auth/logout` — requires `Bearer` JWT. Stateless JWT logout: the client discards the token; returns
  `200` with a confirmation. `401` if unauthenticated.
- `POST /auth/guest` — issue a new guest session (no body). Creates an anonymous `guest` user and returns
  `201` with `{ data: { token, expiresIn, guest: { id, name } } }`. The guest token is a signed JWT with
  `type: "guest"` and is used to key the **server-side guest cart** (§8). Guests are rejected by
  authenticated-only routes (`requireAuth`), so a user token is required for `/auth/me`, `/auth/logout`,
  and `/auth/merge`.
- `POST /auth/google` — Google OAuth exchange. Body (Zod): `{ idToken: string }` (Google ID token obtained
  client-side). The server verifies the token with the Google client ID (`GOOGLE_CLIENT_ID`) and returns
  `200` with `{ data: { token, expiresIn, user } }`. Behavior:
  - existing account matched by `googleId` → login;
  - match by **verified** email → link `googleId` to that account → login;
  - match to a `guest` account with that email → upgrade it to a full account (cart is owned by the same id, so it is kept) → login;
  - no match → create a new account → login.
  Unverified emails are rejected (`403`); invalid tokens return `401`. `emailVerified: true` required.
- `POST /auth/merge` — requires `Bearer` user JWT. Body (Zod): `{ guestToken: string }`. Verifies the guest
  token, merges the guest server-side cart into the user's cart, deletes the guest cart, and deactivates the
  guest user (invalidates the guest session). Returns `200` with
  `{ data: { merged: boolean, itemsMerged: number } }`. Duplicate lines (same product/variant/color/size/
  fiber/embroidery/measurements) are combined by summing quantity; the user cart's price snapshot is retained.
  Guest measurements travel with cart items (they are temp values inside `CartItem`); no separate profile merge.

Security: JWT secret and expiration are read from environment variables (`JWT_SECRET`, `JWT_EXPIRES_IN`),
`BCRYPT_ROUNDS` controls bcrypt cost, and `GOOGLE_CLIENT_ID` is the audience used to verify Google ID tokens.
`/auth/register`, `/auth/login`, `/auth/guest`, and `/auth/google` are rate-limited (see api.md §0.5).

Guest wishlist is **browser-local** (§26), so no server guest-wishlist API is needed (client handles it).

---

## 2. /admin — RBAC (R §62–§64)

- Permissions grouped into roles: **Super Admin**, **Order Manager**, **Product Manager**, **Stitching Manager**,
  **Analyst** (§62). Role→permission model per ADR-013.
- Central `authorize()` permission middleware; **admin activity logging** on every sensitive mutation (§64).
- Sub-areas: users/roles, activity logs, products, categories, inventory (including **fiber inventory** §48),
  orders, coupons/offers, reviews moderation, enquiries, notifications, analytics dashboards + export.

### 2.1 Implemented — Admin authentication + RBAC middleware (Phase 2)

- `POST /admin/auth/login` — body (Zod): `{ email: email, password: string (1–128) }`. Verifies bcrypt hash,
  checks `isActive`, resolves the admin's effective permissions server-side, and returns
  `200` with `{ data: { token, expiresIn, admin: { id, name, email, roleIds, permissions } } }`. Generic
  `401 "Invalid credentials"`; `403` for disabled accounts. Rate-limited like `/auth/*`.
- `GET /admin/auth/me` — requires a bearer **admin token** (`type: "admin"`). Returns the current admin with
  resolved permissions. `401` if unauthenticated.

Admin tokens are signed JWTs with `type: "admin"` (distinct from user/guest tokens). Authorization is enforced
by two middlewares:
- `requireAdmin` — authenticates an admin token and loads the `AdminUser` (rejects missing/invalid tokens,
  non-`admin` claims, and inactive admins).
- `authorize('order:read', …)` — checks the admin's resolved permissions **server-side on every request** (per
  `api.md` §0.1 "never trust client values for permissions"); returns `403` if any required permission is
  missing. A `*` wildcard permission grants everything.

Permissions are `{domain}:{action}` keys grouped into roles and stored in the DB
(`permissions` / `admin_roles` / `admin_users`). Constants live in `packages/shared` so names stay consistent
(ADR-013): `product:*`, `catalogue:*`, `inventory:*`, `order:*`, `coupon:write`, `offer:write`,
`reports:view`, `admin:manage`, `enquiry:manage`, `notification:manage`. Sample role mapping:
SUPER_ADMIN = all; PRODUCT_MANAGER = product/catalogue/inventory; ORDER_MANAGER = order + enquiry;
STITCHING_MANAGER = order; ANALYST = `reports:view`.

`logAdminActivity()` writes an `AdminActivityLog` audit entry (admin, action, target, before/after, IP, UA) and
should be called on every sensitive mutation. Bootstrap data (permissions, roles, initial SUPER_ADMIN from
`ADMIN_EMAIL`/`ADMIN_PASSWORD`) is created by `prisma db:seed`.

---

## 3. /products (R §31–§33, §45)

### 3.1 Implemented — Public catalog (Phase 3)

- `GET /products` — cursor-paginated listing with infinite scroll. Query (Zod-validated):
  - `q` — free-text search (§31): matches product **name, description, design ID, tags**, plus any
    **category / sub-category / color / size / fiber / embroidery** whose *name* contains the query
    (resolved to IDs server-side, case-insensitive).
  - `categoryId`, `subCategoryId` — exact filters.
  - `colorId`, `sizeId`, `fiberId`, `embroideryId` — match against the product's variant options.
  - `minPrice`, `maxPrice` — base-price range.
  - `availability` — `in_stock` | `out_of_stock` | `upcoming`.
  - `sort` — `newest` (default), `price_low_to_high`, `price_high_to_low`, `most_popular`, `most_liked`,
    `most_viewed`, `best_rated`. The four engagement sorts fall back to `newest` until analytics/review
    aggregates land (Phases 11/16).
  - `cursor`, `limit` (default 20, max 50).
  Response: `{ data: ProductCard[], nextCursor: string | null, hasMore: boolean }`.
  `ProductCard` = `{ id, slug, name, designId, type, basePrice (after discount), compareAtPrice,
  discountPercent, images, tags, availability, totalStock, expectedAvailability }`.
- `GET /products/:slug` — detail: all product fields + `finalPrice`, `availability`, `totalStock`,
  `category`/`subCategory` (id/name/slug), resolved `colors`/`sizes`, active `variants`, plus embedded
  `fiberOptions` / `embroideryOptions` snapshots. `404` if inactive.

Pagination is **keyset** (base64url `{sortValue, id}`); the client sends the opaque `nextCursor`.

### 3.2 Implemented — Admin product + variant CRUD (Phase 3)

- `POST /admin/products` — create (§45-wide payload). `slug` auto-generated from `name` if omitted.
  `colors[]`/`sizes[]`/`fiberIds[]`/`embroideryIds[]` accept reference IDs; fiber/embroidery options are
  **snapshotted** (id/name/price) onto the product. `409` on duplicate slug/designId.
- `PATCH /admin/products/:id` — partial update of any field.
- `DELETE /admin/products/:id` — soft delete (`isActive: false`).
- `GET /admin/products` — admin grid: `q`, `page`, `limit` (max 100), `includeInactive`. Returns
  `{ data: AdminProduct[], total, page, limit, totalPages }`.
- `POST /admin/products/:id/variants` — add variant `{ sku?, colorId, sizeId, price, discount?, stock }`.
- `PATCH /admin/products/variants/:id` — update variant.
- `DELETE /admin/products/variants/:id` — hard delete variant.

Permissions: `product:read` / `product:write`. All mutations log admin activity.

## 4. /categories, /subcategories, /colors, /sizes, /fibers, /embroidery

### 4.1 Implemented — Public reads (Phase 3)

- `GET /categories`, `/subcategories`, `/colors`, `/sizes`, `/fibers`, `/embroidery` — return active reference
  data. Fibers include per-fiber `price`; sub-categories include `categoryId`. `/subcategories` accepts an
  optional `categoryId` filter.

### 4.2 Implemented — Admin CRUD (Phase 3)

- `POST/PATCH/DELETE` + `GET` (with `q` search and `includeInactive`) at `/admin/categories`,
  `/admin/subcategories`, `/admin/colors`, `/admin/sizes`, `/admin/fibers`, `/admin/embroidery`.
  Categories/sub-categories auto-generate `slug` from `name`; deletes are soft (set `isActive: false`).
  Category uniqueness is enforced by slug; Color/Size/Embroidery by name where defined; the reference
  data is **not hard-coded** — it is DB-backed per §4.

Permissions: `catalogue:read` / `catalogue:write`. All mutations log admin activity.

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
The current implementation supports guest/user identity, add/update/remove/clear, ready-made variants,
custom fabric selection, measurement completion, stock validation, and server totals.
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

- `POST /orders` — place a COD or Razorpay order; snapshot items (incl. measurements for custom items); decrement
  ready-made inventory and clear the cart.
- `GET /orders` / `GET /orders/:id` — My Orders (order id, date, products, amount, payment status, order status
  §35).
- Admin: `GET/PATCH /admin/orders` with status filters and RBAC-protected status updates.
- Remaining: dedicated tracking endpoint, cancellation/refunds, fiber inventory decrement, and notification delivery.
- Order-status transitions use the exact PDF labels (§35/§42) — see database-design §9.2.

---

## 10. /payments (R §82, §63)

- Razorpay integration is implemented; credentials are optional for local COD-only development.
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
