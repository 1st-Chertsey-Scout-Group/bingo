# Step 125: Emit game:ended with Summaries

## Description
After calculating team summaries in the game:end handler, emit the `game:ended` event to all clients so they can transition to the round-over screen.

## Requirements
- After calculating team summaries in the `game:end` handler, emit `game:ended` to `game:{gameId}` room
- Payload: `{ summary: TeamSummary[] }` where each TeamSummary is `{ teamId, teamName, teamColour, claimedCount }`
- All clients (scouts and leaders) receive this event
- Scouts use this to show the "round over" overlay
- Leaders use this to show the round summary screen
- This same emission pattern is reused by the auto-end logic (step 126)

## Files to Create/Modify
- `src/server/socket/game.ts` — Add `io.to(\`game:${gameId}\`).emit('game:ended', { summary })` after summary calculation. Consider extracting the end logic into a reusable function for auto-end.

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: All clients in the game room receive `game:ended` with the correct summary array
- **Check**: Summary contains all teams with accurate claimedCount values
- **Check**: Summary is sorted by claimedCount descending

## Commit
`feat(server): emit game:ended with team summaries to all clients`
