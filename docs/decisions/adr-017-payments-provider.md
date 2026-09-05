# ADR 017: Payment Provider — Razorpay Primary (small-business fit)

## Status
Proposed

## Context
Requirements (§82) say "India-focused gateway such as Razorpay / another suitable provider", leaving the exact
provider and payment methods open (Open Question #5). We are a small business / startup blouse store: zero
upfront budget, low order volume, cash-flow sensitive. 2026 market data:

- UPI is ~85% of India's retail digital payments and carries **0% TDR (RBI-mandated)** → UPI-first keeps the
  blended cost near 0.6–1% vs ~2% for cards.
- **Razorpay**: ₹0 setup / ₹0 AMC, ~2% + GST per txn, T+2 settlement (T+0 optional paid), strong D2C/startup
  integration support. Already integrated in `apps/api/src/payments`.
- **Cashfree**: ~1.6–1.9%, T+1 — cheaper, but marginally less startup-focused; good fallback.
- **GoKwik is NOT a payment gateway** — it is a checkout/growth platform (one-click checkout, address autofill,
  RTO protection, BNPL) that *aggregates* gateways (Worldline, PayU, Easebuzz) and charges subscription + txn
  fees. Valuable only when COD/RTO losses justify it — not at launch.
- **COD**: no gateway fee, hugely trusted in India (~60% of buyers place COD), but carries RTO risk.
- **Instamojo**: payment links, best for WhatsApp-driven micro sales.

## Decision
- **Primary gateway: Razorpay** (already implemented — order create/verify/webhook, HMAC signature verification,
  idempotent webhook handling). Live credentials to be added in `.env` (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`,
  `RAZORPAY_WEBHOOK_SECRET`).
- **UPI-first checkout** to exploit 0% TDR; store payment method/status/transaction ID on the order (§43).
- **COD toggle** enabled for trust; monitored for RTO and possibly converted via GoKwik Smart COD later.
- **Defer GoKwik / KwikCheckout** until COD order volume makes RTO protection worth the fees; keep **Cashfree**
  documented as a fallback gateway and **Instamojo** links for WhatsApp-driven orders.

## Consequences
- ✅ Zero upfront cost for a small business; pay-per-transaction only.
- ✅ Payment code already written and tested (payments.service.test.ts) — no rework.
- ✅ UPI-first keeps blended TDR near-zero, protecting thin margins.
- ⚠️ Razorpay non-enterprise support can be slow → mitigate with a documented Cashfree migration path.
- ⚠️ COD introduces RTO risk → track COD rate in analytics (Phase 14/16) to time the GoKwik decision.