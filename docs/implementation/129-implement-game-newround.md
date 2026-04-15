# Step 129: Implement game:newround Handler

## Description

Implement the server-side `game:newround` handler that resets the game to lobby state so new teams can form before the next round begins.

## Requirements

- Listen for `game:newround` event with payload `{}` (no payload)
- Set `game.status = 'lobby'` via Prisma update
- Do NOT increment the round number — that happens on the next `game:start`
- All team assignments from the previous round remain in the database for history but are no longer active for the new round
- No need to clear RoundItems or Submissions — they belong to the previous round and are identified by round number

## Files to Create/Modify

- `src/server/socket/game.ts` — Add `game:newround` handler with game status update to 'lobby'

## Checklist

- [x] Implemented
- [x] Verified

## Verification

- **Check**: Triggering game:newround sets the game status to 'lobby' in the database
- **Check**: The round number is NOT incremented
- **Check**: Previous round data remains intact in the database
- **Command**: `npx prisma studio` — verify game status is 'lobby' and round is unchanged

## Commit

`feat(server): implement game:newround handler to reset game to lobby state`
