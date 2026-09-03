# ADR 011: Versioned Measurement System with Order Snapshots

## Status
Proposed

## Context
Custom blouses require measurements (Bust, Under Bust, Waist, Shoulder, Blouse Length, Sleeve Length, Armhole,
Upper Arm, Sleeve Opening, Front/Back Neck Depth, ...). Admin must be able to configure measurement fields over
time, and historical orders must preserve the exact measurements and field definitions that were in effect when
the order was placed.

## Decision
Three layers (validated against requirements §18–§23, §44):
1. **MeasurementField** (reference, admin-configurable): key, label, unit (inches/cm), instructions, example
   image, GIF/video URL, required, order, active. Admin can add extra custom fields (§19). Each measurement shows
   a name, "where to measure" instruction, example image, GIF/video, input, and unit (§18, §20).
2. **MeasurementProfile** (customer-owned, referenced): saved reusable value sets for an authenticated account
   (§23); guests keep values temp in the cart/order.
3. **MeasurementValueSet** (embedded snapshot on each CUSTOMIZE OrderItem): immutable copy of
   `{field, value, unit}` plus a `measurementInstructionVersion` identifying the instruction set in use at order
   time — the PDF shows "Measurement Instruction Version: v1" on admin order detail (§44) so the stitching team
   has no confusion.

Because the order embeds both the values and the instruction version, historical orders render correctly forever,
even after admin edits field names/units/requiredness. See `docs/database-design.md` §10.

## Consequences
- ✅ Admin can reconfigure fields without breaking history or old forms.
- ✅ Orders are self-contained for measurement display/re-stitch; version shown to admin (§44).
- ✅ Customers can save reusable profiles (§23).
- ✅ Units inches/cm + auto-conversion supported (§21) and validation enforced (§22).
- ⚠️ Field-definition versioning must be maintained as a first-class concept.
- ⚠️ Migration/user-messaging needed if a required field is added after profiles exist.
