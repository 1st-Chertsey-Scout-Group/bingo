# Step 023: Create Prisma Client Singleton

## Description

Create a Prisma client singleton module that prevents multiple database connections during development. Next.js hot-reloads modules in development, which would otherwise create a new PrismaClient instance each time, eventually exhausting database connections.

## Requirements

- Create `src/lib/prisma.ts`
- Use the global object pattern to store the PrismaClient instance
- In development, store the client on `globalThis` so it survives hot reloads
- In production, create a new instance each time the module is loaded (normal behavior)
- Export the `prisma` instance as a named export

## Files to Create/Modify

- `src/lib/prisma.ts` — create with the following exact content:

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

## Checklist

- [ ] Implemented
- [ ] Verified

## Verification

- **Check**: `src/lib/prisma.ts` exists with the singleton pattern
- **Command**: `cat src/lib/prisma.ts`
- **Check**: The file imports PrismaClient and exports a `prisma` instance
- **Command**: `grep -c 'export const prisma' src/lib/prisma.ts`

## Commit

`feat(db): create Prisma client singleton for connection reuse`
