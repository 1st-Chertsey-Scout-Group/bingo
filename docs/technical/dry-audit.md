# DRY & Refactoring Audit

A catalogue of repetition, extraction opportunities, and architectural improvements in the Scout Bingo codebase. Findings are grouped by area and ordered by severity within each group. Severity rubric:

- **HIGH** — three or more copies, or the duplication is bug-prone (easy to update one site and miss the others).
- **MEDIUM** — two or three copies that materially harm consistency or maintainability.
- **LOW** — cosmetic or minor consistency improvements; safe to leave.

File references use `path:line` so each duplicate site is jumpable.

---

## Completed (first wave)

These items have already been implemented:

| ID  | Description                   | Status                                                                          |
| --- | ----------------------------- | ------------------------------------------------------------------------------- |
| S-1 | Collapse two rejoin builders  | **Done** — `buildRejoinBoard()` extracted in `lobby.ts`                         |
| C-1 | Collapse five reducer cases   | **Done** — single `SET_SUBMISSION_STATUS` action                                |
| X-2 | `getErrorMessage` helper      | **Done** — `src/lib/errors.ts`                                                  |
| C-4 | Finish `session.ts` migration | **Done** — `saveSession` / `savePartialSession` / `loadSession` used everywhere |
| S-5 | Finish response-helper module | **Done** — `badRequest`, `notFound`, `conflict` in `src/lib/admin.ts`           |

---

## Server (API routes + Socket.IO handlers)

### S-2 (HIGH) Inline string-payload validation across socket handlers

The pattern `typeof x !== 'string' || x.trim() === ''` followed by `socket.emit('error', { message })` recurs 9+ times:

- `src/server/socket/lobby.ts:75, 247, 278, 284, 365`
- `src/server/socket/submission.ts:155, 268, 308, 467`

**Suggested extraction:** `requireString(socket, value, fieldName): value is string` in `src/lib/socket-helpers.ts` that emits a consistent error and returns a type guard.

### S-3 (HIGH) `socket.data` extraction is half-extracted, half-inlined

`src/server/socket/submission.ts:6-14` defines `getTeamIdFromSocket` and `getGameIdFromSocket`. The same pattern is re-inlined as `socket.data.gameId as string | undefined` at:

- `src/server/socket/game.ts:67, 188, 209`
- `src/server/socket/submission.ts:40, 273, 313`
- `src/server/socket-handler.ts:49-50`

**Suggested extraction:** Move helpers into `src/lib/socket-helpers.ts`. Add `getSocketContext(socket)` returning `{ gameId, teamId, role, leaderName }` with proper typing. Use from every handler.

### S-8 (HIGH) Leader connection check repeated 4 times

`src/server/socket/submission.ts:163-166, 276-279, 316-319, 475-478` all duplicate:

```ts
const gameId = getGameIdFromSocket(socket)
const leaderName = socket.data.leaderName as string | undefined
if (!gameId || !leaderName) {
  socket.emit('error', { message: 'Not connected as a leader' })
  return
}
```

**Suggested extraction:** `requireLeaderContext(socket): { gameId, leaderName } | null` that emits the error and returns null on failure.

### S-9 (HIGH) Lock/unlock data pattern scattered across 5 sites

The unlock pattern `{ lockedByLeader: null, lockedAt: null }` appears at:

- `src/server/socket-handler.ts:30` (sweep stale locks)
- `src/server/socket-handler.ts:68` (disconnect timeout)
- `src/server/socket/submission.ts:226-227` (release existing lock)
- `src/server/socket/submission.ts:297` (review:close)
- `src/server/socket/submission.ts:533` (after rejection)

And `io.to(leaders).emit('square:unlocked', { roundItemId })` appears at each of those sites too.

**Suggested extraction:** `releaseLock(roundItemId)` and `broadcastUnlock(io, gameId, roundItemId)` helpers, or a small `LockService`.

### S-10 (HIGH) Leader name uniqueness check duplicated

`src/server/socket/lobby.ts:118-122` (lobby:join) and `src/server/socket/lobby.ts:374-378` (rejoin) both:

```ts
const connectedLeaders = await io.in(`leaders:${game.id}`).fetchSockets()
const isDuplicate = connectedLeaders.some(
  (remote) =>
    typeof remote.data.leaderName === 'string' &&
    remote.data.leaderName.toLowerCase() === leaderName.toLowerCase(),
)
```

