# Step 051: Create PIN Validation API Route

## Description
Create the POST /api/validate endpoint that checks a 4-digit PIN against active games. This is the first API route scouts and leaders hit when joining a game from the landing page.

## Requirements
- Create `src/app/api/validate/route.ts`
- Export a named `POST` handler
- Parse JSON request body for `pin` (string)
- If `pin` is missing or not a string, return 400 with `{ error: "pin is required" }`
- Query the database for a Game where `pin` matches the game's `pin` field OR the game's `leaderPin` field, AND `status` is NOT `'ended'`
- If a game is found and `game.pin === pin`, return `{ valid: true, role: "scout", gameId: game.id }`
- If a game is found and `game.leaderPin === pin`, return `{ valid: true, role: "leader", gameId: game.id }`
- If no game matches, return `{ valid: false }` with 200 status
- Use the Prisma client from `@/lib/prisma`

## Files to Create/Modify
- `src/app/api/validate/route.ts` — create the PIN validation endpoint

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: Route file exists and exports a POST function
- **Command**: `npx ts-node -e "import('./src/app/api/validate/route').then(m => console.log(typeof m.POST))"`
- **Check**: Returns `{ valid: false }` for a non-existent PIN
- **Check**: Returns `{ valid: true, role: "scout", gameId }` when PIN matches a game's pin field
- **Check**: Returns `{ valid: true, role: "leader", gameId }` when PIN matches a game's leaderPin field
- **Check**: Does not match games with status `'ended'`

## Commit
`feat(api): create POST /api/validate PIN validation endpoint`
