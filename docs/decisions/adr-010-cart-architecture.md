# ADR 010: Server-authoritative Cart with Mixed Item Types

## Status
Proposed

## Context
A cart must hold both READY_MADE and CUSTOMIZE items simultaneously, work for guests and authenticated users,
support merging, and — critically — **never trust client-sent prices, discounts, inventory, or totals**.

## Decision
The server owns the cart. Carts are keyed by user id (authenticated) or guest token (guest) via a unique
`ownerKey`. `/cart` endpoints accept intent (variantId/qty or customise config + fiber + measurements), and the
server recomputes authoritative line prices (incl. fiber price), discounts, inventory availability (ready-made
variant stock **and fiber×color stock**, §48), and totals. The cart presents **two clearly separated sections**
(Ready-to-Buy | Customize-with-Measurement) with measurement status (✓/⚠) for custom items (§27–§28). READY_MADE
variant stock and fiber stock are decremented at order creation (no dishonest holds). Cart has configurable
expiration for guests. See `docs/database-design.md` §11 and `docs/api.md` §8.

## Consequences
- ✅ Prices/discounts/inventory(two kinds)/totals always correct and tamper-resistant.
- ✅ Mixed READY_MADE + CUSTOMIZE supported in one cart; two separated sections.
- ✅ Guest → authenticated cart merge.
- ⚠️ More server traffic (every cart mutation round-trips).
- ⚠️ Concurrency control needed for inventory decrements (ready + fiber) at order time.
