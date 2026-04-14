# Scout Nature Bingo

Real-time web app for scout nature bingo evenings. Teams of 2 scouts photograph nature items from a shared bingo board. Leaders review submissions and approve/reject. First team to get a photo approved claims the square.

## Tech Stack

| Layer             | Technology                                              |
| ----------------- | ------------------------------------------------------- |
| Framework         | Next.js (App Router)                                    |
| Real-time         | Socket.IO                                               |
| Database          | SQLite via Prisma (WAL mode)                            |
| Photo storage     | AWS S3 (presigned URLs)                                 |
| Styling           | Tailwind CSS + shadcn/ui                                |
| Toasts            | Sonner                                                  |
| Icons             | Lucide React                                            |
| Image compression | browser-image-compression                               |
| Runtime           | Node 20 LTS                                             |
| Language          | TypeScript (strict mode)                                |
| Testing           | Vitest                                                  |
| Formatting        | Prettier (single quotes, no semicolons, 2-space indent) |
| Linting           | ESLint (Next.js defaults)                               |

## Commands

```bash
npm run dev          # Start dev server (tsx watch server.ts)
npm run build        # Build for production (next build + tsc server)
npm run start        # Run production server (node dist/server.js)
npm run test         # Run tests (vitest)
npm run test:coverage # Run tests with coverage
npm run lint         # Run ESLint
npm run format       # Run Prettier
npm run db:push      # Push Prisma schema to database
npm run db:seed      # Seed database with default items
npm run db:studio    # Open Prisma Studio
```

## Project Structure

```
scout-bingo/
├── docs/
│   ├── product/           # Spec, screens, items, team names
│   ├── technical/         # Architecture, API, data model, sockets, etc.
│   └── implementation/    # Step-by-step build docs (001-153)
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/               # Next.js pages and API routes
│   ├── components/        # React components (ui/ for shadcn)
│   ├── lib/               # Utilities (prisma, socket, s3, teams, etc.)
│   ├── hooks/             # React hooks (useSocket, useGameState)
│   └── server/            # Socket.IO handlers
├── server.ts              # Custom server (HTTP + Socket.IO + Next.js)
└── public/                # Static assets, PWA manifest, service worker
```

## Code Conventions

- TypeScript strict mode — no `any`, no non-null assertions
- Prefer `type` over `interface`
- Named exports only (no default exports for components)
- Props destructured in function signature
- `@/` import alias for `src/`
- Import order: external packages first, then internal `@/`
- Server components are thin (validate, render client component)
- Client components own all interactivity, state, and Socket.IO
- `useReducer` + Context for game state management
- Socket events dispatch actions to the reducer
- API routes validate input and return `{ error: string }` on failure
- Admin routes check `X-Admin-Pin` header against `ADMIN_PIN` env var
- Tests: Vitest, co-located `*.test.ts`, pure functions only, no Prisma mocks
- Sonner toasts for user-facing messages — no technical error details

## Documentation

### Product docs (`docs/product/`)

- `spec.md` — full product specification, game flow, roles, board rules
- `screens.md` — screen-by-screen UI breakdown for scouts, leaders, admin
- `default-items.md` — 85 concrete items + 2 templates with values
- `team-names.md` — 30 team names with hex colours

### Technical docs (`docs/technical/`)

- `architecture.md` — stack, routes, project structure, server setup, deployment
- `data-model.md` — Prisma schema with all 6 models and relationships
- `api-routes.md` — REST endpoints with request/response shapes
- `socket-events.md` — all Socket.IO events with payloads
- `code-standards.md` — TypeScript, formatting, naming, patterns
- `dependencies.md` — all packages with rationale
- `photo-pipeline.md` — camera to S3 to review flow
- `resilience.md` — reconnection, caching, retry, lock timeout

### Implementation docs (`docs/implementation/`)

153 atomic step-by-step build instructions. Each step is a self-contained work order with:

- Description, Requirements, Files to Create/Modify
- Checkboxes (ticked when complete)
- Verification commands
- Prescribed commit message

The table of contents is `docs/implementation.md` — shows all steps with completion status.

**Implementation is done via the implement agent, not directly in a regular session.** This session can read steps and answer questions about them, but should not execute them.

## Agents

| Agent              | Purpose                                                                        |
| ------------------ | ------------------------------------------------------------------------------ |
| `implement`        | Executes implementation steps — reads step doc, builds code, verifies, commits |
| `frontend-design`  | Builds polished UI components/pages using the `frontend-design` skill          |
| `product-review`   | Read-only audit of source against product docs                                 |
| `technical-review` | Read-only audit of source against technical docs                               |

### Workflow

1. Run `/implement` to start the implementation loop
2. Each iteration: agent finds next step, implements it, pauses for review
3. For UI-heavy steps, spawn `frontend-design` agent for polished component design
4. Optionally spawn `product-review` or `technical-review` agents to audit
5. Say "commit" to commit and advance to the next step
6. `/cancel-ralph` to stop the loop
