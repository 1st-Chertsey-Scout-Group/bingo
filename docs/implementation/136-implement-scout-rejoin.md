# Step 136: Implement Scout Rejoin on Server

## Description

Add the server-side `rejoin` handler for scouts so they can reconnect to an in-progress game after a page refresh or signal loss. The server validates the session, rebuilds full game state from the database, and sends it back to the client.

## Requirements

- Register a `rejoin` event handler in `src/server/socket/lobby.ts`
- Receive payload: `{ gamePin: string, teamId: string }`
- Determine this is a scout rejoin by the presence of `teamId` (no `leaderPin`)
- Validation steps (in order):
  1. Find game by `gamePin` — if not found, emit `rejoin:error` with `{ message: "Game not found" }`
  2. Check game is not ended (status is not `ended`) — if ended, emit `rejoin:error` with `{ message: "Game has ended" }`
  3. Find team by `teamId` — if not found, emit `rejoin:error` with `{ message: "Team not found" }`
  4. Verify team belongs to the game's current round — if not (team's roundId does not match game's current round), emit `rejoin:error` with `{ message: "Team not in current round" }`
- On successful validation:
  1. Update `team.socketId` in the database to the new socket ID
  2. Join the socket to the game room (e.g. `game:{gameId}`) and team room (e.g. `team:{teamId}`)
  3. Build full GameState from the database:
     - Game status and current round info
     - All teams in the current round
     - Full board: all RoundItems with claim status (claimed, pending, approved, rejected) for this team
     - Any pending submissions for this team
  4. Emit `rejoin:state` to the socket with the full GameState object
- On any validation failure: emit `rejoin:error` with `{ message: string }`

## Files to Create/Modify

- `src/server/socket/lobby.ts` — Add `rejoin` event handler with scout-specific validation and state reconstruction

## Checklist

- [ ] Implemented
- [ ] Verified

## Verification

- **Check**: Scout refreshes page mid-game, emits rejoin, receives `rejoin:state` with correct board and team data
- **Check**: Scout rejoining with invalid teamId receives `rejoin:error`
- **Check**: Scout rejoining an ended game receives `rejoin:error`
- **Check**: Scout rejoining with a teamId from a previous round receives `rejoin:error`
- **Check**: After rejoin, scout socket is in the correct game and team rooms (receives subsequent broadcasts)

## Commit

`feat(socket): implement server-side scout rejoin with full state reconstruction`
