# ADR 014: Flexible Event-based Analytics

## Status
Proposed

## Context
Analytics must later support product views/unique views/duration, wishlist/cart activity, orders, WhatsApp
enquiries, shares, conversion funnel, and cart abandonment — using a defined event set. Creating hundreds of
dashboard-specific database fields is unmaintainable.

## Decision
Use a single append-only `AnalyticsEvent` collection with a flexible shape: `type`, optional `userId`/`productId`,
`sessionId`, embedded `deviceInfo` and `traffic`, embedded location (country/state/city per §37), an arbitrary
`properties` object for event-specific extras, and timestamps. Aggregations are computed server-side for read-only
ANALYST dashboards. The event set is exactly the one required by the PDF (§76) plus **product-view duration via
`PRODUCT_VIEW_START`/`PRODUCT_VIEW_END`** (§77). See `docs/database-design.md` §13.

Per the PDF (§82), this in-house event store may be **complemented by an optional GA4 feed**; our own database is
the source for the required admin dashboards (§36–§41, §59–§61) and funnel (§78).

## Consequences
- ✅ One schema serves all current and foreseeable analytics; matches the required event list.
- ✅ View duration computed from Start/End events without extra fields.
- ✅ Event payload flexibility (zoom index, search query, field count, etc.).
- ⚠️ Aggregation logic must be built (raw events alone are not dashboards).
- ⚠️ High write volume for popular products → needs indexing + retention policy; append-only design avoids
  hot-document contention.
- ⚠️ IP/location capture must respect privacy/legal requirements (§63).
