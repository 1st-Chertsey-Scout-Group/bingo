# `game:start` is not atomic — partial failure leaves game unrecoverable

**Severity.** Medium.

**Symptom.** If `roundItem.createMany` throws after the game has
already been updated to `active`, the game is stuck in an active state
with no round items. Scouts cannot submit (every `submission:submit`
fails `Invalid round item`), `game:newround` refuses to run (wrong
status), and only `game:end` recovers.

**Location.** `src/server/socket/game.ts:62-117`

## Root cause

Three DB operations run in sequence with no transaction:

1. `prisma.game.update({ round: game.round + 1, status: 'active',
roundStartedAt: new Date() })` — `:62-69`.
2. `generateBoard(...)` — synchronous, can throw if the database is
   missing items — `:91`.
3. `prisma.roundItem.createMany({ data: items })` — `:110-117`.

The existing error handler at `:102-105` catches `generateBoard`
failures and rolls the game status back, but it runs _before_ the
`createMany` call. A failure in `createMany` itself (constraint
violation, disk error, connection loss) bypasses the recovery — the
game has already been committed to `active` with an incremented
`round`, and nothing rolls it back.

## Failing trace

1. Leader emits `game:start`. Round advances from 1 to 2.
   `game.status = 'active'`.
2. `generateBoard` returns 25 items.
3. `roundItem.createMany` fails partway through (e.g. a unique-
   constraint collision on `@@unique([gameId, round, itemId])` from
   a prior partial insert, or a disk-full error).
4. Handler exits. Game is `active` at round 2. No `RoundItem` rows
   exist for round 2.
5. Clients receive no `game:started` broadcast (emitted after the
   create, at `:119-137`) but the DB says the round is live.
6. Any scout `submission:submit` fails at `submission.ts:60-67`
   (`Invalid round item`). Leader cannot `game:newround` because the
   handler refuses unless `game.status === 'ended'`. Leader can
   `game:end` and restart, losing round 2 entirely.

## Fix direction

Wrap the status/round/roundStartedAt update and the `createMany` in
a single `prisma.$transaction`. If the transaction throws, the game
row never commits the state change and no partial rows exist. The
client-facing broadcast moves outside the transaction as normal.

```ts
const { game, items } = await prisma.$transaction(async (tx) => {
  const updated = await tx.game.update({ ... })
  const items = generateBoard(...)
  await tx.roundItem.createMany({ data: items })
  return { game: updated, items }
})
```

Related: [new-round-stale-round.md](new-round-stale-round.md)
overlaps with this code path; fixing the round-increment location
there should happen in the same transaction.
