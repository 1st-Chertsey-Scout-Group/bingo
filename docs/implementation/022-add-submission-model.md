# Step 022: Add Submission Model

## Description
Add the Submission model to the Prisma schema. Submissions represent photo evidence uploaded by teams for specific bingo squares. Each submission links to a round item and a team, tracks its review status, and stores the photo URL from S3.

## Requirements
- Add the `Submission` model to `prisma/schema.prisma`
- The model must have the following fields:
  - `id` — String, primary key, default `cuid()`
  - `roundItemId` — String (foreign key to RoundItem)
  - `roundItem` — relation to RoundItem via `roundItemId` referencing `id`
  - `teamId` — String (foreign key to Team)
  - `team` — relation to Team via `teamId` referencing `id`
  - `photoUrl` — String (S3 URL of the uploaded photo)
  - `status` — String, default `"pending"` (valid values: pending, approved, rejected)
  - `position` — Int (ordering position for multiple submissions to the same round item)
  - `reviewedBy` — String, optional (identifier of who reviewed this submission)
  - `createdAt` — DateTime, default `now()`
- Add an index on `[roundItemId, status]` for filtering submissions by status per round item
- Add an index on `[roundItemId, position]` for ordering submissions per round item
- Add an index on `[teamId]` for looking up all submissions by a team

## Files to Create/Modify
- `prisma/schema.prisma` — add the following model:

```prisma
model Submission {
  id          String   @id @default(cuid())
  roundItemId String
  roundItem   RoundItem @relation(fields: [roundItemId], references: [id])
  teamId      String
  team        Team     @relation(fields: [teamId], references: [id])
  photoUrl    String
  status      String   @default("pending")
  position    Int
  reviewedBy  String?
  createdAt   DateTime @default(now())
  @@index([roundItemId, status])
  @@index([roundItemId, position])
  @@index([teamId])
}
```

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: The Submission model is present in `prisma/schema.prisma` with all specified fields, relations, and indexes
- **Command**: `cat prisma/schema.prisma`
- **Check**: The complete schema (all models from steps 016-022) validates successfully
- **Command**: `npx prisma validate`

## Commit
`feat(db): add Submission model to Prisma schema`