**Suggested extraction:** `isLeaderNameTaken(io, gameId, name): Promise<boolean>`.

### S-4 (MEDIUM) Inline JSON-body validation in REST routes

Every API route reimplements the same `body !== 'object' || body === null || !('field' in body) || typeof ... !== 'string'` guard:

- `src/app/api/validate/route.ts:8-13`
- `src/app/api/game/route.ts:14-25`
- `src/app/api/items/route.ts:26-32`
- `src/app/api/items/[itemId]/route.ts:18-24`
- `src/app/api/upload/route.ts:10-28`

**Suggested extraction:** `parseBody<T>(body, schema): T | null` or `assertStringFields(body, ...fieldNames)` in `src/lib/api-validation.ts`.

### S-6 (MEDIUM) S3 base-URL string is built in two places

`src/lib/s3.ts:31-40` (`getPhotoUrlPrefix`) and `src/lib/s3.ts:62-64` (`getPresignedUploadUrl`) both compute `endpoint ? "${endpoint}/${bucket}" : "https://${bucket}.s3.${region}.amazonaws.com"`.

**Suggested extraction:** `buildS3BaseUrl(bucket, region, endpoint?)` private to `s3.ts`.

### S-11 (MEDIUM) Round item validation pattern repeated

`src/server/socket/submission.ts:58-65` and `src/server/socket/submission.ts:178-185` both:

```ts
if (
  !roundItem ||
  roundItem.gameId !== gameId ||
  roundItem.round !== game.round
) {
  socket.emit('error', { message: 'Invalid round item' })
  return
}
```

**Suggested extraction:** `validateRoundItem(roundItem, gameId, round): roundItem is RoundItem` type guard.

### S-7 (LOW) Role checks are inline strings

`socket.data.role !== 'leader'` at `src/server/socket/game.ts:72, 193, 214`; `socket.data.role !== 'scout'` at `src/server/socket/submission.ts:35`.

**Suggested extraction:** `requireRole(socket, role)` in socket-helpers.

---

## Client (components + hooks)

### C-2 (HIGH) Socket-handler register/cleanup boilerplate in both game components

`src/components/ScoutGame.tsx:229-259` and `src/components/LeaderGame.tsx:181-209` each follow the same pattern: a `useEffect` with ~14 `socket.on(...)` calls and a matching `socket.off(...)` cleanup. About ten event names are subscribed by both (`error`, `lobby:joined`, `lobby:teams`, `game:started`, `square:claimed`, `square:pending`, `game:ended`, `game:lobby`, `rejoin:state`, `rejoin:error`).

**Suggested extraction:**

1. `useSocketHandlers(socket, handlers)` — generic hook that handles `.on` / `.off` symmetry once.
2. `useCommonGameHandlers(dispatch)` — returns the shared handler map for both components.

### C-3 (MEDIUM) Rejoin payload reconstruction duplicated

`src/components/ScoutGame.tsx:180-192` and `src/components/LeaderGame.tsx:157-169` both reconstruct `mySubmissions` from a serialized `Array<[string, string]>` back into a `Map<string, SubmissionStatus>` and then dispatch `FULL_STATE`.

**Suggested extraction:** `deserializeRejoinState(payload): Partial<GameState>` in `src/hooks/useGameState.ts`.

### C-7 (MEDIUM) Session + rejoin logic duplicated in both game components

`src/components/ScoutGame.tsx:47-70` and `src/components/LeaderGame.tsx:39-62` both:

1. Call `loadSession()`
2. Check role matches
3. Emit `rejoin` or `lobby:join` accordingly
4. Fall back to loading name from stale session

**Suggested extraction:** `useSessionRejoin(socket, gameId, role, joinPayload)` hook.

### C-8 (MEDIUM) Score display / end-game layout duplicated

`src/components/ScoutGame.tsx:384-404` and `src/components/LeaderGame.tsx:294-323` both render end-game screens with team scores. Both display team color dot + name + claimed count with `team.claimedCount === 1 ? 'square' : 'squares'`.

**Suggested extraction:** `<TeamScoreBoard summary={summary} />` component.

### C-9 (MEDIUM) PIN input pattern duplicated

`src/app/page.tsx:52-55` and `src/app/admin/page.tsx:123-134` both implement 4-digit numeric-only inputs with `maxLength={4}`, `inputMode="numeric"`, `pattern="[0-9]*"`, and `e.target.value.replace(/\D/g, '')`.

