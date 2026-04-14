# Step 105: Implement Submission Handler

## Description
Implement the `submission:submit` socket event handler in the server. This is the core entry point for scouts submitting photo evidence for a bingo square, validating the submission and persisting it to the database with a queue position.

## Requirements
- Listen for `submission:submit` event with payload `{ roundItemId, photoUrl }`
- Validate that the game is active (status === 'active')
- Validate that the round item exists and belongs to the current round of the game
- Validate that the submitting team is valid (teamId from socket data)
- If `RoundItem.claimedByTeamId` is not null (square already claimed), emit `submission:discarded` to `team:{teamId}` with `{ roundItemId, reason: 'already_claimed' }` and stop processing
- Assign queue position: `SELECT MAX(position) + 1` for this roundItemId, or 1 if no existing submissions
- Create a Submission record in Prisma with: roundItemId, teamId, photoUrl, status: 'pending', position
- Only position 1 with status 'pending' is reviewable by leaders

## Files to Create/Modify
- `src/server/socket/submission.ts` — Add the `submission:submit` handler. Use Prisma to query RoundItem and create Submission. Derive gameId and teamId from socket handshake data or socket rooms.

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: A scout submitting a photo creates a Submission record with status 'pending' and correct queue position
- **Check**: Submitting to an already-claimed square emits `submission:discarded` with reason 'already_claimed'
- **Check**: Multiple submissions to the same round item get incrementing position values (1, 2, 3...)
- **Command**: `npx prisma studio` — inspect Submission table after test submissions

## Commit
`feat(server): implement submission:submit socket handler with validation and queue positioning`
