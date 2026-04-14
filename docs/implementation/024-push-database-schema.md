# Step 024: Push Database Schema

> **MANUAL STEP** — requires human action.

## Description

Push the Prisma schema to the SQLite database, creating all tables and indexes. Also generate the Prisma client TypeScript types so the application can interact with the database with full type safety.

## Requirements

- Run `npx prisma db push` to create the SQLite database file and apply all models
- The database file will be created at `prisma/data/scout-bingo.db` (as specified by `DATABASE_URL`)
- Run `npx prisma generate` to generate the Prisma client with TypeScript types
- All 6 models must be created as tables: Game, Team, Item, TemplateValue, RoundItem, Submission
- All indexes and unique constraints must be applied
- The `.env` file must have `DATABASE_URL="file:./data/scout-bingo.db"` set (from step 006)

## Files to Create/Modify

- `prisma/data/scout-bingo.db` — SQLite database file created by `prisma db push`
- `node_modules/.prisma/client/` — generated Prisma client code (auto-generated, not committed)

## Checklist

- [ ] Implemented
- [ ] Verified

## Verification

- **Check**: Database file is created
- **Command**: `npx prisma db push`
- **Check**: Prisma client is generated
- **Command**: `npx prisma generate`
- **Check**: Database tables exist
- **Command**: `npx prisma db pull` (should output the schema matching your models)
- **Check**: Prisma Studio can connect and show all tables
- **Command**: `npx prisma studio` (opens browser at http://localhost:5555)

## Commit

`feat(db): push schema to SQLite database and generate Prisma client`
