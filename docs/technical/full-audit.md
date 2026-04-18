# Full Codebase Audit

**Date:** 2026-04-17
**Branch:** `features/pre-demo-improvements`
**Methodology:** 5 parallel audit agents (product, technical, socket, API/data, UI) + direct tooling checks (tsc, eslint, vitest)

---

## Tooling Results

| Check          | Result                                              |
| -------------- | --------------------------------------------------- |
| `tsc --noEmit` | Clean (no errors)                                   |
| `vitest`       | 57 tests, 5 files, all passing                      |
| `eslint`       | 4 errors, 1 warning (see below)                     |
| `npm run lint` | Broken script (`next lint .` misinterprets the `.`) |

---

## 1. CRITICAL / MUST FIX

### 1.1 Rules of Hooks Violation

**`src/hooks/useSocket.ts:10-14`**
Early return (`if (typeof window === 'undefined') return null`) before `useEffect` at line 16. This violates React's rules of hooks — hooks must be called in the same order every render. ESLint flags this as an error.

**Fix:** Move the SSR guard inside the effect, or return a no-op socket ref for SSR.

### 1.2 `review:reject` Race Condition

**`src/server/socket/submission.ts:433-488`**
The reject handler does NOT wrap its read-then-write in a `prisma.$transaction()`, unlike `review:approve` (which does at line 301). Between the `findUnique` and the status update, another leader could approve the same submission. A leader could reject an already-approved submission.

**Fix:** Wrap the reject flow in a transaction, same as approve.

### 1.3 Missing Admin Item Pool UI (Screen A2)

**`src/app/admin/page.tsx`**
The spec defines an item management screen (add/edit/delete items from the pool). The REST API is fully implemented (`/api/items` GET/POST, `/api/items/[id]` PUT/DELETE) but there is no UI. Leaders cannot manage items before an event.

### 1.4 Missing Admin Board Config on Game Creation

**`src/app/admin/page.tsx:43-153`**
The spec says admin configures board size (9-25) and template count (0-10) at game creation. The admin form only collects Leader PIN and display name. Board configuration is only available in the Leader Lobby, which doesn't match the spec.

### 1.5 API Response Shape Mismatches

**`src/lib/api-types.ts`**

- `POST /api/game` response is missing `boardSize` and `templateCount` fields documented in `api-routes.md`
- `GET /api/game/[gameId]` response is missing `round`, `boardSize`, and `templateCount` fields
- Root cause: the Game model in Prisma no longer has these fields (refactored to WebSocket-level config), but the API docs were not updated

---

## 2. HIGH PRIORITY

### 2.1 Board Size Max is 24, Not 25

**`src/lib/constants.ts:28-29`**
`SIZE_MAX: 24` but the spec explicitly says 9-25 (default 25). The choice of 24 may be intentional (divides evenly by 3 columns) but violates the spec. The spec's own math is also wrong ("25 items = 9 rows" in a 3-column grid would be 27 cells).

**Decision needed:** Update spec to say 24, or support 25 with a partial last row.

### 2.2 Missing Database Indexes

**`prisma/schema.prisma`**
No index on `Game.pin` or `Game.leaderPin`. Every PIN validation (`POST /api/validate`) does a full table scan. Should add `@@index([pin])` and `@@index([leaderPin])`.

### 2.3 Missing Unique Constraint on Submissions

**`prisma/schema.prisma`**
No `@@unique([roundItemId, teamId])` on the Submission model. The application layer prevents duplicate submissions via socket logic, but there's no database-level defense. This was already identified in `docs/bugs/submission-no-rate-limit.md` but never implemented.

### 2.4 ESLint Errors in Lobby.tsx

**`src/components/Lobby.tsx:68, 82`**
Two `setState` calls directly inside `useEffect` bodies (not in callbacks), flagged by `react-hooks/set-state-in-effect`. The `setIsLandscape(mql.matches)` on line 68 should use initial state instead. The `setTemplateCount(max)` on line 82 is a derived-state clamp that should be a `useMemo`.

### 2.5 Unused Variable

**`src/hooks/useScoutSocket.ts:81`**
`_payload` is defined but never used (ESLint warning).

### 2.6 Non-null Assertion

**`src/server/socket-handler.ts:100`**
`ctx.leaderName!` — the value is checked at line 95 but TypeScript doesn't track it across the async closure. Should use a local const or add a guard.

---

## 3. MEDIUM PRIORITY

### 3.1 Socket Event Documentation Gaps

5 client-to-server and 5 server-to-client events are implemented but not documented in `docs/technical/socket-events.md`:

- `board:preview`, `board:refresh-item` (leader board configuration)
- `location:update`, `location:positions` (GPS tracking)
- `team:switch`, `team:switched` (lobby team switching)
- `team:lock`, `team:locked` (lobby lock toggle)

### 3.2 `square:unlocked` Payload Mismatch

**`src/server/socket/submission.ts:38-48`**
The spec defines `{ roundItemId }` but the implementation adds an undocumented `hasPendingSubmissions` boolean. Clients depend on this field. Either update the spec or remove the field.

### 3.3 Leader Rejoin Stale Session

