# Data Model

SQLite via Prisma. WAL mode enabled for concurrent read/write support.

## Prisma Schema

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Game {
  id              String      @id @default(cuid())
  pin             String      @unique
  leaderPin       String
  status          String      @default("lobby") // lobby | active | ended
  round           Int         @default(0)
  boardSize       Int         @default(25)  // 9-25, total items on board
  templateCount   Int         @default(5)   // 0-10, how many template-generated items
  roundStartedAt  DateTime?   // set when round starts, used for round timer
  createdAt       DateTime    @default(now())
  teams           Team[]
  roundItems      RoundItem[]
}

model Team {
  id          String       @id @default(cuid())
  gameId      String
  game        Game         @relation(fields: [gameId], references: [id])
  name        String       // e.g. "Red Rabbits"
  colour      String       // hex e.g. "#FF0000"
  socketId    String?      // current socket connection, null if disconnected
  round       Int          // which round this team was created for
  createdAt   DateTime     @default(now())
  submissions Submission[]

  @@index([gameId])
}

model Item {
  id         String      @id @default(cuid())
  name       String      // display name, or template e.g. "Something [colour]"
  isTemplate Boolean     @default(false)
  isDefault  Boolean     @default(true)
  roundItems RoundItem[]
}

model TemplateValue {
  id       String @id @default(cuid())
  category String // "colour" | "texture"
  value    String // e.g. "Red", "Smooth"

  @@unique([category, value])
}

model RoundItem {
  id              String       @id @default(cuid())
  gameId          String
  game            Game         @relation(fields: [gameId], references: [id])
  itemId          String
  item            Item         @relation(fields: [itemId], references: [id])
  displayName     String       // resolved name, e.g. "Something Red" (same as item.name for non-templates)
  claimedByTeamId String?
  lockedByLeader  String?      // leader display name currently reviewing, null if unlocked
  lockedAt        DateTime?    // when the lock was acquired, for 30s timeout
  round           Int
  submissions     Submission[]

  @@index([gameId, round])
  @@unique([gameId, round, itemId])
}

model Submission {
  id          String   @id @default(cuid())
  roundItemId String
  roundItem   RoundItem @relation(fields: [roundItemId], references: [id])
  teamId      String
  team        Team     @relation(fields: [teamId], references: [id])
  photoUrl    String
  status      String   @default("pending") // pending | approved | rejected | discarded
  position    Int      // FIFO queue position within this roundItem (1 = first, reviewable)
  reviewedBy  String?  // leader display name
  createdAt   DateTime @default(now())

  @@index([roundItemId, status])
  @@index([roundItemId, position])
  @@index([teamId])
}
```

## Relationships

```
Game 1---* Team
Game 1---* RoundItem
Item 1---* RoundItem
RoundItem 1---* Submission
Team 1---* Submission
```

## Key Design Decisions

- **`Game.round`** — incremented each time a new round starts. Teams and RoundItems reference this to scope data per round.
- **`Game.boardSize`** and **`Game.templateCount`** — configured by admin at game creation, immutable during rounds. Concrete items per round = boardSize - templateCount.
- **`Game.roundStartedAt`** — set when the leader starts a round, used for the MM:SS round timer on leader screens. Survives page refresh via server state.
- **`Team.round`** — teams are created fresh each round (new name/colour assignment). Old team records persist for historical submissions. On new round, clients clear cached teamId from localStorage and scouts re-join the lobby to get a fresh team.
- **`RoundItem.claimedByTeamId`** — nullable FK. `NULL` = unclaimed. Set inside a transaction on approval to prevent double-claims.
- **`RoundItem.lockedByLeader`** and **`RoundItem.lockedAt`** — soft lock for leader review. When a leader opens a review modal, the square is locked to them. Other leaders see it as dimmed with the leader's name. Lock auto-releases after 30 seconds on disconnect (checked server-side). One lock per leader max — acquiring a new lock releases the previous one.
- **`RoundItem.displayName`** — the resolved name shown to players. For concrete items, same as `item.name`. For templates, the resolved value (e.g. "Something Red"). This avoids re-resolving templates on every board render.
- **`Item.isTemplate`** — marks items as templates (e.g. "Something [colour]"). Templates are expanded at round generation time, not stored as separate items.
- **`TemplateValue`** — stores the available values for each template category. Seeded with colours and textures. Decoupled from items so new categories can be added without schema changes.
- **`Submission.status`** — state machine: `pending -> approved | rejected | discarded`. `discarded` is set when the square was claimed by another team. Submissions are locked in once created (no replacement while queued).
- **`Submission.position`** — FIFO queue position within a round item. Position 1 is the first submission and the only one reviewable by leaders. When position 1 is rejected, the next pending submission (by position) is promoted to reviewable. Assigned incrementally on creation (`SELECT MAX(position) + 1`).
- **`Team.socketId`** — updated on connect/reconnect, set to null on disconnect. Used to track online status, not for auth.
- **`@@unique([gameId, round, itemId])`** — prevents the same concrete item appearing twice in a single round. Template items can appear multiple times (different resolved values) so `displayName` handles uniqueness at the application layer.
- **No `claimedByTeam` relation** on RoundItem — kept as a plain string FK to avoid circular dependency complexity. Resolved at query time.

## Indexes

- `Team(gameId)` — fast lookup of all teams in a game
- `RoundItem(gameId, round)` — fast board retrieval for a specific round
- `Submission(roundItemId, status)` — fast pending submission lookup for review queue and claim race checks
- `Submission(roundItemId, position)` — fast FIFO queue ordering within a square
- `Submission(teamId)` — fast team submission history

## Seeding

`prisma/seed.ts` populates:

- `Item` table with the default pool (~85 concrete items + 2 templates) from `docs/product/default-items.md`. All seeded items have `isDefault: true`. Templates have `isTemplate: true`.
- `TemplateValue` table with colour values (Red, Blue, Green, Yellow, Orange, Brown, White, Black, Purple, Pink) and texture values (Smooth, Rough, Bumpy, Soft, Spiky, Fuzzy, Hard, Crumbly).
