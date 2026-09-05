# Guddi Silai — Local Run Guide

Blouse e-commerce + tailoring platform. Monorepo (pnpm workspaces): `apps/api` (Express + Prisma + MongoDB) and `apps/web` (React + Vite).

## 1. Install & first run

```bash
pnpm install
pnpm --filter @guddi-silai/api prisma db push   # create Mongo collections from schema.prisma
pnpm --filter @guddi-silai/api db:seed           # catalogue, products, add-ons, admin account, RBAC
```

## 2. Start both apps

```bash
pnpm --filter @guddi-silai/api dev     # API on http://localhost:4000
pnpm --filter @guddi-silai/web dev     # storefront on http://localhost:3000
```

## 3. Admin

- URL: http://localhost:3000/admin/login
- Credentials (from `apps/api/.env`): `admin@guddisilai.dev` / `Guddi@Admin123`
- Sections: Products, Orders, Inventory, Analytics, Reviews, Coupons, Offers, **Add-ons**, Users, Roles, Permissions, Activity log, Categories/Sub-categories/Colors/Sizes/Fibers/Embroidery.

## 4. Keys still to add (`apps/api/.env`)

Everything works without them; these unlock extra features. Empty values are env-gated.

- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` — test keys from https://dashboard.razorpay.com → enables "Card / Other" at checkout (UPI/COD/Net Banking work without it).
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth (https://console.cloud.google.com, authorized redirect `http://localhost:4000/api/v1/auth/google/callback`) → enables "Continue with Google" on the login page.

Other `.env` notes: `JWT_SECRET`, `ADMIN_*` initial admin credentials, Mongo `DATABASE_URL`.

## 5. Verify the flows

- **Guest checkout**: browse `/products` → ready-made → add to cart → coupon/offer auto-applies → checkout with add-ons → COD places order; order number shown on order detail with add-ons + measurements + style options.
- **Custom blouse**: open any *Custom* product → pick fabric color/fabric, optional embroidery, **style picker** (neckline, sleeve, back, fitting) → add to cart → add measurements in cart → checkout.
- **Occasions**: Home "Shop by occasion" → lands on `/products?occasion=bridal`; the occasion facet on the Catalog sidebar filters too.
- **Admin**: create a coupon/offer → apply at checkout; create an add-on → appears in checkout picker; check Activity log after any admin mutation.

## 6. Tests & typecheck

```bash
pnpm --filter @guddi-silai/api test        # 121 tests
pnpm --filter @guddi-silai/api typecheck
pnpm --filter @guddi-silai/web typecheck
```

## 7. Notable implementation notes

- Mongo dispose: guest users get synthetic unique `email`/`googleId` (nullable `@unique` fields allow only one `null`).
- Offers on Mongo: date-range queries via `fetchActiveOffers()` in `apps/api/src/lib/activeOffers.ts` (the Prisma connector mishandles combined top-level OR/AND date predicates).
- Order totals: `total = subtotal + addonTotal + shipping − discounts`; coupons and offers are recomputed at order time from the active catalogue.