# Step 128: Build Leader Round Summary Screen

## Description

When the game ends, leaders see a scoreboard ranking all teams by their claimed square count, with a "New Round" button to restart the cycle.

## Requirements

- In LeaderGame, when `status === 'ended'`, render the round summary screen (replaces the board view)
- **Content**:
  - Title: "Round Summary" or "Round Over"
  - Teams ranked by `claimedCount` descending (from the summary array in game state)
  - Each row displays: rank number (1, 2, 3...), team colour badge (small circle with team colour), team name, "X squares" claimed count
  - Use a clean list/table layout
  - "New Round" button at the bottom, prominent (e.g. shadcn Button, large)
- **New Round button**: On click, emit `game:newround` to the server (wired to handler in step 129)
- Listen for `game:ended` socket event, dispatch `GAME_ENDED` action with `{ summary }`

## Files to Create/Modify

- `src/components/LeaderGame.tsx` — Add socket listener for `game:ended`. Render summary screen when status is 'ended' with ranked team list and New Round button.

## Checklist

- [x] Implemented
- [x] Verified

## Verification

- **Check**: When the game ends, leaders see the ranked team summary
- **Check**: Teams are sorted by claimedCount descending with correct rank numbers
- **Check**: Team colour badges display correctly
- **Check**: "New Round" button is visible and emits `game:newround` on click

## Commit

`feat(client): build leader round summary screen with rankings and New Round button`
