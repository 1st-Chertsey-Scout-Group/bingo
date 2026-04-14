# Step 112: Wire square:pending Event to Leader Board

## Description

Connect the `square:pending` socket event to the leader's game state so the board updates in real-time when scouts submit photos for review.

## Requirements

- In LeaderGame, listen for the `square:pending` socket event
- On receive, dispatch `SQUARE_PENDING` action with `{ roundItemId }` to the game reducer
- The reducer sets `hasPendingSubmissions = true` on the matching board item
- The Board component re-renders, and the relevant square shows the amber pulsing indicator (from step 110)
- Event listener should be set up when status is 'active' and cleaned up on unmount or status change

## Files to Create/Modify

- `src/components/LeaderGame.tsx` — Add socket listener for `square:pending`, dispatch SQUARE_PENDING action
- `src/hooks/useGameReducer.ts` (or wherever the reducer lives) — Ensure SQUARE_PENDING case updates `hasPendingSubmissions` on the correct board item

## Checklist

- [ ] Implemented
- [ ] Verified

## Verification

- **Check**: When a scout submits a photo, the leader's board immediately shows the amber pulsing indicator on that square
- **Check**: Multiple pending submissions to the same square don't cause visual glitches
- **Check**: The pending indicator disappears when the square is claimed

## Commit

`feat(client): wire square:pending socket event to leader board state`
