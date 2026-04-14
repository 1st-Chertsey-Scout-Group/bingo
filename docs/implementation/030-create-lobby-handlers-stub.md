# Step 030: Create Lobby Handlers Stub

## Description
Create the lobby sub-handler that will manage team joining and reconnection events. This step creates the skeleton with event listeners registered but empty handler bodies, to be implemented in a later step.

## Requirements
- Create `src/server/socket/lobby.ts`
- Export `registerLobbyHandlers(io: Server, socket: Socket): void`
- Register listener for `lobby:join` event — empty handler body with `// TODO: validate game PIN, assign team, join rooms` comment
- Register listener for `rejoin` event — empty handler body with `// TODO: validate teamId, rejoin rooms, send full state` comment
- Use `Server` and `Socket` types from `socket.io`
- Follow project code standards: named exports, no `any`, TypeScript strict

## Files to Create/Modify
- `src/server/socket/lobby.ts` — create lobby event handler stub

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: File exports `registerLobbyHandlers` with correct signature
- **Command**: `cat src/server/socket/lobby.ts`
- **Check**: Both `lobby:join` and `rejoin` listeners are registered
- **Command**: `grep -E 'lobby:join|rejoin' src/server/socket/lobby.ts`

## Commit
`feat(socket): add lobby handler stub with join and rejoin listeners`
