# Step 109: Build RoundHeader Component

## Description

Create the RoundHeader component that sits fixed at the top of the leader's board screen, showing the round timer, progress count, and an "End Round" button with confirmation dialog.

## Requirements

- Create `src/components/RoundHeader.tsx`
- Fixed/sticky top bar that doesn't scroll with the board
- **Timer**: Display MM:SS elapsed since `roundStartedAt` (ISO string prop). Use `setInterval` (1-second tick) to update. Clean up interval on unmount.
- **Progress**: Display claimed/total fraction (e.g. "12/25"). Calculate claimed count from the board array (items where `claimedByTeamId !== null`). Total is `board.length`.
- **End Round button**: shadcn `Dialog` for confirmation. Button text: "End Round". Dialog title: "End this round?". Dialog description: "This will end the current round for all teams." Confirm button triggers `onEndRound` callback prop.
- Props: `roundStartedAt: string`, `board: RoundItem[]`, `onEndRound: () => void`
- Responsive layout: timer on left, progress centered, End Round button on right

## Files to Create/Modify

- `src/components/RoundHeader.tsx` — New component with timer, progress, and end round confirmation dialog

## Checklist

- [x] Implemented
- [x] Verified

## Verification

- **Check**: Timer counts up from the round start time in MM:SS format
- **Check**: Progress shows correct claimed/total count and updates when squares are claimed
- **Check**: "End Round" button opens a confirmation dialog before triggering the callback
- **Check**: Header stays fixed at top while board scrolls beneath

## Commit

`feat(client): build RoundHeader with timer, progress, and end round confirmation`
