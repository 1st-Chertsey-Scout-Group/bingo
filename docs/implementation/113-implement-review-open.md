# Step 113: Implement review:open Handler

## Description
Implement the server-side `review:open` handler that locks a square for a leader to review submissions. This enforces single-leader-per-square locking and serves the first pending submission to the reviewing leader.

## Requirements
- Listen for `review:open` event with payload `{ roundItemId }`
- Validate: round item exists in the current round, `claimedByTeamId` is null, has at least one pending submission
- **Lock conflict**: If `lockedByLeader` is set to a different leader, emit an error back to the requesting socket and stop
- **One-lock-per-leader**: Query all RoundItems in the current round where `lockedByLeader === thisLeaderName`. If found, clear the lock on that other square (set `lockedByLeader = null`, `lockedAt = null`) and emit `square:unlocked` with `{ roundItemId: oldRoundItemId }` to `leaders:{gameId}` room
- Set `RoundItem.lockedByLeader = leaderName` and `lockedAt = new Date()` via Prisma update
- Emit `square:locked` to `leaders:{gameId}` room with `{ roundItemId, leaderName }`
- Find the lowest-position pending submission for this round item: `WHERE roundItemId = X AND status = 'pending' ORDER BY position ASC LIMIT 1`
- Emit `review:submission` back to the requesting leader's socket (not the room) with the `SubmissionForReview` payload: `{ submissionId, roundItemId, displayName, teamName, teamColour, photoUrl }`

## Files to Create/Modify
- `src/server/socket/submission.ts` — Add `review:open` handler with lock management, Prisma queries, and socket emissions

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: Tapping a needs-review square locks it and sends the first pending submission to the leader
- **Check**: Another leader cannot lock an already-locked square (receives error)
- **Check**: A leader opening a new square automatically releases their previous lock
- **Check**: The `square:locked` event is received by all leaders showing the lock status
- **Command**: Check Prisma studio to verify lockedByLeader and lockedAt fields are set

## Commit
`feat(server): implement review:open with lock management and submission serving`
