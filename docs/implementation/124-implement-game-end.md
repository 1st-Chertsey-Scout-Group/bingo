# Step 124: Implement game:end Handler

## Description

Implement the server-side `game:end` handler that allows a leader to manually end the current round, calculating team summaries for the scoreboard.

## Requirements

- Listen for `game:end` event with payload `{}` (no payload)
- Set `game.status = 'ended'` via Prisma update
- Calculate team summaries for the current round:
  - For each team in the current round, count RoundItems where `claimedByTeamId = team.id`
  - Build an array of `TeamSummary` objects: `{ teamId, teamName, teamColour, claimedCount }`
  - Sort by `claimedCount` descending
- Store or return the summary for emission (next step)

## Files to Create/Modify

- `src/server/socket/game.ts` — Add `game:end` handler with game status update and team summary calculation via Prisma queries

## Checklist

- [x] Implemented
- [x] Verified

## Verification

- **Check**: Triggering game:end sets the game status to 'ended' in the database
- **Check**: Team summaries are correctly calculated with accurate claimedCount values
- **Check**: Summaries are sorted by claimedCount in descending order
- **Command**: `npx prisma studio` — verify game status is 'ended' after triggering

## Commit

`feat(server): implement game:end handler with team summary calculation`
