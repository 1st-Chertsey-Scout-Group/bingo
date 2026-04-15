# Step 120: Wire Reject Empty Queue — Close Modal

## Description

Handle the case where after rejecting, the server finds no more queued submissions and emits `square:unlocked`. The ReviewModal closes and the board becomes interactive again.

## Requirements

- In LeaderGame, listen for `square:unlocked` socket event (also used in step 123)
- When `square:unlocked` is received and the unlocked `roundItemId` matches the current `reviewingRoundItemId`, close the ReviewModal
- Clear `reviewingRoundItemId` from state
- Clear the current submission from state
- Board becomes interactive again (backdrop removed)
- Dispatch `SQUARE_UNLOCKED` action to update the board item's lock status

## Files to Create/Modify

- `src/components/LeaderGame.tsx` — In the `square:unlocked` listener, check if the roundItemId matches the currently reviewing item. If so, close the modal and clear review state.

## Checklist

- [x] Implemented
- [x] Verified

## Verification

- **Check**: After rejecting the last queued submission, the modal closes automatically
- **Check**: The board square returns to its non-locked state
- **Check**: The leader can tap other squares after the modal closes
- **Check**: reviewingRoundItemId is cleared

## Commit

`feat(client): close ReviewModal when reject empties the submission queue`
