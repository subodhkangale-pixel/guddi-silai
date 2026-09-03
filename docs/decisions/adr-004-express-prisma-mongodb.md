# ADR 004: Express + Prisma + MongoDB for backend

## Status
Accepted

## Context
Need a backend that's type-safe, scalable, and works well with TypeScript.

## Decision
Use Express.js with Prisma ORM and MongoDB database.

## Consequences
- ✅ Prisma provides type-safe database access
- ✅ MongoDB flexible schema for product variants
- ✅ Express is lightweight and well-understood
- ✅ Good TypeScript integration
- ⚠️ MongoDB requires separate infrastructure
- ⚠️ Prisma MongoDB support is still maturing