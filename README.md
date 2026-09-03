# Guddi Silai

Indian blouse e-commerce and custom-tailoring platform.

## Architecture

This is a monorepo managed with pnpm workspaces:

- **apps/web** - React + TypeScript + Vite frontend
- **apps/api** - Node.js + Express + TypeScript backend
- **packages/shared** - Shared TypeScript types and utilities

## Prerequisites

- Node.js >= 20.18.0
- pnpm >= 10.34.5
- MongoDB (for API)

## Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Generate Prisma client
pnpm db:generate

# Push database schema
pnpm db:push
```

## Development Commands

```bash
# Start all development servers
pnpm dev

# Start only web
pnpm --filter web dev

# Start only API
pnpm --filter api dev

# Build all packages
pnpm build

# Lint all packages
pnpm lint

# Type check all packages
pnpm typecheck

# Format code
pnpm format
```

## Database Commands

```bash
# Generate Prisma client
pnpm db:generate

# Push schema changes to database
pnpm db:push

# Open Prisma Studio
pnpm db:studio
```

## Project Structure

```
guddi-silai/
├── apps/
│   ├── web/          # React frontend
│   └── api/          # Express backend
├── packages/
│   └── shared/       # Shared types/utilities
├── docs/
│   ├── architecture.md
│   ├── development.md
│   ├── roadmap.md
│   └── decisions/
├── scripts/
├── .gitignore
├── .editorconfig
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

## Technology Stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query
- Zustand

### Backend
- Node.js
- Express
- TypeScript
- Prisma ORM
- MongoDB

## Code Quality

- ESLint
- Prettier
- EditorConfig
- TypeScript strict mode