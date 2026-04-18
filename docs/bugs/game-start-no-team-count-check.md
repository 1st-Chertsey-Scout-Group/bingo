# `game:start` does not enforce a minimum team count

**Severity.** Medium.

**Symptom.** A leader client can start an active round with zero
teams joined. The server transitions the game to `active`, generates
a board, and broadcasts `game:started`. The round runs with nobody
able to submit anything.

**Location.** `src/server/socket/game.ts:39-137`

## Root cause

The client disables the "Start Round" button in `Lobby.tsx:113` when
fewer than two teams have joined, but the server's `game:start`
handler validates only that the caller is a leader and that the game
is in `lobby` status. It does not query `prisma.team.count({ where:
{ gameId, round } })`.

## Failing trace

1. Leader opens `/leader/<gameId>` with no scouts joined.
2. A misbehaving or modified client emits `game:start` directly.
3. Handler at `:39-137` updates the game to `status: 'active'`,
   increments `round`, generates the board, creates `RoundItem` rows,
   broadcasts `game:started`.
4. The round is live with no teams. No `submission:submit` can ever
   succeed (there is no team for the scout to belong to). The only
   recovery is `game:end`.

The client guard is useful but not authoritative. Any server invariant
enforced only on the client can be bypassed by a custom emitter.

## Fix direction

Add a server-side check in `game:start` before the status update:

```ts
const teamCount = await prisma.team.count({
  where: { gameId, round: game.round },
})
if (teamCount < 2) {
  socket.emit('error', { message: 'At least two teams required' })
  return
}
```

The exact minimum is a product question — the spec in `docs/product/`
should be the source — but two matches the client guard.
