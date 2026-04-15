# Step 143: Add Lock Timeout on Leader Disconnect

## Description

When a leader disconnects (signal loss, page close, etc.), start a 30-second timeout for any lock they hold. If they don't reconnect in time, the lock is released so other leaders can review that submission. This prevents squares from being permanently locked by a disconnected leader.

## Requirements

- In the server socket `disconnect` event handler:
  1. Identify if the disconnecting socket belongs to a leader
  2. Query the database for any RoundItem where `lockedByLeader` matches this leader's identifier
  3. If a lock is found, start a 30-second `setTimeout`
  4. Store the timeout reference keyed by leader identifier so it can be cancelled
- After the 30-second timeout fires:
  1. Clear `lockedByLeader` and `lockedAt` fields on the RoundItem in the database
  2. Emit `square:unlocked` to the leaders room with the square/RoundItem ID
  3. Clean up the timeout reference
- If the leader reconnects within 30 seconds:
  1. Cancel the pending timeout (using the stored timeout reference)
  2. Do NOT restore the lock — the leader must re-open the review modal to acquire a new lock
  3. Clean up the timeout reference
- Use an in-memory Map (e.g. `Map<string, NodeJS.Timeout>`) to track pending lock timeouts
- Handle edge case: if the server itself restarts, stale locks should be cleaned up on startup (query for locks older than 30 seconds and clear them)

## Files to Create/Modify

- `src/server/socket/handlers.ts` (or equivalent) — Add lock timeout logic to the disconnect handler; add timeout cancellation to the rejoin handler
- `src/server/socket/lobby.ts` — Cancel lock timeout on leader rejoin

## Checklist

- [x] Implemented
- [x] Verified

## Verification

- **Check**: Leader locks a square, disconnects, waits 30+ seconds — square becomes unlocked, `square:unlocked` emitted to other leaders
- **Check**: Leader locks a square, disconnects, reconnects within 30 seconds — timeout is cancelled, lock is NOT restored, square is unlocked
- **Check**: After timeout fires, another leader can lock and review the same square
- **Check**: No memory leaks — timeout references are cleaned up after firing or cancellation

## Commit

`feat(socket): add 30-second lock timeout on leader disconnect with cleanup on rejoin`
