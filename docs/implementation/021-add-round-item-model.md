# Step 021: Add RoundItem Model

## Description

Add the RoundItem model to the Prisma schema. Round items represent the specific bingo squares on the board for a given round of a game. Each round item links a game, an item, and a round together, and tracks which team has claimed it and its display name (which may differ from the base item name for template items).

## Requirements

- Add the `RoundItem` model to `prisma/schema.prisma`
- The model must have the following fields:
  - `id` — String, primary key, default `cuid()`
  - `gameId` — String (foreign key to Game)
  - `game` — relation to Game via `gameId` referencing `id`
  - `itemId` — String (foreign key to Item)
  - `item` — relation to Item via `itemId` referencing `id`
  - `displayName` — String (the name shown on the board; may be a resolved template like "Something Red")
  - `claimedByTeamId` — String, optional (team that successfully claimed this square)
  - `lockedByLeader` — String, optional (leader lock status)
  - `lockedAt` — DateTime, optional (when the square was locked)
  - `round` — Int (which round this item belongs to)
  - `submissions` — relation to Submission[] (one-to-many)
- Add a composite index on `[gameId, round]` for efficient round lookups
- Add a unique constraint on `[gameId, round, itemId]` to prevent duplicate items in the same round

## Files to Create/Modify

- `prisma/schema.prisma` — add the following model:

```prisma
model RoundItem {
  id              String       @id @default(cuid())
  gameId          String
  game            Game         @relation(fields: [gameId], references: [id])
  itemId          String
  item            Item         @relation(fields: [itemId], references: [id])
  displayName     String
  claimedByTeamId String?
  lockedByLeader  String?
  lockedAt        DateTime?
  round           Int
  submissions     Submission[]
  @@index([gameId, round])
  @@unique([gameId, round, itemId])
}
```

## Checklist

- [ ] Implemented
- [ ] Verified

## Verification

- **Check**: The RoundItem model is present in `prisma/schema.prisma` with all specified fields, relations, index, and unique constraint
- **Command**: `cat prisma/schema.prisma`
- **Check**: Prisma validates the schema (note: may fail until Submission model is added in step 022)
- **Command**: `npx prisma validate`

## Commit

`feat(db): add RoundItem model to Prisma schema`
