# Step 137: Implement Leader Rejoin on Server

## Description

Add the server-side `rejoin` handler for leaders so they can reconnect after a page refresh or signal loss. Leaders authenticate with their leader PIN and name, and receive full game state including lock status and pending submissions.

## Requirements

- Extend the `rejoin` event handler in `src/server/socket/lobby.ts` to handle leader payloads
- Receive payload: `{ gamePin: string, leaderPin: string, leaderName: string }`
- Determine this is a leader rejoin by the presence of `leaderPin`
- Validation steps (in order):
  1. Find game by `gamePin` — if not found, emit `rejoin:error` with `{ message: "Game not found" }`
  2. Check game is not ended — if ended, emit `rejoin:error` with `{ message: "Game has ended" }`
  3. Validate `leaderPin` matches the game's leader PIN — if not, emit `rejoin:error` with `{ message: "Invalid leader PIN" }`
  4. Check `leaderName` is not already taken by another **connected** leader socket — if taken, emit `rejoin:error` with `{ message: "Name already taken" }`
- On successful validation:
  1. Join the socket to the game room (e.g. `game:{gameId}`) and leaders room (e.g. `leaders:{gameId}`)
  2. Store leader name and socket ID association (in-memory map or similar)
  3. Build full GameState from the database:
     - Game status and current round info
     - All teams in the current round with their scores
     - Full board: all RoundItems with claim status, lock status (`lockedByLeader`, `lockedAt`)
     - Pending submission counts per square
  4. Emit `rejoin:state` to the socket with the full GameState object
- On any validation failure: emit `rejoin:error` with `{ message: string }`

## Files to Create/Modify

- `src/server/socket/lobby.ts` — Extend `rejoin` handler with leader-specific validation and state reconstruction

## Checklist

- [ ] Implemented
- [ ] Verified

## Verification

- **Check**: Leader refreshes page mid-game, emits rejoin, receives `rejoin:state` with correct board, lock status, and pending counts
- **Check**: Leader rejoining with wrong PIN receives `rejoin:error`
- **Check**: Leader rejoining with a name already taken by a connected leader receives `rejoin:error`
- **Check**: After rejoin, leader socket is in the correct game and leaders rooms
- **Check**: Leader can immediately interact (open review modal, approve/reject) after rejoin

## Commit

`feat(socket): implement server-side leader rejoin with full state reconstruction`
