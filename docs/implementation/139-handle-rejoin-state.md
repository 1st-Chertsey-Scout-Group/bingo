# Step 139: Handle rejoin:state Event on Client

## Description

Listen for the `rejoin:state` socket event and hydrate the entire client-side game state from the server response. This restores the UI to its correct state after a page refresh or reconnection.

## Requirements

- Listen for `rejoin:state` event in both `ScoutGame` and `LeaderGame` components
- The event payload is a full GameState object containing:
  - Game status (lobby, playing, ended)
  - Current round info
  - All teams in the current round (with scores)
  - Full board: all squares with claim status, photo URLs, lock status
  - For scouts: their team's pending submissions
  - For leaders: lock status per square, pending submission counts
- Dispatch a `FULL_STATE` action to the `useGameState` reducer
- The `FULL_STATE` action replaces the entire reducer state with the received payload
- Add the `FULL_STATE` case to the game state reducer if not already present
- After hydration, the UI should re-render to match the current game state exactly:
  - Correct squares shown as claimed/pending/approved/rejected
  - Correct score displayed
  - Leader sees correct lock indicators and pending counts
- Clear any loading/connecting state that was shown while waiting for rejoin response

## Files to Create/Modify

- `src/hooks/useGameState.ts` (or equivalent reducer file) — Add `FULL_STATE` action type that replaces entire state
- `src/components/ScoutGame.tsx` — Listen for `rejoin:state`, dispatch `FULL_STATE`
- `src/components/LeaderGame.tsx` — Listen for `rejoin:state`, dispatch `FULL_STATE`

## Checklist

- [x] Implemented
- [x] Verified

## Verification

- **Check**: After rejoin, scout sees their board with all previously claimed/approved/rejected squares in correct state
- **Check**: After rejoin, leader sees pending counts and lock indicators matching server state
- **Check**: Score displayed matches the server-side score
- **Check**: No stale data from previous state leaks through — full replacement occurs

## Commit

`feat(rejoin): hydrate full game state from rejoin:state event via FULL_STATE action`
