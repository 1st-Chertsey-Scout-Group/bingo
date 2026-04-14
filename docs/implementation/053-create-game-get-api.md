# Step 053: Create Game GET API Route

## Description
Create the GET /api/game/[gameId] endpoint that returns the full state of a game. This powers the leader dashboard and scout game views, providing teams and board state.

## Requirements
- Create `src/app/api/game/[gameId]/route.ts`
- Export a named `GET` handler
- Extract `gameId` from route params
- Query the database for the Game by `id`, including:
  - Teams filtered to the current round (`where: { round: game.round }`)
  - RoundItems for the current round (only included when `status === 'active'`)
- If game not found, return 404 `{ error: "Game not found" }`
- Response shape:
  ```json
  {
    "gameId": "clx...",
    "pin": "3847",
    "status": "lobby",
    "round": 1,
    "boardSize": 25,
    "templateCount": 5,
    "teams": [{ "id": "clx...", "name": "Red Fox", "colour": "#E53E3E" }],
    "board": [{ "roundItemId": "clx...", "displayName": "Oak leaf", "claimedByTeamId": null }]
  }
  ```
- `board` array is empty `[]` when status is not `'active'`
- Each board item includes `roundItemId` (the RoundItem id), `displayName` (from the related Item), and `claimedByTeamId` (nullable)

## Files to Create/Modify
- `src/app/api/game/[gameId]/route.ts` — create the game state endpoint

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: Returns 404 for a non-existent gameId
- **Check**: Returns game data with empty board when status is 'lobby'
- **Check**: Returns game data with populated board when status is 'active'
- **Check**: Teams array only includes teams from the current round
- **Command**: `curl http://localhost:3000/api/game/<gameId>`

## Commit
`feat(api): create GET /api/game/[gameId] game state endpoint`
