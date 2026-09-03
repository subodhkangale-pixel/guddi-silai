# Development Guide

## Getting Started

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Copy environment files:
   ```bash
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   ```
4. Start MongoDB (local or Docker)
5. Generate Prisma client: `pnpm db:generate`
6. Push schema: `pnpm db:push`
7. Start development: `pnpm dev`

## Git Workflow

- Main branch: `main`
- Feature branches: `feature/description`
- Bug fixes: `fix/description`
- Commits follow conventional commits

## Code Style

- TypeScript strict mode enabled
- ESLint + Prettier for formatting
- EditorConfig for consistent editor settings
- Path aliases: `@/` for app src, `@guddi-silai/shared/*` for shared

## Adding Dependencies

```bash
# Root level
pnpm add -w <package>

# Web app
pnpm --filter web add <package>

# API app
pnpm --filter api add <package>

# Shared package
pnpm --filter shared add <package>

# Dev dependencies
pnpm --filter web add -D <package>
```

## Database Migrations

```bash
# After schema changes
pnpm db:generate
pnpm db:push
```

## Testing

```bash
# Run all tests
pnpm test

# Watch mode
pnpm --filter web test
pnpm --filter api test
pnpm --filter shared test
```

## Building for Production

```bash
pnpm build
```

## Environment Variables

Never commit `.env` files. Use `.env.example` as template.

## Debugging

- Frontend: React DevTools, Vite dev server
- Backend: `tsx watch` for hot reload, console logs
- Database: Prisma Studio (`pnpm db:studio`)