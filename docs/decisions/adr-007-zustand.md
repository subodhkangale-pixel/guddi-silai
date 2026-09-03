# ADR 007: Zustand for client state

## Status
Accepted

## Context
Need a simple, lightweight global state management solution for client-side state (UI state, user preferences, cart).

## Decision
Use Zustand for global client state.

## Consequences
- ✅ Minimal boilerplate
- ✅ Small bundle size (~1KB)
- ✅ TypeScript first
- ✅ No Provider wrapper needed
- ✅ Easy to test
- ⚠️ Less opinionated than Redux
- ⚠️ No built-in devtools (but works with Redux DevTools)