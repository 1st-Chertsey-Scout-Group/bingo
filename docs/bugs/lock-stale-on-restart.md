# Stale locks survive server restart

**Severity.** Medium.

**Symptom.** After a server process restart, any `roundItem` that was
locked at crash time keeps its `lockedByLeader` and `lockedAt` columns
populated. No scout or leader can progress on that square until a
leader with the exact same name reconnects and hits a lock-release
path, or an admin clears the rows manually.

**Locations.**

- `src/server/socket-handler.ts:11, 38-57` — in-memory `lockTimeouts` map
- `src/server/socket/submission.ts:190, 251, 313, 467` — `lockedAt` writes
- `prisma/schema.prisma:55-57` — `lockedByLeader`, `lockedAt` columns

## Root cause

The 30-second lock timeout exists only in an in-memory `Map` in the
running Node process. The DB columns `lockedByLeader` and `lockedAt`
on `RoundItem` are written on lock acquisition but are **never read**
for timeout expiry purposes — there is no query of the form
`WHERE lockedAt < now() - 30s` anywhere in the codebase, and no
startup routine that sweeps the table for stale locks.

Combined with [lock-timeout-name-collision.md](lock-timeout-name-collision.md),
the in-memory map is the only authority on which locks should expire,
so any mechanism that loses the map — process restart, uncaught
exception bringing the server down, Docker container replacement —
strands every lock that was pending at the moment of loss.

## Failing trace

1. Leader A locks square X. `roundItem.lockedByLeader = 'A'`,
   `lockedAt = now`.
2. Node process is killed / restarted / redeployed.
3. New process starts. `lockTimeouts` map is empty.
4. Leader B attempts `review:open` on X. Handler at `submission.ts:157-165`
   sees `lockedByLeader === 'A' !== 'B'` and rejects with "Square is
   locked by A".
5. Leader A never reconnects (or reconnects as "A2" because their
   browser session is stale). Square X is unreviewable for the rest
   of the round.

## Fix direction

Pick one, not both:

1. **Sweep on startup.** On server boot, run
   `prisma.roundItem.updateMany({ where: { lockedAt: { not: null } },
data: { lockedByLeader: null, lockedAt: null } })`. Safe because
   any in-flight review UI would have been on a now-disconnected
   socket, and leaders can re-open review trivially. Simplest fix.

2. **Read `lockedAt` for timeout.** On every `review:*` call, treat
   `lockedByLeader` as effectively `null` if `lockedAt` is older than
   `LOCK_TIMEOUT_MS`. Persistent authority lives in the DB; the
   in-memory map becomes an optimisation rather than the source of
   truth. More invasive but eliminates the class of bug.

The Docker setup rebuilds the SQLite file on every container start
(`docker-compose.yml` — DB is non-persistent), so in the current
deployment this bug only affects restarts within a single container
lifetime. Still worth fixing because manual debugging sessions and
future persistent deploys will both hit it.
