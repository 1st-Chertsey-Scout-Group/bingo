# Step 075: Implement Scout Lobby Join Socket Handler

## Description

Implement the lobby:join socket handler that assigns a scout to a team when they join the game lobby. This is the core multiplayer entry point where scouts are automatically assigned to the next available team.

## Requirements

- Implement the `lobby:join` handler in `src/server/socket/lobby.ts`
- Handler receives `{ gamePin: string }` payload from the client
- Validate `gamePin` is a non-empty string; emit `error` event with `{ message: "gamePin is required" }` if invalid
- Find the game by `pin` where `status` is NOT `'ended'`; emit `error` event with `{ message: "Game not found" }` if no match
- If game status is not `'lobby'`, emit `error` event with `{ message: "Game is not in lobby" }`
- Count existing teams for the current round: query Team records where `gameId` matches and `round` equals `game.round`
- Determine the next team using `getNextTeam(teamCount)` from the teams utility (returns `{ name: string, colour: string }`)
- Create a Team record in the database with:
  - `gameId: game.id`
  - `name: nextTeam.name`
  - `colour: nextTeam.colour`
  - `socketId: socket.id`
  - `round: game.round`
- Join the socket to two rooms:
  - `game:{game.id}` (receives game-wide broadcasts)
  - `team:{team.id}` (receives team-specific messages)
- Emit `lobby:joined` to the connecting socket with `{ teamId: team.id, teamName: team.name, teamColour: team.colour }`
- Emit `lobby:teams` to the `game:{game.id}` room with the full updated team list for the current round:
  - `{ teams: [{ id, name, colour }] }`
- Query all teams for the current round to build the teams list for the broadcast

## Files to Create/Modify

- `src/server/socket/lobby.ts` — implement the lobby:join handler

## Checklist

- [x] Implemented
- [x] Verified

## Verification

- **Check**: Connecting with a valid game PIN creates a Team record in the database
- **Check**: Team is assigned the next available name and colour from getNextTeam
- **Check**: Socket joins the correct game and team rooms
- **Check**: Connecting socket receives `lobby:joined` with team details
- **Check**: All sockets in the game room receive `lobby:teams` with updated team list
- **Check**: Invalid game PIN emits an error event
- **Check**: Non-lobby game status emits an error event

## Commit

`feat(socket): implement lobby:join handler with auto team assignment`
