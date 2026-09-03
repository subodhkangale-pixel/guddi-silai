# ADR 012: Order Snapshot for Historical Purchase Integrity

## Status
Proposed

## Context
An old order must display what a customer actually bought even after product names, prices, variants, and
measurement definitions change. A foreign-key-only design would let mutating catalogue data corrupt historical
records.

## Decision
Every order embeds a complete, immutable snapshot per line item: product name/design ID, variant ID, SKU,
product type, color, size, fiber, customization (embedded), measurements + measurement version, unit price,
discount, quantity, shipping, tax (where applicable), and final amount. For CUSTOMIZE items the embedded
measurement snapshot includes the **Measurement Instruction Version** (explicitly shown on admin order detail,
requirements §44) so the stitching team always sees the exact definition set used. The order also embeds
customer/address, coupon/offer, and payment (method, status, transaction id) summaries. Old orders therefore
never join against mutable catalogue data to render. See `docs/database-design.md` §9.

Order statuses use the **PDF-defined lifecycle** (§35, §42) rather than a guessed set:
`Order Placed → Confirmed → Processing → Stitching → Quality Check → Packed → Shipped → Delivered`, with
`Cancelled / Returned / Failed` as the exception/terminal states (per the §42 admin filter list).

## Consequences
- ✅ Historical orders always render accurately (financial/history integrity), including measurements + version.
- ✅ Refund/stitch workflows can reference the original snapshot.
- ✅ Order statuses match the product requirements exactly.
- ⚠️ Denormalised snapshots mean deliberate, explicit updates when order records need correction.
- ⚠️ More storage per order (acceptable for a retail/tailoring volume).
