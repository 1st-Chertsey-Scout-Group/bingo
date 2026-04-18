# Scout rejoin fails on refresh or reconnect

**Symptom.** When a scout loses connection or refreshes the page during an
active round, they are kicked back to the landing page instead of
rejoining the game they were part of. The leader flow is unaffected —
refreshing on `/leader/[gameId]` restores the leader to the active game
as expected.

**Primary location.** `src/server/socket/lobby.ts:210`

## Root cause

The scout rejoin handler rejects every scout during an active round:

```ts
const team = await prisma.team.findUnique({ where: { id: teamId } })
if (!team) {
  socket.emit('rejoin:error', { message: 'Team not found' })
  return
}
if (team.gameId !== game.id || team.round !== game.round) {
  socket.emit('rejoin:error', { message: 'Team not in current round' })
  return
}
```

The `team.round !== game.round` comparison fails on every active round
because the two columns are written at different times and never
re-synced:

1. Scouts create their `Team` row in the lobby with
   `round: game.round` — `src/server/socket/lobby.ts:114-122`. At this
   point `game.round === N` (0 for a fresh game).
2. Leader emits `game:start`. The handler bumps the game to
   `round: game.round + 1` and `status: 'active'` —
   `src/server/socket/game.ts:62-69`.
3. **Nothing ever updates `team.round`.** The only `prisma.team.update`
   call (`src/server/socket/lobby.ts:218`) only touches `socketId`.

So during any active round, every existing scout team has
`team.round === game.round - 1`. The rejoin check demands equality, so
it always rejects. The client receives `rejoin:error`, and
`handleRejoinError` at `src/components/ScoutGame.tsx:188-192` calls
`clearSession()` and hard-redirects to `/`.

## Why the leader flow is unaffected

Leader identity is anchored on `leaderPin` + `leaderName`, not on a per-
round row. The leader rejoin path at
`src/server/socket/lobby.ts:288-377` never reads `Team.round` — it
verifies the pin against `game.leaderPin`, checks name uniqueness, and
joins the rooms. No round comparison, no mismatch possible.

## Relationship to other documented bugs

Distinct defect. The bug occurs on round 1 of a fresh game
(round 0 → 1) where the stale-round bug
([new-round-stale-round.md](new-round-stale-round.md)) plays no role.
The two share a structural weakness — `Team.round` and `Game.round` are
maintained by different handlers with different timing — but either can
be present without the other.

## Fix direction

Two viable approaches:

1. **Read-side (narrow).** Change `lobby.ts:210` to compare against
   `game.round - 1` when the game status is `active`. One-line fix,
   lowest blast radius, addresses the reported bug exactly.
2. **Write-side (invariant-restoring).** In `game:start`, run a
   `prisma.team.updateMany` that advances all teams in the starting
   round to the new `game.round`. This restores the natural invariant
   `team.round === game.round` during active rounds — the assumption
   the rejoin check was written against — and keeps all other round-
   filtered team queries correct
   (`src/server/socket/lobby.ts:82-95, 133-146, 228-232, 327-331`).

Recommended: **write-side**. The invariant is easier to reason about
than a conditional offset, and it prevents a similar bug from appearing
in any future reader that filters teams by `round: game.round`. The
`updateMany` must run atomically with the game update and before any
`lobby:teams` broadcast that follows, otherwise readers filtered by the
new `game.round` would briefly see an empty team list.

Pair this fix with the round-increment fix in
[new-round-stale-round.md](new-round-stale-round.md) so the invariant
holds across both `lobby → active` transitions (`game:start`) and
`ended → lobby` transitions (`game:newround`).

## Adjacent issues surfaced (not in scope for this bug)

- **Over-broad error handling.** `handleRejoinError` in
  `src/components/ScoutGame.tsx:188-192` wipes the full session and
  redirects to `/` on any rejoin error. `"Team not in current round"`
  specifically should fall back to `lobby:join` rather than full reset,
  so even if a round-mismatch does occur in the future the scout lands
  back on the lobby rather than the landing page.
- **Rejoin on mount only, not on reconnect.** The rejoin emit in
  `src/components/ScoutGame.tsx:50-68` fires on component mount with
  deps `[socket, dispatch]`. A transparent Socket.IO reconnect after a
  network blip does not remount the component, so the scout's socket
  is not re-added to the `game:<id>` / `team:<id>` rooms server-side.
  Manifests as "state goes stale after a network blip" rather than the
  reported refresh symptom.
