# Guddi Silai — Database Design (Conceptual)

> Status: **Architecture / conceptual design only.** Validated against `docs/requirements.pdf`.
> No Prisma schema is implemented from this document yet.
> Stack (unchanged, endorsed by the PDF §82): **MongoDB + Prisma**.

Legend per entity: **R** = explicit requirement (PDF §N), **A** = architectural decision, **O** = open question.

---

## 1. Design Method

We use a **capability/domain-oriented** model keyed by the three product types (READY_MADE / CUSTOMIZE /
SHOWCASE). MongoDB document flexibility is used deliberately:

- **Catalog / reference data** (Category, Colour, Size, Fiber, Embroidery) → **referenced** by `_id`. Shared,
  mutable descriptors.
- **Ownership / immutable history** (order item snapshots, measurement snapshots, customisation at order time) →
  **embedded**. These must not change when the referenced catalog changes.
- **Per-variant stock** → embedded on the READY_MADE variant; **fiber stock** → keyed by (fiber × colour) for
  CUSTOMIZE. A stock-movement audit log records changes.

The roster of entities is **grounded in the PDF's recommended DB structure §75** (User, Product, Category,
SubCategory, ProductVariant, Color, Size, Fiber, Embroidery, Inventory, Cart, CartItem, Wishlist, Order,
OrderItem, MeasurementProfile, MeasurementField, Payment, Coupon, Review, Enquiry, AnalyticsEvent, Admin,
AdminRole, Notification). We justify each below and collapse the ones that should be embedded.

---

## 2. Product Architecture

### 2.1 Product (R §45, §46, §83)

A `Product` is a **catalogue listing / design**. Native fields (from §45 admin fields):

| Field | Source |
|-------|--------|
| `id` | — |
| `name` | §45 |
| `designId` (e.g., GS-206) | §45 (used in search §31, WhatsApp §24, order §43) |
| `description` | §45 |
| `type` (`READY_MADE`\|`CUSTOMIZE`\|`SHOWCASE`) | §46, §83 |
| `categoryId` (parent category) | §45 |
| `subCategoryId` | §45, §75 |
| `basePrice` + discount / compare-at | §6, §9 |
| `colors[]`, `sizes[]`, `fiber`, `embroidery[]` | §45 |
| `images[]`, `videos/GIF[]` | §45, §7 |
| `tags[]` | §45 |
| `stock`, `sku` (for ready-made) | §45, §47 |
| `seo`: title, description, keywords, OG image, structured data | §45, §57 |
| `isActive`, `expectedAvailability` (for showcase) | §25 |
| `createdAt`, `updatedAt` | — |

**Selling-model-as-data** (A): each product carries its `type`; a **capability registry** (single map of
`type → { purchasable, requiresMeasurements, requiresFiber, requiresInventory, customizationEnabled }`)
drives which actions are available — the site "automatically decides buttons" per §46/§83 without scattered
if/else.

### 2.2 Category + SubCategory (R §3, §4, §45, §75)

Two-level hierarchy:
- `Category`: top-level grouping (Ready to Buy, Customize, Showcase + Designer, Simple, Silk, Bridal, ...).
- `SubCategory`: child grouping under a category.
- Admin can create/edit/delete (categories not hard-coded) → soft-delete via `isActive`.

(O) Exact depth semantics — see Open Question #2.

### 2.3 ProductVariant (A; R §47, §75)

A `ProductVariant` is a **sellable configuration**. For READY_MADE, a variant = (color × size) with its own
SKU + price + stock. For CUSTOMIZE, the "configuration" is largely chosen at order time (fiber + colour +
embroidery + measurements), so variants may represent base design/options rather than pre-created stock
rows. For SHOWCASE, no sellable variant exists.

| Field | READY_MADE | CUSTOMIZE | SHOWCASE |
|-------|-----------|-----------|----------|
| `id`, `productId` | ✓ | ✓ (template/options) | — |
| `sku` | ✓ | per-config at order? (O) | — |
| `colorId`, `sizeId` | ✓ (color×size) | optional | — |
| `fiberId` | ✓ | ✓ (via selection) | — |
| `price`, discount | ✓ | base | — |
| `inStock` (embedded) | ✓ | n/a (fiber-level stock instead) | — |

(O) Whether a CUSTOMIZE SKU is generated per configuration at order time (vs. none).

---

## 3. Inventory — two kinds (R §47, §48)

