# Step 029: Create Socket Handler Entry Point

## Description

Create the central socket handler module that registers all Socket.IO event handlers when a client connects. This module acts as the orchestrator, delegating to sub-handler modules for lobby, game, and submission events.

## Requirements

- Create `src/server/socket-handler.ts`
- Export a named function `registerSocketHandlers(io: Server): void`
- Inside, set up `io.on('connection', (socket) => { ... })`
- Within the connection callback, call:
  - `registerLobbyHandlers(io, socket)`
  - `registerGameHandlers(io, socket)`
  - `registerSubmissionHandlers(io, socket)`
- Import sub-handlers from `@/server/socket/lobby`, `@/server/socket/game`, `@/server/socket/submission`
- Log socket connection and disconnection events to console (include `socket.id`)
- Use `Server` and `Socket` types from `socket.io`

## Files to Create/Modify

- `src/server/socket-handler.ts` — create the socket handler entry point

## Checklist

- [ ] Implemented
- [ ] Verified

## Verification

- **Check**: File exports `registerSocketHandlers` function with correct signature
- **Command**: `cat src/server/socket-handler.ts`
- **Check**: All three sub-handler imports are present
- **Command**: `grep -c 'register.*Handlers' src/server/socket-handler.ts` (should output 4: 1 definition + 3 calls)

## Commit

`feat(socket): create socket handler entry point with sub-handler delegation`
