# Step 090: Wire game:started Event on Client

## Description
Listen for the `game:started` socket event in both ScoutGame and LeaderGame components. This transitions the UI from the lobby to the active board view.

## Requirements
- Add `GAME_STARTED` action to the game state reducer:
  - Payload: `{ board: RoundItem[], roundStartedAt: string }`
  - Sets `state.status = 'active'`
  - Sets `state.board = action.board`
  - Sets `state.roundStartedAt = action.roundStartedAt`
  - Clears `state.mySubmissions` to a new empty Map
- In `src/components/ScoutGame.tsx`, add a useEffect listener for `game:started`:
  - On receive, dispatch `GAME_STARTED` with the event payload
  - Clean up listener on unmount
- In `src/components/LeaderGame.tsx`, add the same useEffect listener for `game:started`:
  - On receive, dispatch `GAME_STARTED` with the event payload
  - Clean up listener on unmount
- Both components should now render the active view when status transitions to `'active'`

## Files to Create/Modify
- Game state reducer file — add `GAME_STARTED` action
- `src/components/ScoutGame.tsx` — listen for `game:started` and dispatch
- `src/components/LeaderGame.tsx` — listen for `game:started` and dispatch

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: Receiving `game:started` transitions state.status to 'active'
- **Check**: Board items are stored in state.board
- **Check**: roundStartedAt is stored in state
- **Check**: Both ScoutGame and LeaderGame switch from lobby to active view
- **Command**: `npx tsc --noEmit`

## Commit
`feat(state): wire game:started event to client game state`
