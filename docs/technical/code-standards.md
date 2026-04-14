# Code Standards

## TypeScript

- **Strict mode** enabled (`"strict": true` in tsconfig)
- Prefer `type` over `interface` for consistency (unless extending)
- No `any` — use `unknown` and narrow
- No non-null assertions (`!`) — handle nulls explicitly
- Use `satisfies` for type-safe object literals where useful

## Formatting (Prettier)

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "all",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

- Format on save (configured in devcontainer)
- Tailwind plugin auto-sorts class names

## Linting (ESLint)

- Next.js default config (`eslint-config-next`)
- No custom rules
- Run with `npm run lint`

## File Naming

- **Components:** PascalCase — `Board.tsx`, `ReviewCard.tsx`
- **Hooks:** camelCase with `use` prefix — `useSocket.ts`, `useGameState.ts`
- **Lib/utils:** camelCase — `game-logic.ts`, `templates.ts`
- **Server:** camelCase — `socket-handler.ts`, `lobby.ts`
- **Types:** co-located in the file that uses them, or in a `types.ts` if shared

## Component Patterns

### Server Components (pages)

- Thin — validate route params, check game exists, render client component
- No hooks, no state, no Socket.IO
- Handle 404/redirect for invalid routes

### Client Components

- `'use client'` directive at top
- Own all interactivity, Socket.IO, and state
- Use `useGameState` context for shared state
- Keep components focused — extract when a component does two unrelated things

### Props

- Destructure in function signature
- No default exports for components — use named exports

```typescript
// Good
export function Square({ item, status, onTap }: SquareProps) {
  ...
}

// Avoid
export default function Square(props: SquareProps) {
  ...
}
```

## State Management

- `useReducer` for game state — all mutations go through typed actions
- `GameProvider` context wraps client components
- Socket events dispatch actions — never mutate state directly
- `localStorage` sync happens in the reducer (side effect on specific actions)

## Socket Event Handlers (Server)

Each handler file follows this pattern:

```typescript
import { Server, Socket } from 'socket.io'
import { prisma } from '@/lib/prisma'

export function registerLobbyHandlers(io: Server, socket: Socket) {
  socket.on('lobby:join', async (data: { gamePin: string }) => {
    // validate
    // database operation
    // emit response
    // join rooms
  })
}
```

- Always validate incoming data before database operations
- Wrap handler bodies in try/catch — emit simple error to client, log server-side
- Use Prisma transactions for operations that must be atomic (claim approval)

## API Routes

Next.js App Router convention:

```typescript
// src/app/api/items/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const items = await prisma.item.findMany()
  return NextResponse.json({ items })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  // validate
  // create
  return NextResponse.json(item, { status: 201 })
}
```

- Validate request body shape before processing
- Return appropriate HTTP status codes
- Admin routes check `X-Admin-Pin` header against `ADMIN_PIN` env var

## Testing (Vitest)

- **Target:** 80% code coverage
- **Scope:** Unit tests on game logic only
  - Claim transaction logic
  - Template resolution (no duplicate values, cap at 5)
  - Round generation (25 items, avoids recent)
  - Team assignment (correct order, no duplicates)
  - PIN generation (no collisions)
- **Location:** Co-located `*.test.ts` files next to source
- **No mocking of Prisma** — test pure functions that take data in and return results
- **No E2E or integration tests** — manual testing covers this

```
src/lib/game-logic.test.ts
src/lib/templates.test.ts
src/lib/teams.test.ts
```

## Imports

- Use `@/` path alias for `src/` (configured in tsconfig)
- Group imports: external packages, then internal (`@/`)
- No barrel exports (`index.ts`) — import directly from the file

## Error Handling

- Server socket handlers: try/catch, log, emit simple message to client
- API routes: try/catch, return `{ error: string }` with status code
- Client: Sonner toasts for user-facing messages, no technical details
- No custom error classes — keep it simple
