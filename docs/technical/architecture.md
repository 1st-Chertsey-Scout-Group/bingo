# Architecture

## Stack

| Layer             | Technology                | Rationale                                                                            |
| ----------------- | ------------------------- | ------------------------------------------------------------------------------------ |
| Framework         | Next.js (App Router)      | SSR for initial load, API routes for REST, custom server for Socket.IO               |
| Real-time         | Socket.IO                 | Reliable WebSocket with auto-reconnect, room-based broadcasting, fallback to polling |
| Database          | SQLite via Prisma         | Single-file DB, zero config, WAL mode for concurrent reads/writes                    |
| Photo storage     | AWS S3                    | Pre-existing bucket, presigned URLs for direct upload, public read                   |
| Styling           | Tailwind CSS + shadcn/ui  | Utility-first CSS with pre-built accessible components                               |
| Toasts            | Sonner (via shadcn)       | Submission feedback, error messages                                                  |
| Icons             | Lucide React (via shadcn) | Approve/reject, camera, minimal UI icons                                             |
| Image compression | browser-image-compression | Client-side WebP compression with Worker offloading                                  |
| Runtime           | Node 20 LTS               | Long-term support, devcontainer managed                                              |
| Package manager   | npm                       | Standard, no additional tooling                                                      |
| Language          | TypeScript (strict)       | Strict mode, catches null bugs around claims/sockets                                 |
| Testing           | Vitest                    | Fast, native TypeScript, 80% coverage target                                         |
| Linting           | ESLint (Next.js default)  | No custom rules                                                                      |
| Formatting        | Prettier                  | Single quotes, no semicolons, 2-space indent                                         |

## Routes

State-driven rendering — each route renders different UI based on game status (lobby/active/ended).

| Route              | Purpose                                                                                                                                                                                                                          |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                | Landing page — enter PIN (determines scout or leader)                                                                                                                                                                            |
| `/play/[gameId]`   | Scout experience (lobby, board, end-of-round)                                                                                                                                                                                    |
| `/leader/[gameId]` | Leader experience (lobby, board + review modal, summary)                                                                                                                                                                         |
| `/admin`           | Game creation (leader PIN, display name, board size/template count sliders) + item pool management (protected by `ADMIN_PIN` env var). On game creation: seeds localStorage with leader session, redirects to `/leader/[gameId]` |

## Project Structure

```
scout-bingo/
├── docs/
│   ├── product/              # Spec, screens, items, team names
│   └── technical/            # This folder
├── prisma/
│   ├── schema.prisma
│   └── seed.ts               # Default item pool + template values
├── public/
│   ├── manifest.json             # PWA manifest (name, icons, theme, standalone)
│   ├── sw.js                     # Service worker — app shell cache only
│   └── icons/                    # PWA icons (192x192, 512x512)
├── src/
│   ├── app/
│   │   ├── page.tsx                  # Landing — enter PIN
│   │   ├── play/
│   │   │   └── [gameId]/
│   │   │       └── page.tsx          # Scout experience (state-driven)
│   │   ├── leader/
│   │   │   └── [gameId]/
│   │   │       └── page.tsx          # Leader experience (state-driven)
│   │   ├── admin/
│   │   │   └── page.tsx              # Game creation + item management
│   │   └── api/
│   │       ├── game/
│   │       │   └── route.ts          # Game CRUD
│   │       ├── upload/
│   │       │   └── route.ts          # S3 presigned URL generation
│   │       ├── items/
│   │       │   └── route.ts          # Item pool CRUD
│   │       └── validate/
│   │           └── route.ts          # PIN validation
│   ├── components/
│   │   ├── ui/                       # shadcn/ui components
│   │   ├── Board.tsx
│   │   ├── Square.tsx
│   │   ├── ReviewModal.tsx           # Leader review overlay — photo, approve/reject
│   │   ├── RoundHeader.tsx           # Leader round header — timer, progress, end round
│   │   ├── Lobby.tsx
│   │   ├── TeamBadge.tsx
│   │   ├── ScoutGame.tsx             # Client component — scout state-driven UI
│   │   └── LeaderGame.tsx            # Client component — leader state-driven UI
│   ├── lib/
│   │   ├── prisma.ts                 # Prisma client singleton
│   │   ├── socket.ts                 # Socket.IO client setup
│   │   ├── s3.ts                     # S3 presigned URL generation
│   │   ├── image.ts                  # browser-image-compression wrapper
│   │   ├── teams.ts                  # Team name/colour assignment (30 teams)
│   │   ├── game-logic.ts             # Item selection, claim validation
│   │   └── templates.ts              # Template resolution ([colour] -> "Red", etc.)
│   ├── hooks/
│   │   ├── useSocket.ts              # Socket connection + auto-reconnect
│   │   └── useGameState.ts           # useReducer + Context for board state
│   └── server/
│       ├── socket-handler.ts         # Entry point — registers all handlers
│       └── socket/
│           ├── lobby.ts              # join, rejoin
│           ├── game.ts               # start, end, newround
│           └── submission.ts         # submit, approve, reject
├── server.ts                         # Custom Next.js server with Socket.IO
├── tsconfig.json                     # Next.js + browser TypeScript config
├── tsconfig.server.json              # Server-only TypeScript config (CommonJS -> dist/)
├── Dockerfile
├── docker-compose.yml
├── .devcontainer/
│   └── devcontainer.json
├── .prettierrc
├── .env.example
├── package.json
└── README.md
```

