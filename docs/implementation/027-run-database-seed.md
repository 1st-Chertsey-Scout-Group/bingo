# Step 027: Run Database Seed

> **MANUAL STEP** — requires human action.

## Description

Execute the seed script to populate the database with all default bingo items, template items, and template values. This provides the initial data needed for games to be created with a full set of bingo squares.

## Requirements

- Run `npx prisma db seed` to execute the seed script
- The seed script (`prisma/seed.ts`) is executed via `tsx` as configured in `package.json` under `"prisma": { "seed": "tsx prisma/seed.ts" }`
- After seeding, the database should contain:
  - 85 concrete items (`isTemplate: false`, `isDefault: true`)
  - 2 template items (`isTemplate: true`, `isDefault: true`)
  - 87 total items
  - 10 colour template values
  - 8 texture template values
  - 18 total template values
- The seed must be idempotent — running it multiple times produces the same result

## Files to Create/Modify

- No new files — this step executes existing files

## Checklist

- [ ] Implemented
- [ ] Verified

## Verification

- **Check**: Seed script runs successfully
- **Command**: `npx prisma db seed`
- **Check**: Total item count is 87
- **Command**: `npx prisma db execute --stdin <<< "SELECT COUNT(*) as count FROM Item;"` or open Prisma Studio
- **Check**: Concrete item count is 85
- **Command**: `npx prisma db execute --stdin <<< "SELECT COUNT(*) as count FROM Item WHERE isTemplate = false;"`
- **Check**: Template item count is 2
- **Command**: `npx prisma db execute --stdin <<< "SELECT COUNT(*) as count FROM Item WHERE isTemplate = true;"`
- **Check**: Template value count is 18
- **Command**: `npx prisma db execute --stdin <<< "SELECT COUNT(*) as count FROM TemplateValue;"`
- **Check**: Running seed again does not create duplicates
- **Command**: `npx prisma db seed` (run a second time, then re-check counts)

## Commit

`feat(seed): populate database with default items and template values`
