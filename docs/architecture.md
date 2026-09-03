# Architecture

> Status: **Evolving.** Foundation is implemented; the domain/feature architecture below is the target design,
> revalidated against `docs/requirements.pdf`. Nothing here is implemented as business features yet.

## Overview

Guddi Silai is an **Indian blouse e-commerce + custom-tailoring platform** (§1) built as a monorepo:

- **Frontend** (`apps/web`): React SPA, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, Zustand
- **Backend** (`apps/api`): Express REST API, TypeScript, Prisma ORM (MongoDB)
- **Shared** (`packages/shared`): common types, utilities, constants

Tech stack is **endorsed by the requirements PDF §82** (React/TS/Vite/Tailwind/Router/TanStack/Zustand;
Node/Express/TS; MongoDB; Cloudinary or equivalent CDN; Google OAuth + guest; Razorpay or equivalent;
WhatsApp deep-link; custom + GA4 analytics).

## Design Principles

1. **Mobile-first** (§55): Mobile → Tablet → Desktop; **bottom navigation** (Home | Categories | Wishlist |
   Cart | Menu) on mobile.
2. **User-friendly above all** (§54, §81): large buttons, large images, Hindi/English-friendly labels, simple
   language, clear icons, high contrast, minimum steps, **no unnecessary popups**, no complicated forms.
   Experience = Instagram + Meesho + simple tailoring order system; one obvious next action per screen.
3. **Capability-oriented domain** (§83): one Product model driven by a type ↔ capability registry
   (READY_MADE / CUSTOMIZE / SHOWCASE) — the site "automatically decides" buttons/features per type, avoiding a
   frontend if/else mess.
4. **Server-authoritative commerce** (A): server owns price, discount, ready + fiber inventory, totals; never
   trusts client.
5. **Type safety** (existing): strict TS, shared types in `packages/shared`.
6. **Security** (§63, existing): Helmet, CORS, Zod, JWT/guest, password hashing, rate limiting, XSS, CSRF,
   webhook verification, admin activity logs, RBAC; privacy/legal for IP/location analytics.
7. **Performance** (§56): WebP/AVIF, lazy loading, responsive images, CDN, compression, infinite scroll, cursor
   pagination, browser caching, cloud storage.
8. **Accessibility / clear UX** as part of user-friendliness.

## Data Flow

```
User -> Web (React) -> API (Express) -> MongoDB
                    <- (JSON)         <-
        [Cloudinary CDN for images]
```

## API Design

- RESTful, versioned `/api/v1`, per `docs/api.md`. Existing `AppError`/`errorHandler`.
- Zod validation; pagination (offset for admin, **cursor for infinite-scroll feed**).
- JWT + guest identity; RBAC via centralized `authorize()` permission middleware.

## Authentication & Guest Model (R §30, §82)

- **Guest-first**: browse, search, view, zoom, WhatsApp, wishlist(browser-local), cart, guest checkout — no login.
- **Google OAuth** for authenticated features (save measurements, DB wishlist, order history).
- AuthN (identity) ≠ AuthZ (ownership) ≠ Permissions (fine-grained RBAC).
- Guest cart merges into account on login.

## Product Domain (R §46, §83)

Three product types (Python-explicit): **READY_MADE**, **CUSTOMIZE**, **SHOWCASE**.

- `Product` = listing/design (name, designId e.g. GS-206, description, category + sub-category, type, price +
  discount, colors, sizes, fiber, embroidery, images/videos/GIF, stock, SKU, tags, SEO, expectedAvailability).
- `ProductVariant` = sellable config (READY_MADE: color×size with SKU + stock).
- Referenced catalogues: Category, SubCategory, Color, Size, Fiber (with price), Embroidery.
- **Two inventories**:
  - **READY_MADE** per (color×size) stock (§47).
  - **Fiber inventory** per (fiber×color) for CUSTOMIZE (§48).
