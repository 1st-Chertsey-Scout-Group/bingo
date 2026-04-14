# Step 052: Create Game POST API Route

## Description

Create the POST /api/game endpoint that allows admins to create a new game. This is the primary admin action and produces the game record that scouts and leaders will join.

## Requirements

- Create `src/app/api/game/route.ts`
- Export a named `POST` handler
- Check `x-admin-pin` header against `process.env.ADMIN_PIN`; return 401 `{ error: "Unauthorized" }` if invalid or missing
- Parse JSON body for `leaderPin` (required string), `boardSize` (optional number, default 25), `templateCount` (optional number, default 5)
- Validate `leaderPin` is a non-empty string; return 400 `{ error: "leaderPin is required" }` if missing
- Validate `boardSize` is between 9 and 25 inclusive; return 400 `{ error: "boardSize must be between 9 and 25" }` if out of range
- Validate `templateCount` is between 0 and 10 inclusive; return 400 `{ error: "templateCount must be between 0 and 10" }` if out of range
- Validate `templateCount <= boardSize`; return 400 `{ error: "templateCount must not exceed boardSize" }` if violated
- Generate a random 4-digit game PIN using `generatePin` from `@/lib/game-logic`
- Check PIN uniqueness: query for any game with same `pin` and status NOT `'ended'`; regenerate if collision found (loop up to 10 attempts, then return 500)
- Create a Game record with: `pin`, `leaderPin`, `boardSize`, `templateCount`, `status: 'lobby'`, `round: 1`
- Return 201 with `{ gameId: game.id, pin: game.pin, leaderPin: game.leaderPin, status: game.status, boardSize: game.boardSize, templateCount: game.templateCount }`

## Files to Create/Modify

- `src/app/api/game/route.ts` — create the game creation endpoint

## Checklist

- [x] Implemented
- [x] Verified

## Verification

- **Check**: Returns 401 without valid X-Admin-Pin header
- **Check**: Returns 400 for missing leaderPin
- **Check**: Returns 400 for boardSize outside 9-25
- **Check**: Returns 400 for templateCount outside 0-10
- **Check**: Returns 400 when templateCount exceeds boardSize
- **Check**: Returns 201 with full game data on success
- **Check**: Generated PIN is a 4-digit string

## Commit

`feat(api): create POST /api/game admin game creation endpoint`
