# Team assignment race condition

**Symptom.** When multiple scouts join a lobby at the same time, some or all
are assigned the same team name.

**Primary location.** `src/server/socket/lobby.ts:101-122`

## Root cause

The scout branch of `lobby:join` performs a read-modify-write across three
un-serialised Prisma calls:

1. Count existing teams for `(gameId, round)` — `src/server/socket/lobby.ts:101-106`.
2. Pick the next unused team from the hard-coded list — `src/server/socket/lobby.ts:108`
   (`src/lib/teams.ts:44-46`).
3. Insert a new `Team` row — `src/server/socket/lobby.ts:114-122`.

Two or more concurrent joiners can all complete step 1 before any of them
reach step 3. All callers then see the same count, compute the same team
name, and write conflicting rows.

No DB-level constraint prevents the collision: the `Team` model in
`prisma/schema.prisma:25-37` declares `@@index([gameId])` only. There is no
unique constraint on `(gameId, round, name)`, so the racing inserts all
succeed.

## Interactions

- The deterministic team picker ([team-pick-deterministic.md](team-pick-deterministic.md))
  makes every concurrent caller resolve to the _same_ team, rather than
  distributed collisions. Without it, the race would cause occasional
  collisions; with it, every concurrent joiner lands on one team.
- The client re-join amplifier ([lobby-thundering-herd.md](lobby-thundering-herd.md))
  makes the race trivial to trigger at the start of a new round.
- The stale-round bug ([new-round-stale-round.md](new-round-stale-round.md))
  causes a separate correctness problem on the new-round path that the race
  also runs through; fixing the race alone masks but does not resolve it.

## Fix direction

Single-process deployment (custom `server.ts` + single-file SQLite) permits
either:

1. **Per-game async mutex.** Serialise the read-modify-write in `lobby:join`
   behind a per-game in-memory lock. Simpler code, no schema change.
2. **DB unique constraint + P2002 retry loop.** Add
   `@@unique([gameId, round, name])` to `Team`; catch Prisma's P2002 on
   insert and retry with the next team.

Recommended: **mutex as the primary fix plus the unique constraint as
belt-and-braces defence.** The database is non-persistent in the Docker
setup, so adding the constraint costs no migration work and guarantees
that any future bug cannot silently double-assign.
