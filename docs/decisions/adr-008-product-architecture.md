# ADR 008: Capability-oriented Product Architecture

## Status
Proposed

## Context
Guddi Silai sells three product types: READY_MADE, CUSTOMIZE, and SHOWCASE. These differ materially in
workflow (off-the-shelf inventory vs. made-to-order customisation vs. display/enquiry), yet they share a
catalogue identity (name, images, description, category). A naive approach (one giant `Product` with many
nullable columns plus `if (type === ...)` scattered across frontend and backend) becomes unmaintainable as
features are added.

## Decision
Represent every listing as a single `Product` with a stored **selling model** descriptor that captures how it
is sold: kind, `requiresMeasurements`, `requiresFiber`, `requiresInventory`, `purchasable`,
`customizationEnabled`. A **capability registry** (single map of `type → workflow`) is the only place that
interprets the type — matching the PDF's guidance that the site "automatically decides which buttons/features"
per selected type (§46) and that the three product types be kept technically separate to avoid a frontend
if/else mess (§83). `ProductVariant` carries the sellable configuration; catalogues (Category, SubCategory,
Color, Size, Fiber, Embroidery) are referenced.

Inventory follows the two explicit requirements: **READY_MADE** per (color×size) variant stock (§47) and
**fiber inventory** per (fiber×color) for CUSTOMIZE (§48) — so CUSTOMIZE is not "no stock"; it tracks fabric
stock. See `docs/database-design.md` §2–§3 and ADR-016.

## Consequences
- ✅ New product types added by extending the registry, not editing scattered conditionals.
- ✅ Consistent data access and API shapes across product types.
- ✅ Shared cart/checkout/orders handle all types via capabilities; SHOWCASE confirmed display-only (§25).
- ✅ One catalogue listing model keeps SEO/browsing uniform.
- ⚠️ Each product type still needs its own feature UI folder and specific validation.
- ⚠️ Requires discipline: no new branch on `type` outside the registry/service layer.
- ⚠️ Two inventory models (ready variant stock + fiber×color stock) must be kept consistent.
