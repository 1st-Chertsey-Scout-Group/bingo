# Step 106: Emit square:pending After Submission

## Description
After successfully creating a submission record, emit the `square:pending` event to all clients in the game room so every device knows this square has pending submissions awaiting review.

## Requirements
- After creating the Submission record in the `submission:submit` handler, emit `square:pending` to the `game:{gameId}` room
- Payload: `{ roundItemId }`
- All clients (scouts and leaders) receive this event
- Leaders use this to show the amber/orange pulsing indicator on the square
- Scouts use this to update their board state (hasPendingSubmissions = true)

## Files to Create/Modify
- `src/server/socket/submission.ts` — Add `io.to(\`game:${gameId}\`).emit('square:pending', { roundItemId })` after the Submission record is created in the submit handler

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: After a scout submits a photo, all connected clients in the game room receive the `square:pending` event with the correct roundItemId
- **Check**: The event is NOT emitted if the submission was discarded (square already claimed)

## Commit
`feat(server): emit square:pending to game room after submission created`