## Component Architecture

Pages are thin server components that validate the route (game exists?) then render a fat client component:

```
app/play/[gameId]/page.tsx          <- server component, validates gameId exists
  └── components/ScoutGame.tsx      <- 'use client', Socket.IO, useGameState, all UI
        ├── Lobby                   <- rendered when game.status === 'lobby'
        ├── Board + Square[]        <- rendered when game.status === 'active'
        └── RoundEnd overlay        <- rendered when game.status === 'ended'
```

```
app/leader/[gameId]/page.tsx        <- server component, validates gameId exists
  └── components/LeaderGame.tsx     <- 'use client', Socket.IO, useGameState, all UI
        ├── Lobby                   <- rendered when game.status === 'lobby'
        ├── RoundHeader + Board + ReviewModal  <- rendered when game.status === 'active'
        └── Summary                 <- rendered when game.status === 'ended'
```

## State Management

Client-side state uses `useReducer` + React Context:

```typescript
// Game state shape
type GameState = {
  status: 'lobby' | 'active' | 'ended'
  teams: Team[]
  board: RoundItem[]
  myTeam: Team | null
  mySubmissions: Map<string, SubmissionStatus>
  summary: TeamSummary[] | null
  roundStartedAt: string | null // ISO timestamp for round timer
  // Leader-only state:
  locks: Map<string, string> // roundItemId -> leaderName
  reviewingRoundItemId: string | null // which square this leader has open
}

// Socket events dispatch actions to the reducer
type GameAction =
  | { type: 'GAME_STARTED'; items: RoundItem[]; roundStartedAt: string }
  | {
      type: 'SQUARE_CLAIMED'
      roundItemId: string
      teamId: string
      teamName: string
      teamColour: string
    }
  | { type: 'SQUARE_PENDING'; roundItemId: string } // new submission queued for this square
  | { type: 'SQUARE_LOCKED'; roundItemId: string; leaderName: string }
  | { type: 'SQUARE_UNLOCKED'; roundItemId: string }
  | { type: 'SUBMISSION_RECEIVED'; itemId: string }
  | { type: 'SUBMISSION_APPROVED'; itemId: string }
  | { type: 'SUBMISSION_REJECTED'; itemId: string }
  | { type: 'SUBMISSION_DISCARDED'; itemId: string }
  | {
      type: 'REVIEW_PROMOTED'
      roundItemId: string
      submission: SubmissionForReview
    } // next in queue
  | { type: 'GAME_ENDED'; summary: TeamSummary[] }
  | { type: 'GAME_LOBBY' } // clears teamId from localStorage — scouts must re-join for fresh team
  | { type: 'LOBBY_TEAMS'; teams: Team[] }
  | { type: 'FULL_STATE'; state: GameState } // rejoin hydration
```

A `GameProvider` context wraps the client components, making state available to nested components without prop drilling.

## Custom Server

Next.js App Router doesn't natively support WebSockets. `server.ts` creates a custom HTTP server:

1. Creates an HTTP server
2. Attaches Socket.IO to it
3. Passes all HTTP requests through to Next.js `getRequestHandler()`
4. Single port (3000), single process

```
Browser requests /play/abc123
  → httpServer receives HTTP request
  → Next.js request handler renders page + ships client JS
  → Browser loads JS, connects Socket.IO on same host:port
  → WebSocket upgrade on same httpServer
  → Socket.IO handles real-time events
```

```
Client <--WebSocket--> Socket.IO <---> server.ts <---> Next.js (HTTP)
                                         |
                                       Prisma <---> SQLite (/app/data/scout-bingo.db)
                                         |
                                       S3 SDK <---> AWS S3
```

### Server TypeScript Config

