# ADR 001: Monorepo with pnpm workspaces

## Status
Accepted

## Context
We need a structure that allows sharing code between frontend and backend while maintaining clear separation.

## Decision
Use pnpm workspaces with three packages:
- `apps/web` - React frontend
- `apps/api` - Express backend
- `packages/shared` - Shared TypeScript types and utilities

## Consequences
- ✅ Single `pnpm install` installs all dependencies
- ✅ Shared types prevent duplication
- ✅ Independent versioning and deployment possible
- ✅ Fast installs with pnpm's symlink strategy
- ⚠️ Requires pnpm (not npm/yarn)