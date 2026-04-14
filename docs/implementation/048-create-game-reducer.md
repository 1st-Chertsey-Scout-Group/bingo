# Step 048: Create Game Reducer

## Description

Create the game state reducer that manages all client-side game state transitions. This reducer is the single source of truth for the game UI, processing actions dispatched from socket events and user interactions.

## Requirements

- Create `src/hooks/useGameState.ts`
- Import `GameState`, `GameAction`, and related types from `@/types`
- Define the initial state:
  ```typescript
  const initialState: GameState = {
    status: 'lobby',
    teams: [],
    board: [],
    myTeam: null,
    mySubmissions: new Map(),
    summary: null,
    roundStartedAt: null,
    locks: new Map(),
    reviewingRoundItemId: null,
  }
  ```
- Implement `gameReducer(state: GameState, action: GameAction): GameState` handling every action type:
  - `GAME_STARTED` — set status to `'active'`, set board to `action.items`, set `roundStartedAt`, clear submissions and locks
  - `SQUARE_CLAIMED` — update the matching board item's `claimedByTeamId`, `claimedByTeamName`, `claimedByTeamColour`, set status to `'claimed'`
  - `SQUARE_PENDING` — update the matching board item's status to `'pending'`
  - `SQUARE_LOCKED` — add entry to `locks` Map (`roundItemId -> leaderName`)
  - `SQUARE_UNLOCKED` — remove entry from `locks` Map
  - `SUBMISSION_RECEIVED` — set submission status to `'pending'` in `mySubmissions`
  - `SUBMISSION_APPROVED` — set submission status to `'approved'` in `mySubmissions`
  - `SUBMISSION_REJECTED` — set submission status to `'rejected'` in `mySubmissions`
  - `SUBMISSION_DISCARDED` — set submission status to `'discarded'` in `mySubmissions`
  - `REVIEW_PROMOTED` — set `reviewingRoundItemId` to the action's value (leader only)
  - `GAME_ENDED` — set status to `'ended'`, set `summary`
  - `GAME_LOBBY` — reset to initial state but keep `teams`
  - `LOBBY_TEAMS` — update `teams` array
  - `FULL_STATE` — replace entire state with `action.state`
- Export `useGameState()` hook that wraps `useReducer(gameReducer, initialState)` and returns `[state, dispatch]`
- Reducer must be a pure function (create new Map instances instead of mutating)

## Files to Create/Modify

- `src/hooks/useGameState.ts` — create game state reducer and useGameState hook

## Checklist

- [ ] Implemented
- [ ] Verified

## Verification

- **Check**: File exports `useGameState` hook and `gameReducer` function
- **Command**: `cat src/hooks/useGameState.ts`
- **Check**: All action types are handled in the reducer
- **Command**: `grep -c "case '" src/hooks/useGameState.ts` (should be 14)
- **Check**: TypeScript compiles without errors
- **Command**: `npx tsc --noEmit`

## Commit

`feat(state): add game state reducer with all action type handlers`
