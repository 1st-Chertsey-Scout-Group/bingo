# Separation of Concerns Audit

## Context

Investigating whether HTTP requests and other logic should be extracted from TSX component files. The goal is to identify what's genuinely worth extracting vs what's fine where it is.

## Findings

### HTTP Requests in Components

There are only **4 fetch calls** across the entire frontend:

| File                               | Endpoint             | Purpose                                  |
| ---------------------------------- | -------------------- | ---------------------------------------- |
| `src/app/page.tsx:97`              | `POST /api/validate` | PIN validation on form submit            |
| `src/app/admin/page.tsx:39`        | `POST /api/game`     | Create game on form submit               |
| `src/app/admin/page.tsx:143`       | `GET /api/items`     | Admin PIN auth check                     |
| `src/components/ScoutGame.tsx:219` | `POST /api/upload`   | Get presigned S3 URL during photo upload |

**Verdict: Not worth extracting into an API client layer.** Each fetch is a one-shot call tied to a specific user action (form submit, photo upload). There's no shared auth token pattern, no retry logic on the fetches themselves, and no call is reused across components. Creating an `apiClient.validatePin()` / `apiClient.createGame()` abstraction would just add indirection for 4 simple calls that are already well-typed via `api-types.ts`.

### What IS Worth Extracting

The real separation of concerns wins are in **ScoutGame.tsx** (388 lines) and **LeaderGame.tsx** (340 lines). Both have massive `useEffect` blocks that mix:

1. **Session check + join/rejoin logic** — reading localStorage, deciding whether to rejoin or fresh-join, emitting the right socket event
2. **Socket event handler definitions** — 8-12 handlers each, inline in the useEffect
3. **In ScoutGame: the entire upload pipeline** — compress, get presigned URL, upload with retry, emit socket event, handle abort/failure/retry

#### Extraction 1: `useScoutSocket` hook (from ScoutGame.tsx)

Extract the ~150-line useEffect (lines 44-198) into a dedicated hook. This hook would:

- Handle session loading + join/rejoin logic
- Define and register all scout-specific socket handlers (lobby:joined, submission:received/approved/rejected/discarded, game:lobby, rejoin:error)
- Return nothing — it's a side-effect-only hook that dispatches to the existing reducer

#### Extraction 2: `useLeaderSocket` hook (from LeaderGame.tsx)

Same pattern — extract the ~140-line useEffect (lines 31-171) into a hook. Handles:

- Session loading + leader join/rejoin
- All leader-specific socket handlers (lobby:joined, review:submission, square:locked/unlocked, game:lobby, rejoin:error, board:preview, board:refresh-item)

#### Extraction 3: `usePhotoUpload` hook (from ScoutGame.tsx)

Extract the upload pipeline (lines 200-324) into a hook that encapsulates:

- `doUpload` (compress + presigned URL + S3 upload + socket emit)
- `handleFileSelected` (file input onChange)
- `handleCancelUpload` (abort controller)
- `handleSquareTap` (trigger file input or retry failed upload)
- Upload state: `uploadStage`, `failedUpload`, `pendingItems`
- The hidden `<input type="file">` ref

This would reduce ScoutGame to ~50 lines: just the hook calls and the render switch.

### What's Fine As-Is

- **`page.tsx`** (234 lines) — The PIN validation fetch + two-phase form is straightforward. It's a page, not a reusable component. The fetch is part of its core responsibility.
- **`admin/page.tsx`** (215 lines) — Two small forms with fetches. Already split into `AdminPage` + `GameCreationForm` sub-components. Clean enough.
- **`Lobby.tsx`** (305 lines) — The "business logic" here (category toggles, board size clamping) is form state management, which belongs in the component that renders the form.
- **All other components** (Board, Square, ReviewModal, etc.) — Pure presentation, no issues.

## Summary

| Area                       | Action                                | Reason                                                        |
| -------------------------- | ------------------------------------- | ------------------------------------------------------------- |
| HTTP fetch calls           | **Leave as-is**                       | Only 4 calls, each one-shot, no reuse, already typed          |
| ScoutGame socket handlers  | **Extract to `useScoutSocket` hook**  | 150 lines of setup logic in a useEffect                       |
| LeaderGame socket handlers | **Extract to `useLeaderSocket` hook** | 140 lines of setup logic in a useEffect                       |
| ScoutGame upload pipeline  | **Extract to `usePhotoUpload` hook**  | Compress + upload + retry + abort is a self-contained concern |
| page.tsx, admin/page.tsx   | **Leave as-is**                       | Simple pages, fetch is core responsibility                    |
| Lobby.tsx                  | **Leave as-is**                       | Form state belongs with the form                              |

## Files to modify

- `src/components/ScoutGame.tsx` — shrink to ~50 lines
- `src/components/LeaderGame.tsx` — shrink to ~80 lines
- `src/hooks/useScoutSocket.ts` — new, extracted from ScoutGame
- `src/hooks/useLeaderSocket.ts` — new, extracted from LeaderGame
- `src/hooks/usePhotoUpload.ts` — new, extracted from ScoutGame

## Verification

- `npm run build` — type-checks everything
- `npm run test` — existing tests pass
- `npm run lint` — no new warnings
- `npm run format` — formatting clean
- Manual test: join as scout, take photo, upload, verify approve/reject flow
- Manual test: join as leader, preview board, start round, review submissions
