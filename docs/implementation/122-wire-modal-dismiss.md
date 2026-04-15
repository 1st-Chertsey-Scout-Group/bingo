# Step 122: Wire Modal Dismiss to review:close

## Description

Connect the ReviewModal's dismiss action (X button or tap outside) to emit `review:close` to the server and clean up local state.

## Requirements

- In LeaderGame, the `onDismiss` callback passed to ReviewModal should:
  1. Emit `review:close` with `{ roundItemId }` (using the current `reviewingRoundItemId`) to the server
  2. Clear `reviewingRoundItemId` from local state
  3. Clear the current submission from state
  4. Close the ReviewModal (set open to false)
- Board becomes interactive again after dismiss
- Works for both X button click and tap-outside-modal interactions

## Files to Create/Modify

- `src/components/LeaderGame.tsx` — Wire the onDismiss callback to emit review:close and clear review state

## Checklist

- [x] Implemented
- [x] Verified

## Verification

- **Check**: Clicking X or tapping outside the modal emits review:close to the server
- **Check**: The modal closes and board becomes interactive
- **Check**: The square's lock is released on other leaders' screens
- **Check**: The pending submissions remain available for another leader to review

## Commit

`feat(client): wire modal dismiss to emit review:close and clear review state`