**Suggested extraction:** `<PinInput value={v} onChange={fn} />` component in `src/components/ui/`.

### C-5 (MEDIUM) Submission outcome handlers follow toast-then-resolve pattern

`src/components/ScoutGame.tsx:138-163` has four handlers (received/approved/rejected/discarded) that all follow:

```ts
toast('message')
dispatch({ type: 'SUBMISSION_RESOLVED', roundItemId })
```

**Suggested extraction:** Factory function or `useSubmissionHandlers(dispatch)` hook.

### C-10 (MEDIUM) Error message className repeated 5+ times

The class string `"text-destructive text-sm font-medium"` appears at:

- `src/app/admin/page.tsx:181, 417, 461`
- `src/app/page.tsx:191, 228`

**Suggested extraction:** `<ErrorMessage>` component or shared `errorMessageClass` constant.

### C-6 (LOW) `ReviewModal` re-implements team chip instead of using `TeamBadge`

`src/components/ReviewModal.tsx:32-37` builds a coloured chip inline; `src/components/TeamBadge.tsx` already exists. Swap in `<TeamBadge />`.

### C-11 (LOW) Timer logic in RoundHeader could be a hook

`src/components/RoundHeader.tsx:36-48` implements a `setInterval`-based elapsed-time counter. Could be `useElapsedTime(startIso)` if reused elsewhere.

---

## Shared / cross-cutting

### X-1 (HIGH) Inline type definitions shadow `src/types.ts`

- `src/lib/teams.ts:1-5` defines a local `type Team = { index, name, colour }` — rename to `TeamPreset` to avoid confusion with `src/types.ts:1-5`.
- `src/lib/game-logic.ts:15-18` redeclares `BoardItem` — import from `src/types.ts` instead.

### X-3 (HIGH) Game / submission / role status literals are stringly-typed everywhere

No constants exist for the status unions. Strings appear in 20+ locations:

Game status (`'lobby' | 'active' | 'ended'`):

- `src/types.ts:42`, `src/server/socket/game.ts:34,141,231`, `src/server/socket/lobby.ts:83,92`, `src/app/api/game/route.ts:112`, `src/hooks/useGameState.ts:8,24`

Submission status (`'pending' | 'approved' | 'rejected' | 'discarded'`):

- `src/types.ts:17`, `src/server/socket/submission.ts:96,115,352,374,392,503`, Prisma queries passim

Role (`'scout' | 'leader'`):

- `src/lib/session.ts:10,18`, `src/server/socket/lobby.ts:136,205`, `src/app/api/validate/route.ts:32,37`

**Suggested extraction:** `src/lib/constants.ts`:

```ts
export const GAME_STATUS = {
  LOBBY: 'lobby',
  ACTIVE: 'active',
  ENDED: 'ended',
} as const
export const SUBMISSION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  DISCARDED: 'discarded',
} as const
export const ROLE = { SCOUT: 'scout', LEADER: 'leader' } as const
```

Derive types from the constants instead of standalone unions.

### X-8 (HIGH) Socket event names are string literals on both sides

~25 event names (`lobby:join`, `lobby:joined`, `game:started`, `square:claimed`, etc.) are hardcoded in both server handlers and client `socket.on` / `socket.emit` calls. A typo silently fails at runtime.

**Suggested extraction:** `src/lib/socket-events.ts` exporting a flat `SOCKET_EVENTS` object. Both client and server import the same constant.

### X-9 (HIGH) Socket room names constructed inline

`` `game:${gameId}` ``, `` `team:${teamId}` ``, `` `leaders:${gameId}` `` appear 15+ times across server handlers.

**Suggested extraction:** `SOCKET_ROOMS.game(id)`, `SOCKET_ROOMS.team(id)`, `SOCKET_ROOMS.leaders(id)` helpers in `src/lib/socket-helpers.ts`.

### X-4 (MEDIUM) Team identity is always a tuple of `(teamId, teamName, teamColour)`

The trio appears in `TeamSummary`, `SubmissionForReview`, `SQUARE_CLAIMED` payload, `lobby:joined` emit, and summary map construction.

**Suggested extraction:** `type TeamIdentity = { teamId: string; teamName: string; teamColour: string }` intersected into the specific types.

### X-5 (MEDIUM) PIN format check is open-coded

