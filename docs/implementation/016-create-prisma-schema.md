# Step 016: Create Prisma Schema

## Description

Create the Prisma schema file with the datasource and generator configuration blocks. This establishes the connection to the SQLite database and sets up the Prisma client generator. Models will be added in subsequent steps.

## Requirements

- Create `prisma/schema.prisma` at the project root
- Configure the `datasource` block:
  - Provider: `"sqlite"`
  - URL: read from the `DATABASE_URL` environment variable
- Configure the `generator` block:
  - Provider: `"prisma-client-js"`
- No models yet — they will be added in steps 017-022

## Files to Create/Modify

- `prisma/schema.prisma` — create with the following exact content:

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

## Checklist

- [ ] Implemented
- [ ] Verified

## Verification

- **Check**: `prisma/schema.prisma` exists with correct datasource and generator blocks
- **Command**: `cat prisma/schema.prisma`
- **Check**: Prisma can validate the schema
- **Command**: `npx prisma validate`

## Commit

`feat(db): create Prisma schema with SQLite datasource`