> Correction: the earlier draft said "CUSTOMIZE has no stock". Per **§48**, CUSTOMIZE **does** track
> **fiber inventory** (fiber × colour availability). Fixed here.

### 3.1 READY_MADE stock (R §47)
Per-variant stock keyed by **(color × size)**, each with `quantity` and `sku`. E.g. Red: S→2, M→5, L→0, XL→3.
- Availability derived from quantity (0 → "Out of Stock"); unavailable combos shown clearly.
- Embedded on the variant + a `StockMovement` audit log (A) for accuracy and low-stock alerts.

### 3.2 Fiber inventory for CUSTOMIZE (R §48)
Track stock per **(fiber × color)** combination, e.g.:
- Red Raw Silk — Available
- Black Velvet — Available
- Pink Silk — Out of Stock

Design: a `FiberInventory` (or stock on the `Fiber`/`Color` join) capturing availability per (fiber, color).
Low-stock / out-of-stock drives which combinations are selectable in the customization popup (§15) and
supports the "Only X left" indicator (§67, computed from real inventory).

---

## 4. Entity Catalogue (with justification)

| Entity | Justification |
|--------|---------------|
| `User` | Authenticated accounts (Google OAuth + guest) §30, §82; saved measurements §23; order history §35; wishlist §26 |
| `Category` | §3, §75 — top-level taxonomy |
| `SubCategory` | §45, §75 — second-level taxonomy (O depth) |
| `Product` | §45, §75 — catalogue listing |
| `ProductVariant` | §47, §75 — sellable config (color×size for ready-made) |
| `Color` | §45, §47, §75 — referenced descriptor |
| `Size` | §45, §47, §75 — referenced descriptor |
| `Fiber` | §45, §48, §75 — referenced descriptor with per-choice price §16 |
| `Embroidery` | §45, §75 — referenced descriptor / surcharge |
| `Inventory` (ready-made variant stock) | §47, §75 |
| `FiberInventory` (fiber×color stock) | §48 (**added to satisfy customization inventory**) |
| `Cart` / `CartItem` | §27, §28, §75 |
| `Wishlist` / `WishlistItem` | §26, §75 |
| `Order` / `OrderItem` | §35, §43, §75 — snapshot-based |
| `MeasurementProfile` | §23, §75 — saved customer measurements |
| `MeasurementField` | §19, §75 — admin-configurable fields |
| `Payment` | §43, §75 — method, status, transaction ID |
| `Coupon` | §49, §75 |
| `Offer` | §50 — product/category/festival/limited-time discounts (beyond coupons) (A) |
| `Review` | §34, §75 — ready-to-buy product reviews (rating, text, photo), admin moderation |
| `Enquiry` | §24, §75 — WhatsApp/product enquiries (O storage scope) |
| `AnalyticsEvent` | §76–§78, §75 — flexible event store |
| `AdminUser` / `AdminRole` / `Permission` | §62, §63, §64 — RBAC + activity logs |
| `AdminActivityLog` | §64 |
| `Notification` | §51, §75 |
| `StockMovement` | (A) inventory audit |

**Collapsed / embedded** (owned children, always read with parent):
- `CartItem` → embedded in `Cart`
- `WishlistItem` → embedded in `Wishlist`
- `OrderItem` → embedded in `Order`
- Measurement values on an order → embedded snapshot in `OrderItem`

---

## 5. Relationships

```
Category 1─* SubCategory 1─* Product 1─* ProductVariant 1─? Inventory(ready) / 1─* StockMovement
Color / Size / Fiber / Embroidery 1─* (referenced across products/variants)
FiberInventory: (Fiber * Color) → availability/stock          [customize]
User 1─* Cart, 1─* Wishlist, 1─* Order, 1─* MeasurementProfile
Cart 1─* CartItem(embedded)
Order 1─* OrderItem(embedded), 1─? Payment, 1─? Offer/Coupon(applied), 1─? Enquiry
Coupon/Offer → Order (applied)
Review → (User, Product)
AdminUser 1─* AdminRole 1─* Permission
AdminActivityLog → AdminUser
AnalyticsEvent → (User?, Product?, session embedded)
Notification → (User?, AdminUser?)
```

---

## 6. Indexes, Uniqueness, Query Patterns