**`src/hooks/useLeaderSocket.ts:40-48`**
If a leader was previously in a different game, `loadSession()` could return a stale `leaderName` from that game, potentially causing a rejoin to the wrong leader room.

### 3.4 Lock Timeout Missing hasPendingSubmissions

**`src/server/socket-handler.ts:94-111`**
When a leader disconnects and their lock times out, the `square:unlocked` broadcast doesn't include `hasPendingSubmissions`, unlike all other unlock paths. Clients may show stale lock state.

### 3.5 Location Broadcast Interval Never Cleaned Up

**`src/server/socket/location.ts:24-51`**
`setInterval` for GPS position broadcasting is never cancelled when games end. The interval is harmless (guards against empty positions) but accumulates over server lifetime.

### 3.6 Lobby Component is a God Component

**`src/components/Lobby.tsx` (382 lines)**
Handles 4 distinct UI states (scout lobby, leader config, board preview, landscape mode) in one component. Should be split into `ScoutLobby`, `LeaderLobbyConfig`, `LeaderBoardPreview`.

### 3.7 Missing Error Boundaries

No React error boundary components anywhere in the app. A crash in any component will white-screen the entire app with no recovery path.

### 3.8 Lint Script Broken

**`package.json:15`**
`"lint": "next lint ."` — the trailing `.` is interpreted as a project directory, not a lint target. Should be `"lint": "next lint"` or use `eslint` directly.

---

## 4. LOW PRIORITY / NICE-TO-HAVE

### 4.1 Accessibility Gaps

- `src/components/Square.tsx:59` — Buttons lack `aria-label` (screen readers can't identify squares)
- `src/components/Board.tsx:24` — Grid lacks `aria-label`
- `src/components/Lobby.tsx:341-362` — Range slider inputs lack `aria-label` and `aria-valuetext`
- `src/components/UploadOverlay.tsx` — Upload stages not announced to screen readers (`aria-live` missing)

### 4.2 Missing Image Error Handling

- `src/components/ReviewModal.tsx:49-54` — Raw `<img>` tag with no `loading="lazy"`, no `width/height` (layout shift), no fallback if image fails to load
- Uses ESLint disable comment instead of Next.js `Image` component

### 4.3 Dark Mode Incomplete

Board and game UI ignore dark mode entirely. `src/components/Board.tsx:24` uses `bg-gray-50/60` with no dark variant. Admin page has partial dark mode support.

### 4.4 Service Worker Doesn't Cache Game State

**`public/sw.js:34-35`**
All `/api/` requests are skipped by the service worker. Game state and board data are never cached, so going offline mid-game loses everything.

### 4.5 No Memoization on Board/Square Components

- `src/components/Board.tsx` — No `React.memo()` wrapper; re-renders on every parent update
- `src/components/Square.tsx` — Same issue; multiplied across 9-25 squares
- `src/components/ScoutHeader.tsx:30-45` — Recreates `countByTeam` Map on every render

### 4.6 Sequential PIN Generation

**`src/app/api/game/route.ts:28-29`**
Scout PIN and Leader PIN are generated sequentially. Could use `Promise.all()` for minor performance improvement.

### 4.7 Inconsistent Tailwind Spacing

Components use a mix of `gap-2`, `gap-2.5`, `gap-3`, `gap-4`, `gap-6` without a consistent system.

### 4.8 Missing Input Length Validation

**`src/lib/api-validation.ts`**
Item names from `POST/PUT /api/items` are only checked for non-empty after trim. No max-length validation — could accept arbitrarily long strings.

---

## 5. WHAT'S WORKING WELL

- **TypeScript strict mode**: No `any` in user code, no non-null assertions (except one). All uses of `any` are in Prisma-generated code or explicitly commented socket handler types.
- **Security**: Timing-safe token comparison, Prisma ORM (no SQL injection), admin PIN on all admin routes, S3 URL validation on submissions.
- **Test coverage**: 57 tests across 5 files covering game logic, PIN generation, session tokens, board generation, and edge cases.
- **Socket cleanup**: Event listeners properly added/removed in React hooks. Timeouts cleared. Team deletion has grace periods.
- **Submission locking**: `review:approve` uses `prisma.$transaction()` for atomic claim-or-discard logic.
- **Reconnection handling**: Full state rebuild on rejoin for both scouts and leaders.
- **S3 lifecycle**: Orphan uploads swept on game end. Presigned URLs expire after 5 minutes.
- **Code conventions**: Named exports, `type` over `interface`, `@/` imports, consistent patterns throughout.

---

## Summary by Category

| Category           | Critical | High  | Medium | Low   |
| ------------------ | -------- | ----- | ------ | ----- |
| Product Spec       | 2        | 1     | 0      | 0     |
| API / Data         | 1        | 2     | 0      | 2     |
| Socket / Real-time | 1        | 0     | 4      | 1     |
| React / Hooks      | 1        | 1     | 1      | 1     |
| UI / UX            | 0        | 0     | 1      | 4     |
| Tooling            | 0        | 0     | 1      | 0     |
| **Total**          | **5**    | **4** | **7**  | **8** |
