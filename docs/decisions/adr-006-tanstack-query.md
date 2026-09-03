# ADR 006: TanStack Query for server state

## Status
Accepted

## Context
Need to manage server state (caching, synchronization, background updates) separately from client state.

## Decision
Use TanStack Query (React Query) for all server state management.

## Consequences
- ✅ Automatic caching and deduplication
- ✅ Background refetching
- ✅ Optimistic updates
- ✅ Pagination and infinite scroll helpers
- ✅ Devtools for debugging
- ⚠️ Additional learning curve
- ⚠️ Overkill for very simple apps