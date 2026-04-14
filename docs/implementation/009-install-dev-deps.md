# Step 009: Install Dev Dependencies

> **MANUAL STEP** — requires human action.

## Description
Install all development npm dependencies required for building, testing, linting, and formatting the Scout Bingo project. These packages are not included in the production bundle.

## Requirements
- All packages must be installed as dev dependencies (`--save-dev`)
- Install the following exact packages:
  - `typescript` — TypeScript compiler
  - `tsx` — TypeScript execution engine (for running server.ts in dev)
  - `prisma` — Prisma CLI for database migrations and schema management
  - `vitest` — Test runner
  - `@vitest/coverage-v8` — Code coverage provider for Vitest
  - `eslint` — JavaScript/TypeScript linter
  - `eslint-config-next` — Next.js ESLint configuration
  - `prettier` — Code formatter
  - `prettier-plugin-tailwindcss` — Prettier plugin for Tailwind CSS class sorting
  - `@types/node` — Node.js type definitions
  - `@types/react` — React type definitions
  - `@types/react-dom` — React DOM type definitions

## Files to Create/Modify
- `package.json` — updated with dev dependencies in the `devDependencies` section

## Checklist
- [x] Implemented
- [x] Verified

## Verification
- **Check**: All dev packages are listed in `package.json` under `devDependencies`
- **Command**: `npm install --save-dev typescript tsx prisma vitest @vitest/coverage-v8 eslint eslint-config-next prettier prettier-plugin-tailwindcss @types/node @types/react @types/react-dom`
- **Check**: Prisma CLI is available
- **Command**: `npx prisma --version`
- **Check**: Vitest is available
- **Command**: `npx vitest --version`

## Commit
`chore(deps): install dev dependencies`
