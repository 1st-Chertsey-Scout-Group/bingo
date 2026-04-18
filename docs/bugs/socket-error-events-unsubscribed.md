# Server `'error'` events are never received by any client

**Severity.** Medium.

**Symptom.** Every handler-level validation failure in the socket
layer emits `socket.emit('error', { message })`. No client ever
subscribes to the generic `'error'` event, so these errors are
silently dropped. Users receive no feedback when a submission is
refused, a review action is rejected, or a malformed payload is
returned to them.

**Locations.**

Server emissions (non-exhaustive):

- `src/server/socket/lobby.ts:16, 28, 33, 42, 51, 64, 110, 166, ...`
- `src/server/socket/game.ts:42, 47, 52, ...`
- `src/server/socket/submission.ts:36, 46, 51, 65, 71, 110, 118, 124, 137, 142, 152, 161, 223, 231, 240, 245, 263, 271, 333, 407, 415, 425`

Client subscriptions:

- `src/components/ScoutGame.tsx` — no `socket.on('error', ...)` call
- `src/components/LeaderGame.tsx` — no `socket.on('error', ...)` call
- `src/components/Admin.tsx` — no `socket.on('error', ...)` call

## Root cause

Server handlers emit a generic `'error'` event as a one-size-fits-all
rejection channel. The client code only wires up handlers for
specific, well-named events (`lobby:joined`, `submission:approved`,
`rejoin:state`, etc.). The generic `'error'` channel has no
subscriber anywhere.

A secondary issue: payload shape is inconsistent. Most sites use
`{ message: string }`; at least two sites (`lobby.ts:42, 65`) use
`{ error: string }`. A future subscriber will pick one shape and find
the other half unreadable.

## Failing trace

1. Scout emits `submission:submit` with a valid payload, but the game
   has just transitioned to `ended`. Handler at
   `submission.ts:50-54` emits `socket.emit('error', { message:
'Game is not active' })` and returns.
2. Scout's client has already dispatched `SUBMISSION_SENT`
   optimistically (`ScoutGame.tsx:253`). The UI shows a pending
   submission for the round item.
3. No `submission:approved`, `submission:rejected`,
   `submission:discarded`, or `error` handler fires. The pending
   state sticks until `GAME_ENDED` → `GAME_LOBBY` resets it.
4. Scout sees no toast, no error, no explanation.

## Fix direction

Either:

1. **Subscribe and surface.** In `ScoutGame.tsx` and `LeaderGame.tsx`,
   add `socket.on('error', (payload) => toast.error(payload.message
?? payload.error ?? 'Something went wrong'))`. Normalise the
   server payload shape to `{ message: string }` everywhere while
   you're there.
2. **Replace `'error'` with targeted events.** For each site that
   emits `'error'`, emit a named event the client already listens for
   (`submission:rejected`, `review:error`, etc.) so the UI can react
   appropriately. More invasive but removes the catch-all channel.

Either approach is better than the current silent-drop behaviour.
Option 1 is the cheaper partial fix.