`/^\d{4}$/` or equivalent checks at `src/app/api/game/route.ts:37` and `src/server/socket/lobby.ts:33-34`, plus client form validation.

**Suggested extraction:** `isValidPin(pin): boolean` + `PIN_REGEX` in `src/lib/constants.ts`.

### X-6 (MEDIUM) Board-size and template-count magic numbers

`src/app/api/game/route.ts:44` enforces 9–25 board size and 0–10 templates with inline literals. `src/app/admin/page.tsx:55-56` duplicates the defaults (25, 5).

**Suggested extraction:** `BOARD_CONFIG` in `src/lib/constants.ts`:

```ts
export const BOARD_CONFIG = {
  SIZE_MIN: 9,
  SIZE_MAX: 25,
  SIZE_DEFAULT: 25,
  TEMPLATE_MIN: 0,
  TEMPLATE_MAX: 10,
  TEMPLATE_DEFAULT: 5,
} as const
```

### X-10 (MEDIUM) Magic numbers for timeouts and retries

- `src/server/socket-handler.ts:9`: `LOCK_TIMEOUT_MS = 30_000`
- `src/lib/upload.ts:11-12`: `MAX_RETRIES = 3`, `BASE_DELAY_MS = 1000`
- `src/lib/s3.ts:60`: `expiresIn: 300` (seconds)
- `src/lib/socket.ts:10-13`: `reconnectionDelay: 1000`, `reconnectionDelayMax: 10000`
- `src/app/api/game/route.ts:84`: `attempt < 10` (PIN generation retries)

Units are inconsistent (some ms, some seconds). Related tunables live in different files.

**Suggested extraction:** Group in `src/lib/constants.ts` with explicit unit suffixes.

### X-11 (MEDIUM) Prisma select shape `{ id, name, colour }` for teams repeated 5 times

- `src/server/socket/lobby.ts:27, 43, 148, 219`
- `src/app/api/game/[gameId]/route.ts:22`

**Suggested extraction:** `TEAM_SELECT` constant in `src/lib/prisma.ts`.

### X-12 (MEDIUM) Mixed discriminator patterns in transaction results

`src/server/socket/lobby.ts:176,189` uses `{ kind: 'full' }` / `{ kind: 'ok' }`.
`src/server/socket/submission.ts:328-402` uses `{ error: string }` / `{ discarded: true }` / `{ approved: true }`.

Inconsistent makes exhaustive matching unreliable. Standardise on `kind` discriminator with typed unions.

### X-7 (LOW) Socket.IO reconnection tunables are inline

`src/lib/socket.ts:10-14` hardcodes delays. Low priority — single site today.

---

## Data access layer

### D-1 (HIGH) Identical "get teams in round" query appears 3 times

`src/server/socket/lobby.ts:25, 143, 214` — all identical:

```ts
prisma.team.findMany({
  where: { gameId, round },
  select: { id: true, name: true, colour: true },
  orderBy: { createdAt: 'asc' },
})
```

**Suggested extraction:** `getTeamsInRound(gameId, round)` in `src/lib/repositories/team.ts`.

### D-2 (HIGH) "Get next pending submission" query appears 2 times

`src/server/socket/submission.ts:245` and `src/server/socket/submission.ts:512` — identical:

```ts
prisma.submission.findFirst({
  where: { roundItemId, status: 'pending' },
  orderBy: { position: 'asc' },
  include: { team: true, roundItem: true },
})
```

**Suggested extraction:** `getNextPendingSubmission(roundItemId)`.

### D-3 (HIGH) "Find game by ID and validate status" appears 6 times

`src/server/socket/game.ts:78, 199, 220` and `src/server/socket/submission.ts:48, 168, 445` all do:

```ts
const game = await prisma.game.findUnique({ where: { id: gameId } })
if (!game || game.status !== 'expected') { ... }
```

**Suggested extraction:** `getActiveGame(gameId)` or `getGameById(gameId)` + status guard.

### D-4 (MEDIUM) Submission status update methods scattered

Status updates happen at `src/server/socket/submission.ts:350` (discard), `372` (approve), `387` (bulk discard), `501` (reject). Each inlines the Prisma call.

**Suggested extraction:**

- `approveSubmission(id, reviewedBy)`
- `rejectSubmission(id, reviewedBy)`
- `discardSubmission(id)`
- `discardPendingForRoundItem(roundItemId)`

