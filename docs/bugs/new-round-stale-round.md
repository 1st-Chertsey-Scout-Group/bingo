# `game.round` not incremented on new round

**Symptom.** After a leader starts a new round, scouts joining the lobby
are assigned team names scoped to the _previous_ round, and the new
`Team` rows are written under the previous round's number. Combined with
the team-assignment race
([team-assignment-race.md](team-assignment-race.md)), every scout ends
up with the same team name on the new round.

**Location.** `src/server/socket/game.ts:178-181`

## Root cause

The `game:newround` handler only toggles `status`:

```ts
await prisma.game.update({
  where: { id: gameId },
  data: { status: 'lobby' },
})
```

It does not increment `round` and does not clear `roundStartedAt`. The
only place `round` is ever bumped is `game:start` at
`src/server/socket/game.ts:62-69`:

```ts
data: {
  round: game.round + 1,
  status: 'active',
  roundStartedAt: new Date(),
}
```

So the state sequence `ended → (newround) → lobby → (start) → active`
moves through the `lobby` state with `round` still holding the
just-finished round. Every reader that correctly filters by
`(gameId, round)` sees stale data during the new-round lobby window.

## Affected readers

All of these scope correctly by round — the problem is that `game.round`
holds the stale value when they run:

- `src/server/socket/lobby.ts:82-95` — leader `lobby:join` team listing
- `src/server/socket/lobby.ts:101-106` — scout team count (primary cause of the user-visible symptom)
- `src/server/socket/lobby.ts:120` — `round: game.round` on the new Team insert (silently orphans the new team under the old round)
- `src/server/socket/lobby.ts:133-146` — `lobby:teams` broadcast
- `src/server/socket/lobby.ts:210` — rejoin team-validity check
- `src/server/socket/lobby.ts:229, 235, 267` — scout rejoin state payload
- `src/server/socket/lobby.ts:328, 334` — leader rejoin state payload
- `src/app/api/game/[gameId]/route.ts:19-34` — game GET endpoint

## Independence from the race

This bug is _independent_ of the team-assignment race. Fixing the race
alone would mask the symptom (scouts would get distinct team names
again) but leave a silent correctness bug: new teams are written with
`round: game.round === previous round`, so they are orphaned under the
old round number. The subsequent `game:start` bumps `round` to the new
value and `lobby:teams` queries against the new round would find zero
teams — diverging from what scouts actually received.

## Fix direction

Increment `round` (and reset `roundStartedAt: null`) inside the
`game:newround` handler:

```ts
data: {
  round: game.round + 1,
  roundStartedAt: null,
  status: 'lobby',
}
```

`game:start` must then **not** re-increment. The item-anti-repeat window
in `src/server/socket/game.ts:77-84` uses
`round: { gte: updatedGame.round - 2 }` on the _post-increment_ round.
After moving the increment into `game:newround`, re-verify that the `-2`
arithmetic still yields the intended two-round anti-repeat window given
the new timing of the bump.
