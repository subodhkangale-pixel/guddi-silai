# ADR 015: API Design Boundaries

## Status
Proposed

## Context
The API must serve a public storefront plus an admin back-office, with clear boundaries for authentication,
authorization, validation, pagination, and error handling across many functional areas.

## Decision
Expose a versioned REST API under `/api/v1` with one router per domain area: `/auth`, `/products`, `/categories`,
`/fibers`, `/measurements`, `/cart`, `/wishlist`, `/orders`, `/payments`, `/reviews`, `/coupons`, `/enquiries`,
`/analytics`, and `/admin`. Each boundary has a documented responsibility, auth requirement, authorization
requirement, operations, validation (Zod), pagination, and error handling. The server is authoritative for price,
discount, inventory, order totals, and payment status (Razorpay webhook-verified). See `docs/api.md`.

## Consequences
- ✅ Clear, uniform contracts across all functional areas.
- ✅ Security/trust boundaries explicit and auditable.
- ✅ Extensible as features grow.
- ⚠️ Requires shared types to keep frontend/backend contracts in sync (via `packages/shared`).
