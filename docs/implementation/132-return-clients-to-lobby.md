# Step 132: Return All Clients to Lobby View

## Description

When the `GAME_LOBBY` reducer action fires, reset all game state so components re-render showing the lobby view. Scouts see the join flow and leaders see the lobby with PINs and team list, ready for a new round.

## Requirements

- In the game reducer, the `GAME_LOBBY` action must:
  - Set `status` to `'lobby'`
  - Clear `board` to an empty array
  - Clear `teams` to an empty array
  - Clear `myTeam` to null
  - Clear `summary` to null
  - Clear `roundStartedAt` to null
  - Clear any review state (reviewingRoundItemId, currentSubmission)
- In ScoutGame: when status is 'lobby' and no teamId, render the join/lobby flow. Auto-emit `lobby:join` if the game page auto-joins.
- In LeaderGame: when status is 'lobby', render the lobby view showing PINs and the team list. Listen for `lobby:teams` events to populate teams as scouts join.
- Both components should handle the transition smoothly from 'ended' to 'lobby'

## Files to Create/Modify

- `src/hooks/useGameReducer.ts` — Ensure GAME_LOBBY case resets all state fields completely
- `src/components/ScoutGame.tsx` — Ensure lobby view renders when status is 'lobby' with no team, triggering the join flow
- `src/components/LeaderGame.tsx` — Ensure lobby view renders when status is 'lobby', showing PINs and team list

## Checklist

- [x] Implemented
- [x] Verified

## Verification

- **Check**: After game:lobby, scouts see the join/lobby screen (not the board or round-over overlay)
- **Check**: After game:lobby, leaders see the lobby with PINs and empty team list
- **Check**: New scouts joining after reset get fresh team assignments
- **Check**: The board, summary, and team data from the previous round are fully cleared from client state
- **Check**: Starting a new game from the lobby works correctly with fresh board generation

## Commit

`feat(client): reset all game state on GAME_LOBBY and return clients to lobby view`
