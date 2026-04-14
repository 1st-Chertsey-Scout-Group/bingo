# Step 126: Add Auto-End When All Squares Claimed

## Description

After every successful approval, check if all squares on the board are claimed. If so, automatically end the round without requiring the leader to press "End Round". This provides a natural conclusion when the board is complete.

## Requirements

- After every successful `review:approve` transaction (in step 117's post-transaction logic), query all RoundItems for the current game/round
- Check if every RoundItem has a non-null `claimedByTeamId`
- If ALL claimed: trigger the same game end logic used in steps 124-125:
  1. Set `game.status = 'ended'`
  2. Calculate team summaries (count claimed squares per team, sort descending)
  3. Emit `game:ended` to `game:{gameId}` with `{ summary: TeamSummary[] }`
- Extract the end logic into a shared helper function (e.g. `endGame(io, gameId)`) to avoid duplication between manual end and auto-end
- If not all claimed, do nothing (game continues)

## Files to Create/Modify

- `src/server/socket/game.ts` — Extract game end logic into a reusable `endGame` function
- `src/server/socket/submission.ts` — Import and call `endGame` after approval if all squares are claimed

## Checklist

- [ ] Implemented
- [ ] Verified

## Verification

- **Check**: When the last unclaimed square is approved, the game ends automatically
- **Check**: The `game:ended` event is emitted with correct summaries
- **Check**: If there are still unclaimed squares, the game does not end
- **Check**: Manual end (game:end) still works correctly using the same shared logic

## Commit

`feat(server): auto-end round when all board squares are claimed`
