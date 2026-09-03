# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for significant architectural decisions.

## Format

Each ADR should follow this template:

```markdown
# ADR <number>: <title>

## Status
Proposed | Accepted | Deprecated | Superseded

## Context
What is the issue that we're seeing that is motivating this decision or change?

## Decision
What is the change that we're proposing and/or doing?

## Consequences
What becomes easier or more difficult to do because of this change?
```

## Index

- [ADR 001: Monorepo with pnpm workspaces](./adr-001-monorepo.md)
- [ADR 002: TypeScript strict mode](./adr-002-typescript-strict.md)
- [ADR 003: React + Vite for frontend](./adr-003-react-vite.md)
- [ADR 004: Express + Prisma + MongoDB for backend](./adr-004-express-prisma-mongodb.md)
- [ADR 005: Tailwind CSS for styling](./adr-005-tailwind.md)
- [ADR 006: TanStack Query for server state](./adr-006-tanstack-query.md)
- [ADR 007: Zustand for client state](./adr-007-zustand.md)
- [ADR 008: Capability-oriented Product Architecture](./adr-008-product-architecture.md)
- [ADR 009: Guest Identity + Authenticated Identity](./adr-009-guest-identity.md)
- [ADR 010: Server-authoritative Cart with Mixed Item Types](./adr-010-cart-architecture.md)
- [ADR 011: Versioned Measurement System with Order Snapshots](./adr-011-measurement-versioning.md)
- [ADR 012: Order Snapshot for Historical Purchase Integrity](./adr-012-order-snapshots.md)
- [ADR 013: Permission-based RBAC](./adr-013-rbac.md)
- [ADR 014: Flexible Event-based Analytics](./adr-014-analytics.md)
- [ADR 015: API Design Boundaries](./adr-015-api-boundaries.md)
- [ADR 016: Fiber Inventory for Customization](./adr-016-fiber-inventory.md)