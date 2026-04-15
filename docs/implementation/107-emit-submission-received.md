# Step 107: Emit submission:received to Scout Team

## Description

After creating the submission record, emit `submission:received` to the submitting scout's team room so their device can confirm the submission was received and update the UI accordingly.

## Requirements

- After creating the Submission record in the `submission:submit` handler, emit `submission:received` to `team:{teamId}` room
- Payload: `{ roundItemId }`
- Only the submitting team's devices receive this event
- This confirms to the scout that their photo was accepted into the review queue

## Files to Create/Modify

- `src/server/socket/submission.ts` — Add `io.to(\`team:${teamId}\`).emit('submission:received', { roundItemId })` after the Submission record is created in the submit handler

## Checklist

- [x] Implemented
- [x] Verified

## Verification

- **Check**: After a scout submits a photo, only their team's devices receive `submission:received` with the correct roundItemId
- **Check**: Other teams do NOT receive this event
- **Check**: The event is NOT emitted if the submission was discarded

## Commit

`feat(server): emit submission:received to team room after submission created`
