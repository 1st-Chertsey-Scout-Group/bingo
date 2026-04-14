# Step 076: Add Team Auto-Assignment on Scout Join

## Description
When a scout joins via `lobby:join`, automatically assign them to the next available team. This ensures every scout device gets a unique team identity without manual selection.

## Requirements
- In `src/server/socket/lobby.ts`, handle the scout variant of `lobby:join` (payload: `{ gamePin }`)
- Query the Game by `gamePin`; if not found, emit an error event back to the socket and return
- Count existing Team records for this game's current round (`where: { gameId, round: game.round }`)
- Call `getNextTeam(count)` from `src/lib/teams.ts` to get the next team name and colour
- If `getNextTeam` returns `null` (all 30 teams assigned), emit an error event back to the socket and return
- Create a Team record via Prisma: `{ gameId: game.id, name: team.name, colour: team.colour, socketId: socket.id, round: game.round }`
- Join the socket to rooms `game:{game.id}` and `team:{team.id}`
- Emit acknowledgement back to the joining socket with `{ gameId: game.id, teamId: team.id, teamName: team.name, teamColour: team.colour }`
- Query all teams for the game's current round and emit `lobby:teams` to `game:{game.id}` room with `{ teams: Team[] }` (each team: `{ id, name, colour }`)

## Files to Create/Modify
- `src/server/socket/lobby.ts` — implement scout `lobby:join` handler with team auto-assignment

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: A scout joining with a valid gamePin receives a team assignment response
- **Check**: Sequential joins produce different teams (Red Rabbits, Orange Ocelots, etc.)
- **Check**: All clients in the game room receive `lobby:teams` with the updated team list
- **Check**: Joining with an invalid gamePin returns an error
- **Check**: Joining when all 30 teams are assigned returns an error

## Commit
`feat(socket): add team auto-assignment on scout lobby join`