- A capability **registry** maps `type → { purchasable, requiresMeasurements, requiresFiber, requiresInventory,
  customizationEnabled }` — the single place interpreting the type, so future types extend it (ADR-008).
  SHOWCASE is confirmed display-only (no add-to-cart/buy). Details in `docs/database-design.md`.

## Frontend Architecture (feature-oriented React; §82 stack)

Responsibilities:
- **React**: rendering + local component state.
- **React Router**: routes, layouts, guards.
- **TanStack Query**: owns **all server state** (catalogue, cart, orders, admin) — caching, infinite scroll,
  invalidation, optimistic updates.
- **Zustand**: **client/UI state only** (theme, session presence, transient form/composer state, **guest
  wishlist stored in browser-local storage**, UI toggles). No duplication of server state.

Structure:
```
apps/web/src/
  app/           providers, router, theme, bootstrap
  components/    shared/primitive UI
  features/      auth/ catalog/ product-detail/ ready-made/ customize/ showcase/
                 wishlist/ cart/ checkout/ payments/ orders/ measurements/ reviews/
                 coupons/ offers/ enquiries/ analytics(report)/ admin/ notifications/ seo/
  pages/         route-level pages + layouts
  layouts/       Public / Account / Admin
  hooks/         shared hooks
  lib/           api client, router, guards
  api/           TanStack Query hooks per domain
  stores/        zustand (UI/client only)
  types/         shared frontend types (re-export @guddi-silai/shared)
```

Each product type is a feature folder consuming shared flows (cart, checkout, orders) via its capability,
not inline branches.

## UX requirements lock-in (R §54–§55, §81)
- Mobile-first; bottom navigation; large buttons/images; Hindi/English labels; simple language; high contrast;
  min steps; no unnecessary popups; no complicated forms; one obvious next action per screen
  (Choose Design → Choose Fabric → Give Measurement → Order).

## Analytics (R §76–§78, §36–§41)
Flexible append-only `AnalyticsEvent` model (see database-design §13) collecting the **explicit event set**:
`PAGE_VIEW, PRODUCT_VIEW, PRODUCT_IMAGE_VIEW, IMAGE_ZOOM, SEARCH, CATEGORY_VIEW, WISHLIST_ADD, CART_ADD,
CART_REMOVE, BUY_NOW, CHECKOUT_START, MEASUREMENT_START, MEASUREMENT_COMPLETE, WHATSAPP_CLICK, SHARE,
ORDER_PLACED, PAYMENT_SUCCESS, PAYMENT_FAILED` + **`PRODUCT_VIEW_START`/`PRODUCT_VIEW_END`** for view duration
(§77). Aggregations computed server-side for the required dashboards (overview, visitor, user activity, product,
customer, cart, funnel, date filter, CSV/Excel export). Own DB analytics + optional GA4 feed (§82).

## Recommended Extra Features (§65–§74)
Captured as **optional** backlog (per Open Question #6): Recently Viewed, Continue Shopping, Low-stock
indicator (real inventory), Similar Designs, Trending Blouses, WhatsApp floating + Call button, Pincode check,
Order Notes, Measurement Recheck.

## Performance (§56)
WebP/AVIF, lazy loading, responsive images, CDN (Cloudinary/equivalent), image compression, infinite scroll +
cursor pagination, browser caching, cloud storage. Indexes aligned to query patterns; 500–1000 products
supported.

## Security (§63)
See api.md §0.5. Admin auth, RBAC, password hashing, JWT/session, rate limiting, input validation, XSS, CSRF,
payment webhook verification, admin activity logs, and **privacy/legal for IP/location data collection**.

## SEO & Social (R §57–§58)
Unique product URLs (`/blouse/designer/gs-206`), per-product meta title/description/keywords, Open Graph image,
product structured data (so it appears in Google), attractive social previews (name+price+brand+image+link) for
WhatsApp/Instagram/Facebook.
