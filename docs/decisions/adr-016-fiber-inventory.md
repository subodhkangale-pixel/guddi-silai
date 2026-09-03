# ADR 016: Fiber Inventory for Customization

## Status
Proposed

## Context
The requirements explicitly require that the **Customize section maintains fiber stock** (§48): combinations of
fiber and colour are shown as Available / Out of Stock (e.g., Red Raw Silk — Available; Pink Silk — Out of
Stock). This means CUSTOMIZE is not "no stock" — the fabric used for made-to-order blouses is itself a tracked,
finite resource. An earlier draft incorrectly stated "CUSTOMIZE has no stock"; this ADR corrects that.

## Decision
Maintain a **fiber inventory** keyed by **(fiber × color)** combination as a first-class, server-authoritative
stock alongside READY_MADE per-variant stock. The customization flow (§14–§16) filters/selects fiber by colour
and checks availability from this stock; unavailable combinations are shown out-of-stock and cannot be added.
Fiber stock is decremented when a CUSTOMIZE order is placed and audited via the `StockMovement` log. This also
powers low-stock alerts (§51) and the "Only X left" indicator (§67, from real inventory).

## Consequences
- ✅ Satisfies the explicit §48 fiber-inventory requirement.
- ✅ Customization can't oversell fabric; accurate availability in the fiber popup.
- ✅ Two inventories (ready variant + fiber×color) both server-authoritative, both audited.
- ⚠️ Adds a second inventory model and its consistency rules.
- ⚠️ Requires an admin UI to manage fiber stock alongside ready-made stock.