### D-5 (MEDIUM) Lock lifecycle spread across 3 files

Lock acquire/release/sweep logic lives in `socket-handler.ts`, `submission.ts`, and disconnect handlers with repeated `{ lockedByLeader: null, lockedAt: null }` data.

**Suggested extraction:** `src/lib/lock-service.ts`:

- `acquireLock(roundItemId, leaderName)`
- `releaseLock(roundItemId)`
- `releaseLeaderLocks(gameId, round, leaderName)`
- `sweepStaleLocks()`

### D-6 (MEDIUM) "Get submission with relations" appears 2 times

`src/server/socket/submission.ts:322` and `480` both:

```ts
prisma.submission.findUnique({
  where: { id },
  include: { roundItem: true, team: true },
})
```

**Suggested extraction:** `getSubmissionWithContext(id)`.

### D-7 (LOW) "Find game by PIN" has two variants

`src/server/socket/lobby.ts:80` (with status filter) and `252` (without). Similar but intentionally different — just note for awareness.

---

## Recommended architecture: repository + service layer

For a codebase of this size, a full ORM abstraction would be overkill. Instead, a thin **repository layer** (named query functions) plus a few **service modules** for complex workflows:

```
src/lib/
├── repositories/
│   ├── game.ts          # getGameById, findGameByPin, createGame, updateGameStatus
│   ├── team.ts          # getTeamsInRound, getAllTeamsInGame, createTeam, updateSocketId
│   ���── round-item.ts    # getRoundItems, createRoundItems, countUnclaimed
│   ├── submission.ts    # getNextPending, getSubmissionWithContext, createPending,
│   │                    #   approveSubmission, rejectSubmission, discardSubmission
│   ├── item.ts          # getConcreteItems, getTemplateItems, isItemInUse
│   └── pending-upload.ts # createUpload, markConsumed, sweepOrphans
│
├── services/
│   ├── lock-service.ts  # acquireLock, releaseLock, releaseLeaderLocks, sweepStale
│   └── game-service.ts  # startGame (transaction), endGame (with sweep)
│
├── socket-helpers.ts    # requireString, requireLeaderContext, getSocketContext,
│                        #   broadcastUnlock, SOCKET_ROOMS
├── socket-events.ts     # SOCKET_EVENTS constant
├── constants.ts         # GAME_STATUS, SUBMISSION_STATUS, ROLE, BOARD_CONFIG, TIMEOUTS
└── ...existing files
```

### Benefits

- **Socket handlers become thin orchestrators** — validate, call repository/service, emit. No inline Prisma.
- **Testable without Prisma mocks** — repositories can be stubbed at the function level.
- **Single source of truth** for each query — change the select shape once.
- **Transactions stay encapsulated** — `game-service.ts:startGame` owns the board-generation transaction.

### Migration path

1. Start with `constants.ts` (zero risk, immediate wins).
2. Extract `socket-helpers.ts` (validation + context helpers).
3. Extract `repositories/` one model at a time, starting with `team.ts` (3 identical queries).
4. Extract `lock-service.ts` (complex lifecycle, highest bug risk).
5. Extract `game-service.ts` (encapsulates the start-game transaction).

---

## Summary

| Area         | HIGH   | MEDIUM | LOW   | Total  |
| ------------ | ------ | ------ | ----- | ------ |
| Server       | 5      | 3      | 1     | 9      |
| Client       | 1      | 6      | 2     | 9      |
| Shared       | 4      | 5      | 1     | 10     |
| Data access  | 3      | 3      | 1     | 7      |
| **Sum**      | **13** | **17** | **5** | **35** |
| Already done | —      | —      | —     | **5**  |

### Suggested second wave (highest leverage)

1. **X-3** — create `src/lib/constants.ts` with status, role, board config constants. Zero-risk, touches every file.
2. **S-2 + S-3 + S-8** — create `src/lib/socket-helpers.ts` with `requireString`, `getSocketContext`, `requireLeaderContext`. Cleans up all socket handler boilerplate.
3. **D-1** — extract `getTeamsInRound()`. Three identical queries → one function.
4. **D-5** — extract `lock-service.ts`. Bug-prone lifecycle logic in 3 files → one module.
5. **C-2** — extract `useSocketHandlers` hook. Eliminates the `.on`/`.off` boilerplate in both game components.
6. **X-8 + X-9** — extract socket event names and room name helpers. Makes client-server contract explicit.
