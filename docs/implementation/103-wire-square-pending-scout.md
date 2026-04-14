# Step 103: Wire square:pending Event in ScoutGame

## Description

Listen for `square:pending` events to track which squares have pending submissions across all teams. This keeps the board state consistent and is primarily used by the leader view, but scouts also receive it for state consistency.

## Requirements

- In `src/components/ScoutGame.tsx`, add a useEffect listener for `square:pending`
  - Event payload: `{ roundItemId: string }`
  - Dispatch `SQUARE_PENDING` action with the payload
  - Clean up listener on unmount
- Add `SQUARE_PENDING` action to the game state reducer:
  - Payload: `{ roundItemId: string }`
  - Find the board item with matching `roundItemId`
  - Update it: `hasPendingSubmissions: true`
  - Create new board array (immutable update): `state.board.map(item => item.roundItemId === roundItemId ? { ...item, hasPendingSubmissions: true } : item)`
- This does not directly affect scout UI styling (scouts only see their own pending via mySubmissions), but keeps the board data accurate for any shared logic

## Files to Create/Modify

- `src/components/ScoutGame.tsx` — add `square:pending` socket listener
- Game state reducer file — add `SQUARE_PENDING` action

## Checklist

- [ ] Implemented
- [ ] Verified

## Verification

- **Check**: Receiving `square:pending` updates the board item's hasPendingSubmissions to true
- **Check**: Board state is updated immutably
- **Check**: Socket listener is cleaned up on unmount
- **Command**: `npx tsc --noEmit`

## Commit

`feat(socket): wire square:pending event to scout game state`
