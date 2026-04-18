# Scout client wipes the session on any rejoin error

**Severity.** Medium.

**Symptom.** Any `rejoin:error` event from the server causes the scout
client to call `clearSession()` and hard-redirect to `/`, regardless
of whether the error reflects a credential problem, a transient
server-side hiccup, or a recoverable state mismatch.

**Location.** `src/components/ScoutGame.tsx:188-192`

## Root cause

```ts
const handleRejoinError = () => {
  clearSession()
  window.location.href = '/'
}
```

The handler ignores the error payload entirely. The server emits
`rejoin:error` for at least nine distinct reasons
(`src/server/socket/lobby.ts:166, 175, 180, 189, 197, 206, 211, 294,
299, 313`), ranging from "gamePin missing" to "Game not found" to
"Team not in current round" to "Round has ended — please rejoin".
All of them produce the same nuclear reset.

## Failing trace

1. Scout is mid-round and has a valid session.
2. Server emits `rejoin:error` with `message: 'Team not in current
round'` — for example because of the defect in
   [scout-rejoin-round-mismatch.md](scout-rejoin-round-mismatch.md),
   or any future transient mismatch.
3. Client wipes the session and redirects to `/`. The scout has to
   re-enter the game PIN, is re-assigned a new team, and loses all
   context.

Even when the underlying cause is server-fixable (as with the
round-mismatch bug), this handler ensures every occurrence is
maximally user-hostile.

## Fix direction

Switch on the error message:

- `'Invalid leader PIN'`, `'Game not found'`, `'Game has ended'`,
  `'Team not found'` → clear session and redirect to `/`.
- `'Round has ended — please rejoin'`, `'Team not in current round'`
  → drop the team-specific session fields only and fall back to
  `socket.emit('lobby:join', { gamePin })` so the scout re-enters the
  current round without losing the game.
- Transient / malformed payload errors
  (`'gamePin is required'`, `'teamId is required'`) → surface a toast
  and keep the session intact; the client emitted a bad rejoin, not
  the server.

Normalise the server payload shape as a prerequisite (see
[socket-error-events-unsubscribed.md](socket-error-events-unsubscribed.md)).

Related bug: [scout-rejoin-round-mismatch.md](scout-rejoin-round-mismatch.md)
is the main driver of this handler firing today.
