# ADR 009: Guest Identity + Authenticated Identity

## Status
Proposed

## Context
Customers should be able to browse, use a cart, and shop without creating an account, but must be able to
create/merge an account afterward (email or Google OAuth). This requires a stable identity for anonymous users
that survives across requests and can later be merged into an authenticated account.

## Decision
Issue a signed **guest identity token** to anonymous visitors, used to key the **server-side guest cart**.
Authenticated users use JWT keyed to a `User`. Per requirements §26, the **guest wishlist is stored in
browser-local storage** (not a server collection); the authenticated wishlist lives in the database. On
login/OAuth, a `/auth/merge` flow merges the guest cart (and any guest-temp saved measurements) into the account
and invalidates the guest session. Separation is maintained between **Authentication** (identity),
**Authorization** (ownership), and **Permissions** (fine-grained RBAC); see `docs/api.md` §1–2.

## Consequences
- ✅ Seamless guest browsing + guest checkout without friction.
- ✅ Guest browser wishlist + guest cart preserved across account creation.
- ✅ Clear ownership scoping for cart/orders/wishlist/profiles.
- ⚠️ Guest tokens add session-management surface and security review.
- ⚠️ Merge logic must handle duplicates and price-snapshot consistency.
