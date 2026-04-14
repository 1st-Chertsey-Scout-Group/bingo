# Step 017: Add Game Model

## Description
Add the Game model to the Prisma schema. The Game model is the central entity that represents a bingo game session, tracking its PIN, leader credentials, game status, round number, board configuration, and related teams and round items.

## Requirements
- Add the `Game` model to `prisma/schema.prisma`
- The model must have the following fields:
  - `id` — String, primary key, default `cuid()`
  - `pin` — String, unique (used by teams to join)
  - `leaderPin` — String (used by the game leader to manage the game)
  - `status` — String, default `"lobby"` (valid values: lobby, active, ended)
  - `round` — Int, default `0`
  - `boardSize` — Int, default `25`
  - `templateCount` — Int, default `5`
  - `roundStartedAt` — DateTime, optional
  - `createdAt` — DateTime, default `now()`
  - `teams` — relation to Team[] (one-to-many)
  - `roundItems` — relation to RoundItem[] (one-to-many)

## Files to Create/Modify
- `prisma/schema.prisma` — add the following model after the generator block:

```prisma
model Game {
  id              String      @id @default(cuid())
  pin             String      @unique
  leaderPin       String
  status          String      @default("lobby") // lobby | active | ended
  round           Int         @default(0)
  boardSize       Int         @default(25)
  templateCount   Int         @default(5)
  roundStartedAt  DateTime?
  createdAt       DateTime    @default(now())
  teams           Team[]
  roundItems      RoundItem[]
}
```

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: The Game model is present in `prisma/schema.prisma` with all specified fields
- **Command**: `cat prisma/schema.prisma`
- **Check**: Prisma validates the schema (note: this may fail until Team and RoundItem models are added in later steps)
- **Command**: `npx prisma validate`

## Commit
`feat(db): add Game model to Prisma schema`
