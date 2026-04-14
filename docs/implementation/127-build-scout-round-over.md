# Step 127: Build Scout Round Over Screen

## Description

When the game ends, scouts see an overlay on top of their board with a friendly message and their team's score. This screen persists until the leader starts a new round.

## Requirements

- In ScoutGame, when `status === 'ended'`, render an overlay on top of the existing board
- The board remains visible beneath the overlay (semi-transparent backdrop)
- **Overlay content**:
  - "Head back to base!" heading (large, centered, friendly font)
  - "Your team claimed X squares" — calculate X from the summary array where `teamId` matches `myTeam.id`
  - If team not found in summary, show "Your team claimed 0 squares"
- Overlay stays visible until the `game:lobby` event is received (leader starts new round)
- No interactive elements on the scout overlay — they just wait
- Listen for `game:ended` socket event, dispatch `GAME_ENDED` action with `{ summary }` to set status to 'ended'

## Files to Create/Modify

- `src/components/ScoutGame.tsx` — Add socket listener for `game:ended`. Render overlay when status is 'ended' with heading and team score.
- `src/hooks/useGameReducer.ts` — Ensure GAME_ENDED case sets status to 'ended' and stores summary

## Checklist

- [ ] Implemented
- [ ] Verified

## Verification

- **Check**: When the game ends, scouts see the "Head back to base!" overlay
- **Check**: The team's claimed square count is correct
- **Check**: The board is visible beneath the overlay
- **Check**: The overlay persists until a new round starts

## Commit

`feat(client): build scout round-over overlay with team score`
