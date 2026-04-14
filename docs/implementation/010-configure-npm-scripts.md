# Step 010: Configure npm Scripts

## Description
Update package.json with all npm scripts needed for development, building, testing, and database management. Also add the Prisma seed configuration so that `prisma db seed` knows how to execute the seed file.

## Requirements
- Replace the default `scripts` section in `package.json` with the following exact scripts:
  - `"dev": "tsx watch server.ts"` — run the custom server in dev mode with hot reload
  - `"build": "next build && tsc --project tsconfig.server.json"` — build Next.js and compile server
  - `"start": "node dist/server.js"` — run the production server
  - `"db:push": "prisma db push"` — push schema changes to the database
  - `"db:seed": "prisma db seed"` — run the seed script
  - `"db:studio": "prisma studio"` — open Prisma Studio GUI
  - `"test": "vitest"` — run tests in watch mode
  - `"test:coverage": "vitest --coverage"` — run tests with coverage
  - `"lint": "next lint"` — run ESLint
  - `"format": "prettier --write ."` — format all files with Prettier
- Add a top-level `"prisma"` key to `package.json` with seed configuration:
  ```json
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
  ```

## Files to Create/Modify
- `package.json` — update `scripts` section and add `prisma` seed config

## Checklist
- [x] Implemented
- [x] Verified

## Verification
- **Check**: All scripts are present in package.json
- **Command**: `node -e "const pkg = require('./package.json'); console.log(JSON.stringify(pkg.scripts, null, 2))"`
- **Check**: Prisma seed config is present
- **Command**: `node -e "const pkg = require('./package.json'); console.log(JSON.stringify(pkg.prisma, null, 2))"`

## Commit
`chore(scripts): configure npm scripts and Prisma seed command`
