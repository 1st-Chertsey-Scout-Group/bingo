# Resilience & Reconnection Audit

## Context

Deep dive on all retry/reconnection/disaster recovery logic across client and server to assess what works, what gaps exist, and what edge cases could cause problems during a scout evening with spotty WiFi.

## Architecture Overview

The resilience strategy has three layers:

1. **Socket.IO auto-reconnect** — handles brief network drops transparently
2. **Session persistence** — localStorage stores credentials for rejoin after page refresh/browser restart
3. **Rejoin protocol** — server-side handler restores full game state to reconnecting clients

## What Works Well

### Socket.IO Client Config (`src/lib/socket.ts`)

- `reconnection: true`, `reconnectionAttempts: Infinity`
- Exponential backoff: 1s -> 10s max
- Buffered events replayed on reconnect (Socket.IO default)
- `autoConnect: false` — connects on-demand, not at module load

### Connection Banner (`src/components/ConnectionBanner.tsx`)

- Non-dismissable amber banner shows during disconnection
- Auto-clears when socket reconnects
- Simple, correct, no false positives

### Session Persistence (`src/lib/session.ts`)

- Scout session: `gamePin, gameId, teamId, teamName, teamColour, sessionToken, role`
- Leader session: `gamePin, leaderPin, gameId, leaderName, role`
- `clearTeamIdFromSession()` — partial clear for round transitions
- All localStorage calls wrapped in try-catch (graceful fallback)

### Scout Rejoin (`src/server/socket/lobby.ts:238-315`)

- Validates team exists, belongs to game, session token matches (timing-safe compare)
- Updates socketId to new connection
- Joins correct rooms
- Sends full `rejoin:state` with board, teams, submissions, round timer
- Works for both LOBBY and ACTIVE game states

### Leader Rejoin (`src/server/socket/lobby.ts:316-363`)

- Validates leaderPin and leaderName
- Cancels any pending lock-release timeout from prior disconnect
- Sends full `rejoin:state`

### Upload Retry (`src/lib/upload.ts`)

- 3 retries with exponential backoff (1s, 2s, 4s)
- Fresh presigned URL if current one expired (5min TTL)
- Returns blob on failure for manual retry
- `usePhotoUpload` stores failed blob in state — user can tap square to retry

### Lock Timeout (`src/server/socket-handler.ts`)

- 30-second timeout on leader disconnect before lock auto-releases
- Keyed by composite `${gameId}:${leaderName}` — no cross-game collision
- Cancelled on rejoin (line 345 in lobby.ts)

### Stale Lock Sweep (`src/lib/services/lock-service.ts`)

- `sweepStaleLocks()` called on server startup (socket-handler.ts:36)
- Clears all locks — clean slate after restart

### Submission Safety (`src/server/socket/submission.ts`)

- Claim check + insert + position calculation all inside `$transaction`
- Approval: claim + approve + discard competitors all inside `$transaction`
- Photo URL validated against expected S3 prefix

### S3 Orphan Cleanup (`src/server/socket/game.ts:14-32`)

- `sweepOrphanUploads()` runs on game end
- Finds unconsumed `PendingUpload` rows, deletes S3 objects, then DB rows

### Error Event Handling

- Both `useScoutSocket` and `useLeaderSocket` handle the `error` event
- Shows toast with server message

## Failure Scenarios

### Brief WiFi Drop (< 5s)

- Socket.IO auto-reconnects within 1-3s
- Buffered events replayed
- User sees amber banner briefly
- **Works correctly**

### Medium Disconnection (30s-2min)

- Socket.IO keeps retrying (exponential backoff up to 10s)
- On reconnect, socket emits rejoin automatically (scout/leader hooks re-run)
- Full state restored via `rejoin:state`
- **Works correctly**

### Page Refresh During Active Round

- Session loaded from localStorage
- Rejoin emitted with cached teamId + sessionToken
- Full board + submission state restored
- **Works correctly**

### Phone Sleep/Wake

- Socket disconnects when phone sleeps
- On wake, Socket.IO reconnects + rejoin fires
- Same as medium disconnection
- **Works correctly**

### Upload Fails Mid-Photo

- Upload retries 3 times with backoff
- If all fail, blob stored in component state
- User sees failed square indicator, can tap to retry
- **Works correctly**

### Server Restart Mid-Round

- All sockets disconnect
- Clients auto-reconnect via Socket.IO
- Stale locks swept on startup
- Rejoin restores full state from DB
- **Works correctly** (all game state is in DB, not memory)

### Scout Disconnects During Lobby

- Team row deleted from DB
- `lobby:teams` broadcast updates all clients
- If scout reconnects, they get a new random team
- **Works correctly** — team freed up for others

### Leader Disconnects While Reviewing

- 30-second timeout starts
- If leader reconnects within 30s, timeout cancelled, lock preserved
- If timeout fires, lock released, `square:unlocked` broadcast
- **Works correctly**

## Identified Gaps

### 1. Error Event Handler — No Rejoin Context

**Severity:** Low
**Location:** `useScoutSocket.ts:150`, `useLeaderSocket.ts:116`

The `error` handler shows a generic toast but has no context about what action triggered it. If a scout's `submission:submit` is rejected because the game ended between upload and submit, they see "Game is not active" with no guidance. Not a bug, but could be more helpful.

### 2. No Session TTL

**Severity:** Low
**Location:** `src/lib/session.ts`

Sessions persist in localStorage indefinitely. A scout who played last week still has a session pointing to a deleted game. On next visit, rejoin fires, fails with "Game not found", clears session, redirects to `/`. This works correctly but adds a brief flicker on return visits.

**Possible improvement:** Store a timestamp, clear sessions older than 24h on load.

### 3. Scout Lobby Disconnect — Team Name Recycling

**Severity:** Low
**Location:** `src/server/socket-handler.ts:57-71`

When a scout disconnects during lobby, their team is deleted. If they reconnect, they get a _new random_ team, not their previous one. Not a bug — the session is cleared on `game:lobby` — but could be surprising if a scout was attached to their team name.

**Relevant to team selection feature:** Once scouts can choose teams, this becomes more important. A brief disconnect shouldn't lose their chosen team.

### 4. Service Worker — Limited Offline Shell

**Severity:** Low
**Location:** `public/sw.js`

Only `/` is pre-cached. If a scout navigates directly to `/play/abc123` while offline, they get the offline fallback rather than the app shell. In practice this rarely matters because scouts always start from `/`.

## Summary

| Layer                    | Status  | Notes                                     |
| ------------------------ | ------- | ----------------------------------------- |
| Socket.IO auto-reconnect | Working | Good config, infinite retries, backoff    |
| Session persistence      | Working | Survives refresh + restart                |
| Scout rejoin             | Working | Full state restore from DB                |
| Leader rejoin            | Working | Lock timeout cancellation on reconnect    |
| Upload retry             | Working | 3 retries + manual retry on failure       |
| Lock management          | Working | 30s timeout, composite key, startup sweep |
| Submission safety        | Working | Transactional claim + approve             |
| S3 cleanup               | Working | Orphan sweep on game end                  |
| Error handling           | Working | Both roles handle error events            |
| Connection UI            | Working | Non-dismissable banner during disconnect  |

The resilience architecture is solid. The gaps identified are low-severity UX improvements, not functional bugs.