| Collection | Indexes | Unique |
|-----------|---------|--------|
| Product | `slug`, `designId`, `type`, `categoryId`, `subCategoryId`, `isActive`, text(name/description/designId/tags) | slug, designId |
| ProductVariant | `productId`, `sku`, `(colorId,sizeId)` | sku |
| Category / SubCategory | `slug` | slug |
| Fiber | `name`, `isActive` | name |
| FiberInventory | `(fiberId,colorId)` unique | (fiberId,colorId) |
| User | `email`(sparse), `googleId`(sparse) | email/googleId |
| Order | `userId`, `orderNumber`(unique), `status`, `createdAt` | orderNumber |
| Cart | `ownerKey` unique | ownerKey |
| Wishlist | `userId`(auth) unique | userId |
| Coupon | `code` unique, `isActive` | code |
| Review | `(userId,productId)`, `productId`, `status` | (userId,productId) |
| AnalyticsEvent | `type`, `productId`, `userId`, `createdAt` | none (append-only) |
| AdminActivityLog | `adminUserId`, `createdAt`, `action` | none |
| Payment | `orderId`, `transactionId`(sparse) | transactionId |

Pagination: offset for catalogue; **cursor for infinite scroll feed and append-only logs** (§5, §56).

---

## 7. Timestamps, Soft Delete, Audit

- `createdAt`/`updatedAt` on top-level collections.
- Soft delete / publish for catalogue (Product, Category, SubCategory, Fiber, Color, Size, Embroidery, Coupon,
  Offer) via `isActive`/`isArchived`; SKU/product availability derived from active + stock.
- `AdminActivityLog` records actor, action, target, before/after, timestamp, IP (§64) — price changes, new fiber,
  order-status changes, etc.
- `StockMovement` audits inventory changes (ready-made + fiber).

---

## 8. Historical Snapshots

1. **Order items** — §9.
2. **Measurement values + instruction version** — §10. The PDF explicitly shows **"Measurement Instruction
   Version: v1"** on custom orders (§44) — embedding this snapshot is a direct requirement, not just good practice.

---

## 9. Orders — Snapshot + Status Lifecycle

### 9.1 Order document (embedded snapshot; R §43–§44)

`OrderItem` embeds everything needed to display and administer the purchase:
- Ready-to-buy: product name, designId, variant/SKU, type (READY_MADE/CUSTOMIZE), color, size, fiber, price,
  discount, quantity, shipping, total.
- Customize: additionally **fiber selection**, **measurements embedded (field/value/unit) + Measurement
  Instruction Version**, plus embroidery/customisation choices.
Order embeds: customer info (name, mobile, email-optional, address, city, state, pincode) §29/§43; payment
summary (method, status, transaction id) §43; totals; coupon/offer snapshot; **order notes** (§73, recommended).

Because item + measurement snapshots are embedded, an old order renders correctly forever.

### 9.2 Order statuses (R §35, §42)

**Transition chain (§35):** `Order Placed → Confirmed → Processing → Stitching → Quality Check → Packed →
Shipped → Delivered`.

**Admin filter set (§42) additionally includes:** `Cancelled, Returned, Failed` (terminal/exception states).

Proposed state model (A, uses the exact PDF labels):
```
Order Placed → Confirmed → Processing → Stitching → Quality Check → Packed → Shipped → Delivered
      \            \            \            \            \        \        \
       └────────────┴────────────┴────────────┴────────────┴────────┴────────┴──> Cancelled / Failed
                                                                                 Returned (post-delivery, if offered)
```
This uses **only PDF-defined statuses**; return/cancel rules are business rules to confirm (Open Question).

---

## 10. Measurements — Configurable + Versioned (R §18–§23, §44, §74)

### 10.1 MeasurementField (R §19, §75)
Admin-configurable: `key, label, unit (inches|cm), instructions, exampleImage, gifUrl/videoUrl, isRequired,
displayOrder, isActive`. Admin can add extra custom fields (§19).

Required default set (§19): Bust, Under Bust, Waist, Shoulder, Blouse Length, Sleeve Length, Armhole, Upper
Arm, Sleeve Opening, Front Neck Depth, Back Neck Depth.

### 10.2 MeasurementProfile (R §23, §75)
`id, userId, alias (e.g., "Default Profile"), values: [{fieldId, value, unit}], createdAt, updatedAt`.
Logged-in users save / edit; auto-available next order (§23). Guests: temp values in cart/order only.

