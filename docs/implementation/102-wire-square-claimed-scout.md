# Step 102: Wire square:claimed Event in ScoutGame

## Description
Listen for `square:claimed` events to update the board when any team claims a square. This keeps all scouts' boards in sync with the game state.

## Requirements
- In `src/components/ScoutGame.tsx`, add a useEffect listener for `square:claimed`
  - Event payload: `{ roundItemId: string, teamId: string, teamName: string, teamColour: string }`
  - Dispatch `SQUARE_CLAIMED` action with the payload
  - Clean up listener on unmount
- Add `SQUARE_CLAIMED` action to the game state reducer:
  - Payload: `{ roundItemId: string, teamId: string, teamName: string, teamColour: string }`
  - Find the board item with matching `roundItemId`
  - Update it: `claimedByTeamId: teamId`, `claimedByTeamName: teamName`, `claimedByTeamColour: teamColour`
  - Create new board array (immutable update): `state.board.map(item => item.roundItemId === roundItemId ? { ...item, ...claimData } : item)`
  - Also remove the roundItemId from `mySubmissions` if present (submission resolved)
- Board re-renders with updated square styling:
  - Own team claim: team colour background + checkmark (step 094)
  - Other team claim: team colour + abbreviation (step 095)

## Files to Create/Modify
- `src/components/ScoutGame.tsx` — add `square:claimed` socket listener
- Game state reducer file — add `SQUARE_CLAIMED` action

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: When any square is claimed, the board updates to show the claim
- **Check**: Own-team claims show team colour with checkmark
- **Check**: Other-team claims show their colour with abbreviation
- **Check**: Pending indicator is removed when the square is claimed
- **Command**: `npx tsc --noEmit`

## Commit
`feat(socket): wire square:claimed event to scout board state`
