# Step 096: Render Scout Active Board

## Description

Wire the Board component into the ScoutGame active view. When the round is active, scouts see the bingo grid and can interact with unclaimed squares.

## Requirements

- In `src/components/ScoutGame.tsx`, when `state.status === 'active'`:
  - Render the `<Board />` component
  - Pass props:
    - `items={state.board}`
    - `role="scout"`
    - `myTeamId={state.myTeam?.id ?? null}`
    - `onSquareTap={handleSquareTap}`
  - Define `handleSquareTap(roundItemId: string)`:
    - For now, check that the square is unclaimed (`claimedByTeamId === null`) and not already submitted by own team
    - If claimed or already submitted, return early (no action)
    - Otherwise, trigger camera capture (placeholder — fully wired in step 097)
  - Wrap the board in a full-height container: `flex flex-col h-[calc(100dvh)]` or similar to fill the viewport
  - Board should be the primary content with vertical scroll

## Files to Create/Modify

- `src/components/ScoutGame.tsx` — render Board component during active status

## Checklist

- [ ] Implemented
- [ ] Verified

## Verification

- **Check**: Board renders when game status is 'active'
- **Check**: Board displays all items from state.board
- **Check**: Tapping an unclaimed square calls handleSquareTap with correct roundItemId
- **Check**: Tapping a claimed square does nothing
- **Command**: `npx tsc --noEmit`

## Commit

`feat(ui): render scout board during active round`
