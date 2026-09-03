# ADR 013: Permission-based RBAC

## Status
Proposed

## Context
The admin back-office has multiple roles (SUPER_ADMIN, ORDER_MANAGER, PRODUCT_MANAGER, STITCHING_MANAGER,
ANALYST). Naively scattering `if (role === ...)` checks through the code makes authorization hard to audit and
extend, and mixes Authentication with Authorization.

## Decision
Use a **permission-based RBAC** model: named `Permission`s (e.g., `product:*`, `order:*`, `coupon:*`,
`reports:view`) are grouped into `AdminRole`s, and users are assigned roles. A single centralized `authorize()`
middleware enforces permissions declaratively per route. Authentication is separate from authorization, which is
separate from fine-grained permissions. All sensitive operations write an `AdminActivityLog` audit entry. See
`docs/api.md` §2 and `docs/database-design.md` §3.

## Consequences
- ✅ Centralized, auditable authorization.
- ✅ Roles easily composed/reconfigured without code changes.
- ✅ Sensitive-operation audit trail built-in.
- ✅ New permissions/roles added declaratively.
- ⚠️ More initial set-up than ad-hoc role checks.
- ⚠️ Must keep permission names consistent in shared types.
