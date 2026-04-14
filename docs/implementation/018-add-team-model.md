# Step 018: Add Team Model

## Description

Add the Team model to the Prisma schema. Teams represent groups of scouts participating in a game. Each team belongs to a game, has a name and colour, tracks its current round, and can have multiple photo submissions.

## Requirements

- Add the `Team` model to `prisma/schema.prisma`
- The model must have the following fields:
  - `id` — String, primary key, default `cuid()`
  - `gameId` — String (foreign key to Game)
  - `game` — relation to Game via `gameId` referencing `id`
  - `name` — String
  - `colour` — String
  - `socketId` — String, optional (tracks the team's current WebSocket connection)
  - `round` — Int (tracks which round this team is on)
  - `createdAt` — DateTime, default `now()`
  - `submissions` — relation to Submission[] (one-to-many)
- Add an index on `gameId` for efficient lookups of teams within a game

## Files to Create/Modify

- `prisma/schema.prisma` — add the following model:

```prisma
model Team {
  id          String       @id @default(cuid())
  gameId      String
  game        Game         @relation(fields: [gameId], references: [id])
  name        String
  colour      String
  socketId    String?
  round       Int
  createdAt   DateTime     @default(now())
  submissions Submission[]
  @@index([gameId])
}
```

## Checklist

- [x] Implemented
- [x] Verified

## Verification

- **Check**: The Team model is present in `prisma/schema.prisma` with all specified fields, relation, and index
- **Command**: `cat prisma/schema.prisma`
- **Check**: Prisma validates the schema (note: may fail until Submission model is added in step 022)
- **Command**: `npx prisma validate`

## Commit

`feat(db): add Team model to Prisma schema`
