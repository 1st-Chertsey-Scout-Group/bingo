# Step 088: Create RoundItem Records in Database

## Description
Persist the generated board as RoundItem records in the database. Each RoundItem represents one square on the bingo board for the current round.

## Requirements
- In `src/server/socket/game.ts`, after board generation (step 087):
  - For each item in the generated board array, create a RoundItem record
  - Use Prisma `createMany` for efficiency:
    ```
    prisma.roundItem.createMany({
      data: boardItems.map(item => ({
        gameId: game.id,
        itemId: item.itemId,
        displayName: item.displayName,
        round: game.round,
      }))
    })
    ```
  - Each RoundItem starts with: `claimedByTeamId: null`, `status: 'unclaimed'` (or equivalent default from schema)

## Files to Create/Modify
- `src/server/socket/game.ts` — add RoundItem creation after board generation

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: RoundItem records are created in the database with correct gameId and round
- **Check**: Number of RoundItem records matches game.boardSize
- **Check**: Each RoundItem has the correct itemId and displayName from generation
- **Check**: All RoundItems start as unclaimed

## Commit
`feat(socket): create round item records for generated board`
