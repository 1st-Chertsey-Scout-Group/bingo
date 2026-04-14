# Step 100: Emit submission:submit After Upload

## Description
After a successful S3 upload, emit the `submission:submit` socket event to notify the server that a photo has been submitted for review. This completes the scout-side photo pipeline.

## Requirements
- In `src/components/ScoutGame.tsx`, after successful S3 upload (step 099):
  - Emit via Socket.IO:
    ```typescript
    socket.emit('submission:submit', {
      roundItemId,   // the square this submission is for
      photoUrl       // the public S3 URL from the upload API response
    })
    ```
  - Immediately update local state to mark this square as pending:
    - Dispatch an action (e.g., `SUBMISSION_SENT`) that adds `roundItemId` to `state.mySubmissions` Map with status `'pending'`
  - Show a brief success toast: `toast('Submitted!')`
  - Clear `pendingRoundItemIdRef.current`
- Add `SUBMISSION_SENT` action to the game state reducer:
  - Payload: `{ roundItemId: string }`
  - Creates a new Map from existing mySubmissions, sets the roundItemId entry to `'pending'`
- The full scout photo pipeline is now: tap → camera → compress → upload → emit → toast

## Files to Create/Modify
- `src/components/ScoutGame.tsx` — emit `submission:submit` and update local submission state
- Game state reducer file — add `SUBMISSION_SENT` action

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: `submission:submit` is emitted with correct roundItemId and photoUrl
- **Check**: mySubmissions Map is updated with the new pending entry
- **Check**: "Submitted!" toast appears after emit
- **Check**: pendingRoundItemIdRef is cleared
- **Command**: `npx tsc --noEmit`

## Commit
`feat(socket): emit submission:submit after successful S3 upload`
