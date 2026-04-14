# Step 007: Create Environment Files

> **MANUAL STEP** — requires human action.

## Description
Create `.env.example` as a reference for all required environment variables, and `.env` with the SQLite database URL pre-filled. AWS and admin credentials must be filled in manually by the developer.

## Requirements
- Create `.env.example` listing all environment variables with empty values for secrets
- Create `.env` with `DATABASE_URL` set to `"file:./data/scout-bingo.db"`
- Ensure `.env` is listed in `.gitignore` (should already be there from create-next-app, but verify)
- Do NOT commit `.env` — only `.env.example` should be committed
- The following environment variables must be defined:
  - `DATABASE_URL="file:./data/scout-bingo.db"`
  - `AWS_ACCESS_KEY_ID=`
  - `AWS_SECRET_ACCESS_KEY=`
  - `AWS_REGION=`
  - `S3_BUCKET_NAME=`
  - `ADMIN_PIN=`
  - `NODE_ENV=development`
  - `PORT=3000`

## Files to Create/Modify
- `.env.example` — create with all environment variables (empty values for secrets):

```
DATABASE_URL="file:./data/scout-bingo.db"
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
S3_BUCKET_NAME=
ADMIN_PIN=
NODE_ENV=development
PORT=3000
```

- `.env` — create with the same content as `.env.example` (developer fills in secrets later):

```
DATABASE_URL="file:./data/scout-bingo.db"
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
S3_BUCKET_NAME=
ADMIN_PIN=
NODE_ENV=development
PORT=3000
```

- `.gitignore` — verify `.env` is listed; add it if missing

## Checklist
- [x] Implemented
- [x] Verified

## Verification
- **Check**: `.env.example` exists with all required variables
- **Command**: `cat .env.example`
- **Check**: `.env` exists with DATABASE_URL set
- **Command**: `cat .env`
- **Check**: `.env` is in `.gitignore`
- **Command**: `grep '^\.env' .gitignore`

## Commit
`chore(env): add environment variable example and local env file`
