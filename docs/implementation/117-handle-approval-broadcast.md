# Step 117: Handle Approval Broadcast Events

## Description
After the approval transaction succeeds, broadcast the result to all relevant socket rooms: notify all clients of the claim, notify the winning team, discard competing submissions, and check for auto-end.

## Requirements
- After the successful Prisma transaction in `review:approve`:
  1. Emit `square:claimed` to `game:{gameId}` room with `{ roundItemId, teamId, teamName, teamColour }`
  2. Emit `submission:approved` to `team:{teamId}` room with `{ roundItemId }`
  3. Find all OTHER pending submissions for this roundItemId (`WHERE roundItemId = X AND status = 'pending'`). For each: update status to 'discarded', emit `submission:discarded` to `team:{submission.teamId}` with `{ roundItemId, reason: 'already_claimed' }`
  4. Emit `square:unlocked` to `leaders:{gameId}` room with `{ roundItemId }`
  5. **Auto-end check**: Query all RoundItems for the current game/round. If every item has `claimedByTeamId !== null`, trigger the game end logic (set game status to 'ended', calculate summaries, emit `game:ended`)

## Files to Create/Modify
- `src/server/socket/submission.ts` — Add post-transaction broadcast logic in the review:approve handler. Include the auto-end check.

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: All clients receive `square:claimed` and their boards update with the team colour
- **Check**: The winning team receives `submission:approved`
- **Check**: Other teams with pending submissions for the same square receive `submission:discarded`
- **Check**: Leaders receive `square:unlocked` and the lock indicator is removed
- **Check**: When the last unclaimed square is approved, the game ends automatically

## Commit
`feat(server): broadcast approval results, discard competing submissions, check auto-end`
