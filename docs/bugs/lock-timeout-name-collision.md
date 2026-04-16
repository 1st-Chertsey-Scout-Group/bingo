# Lock timeout map keyed by leader name only

**Severity.** Medium.

**Symptom.** Two concurrent games each with a leader named the same
(e.g. "Sam") interfere with each other's lock-timeout bookkeeping. A
reconnect in one game can cancel the disconnect-timeout for an
identically-named leader in a different game, causing their lock to
be released prematurely — or, in the reverse direction, a new
disconnect overwrites a pending timeout and effectively postpones
another game's lock release.

**Location.** `src/server/socket-handler.ts:8-58`

## Root cause

```ts
const lockTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

export function cancelLockTimeout(leaderName: string): void {
  const timeout = lockTimeouts.get(leaderName)
  ...
  lockTimeouts.delete(leaderName)
}
```

The map is keyed on `leaderName` alone. The disconnect handler at
`:29-58` writes `lockTimeouts.set(leaderName, timeout)` with no game
scoping. The rejoin path at `src/server/socket/lobby.ts:325` calls
`cancelLockTimeout(leaderName)` without any way to distinguish which
game's timer should be cancelled.

The timeout callback itself (`:38-55`) captures `gameId` from its
closure, so when it fires it releases the correct game's lock. The
bug is in the map scoping, not the callback body.

## Failing trace

1. "Sam" is a leader in game A and has a square locked. Sam disconnects.
   A 30-second timeout is queued under key `"Sam"`.
2. A different "Sam" joins game B and takes a lock.
3. Game-B-Sam disconnects. A second `setTimeout` runs and
   `lockTimeouts.set("Sam", timeout2)` overwrites the Map entry.
   Game-A-Sam's timeout is now untracked — it will still fire and
   release game A's lock correctly, but `cancelLockTimeout("Sam")`
   can no longer reach it.
4. Game-A-Sam reconnects before 30 s. `cancelLockTimeout("Sam")` at
   `lobby.ts:325` clears `timeout2` — game B's timer. Game A's
   timer is unaffected (and will fire as originally scheduled,
   releasing game A's lock even though game-A-Sam is now reconnected).
5. Net effect: game-A-Sam loses their lock 30 seconds after their
   disconnect despite reconnecting in time, and game-B-Sam keeps
   their lock indefinitely even though they are still disconnected.

## Fix direction

Key the map on the composite `${gameId}:${leaderName}`. Update the
call sites (`socket-handler.ts:11-19`, `:57`, and
`lobby.ts:325`, `src/server/socket/submission.ts` wherever timeouts
are cancelled) to pass both `gameId` and `leaderName`.

Related: [lock-stale-on-restart.md](lock-stale-on-restart.md) —
process-restart leaves stale DB locks because this map is the only
authority on pending timeouts.