### 10.3 MeasurementValueSet (embedded snapshot; R §44)
Embedded on each CUSTOMIZE OrderItem: `{ values: [{fieldKey, fieldLabel, value, unit}], measurementInstructionVersion, source(profileId?) }`.
The **version is shown to admin** ("Measurement Instruction Version: v1") so stitching has no confusion (§44).

### 10.4 Validation & units (R §21–§22)
- Inches or Centimeter choice + auto-conversion where possible (§21).
- Reject invalid values (e.g., Bust 500 invalid) with "Please enter a valid measurement." (§22) — enforce
  range validation server + client.
- Recommended recheck step before payment (§74) — show confirm table + "I confirm these measurements".

---

## 11. Cart — two separated sections + mixed (R §27–§28)

- `Cart` keyed by owner (guest token or user). Embedded `CartItem`s.
- `CartItem` fields: product ref, kind (READY_MADE|CUSTOMIZE):
  - READY_MADE: variantId (color×size) + quantity + price snapshot.
  - CUSTOMIZE: product ref + **selected fiber (fiberId) + color**, **measurement status (✓ Complete / ⚠ Pending)**,
    quantity, price snapshot, plus measurementValueSet reference (temp for guests / profile for auth).
- **Two clearly separated sections** (§27) and **mixed cart** allowed (§28). Order summary splits them.
- Server-authoritative price/discount/inventory/totals (A). Inventory (ready + fiber) checked at add/read;
  decremented at order placement.

> Guest measurements are temp-saved to the current cart/order (§23); guest wishlist is **browser-local** (§26),
> handled client-side, not a server collection.

---

## 12. Wishlist (R §26)

- `Wishlist`/`WishlistItem` collection for **logged-in** users (saved in DB).
- **Guest** wishlist → **local browser storage** (no server collection).
- Wishlist page shows image, name, price, availability, Move to Cart, Remove (§26).

---

## 13. Analytics Event Model (R §76–§78)

Refined from the PDF. Events required (§76): `PAGE_VIEW, PRODUCT_VIEW, PRODUCT_IMAGE_VIEW, IMAGE_ZOOM, SEARCH,
CATEGORY_VIEW, WISHLIST_ADD, CART_ADD, CART_REMOVE, BUY_NOW, CHECKOUT_START, MEASUREMENT_START,
MEASUREMENT_COMPLETE, WHATSAPP_CLICK, SHARE, ORDER_PLACED, PAYMENT_SUCCESS, PAYMENT_FAILED`.
**Plus view-duration events (§77):** `PRODUCT_VIEW_START`, `PRODUCT_VIEW_END`.

Single flexible `AnalyticsEvent` collection:
```
{ type, userId?, productId?, variantId?, sessionId, deviceInfo(embedded: device/browser/OS/screen),
  location(embedded: country/state/city/approx), trafficSource(embedded: Google/IG/FB/WhatsApp/Direct/Referral),
  properties:{...}, createdAt }
```
Aggregations (unique views, avg view time = end−start, zoom count, wishlist/cart counts, funnel, abandonment)
are computed server-side. Supports the required dashboards (§36–§41) and funnel (§78). Append-only; retention +
legal/privacy handling for IP/location (§63) is an open/privacy item.

---

## 14. Coupons & Offers

- `Coupon` (R §49): code, type (percent|fixed), minOrder, maxDiscount, applicable category/product, expiry,
  usage limit, isActive.
- `Offer` (A from §50): product discount, category discount, festival sale, limited-time offer — a persistent,
  admin-managed discount that differs from one-time coupons. Because §50 lists these as admin capabilities, we
  model a lightweight `Offer`.

---

## 15. Admin / RBAC (R §62–§64, §75)

- `AdminUser`, `AdminRole` (Super Admin / Order Manager / Product Manager / Stitching Manager / Analyst),
  `Permission` (fine-grained), `AdminActivityLog`.
- Roles listed in §62 map directly to the 5 roles from the earlier ADR-013 — confirmed by PDF.

---

## 16. Scalability Notes

- Cursor pagination for infinite-scroll homepage feed (§5) and append-only logs.
- Indexes aligned to query patterns in §6.
- READY_MADE + fiber inventory are both real-time stocks (§47–§48) — decremented at order placement with
  concurrency guards (server-authoritative, §A).
- Cloud image storage + CDN (Cloudinary/equivalent) for performance (§56, §82).
- MongoDB handles 500–1000 products easily with proper indexing (§5, §56).
