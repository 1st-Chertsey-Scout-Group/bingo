# Step 081: Implement Leader Lobby Join Handler

## Description

Add leader-specific handling to the `lobby:join` socket event. Leaders authenticate with the leader PIN and join additional rooms for leader-only events like review notifications.

## Requirements

- In `src/server/socket/lobby.ts`, handle the leader variant of `lobby:join`
  - Payload: `{ gamePin, leaderPin, leaderName }`
  - Distinguish from scout join by the presence of `leaderPin` in the payload
- Validate game exists by querying Game where `gamePin` matches; emit error if not found
- Validate `leaderPin` matches `game.leaderPin`; emit error `{ error: "Invalid leader PIN" }` if mismatch
- Validate `leaderName` is a non-empty trimmed string; emit error if empty
- Join socket to rooms: `game:{game.id}` and `leaders:{game.id}`
- Store the leader's socket association (e.g., attach `socket.data.gameId`, `socket.data.leaderName`, `socket.data.role = 'leader'`)
- Emit acknowledgement back to the joining socket with `{ gameId: game.id, leaderName }`
- Query all teams for the game's current round and emit `lobby:teams` to the joining socket with `{ teams: Team[] }`

## Files to Create/Modify

- `src/server/socket/lobby.ts` — add leader join branch to `lobby:join` handler

## Checklist

- [ ] Implemented
- [ ] Verified

## Verification

- **Check**: Leader joining with correct gamePin and leaderPin receives acknowledgement
- **Check**: Leader joining with wrong leaderPin receives an error
- **Check**: Leader socket is added to both `game:{gameId}` and `leaders:{gameId}` rooms
- **Check**: Leader receives current team list on join

## Commit

`feat(socket): implement leader lobby join with PIN validation`