Separate `tsconfig.server.json` for compiling server code:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "commonjs",
    "outDir": "dist",
    "noEmit": false
  },
  "include": ["server.ts", "src/server/**/*", "src/lib/prisma.ts"]
}
```

- Dev: `tsx watch server.ts`
- Production: compiled to `dist/server.js`, run with `node`

## Socket.IO Rooms

Rooms scope broadcasts to relevant clients:

| Room               | Members                        | Purpose                                           |
| ------------------ | ------------------------------ | ------------------------------------------------- |
| `game:{gameId}`    | All clients (scouts + leaders) | Board state updates, game flow events             |
| `leaders:{gameId}` | Leaders only                   | Review queue events                               |
| `team:{teamId}`    | Single team's device(s)        | Submission feedback (approved/rejected/discarded) |

### Socket Handler Structure

```
src/server/
├── socket-handler.ts         # entry point — registerSocketHandlers(io)
└── socket/
    ├── lobby.ts              # lobby:join, rejoin
    ├── game.ts               # game:start, game:end, game:newround
    └── submission.ts         # submission:submit, review:approve, review:reject
```

Each file exports a function `(io: Server, socket: Socket) => void` that registers event listeners. The Prisma singleton is imported directly by each handler.

## Photo Upload Flow

1. Scout taps square → hidden `<input type="file" accept="image/*" capture="environment">` opens native camera
2. Photo captured, returned as File
3. `browser-image-compression` compresses to WebP (~1200px wide, ~50-150KB)
4. Client requests presigned S3 upload URL from `POST /api/upload`
5. Client uploads directly to S3 using presigned PUT URL
6. Client emits `submission:submit` with `{ roundItemId, photoUrl }` via Socket.IO
7. Server creates Submission record, emits `review:new` to leaders room

Presigned URLs keep photo bandwidth off the app server — S3 handles it directly.

## Concurrency

SQLite with WAL mode handles ~30 concurrent writers.

Critical section — claiming a square:

1. Leader approves submission
2. Server runs in a Prisma transaction:
   a. Check `RoundItem.claimedByTeamId IS NULL`
   b. If null: set `claimedByTeamId`, update submission to `approved`
   c. If not null: submission lost the race — mark as `discarded`
3. Broadcast result

SQLite transactions are serialised by default — no double-claims possible.

## Error Handling

### Client-Side (Scout-Friendly)

- **No connection**: banner at top — "No connection — trying to reconnect..."
- **Photo upload failed**: inline on square — "Photo didn't send — tap to try again"
- **Unrecoverable**: redirect to `/` — re-enter PIN to rejoin
- No technical error messages, no error codes, no modals

### Server-Side

- `console.error` to stdout — captured by Coolify logs
- No logging library — single process, stdout is sufficient
- Socket event handlers catch errors and emit simple messages to the client

## Deployment

### Infrastructure

- **Host:** Hetzner VPS
- **Platform:** Coolify
- **Container:** Docker Compose

### Docker

Multi-stage Dockerfile (Alpine):

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build    # next build + tsc --project tsconfig.server.json

# Stage 2: Production
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
```

Entrypoint script (auto-migrate + seed on first start):

```bash
#!/bin/sh
if [ ! -f /app/data/scout-bingo.db ]; then
  npx prisma db push
  npx prisma db seed
fi
exec "$@"
```

### Docker Compose

```yaml
services:
  app:
    build: .
    ports:
      - '3000:3000'
    volumes:
      - sqlite-data:/app/data
    environment:
      - DATABASE_URL=file:/app/data/scout-bingo.db
      - NODE_ENV=production
    env_file: .env

volumes:
  sqlite-data:
```

## Environment Variables

```
# Database
DATABASE_URL="file:./data/scout-bingo.db"

# S3 (supports AWS or S3-compatible services)
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_REGION=
S3_BUCKET=
S3_ENDPOINT=              # Optional — for S3-compatible services (e.g. MinIO)

# Admin
ADMIN_PIN=              # Protects /admin page

# App
NODE_ENV=development    # or production
PORT=3000
```

## Devcontainer

```json
{
  "name": "Scout Bingo",
  "image": "mcr.microsoft.com/devcontainers/javascript-node:20",
  "features": {
    "ghcr.io/timcane/devcontainer-features/claude-code-passthrough:0": {}
  },
  "forwardPorts": [3000],
  "customizations": {
    "vscode": {
      "extensions": [
        "Prisma.prisma",
        "bradlc.vscode-tailwindcss",
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode"
      ],
      "settings": {
        "editor.defaultFormatter": "esbenp.prettier-vscode",
        "editor.formatOnSave": true
      }
    }
  }
}
```

## NPM Scripts

```json
{
  "dev": "tsx watch server.ts",
  "build": "next build && tsc --project tsconfig.server.json",
  "start": "node dist/server.js",
  "db:push": "prisma db push",
  "db:seed": "prisma db seed",
  "db:studio": "prisma studio",
  "test": "vitest",
  "test:coverage": "vitest --coverage",
  "lint": "next lint",
  "format": "prettier --write ."
}
```
