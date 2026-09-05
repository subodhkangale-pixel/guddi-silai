# Guddi Silai — Requirements Analysis

## Status
**Rewritten against `docs/requirements.pdf`** (the primary source of truth), which I read in full (46 pages,
§1–§84). Every item below is labelled:

- **PDF §N** — explicitly stated in the requirements document (section numbers refer to the PDF's numbered sections).
- **Implication** — architectural consequence derived from an explicit requirement.
- **Open question** — genuinely ambiguous or under-specified; **not** invented. To be confirmed with the owner.

> This document supersedes the earlier draft which was written without access to the requirements PDF.

---

## 0. Business Overview

Guddi Silai is an **Indian blouse e-commerce + custom-tailoring platform**. Primary purposes (§1):
1. **Ready-to-Buy blouses** — already stitched, size + colour selection, Add to Cart / Buy Now.
2. **Customize blouse** with custom measurements — customer selects design/fabric/fiber, provides measurements,
   places a stitching order, with measurement instructions + GIF/video guidance.
3. **Blouse design Showcase / Upcoming designs** — display-only; not buyable.

Overall positioning (§81, §84): an experience like **Instagram + Meesho + a simple tailoring order system** —
not a complicated generic e-commerce site. Customer website includes: shopping, customization, measurement,
WhatsApp enquiry, wishlist, cart, checkout, order tracking, inventory, customer management, advanced analytics.
Admin dashboard includes: product/categories/fiber management, SEO, performance & security.

---

## 1. Product Types (§1, §46, §83)

Three product types drive the whole site. The PDF is explicit that the site **automatically decides which
buttons/features appear** based on the selected type (§46), and that the types should be kept **technically
separate** to avoid a frontend if/else mess (§83).

| Type | PDF behaviour |
|------|---------------|
| **READY_MADE** (Ready-to-Buy) | size → color → stock → cart → buy (§83). Stock quantity, SKU, size-wise & color-wise stock, unavailable combos marked out of stock (§11, §47). Reviews apply here (§34). |
| **CUSTOMIZE** | fiber → color → measurement → cart → buy (§83). Fiber selection + fiber filter first; configurable + validated measurements; order snapshot incl. measurement-instruction version (§14–§23, §44). Fiber stock maintained for customization (§48). |
| **SHOWCASE / Upcoming** | images → details → share → like → WhatsApp (§83). **No Add to Cart / Buy Now** (§15, §25). May show a "Coming Soon" badge at admin option. Shows expected availability (§25). |

**Implications**
- Capability/dispatch is a **registry keyed by product type** that decides available actions — aligns with the
  existing `ProductType` enum (`packages/shared`) and ADR-008.
- ShOWCASE is confirmed **not purchasable**; engagement is like/share/WhatsApp/enquiry only.

**Open question**
- Whether SHOWCASE items can ever be converted to purchasable later (business rule, not architecture).

---

## 2. Homepage & Navigation (§2, §5)

- **Homepage → direct product display**: "open karte hi blouse designs dikhne chahiye" — blouse designs should
  show immediately; About/Contact must **not** take top space.
- Header: Logo, Home, Ready to Buy, Customize, New Designs, Search 🔍, Wishlist ❤, Cart 🛒, Menu ☰.
- Mobile header: Logo, Search, Wishlist, Cart, Hamburger menu. Mobile **bottom navigation**: Home | Categories |
  Wishlist | Cart | Menu (§55).
- Infinitely scrolling product feed on homepage; **no "See More" button**; loads more on scroll (§5).
- Categories are **not hard-coded**; admin can create/edit/delete (§4). Recommended navigation tree given in §79.

---

## 3. Categories & Sub-categories (§4, §75)

- Top-level categories: Ready to Buy, Customize, Showcase/Upcoming (§3).
- Within each section, common categories: Designer, Simple, Silk, Bridal, Party Wear, Wedding, Traditional,
  Embroidery, Sleeveless, Full Sleeve, New Designs, Trending, Upcoming (§3).
- The requirements' recommended DB structure lists **Category **and** SubCategory** as separate entities (§75).
- Admin creates/edits/deletes categories (not hard-coded) (§4).

**Open question**
- Whether "sub-category" is a true two-level hierarchy vs. flat tag-like grouping. The PDF uses "Category /
  Sub-category" in admin product fields (§45) and lists both entities (§75), so a two-level hierarchy is the
  reasonable reading, but the exact depth is an open question.

---

## 4. Product Card (§6)

Extremely simple product card:
- Image, Name (e.g., "Designer Blouse Design 006"), price (₹899), compare-at (₹1,199) + 25% OFF, rating ⭐4.8 (23),
  available colours (swatches), available sizes (S/M/L/XL), heart (wishlist), Add to Cart, Buy Now.
- **CUSTOMIZE** products: "Choose Fabric & Customize". **SHOWCASE** products: "View Design".

---

## 5. Product Detail Page (§7–§9, §57)

- Product **gallery**: multiple images — Front, Back, Side, Sleeve close-up, Fabric close-up, Embroidery
  close-up, Model image; thumbnail gallery (§7).
- **Mobile-style image zoom** (§8): pinch-to-zoom, double-tap zoom, drag/move, zoom in/out; desktop: mouse-wheel
  zoom, click+drag, zoom buttons (+ / − / reset). Must be intuitive (no technical knowledge).
- **Basic info** (§9): Product Name, **Design ID** (e.g., GS-206), Category, Sub-category, Price, Discount,
  Final Price, Availability, Fabric/Fiber, Embroidery type, Color, Size, Stitching information, Care instructions.
- Buttons: Like ❤, Add to Cart 🛒, Buy Now 🛍, WhatsApp Enquiry 📱, Share 🔗.
- Unique product URL for SEO: `/blouse/designer/gs-206` (§57).

**Design ID** is a first-class field (used in search §31, WhatsApp message §24, order detail §43, admin §45).
The PDF example format is `GS-206`.

---

## 6. Share Feature (§10, §58)

- Share button → native share on mobile (WhatsApp, Instagram, Facebook, Copy Link, Other Apps); copy link on desktop.
- Social preview should be attractive: name + price + brand "(Guddi Silai)" + image + link (§58).

---

## 7. READY_MADE Workflow (§11, §12)

1. Color selection → 2. Size selection → 3. Quantity → Address → Order Summary → Payment → Order Confirmed.
- Sizes: XS, S, M, L, XL, XXL, XXXL. Colours have examples (Red, Maroon, Pink, Black, Green).
- **Unavailable combination clearly shown** (e.g., "M — Red: Out of Stock") (§11).
- **Buy Now** flow duplicates colour/size/qty/address/order-summary/payment (§12).

**Implication:** READY_MADE inventory is per **(color × size)** combination — confirmed by §47 examples
(Red: S→2, M→5, L→0, XL→3).

---

## 8. CUSTOMIZE Workflow (§13–§17, §80)

Product card ≈ same as READY_MADE, but the **Add to Cart / Buy Now does NOT go straight to cart**. First:

1. **Fiber Selection popup** ("Select Your Fabric/Fiber") opens. Fiber examples: Silk, Raw Silk, Cotton Silk,
   Satin, Velvet, Brocade, Net, Organza, Designer Fabric (§14).
2. Fiber itself has price per choice (§16: Silk ₹299, Raw Silk ₹349, Velvet ₹399).
3. **Fiber Filter** inside the popup: filter by Color, by Fiber, by Embroidery (§15). Embroidery examples:
   Zari, Thread, Mirror, Sequin, Stone, Pearl, Aari. Selection via **visual swatches**.
4. Selected → **✓ Selected** → **Continue** (§16).

Then the measurement flow (§17):
1. Design confirm → 2. Fabric/Fiber select → 3. Measurement → 4. Order Summary → 5. Payment → 6. Order Confirmed.

Overall customize flow (§80): Homepage → Customize → Design → Fiber Select → Measurement → Measurement
Confirmation → Cart/Buy → Checkout → Payment → Order.

**Important — pricing (§16):** Fibers carry explicit prices. **The overall custom blouse price formula is NOT
specified** in the PDF (fiber + base design + embroidery + stitching?). Do **not** invent a formula — record as
Open Question.

---

## 9. Measurements (§18–§23, §74)

Measurement page must be **extremely simple**, designed for Indian ladies. For each measurement field, show:
- Measurement name
- "Kahan se measurement lena hai" (where to measure from) instruction
- Example image
- **GIF/video** guidance
- Input field
- Unit

Fields (§19, admin configurable): Bust, Under Bust, Waist, Shoulder, Blouse Length, Sleeve Length, Armhole,
Upper Arm, Sleeve Opening, Front Neck Depth, Back Neck Depth. **Admin can create extra custom fields.**

Instructions example (§20): Bust — "measuring tape ko bust ke fullest part ke around comfortably rakhein"
with GIF and "Bust: ____ inch".

**Units (§21):** user can choose **Inches or Centimeter**; auto-conversion if possible.

**Validation (§22):** system rejects invalid measurements (e.g., Bust 500 inch invalid). Warning:
"Please enter a valid measurement."

**Save (§23):** Logged-in users: "Save My Measurements" → available automatically in future orders (default
profile; editable). Guests: measurements temp-saved to current cart/order.

**Measurement recheck (§74, recommended):** before placing a customized order, show "Please Confirm Your
Measurements" table + "✓ I confirm these measurements"; then payment. Reduces measurement errors.

**Versioning (§44):** admin order detail shows **"Measurement Instruction Version: v1"** for custom orders —
explicitly so the stitching team has no confusion. Confirms the versioned-snapshot strategy.

---

## 10. WhatsApp Enquiry (§24, §70)

- On every applicable design: 📱 WhatsApp Enquiry button → opens WhatsApp with an **auto-generated message**
  template: greeting, Design (name), Design ID (GS-206), Category, Link, request for price/stitching/availability.
- The **design link is auto-generated from the current product URL**.
- Admin can change the WhatsApp number (§24).
- Recommended extra (§70): floating WhatsApp 💬 button (bottom-right) that opens site-wide message, but on a
  product page it generates the specific product message; plus a 📞 Call button on mobile to an admin-configured number.
- Tech note (§82): WhatsApp **deep-link** based enquiry initially; WhatsApp **Business API** later if automated
  business messaging is needed.

**Open question:** The auto-send mechanism (deep link to `wa.me/<number>?text=<encoded>` vs. API). §82 says
deep-link initially — this is the recommended path.

---

## 11. SHOWCASE / Upcoming (§15, §25)

Display-only: large images, design name, Design ID, category, fabric info, embroidery info, color, design
description, **expected availability**, Like, Share, WhatsApp Enquiry. **No Add to Cart / Buy Now**.
Admin may show a "Coming Soon" badge.

---

## 12. Wishlist (§26)

- Heart button adds product to wishlist.
- **Guest user:** wishlist stored in **local browser**.
- **Logged-in user:** wishlist saved in **database**.
- Wishlist page: product image, name, price, availability, **Move to Cart**, Remove.

> Correction vs. earlier draft: guest wishlist is **browser-local**, not a server-side guest wishlist.

---

## 13. Cart (§27–§28)

- **Two clearly separated sections** in the cart:
  - **Section 1 — Ready-to-Buy**: product, color, size, quantity, price.
  - **Section 2 — Customize with Measurement**: product, selected fiber, **measurement status** (✓ Completed /
    ⚠ Pending), quantity, price. If measurement pending → "Complete Measurement" button.
- **Mixed cart**: one cart can hold e.g. 2 ready-made blouses + 1 customized blouse (§28).
- **Order summary clearly splits** ready-made vs. customized (§28).

---

## 14. Checkout (§29, §72)

- **Simple.** Customer details: Name, Mobile Number, **Email (optional)**, Address, City, State, Pincode.
- Google login optional. **Guest checkout allowed.**
- Recommended extra (§72): **Pincode check** — enter pincode → delivery available?, estimated delivery date,
  shipping charge.

---

## 15. Login (§30, §82)

- **Login not compulsory.** Content not behind login.
- Options: **Continue as Guest** / **Continue with Google**.
- Tech: **Google OAuth + Guest User** (§82).
- No explicit email/password registration flow is described (only Google + guest).

**Open question:** Is email+password registration needed at all, or Google + guest only? PDF only shows
Google + guest. Treat email/password as optional/deferred.

---

## 16. Search, Filters, Sort (§31–§33)

- **Powerful search** — by: name, Design ID, category, color, fiber, embroidery (e.g., "red blouse", "bridal
  blouse", "silk blouse", "designer blouse", "GS-206").
- **Filters:** Category, Price ranges (₹0–500, ₹500–1000, ₹1000–2000), Color, Fabric, Embroidery, **Availability
  (In Stock / Out of Stock / Upcoming)**.
- **Sort:** Newest, Most Popular, Price low→high, Price high→low, Most Liked, Most Viewed, Best Rated.

---

## 17. Reviews (§34)

- Reviews/ratings apply to **ready-to-buy** products: ⭐ rating, customer review, **photo review**.
- **Admin approves/deletes** reviews.

---

## 18. Orders & Tracking (§35, §42–§44)

- **My Orders** shows: Order ID, Date, Products, Amount, Payment Status, **Order Status** (§35).
- **Order status flow (§35):** Order Placed → Confirmed → Processing → Stitching → Quality Check → Packed →
  Shipped → Delivered.
- **Admin order filters (§42):** All, New, Confirmed, Processing, Stitching, Packed, Shipped, Delivered,
  **Cancelled, Returned, Failed**.
- Admin order detail (§43): customer (name, mobile, email, address, state, city); order (product, Design ID,
  color, size, fiber, measurements, quantity, price, discount, shipping, total); payment (method, status,
  transaction ID).
- **Custom-order detail (§44):** clearly show "CUSTOM ORDER" with design (GS-206), fiber (Raw Silk — Red),
  measurements (Bust 34, Waist 30, Shoulder 14, Sleeve 10, etc.), **Measurement Instruction Version v1**.

> Correction vs. earlier draft: statuses are **explicitly defined** in the PDF — adopt them exactly rather than
> my guessed set. The admin filter list additionally references Cancelled / Returned / Failed.

---

## 19. Inventory (§47–§48, §67)

- **Ready-to-Buy inventory:** stock quantity, **SKU**, **size-wise stock**, **color-wise stock**; unavailable
  combinations shown out-of-stock (§47).
- **Fiber Inventory for Customize (§48):** fiber stock must also be maintained, keyed by color + fiber (e.g.,
  Red Raw Silk — Available; Black Velvet — Available; Pink Silk — Out of Stock).
- Recommended extra (§67): "Only 2 left" low-stock indicator — **computed from actual inventory**, no fake urgency.

> **Correction vs. earlier draft:** CUSTOMIZE **does** track inventory — but for **fiber** (fabric + color
> stock), not for finished blouses. The earlier "CUSTOMIZE has no stock" statement is wrong and is fixed
> throughout the docs.

---

## 20. Coupons & Offers (§49–§50)

- **Coupons** (§49): admin-created (e.g., WELCOME10, FIRSTORDER, BRIDAL20). Conditions: percentage discount,
  fixed discount, minimum order, maximum discount, specific category, specific product, expiry date, usage limit.
- **Offers & discounts** (§50): product discount, category discount, festival sale, limited-time offer, coupon management.

---

## 21. Notifications (§51)

- **Customer:** order placed, order confirmed, stitching started, shipped, delivered.
- **Admin:** new order, new customer, payment received, low stock, new enquiry.

**Open question:** Delivery channel (WhatsApp / email / SMS / in-app) is not specified in the PDF. WhatsApp is
used throughout, but notification transport is an open question.

---

## 22. Info Pages (§52–§53)

Separate pages (not large homepage sections): About Us, Contact Us, **FAQ**, Shipping Policy, Return Policy,
Privacy Policy, Terms & Conditions.
FAQ questions (§53): How do I order? How do I give measurements? Which fabric is available? How long does
stitching take? Can I modify my measurements? Do you accept returns? How do I track my order?

---

## 23. UX Requirements (§54–§55, §81)

- **User-friendly, not complicated** — especially for Indian ladies.
- Large buttons; large images; Hindi/English-friendly labels; simple language; clear icons; high contrast;
  minimum steps; **no unnecessary popups**; no complicated forms; **mobile-first** design (§54).
- Avoid jargon (❌ "Proceed to Configure Product Variant" → ✅ "Fabric Choose Karein") (§54).
- Mobile-first: Mobile → Tablet → Desktop priority. Mobile **bottom navigation**: Home | Categories | Wishlist |
  Cart | Menu (§55).
- Experience principle (§81): **Instagram + Meesho + simple tailoring order system**; one obvious next action on
  every screen (Choose Design → Choose Fabric → Give Measurement → Order).

---

## 24. Performance (§56)

- WebP/AVIF images, lazy loading, responsive images, CDN, image compression, infinite scroll, pagination/cursor
  pagination, browser caching, **cloud storage** (§56; §82 Cloudinary/equivalent image CDN). Image gallery must
  not slow the site.
- Homepage infinite scroll with cursor pagination for 500–1000 products (§5).

---

## 25. SEO & Social (§57–§58)

- Unique product URL: `/blouse/designer/gs-206` (§57).
- SEO fields per product: **meta title, meta description, keywords, Open Graph image**, product **structured data**
  → so product appears directly in Google search (§57).
- Attractive social sharing preview (name, price, brand, image + link) on WhatsApp/Instagram/Facebook (§58).

---

## 26. Analytics (§36–§41, §59–§61, §76–§78)

Explicitly required (customer + admin):

- **Admin Dashboard overview (§36, §59):** Today's: Visitors, New/Returning Visitors, Product Views, Product
  Clicks, Add to Cart, Wishlist, Orders, Revenue, WhatsApp Enquiries. Top products by views; visitors by
  location; traffic sources; **charts**.
- **Visitor analytics (§37):** where from (country/state/city/approx location), device, browser, OS, screen
  size; traffic source (Google/Instagram/Facebook/WhatsApp/Direct/Referral).
- **User activity tracking (§38):** event timeline per visitor (India→Maharashtra→Pune→ home→bridal category→
  product GS-206; view 42s; zoom 3×; wishlist yes; add cart yes; checkout no).
- **Product analytics (§39):** per product: total views, unique views, clicks, avg view time, image zoom count,
  wishlist count, add-to-cart count, buy-now count, orders, WhatsApp enquiries, shares.
- **Customer analytics (§40):** total customers, guest users, registered users, returning, new, most active,
  most purchased categories, customer lifetime value.
- **Cart analytics (§41):** how often a product was added, products currently in cart, abandoned carts, cart
  abandonment rate, at which step customers abandon checkout.
- **Admin analytics dashboard (§59):** KPIs, top products, visitors by location, traffic sources, charts.
- **Date filter (§60):** Today, Yesterday, Last 7 days, Last 30 days, This month, Last month, Custom range.
- **Export (§61):** CSV/Excel — orders, customers, products, sales, analytics, WhatsApp enquiries.
- **Event system (§76):** store every important action as an event for future powerful analytics.
- **View time (§77):** track **Product View Start** and **Product View End** events to compute average view
  time (e.g., GS-206 avg 1m 42s).
- **Funnel (§78):** Visitors → Product Views → Interested → Wishlist → Add to Cart → Checkout → Payment → Order.

### Explicitly-required event set (§76, §77)
`PAGE_VIEW, PRODUCT_VIEW, PRODUCT_IMAGE_VIEW, IMAGE_ZOOM, SEARCH, CATEGORY_VIEW, WISHLIST_ADD, CART_ADD,
CART_REMOVE, BUY_NOW, CHECKOUT_START, MEASUREMENT_START, MEASUREMENT_COMPLETE, WHATSAPP_CLICK, SHARE,
ORDER_PLACED, PAYMENT_SUCCESS, PAYMENT_FAILED` — **plus `PRODUCT_VIEW_START` / `PRODUCT_VIEW_END`** (for view
duration, §77), and logically `WHATSAPP_ENQUIRY`/shares referenced in product analytics.

Tech note (§82): **custom event tracking + GA4/other analytics + own database analytics** (all three can coexist;
we own the event model in our DB and can also feed GA4).

---

## 27. Admin Panel (§36, §42–§50, §59–§64)

- Admin panel **more powerful than a normal e-commerce admin** (§36).
- **Dashboard / analytics (§36–§41, §59–§61):** see Analytics section (above).
- **Order management (§42–§44):** all/new/status filters; order detail incl. custom-order measurements + version.
- **Product management (§45):** Add/edit product with fields: name, Design ID, description, category,
  sub-category, product type, price, discount, colors, sizes, fiber, embroidery, images, videos/GIF, stock, SKU,
  tags, SEO title, SEO description.
- **Product type (§46):** choose Ready to Buy / Customize / Showcase — site auto-decides buttons/features.
- **Inventory (§47–§48):** ready-to-buy stock (size/color) + **fiber stock**.
- **Coupons/Offers (§49–§50):** coupon management + discounts (product/category/festival/limited-time).
- **Roles (§62):** Super Admin (everything), Order Manager (orders), Product Manager (products/images/categories),
  Stitching Manager (customized orders + measurements), Analyst (analytics only).
- **Activity logs (§64):** what admin did — e.g., Deepak changed price of GS-206 (12:32), added new fiber
  (12:41), changed order #GS102 status → Stitching (12:50).
- **Notifications (§51):** new order, new customer, payment received, low stock, new enquiry.

---

## 28. Security & Privacy (§63)

Explicitly required:
- Admin authentication
- Role-based access
- Secure password hashing
- JWT/session security
- Rate limiting
- Input validation
- XSS protection
- CSRF protection where applicable
- Payment webhook verification
- Admin activity logs
- **Privacy/legal requirements when collecting IP/location data** for analytics.

---

## 29. Recommended Extra Features (§65–§74)

The PDF marks these as **recommended extras** (nice-to-have, not core):
- **Recently Viewed** (§65)
- **Continue Shopping** from cart (§66)
- **Low-stock indicator** — real inventory, no fake urgency (§67)
- **Similar Designs** ("You May Also Like" — same category/color/fiber/style) (§68)
- **Trending Blouses** on homepage, auto-generated from analytics (§69)
- **WhatsApp floating button** + **Call button** with admin-configured number (§70–§71)
- **Pincode check** (delivery available/date/shipping charge) (§72)
- **Order Notes / special instructions** (§73)
- **Measurement Recheck** before payment (§74)

**Open question:** which, if any, are in-scope for v1 vs. later. Recommend deferring recommended extras
(see roadmap).

---

## 30. Recommended Tech (§82)

The PDF explicitly endorses the **existing stack**:
- Frontend: React, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, Zustand/Redux Toolkit.
- Backend: Node.js, Express.js, TypeScript.
- DB: MongoDB.
- Images: **Cloudinary / equivalent image CDN**.
- Auth: **Google OAuth + Guest User**.
- Payments: **India-focused gateway such as Razorpay / another suitable provider**.
- WhatsApp: deep-link based enquiry initially; WhatsApp Business API later if needed.
- Analytics: **custom event tracking + GA4/other + own database analytics**.

---

## 31. Open Questions Register

| # | Open question | Origin | Impact |
|---|---------------|--------|--------|
| 1 | Custom blouse price formula (fiber + base + embroidery + stitching?) — not given | §16 | Pricing engine; must not be guessed |
| 2 | Sub-category depth (true 2-level vs tags) | §4, §45, §75 | Category model |
| 3 | Email/password registration, or Google + guest only? | §30, §82 | Auth model |
| 4 | Notification delivery channel (WhatsApp/email/SMS/in-app) | §51 | Notifications service |
| 5 | Exact payment provider + payment methods (COD? UPI?) | §82 | Payments design |
> **Resolved (Sept 2026): Razorpay primary + COD toggle, UPI-first checkout. See ADR 017.** |
| 6 | Which recommended extras (§65–74) are in v1 scope | §65–74 | Roadmap |
| 7 | Whether SHOWCASE designs can be converted to purchasable later | §25 | Capability registry |
| 8 | Using GA4 in addition to own DB analytics — privacy/storage of IP/location | §63, §82 | Analytics + privacy |
| 9 | "Customer lifetime value" computation basis | §40 | Customer analytics |
| 10 | Whether reviews support photo upload moderation pipeline | §34 | Reviews + media |
| 11 | WhatsApp enquiry storage (deep-link only vs also persisting Enquiry records) | §24, §75 | Enquiry entity |
| 12 | Unit of measurement default for new users (inches vs cm) and conversion handling | §21 | Measurement UX |
