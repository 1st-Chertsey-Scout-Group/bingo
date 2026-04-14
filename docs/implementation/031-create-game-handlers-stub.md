# Step 031: Create Game Handlers Stub

## Description

Create the game sub-handler that will manage game lifecycle events. This step creates the skeleton with event listeners registered but empty handler bodies, to be implemented later.

## Requirements

- Create `src/server/socket/game.ts`
- Export `registerGameHandlers(io: Server, socket: Socket): void`
- Register listener for `game:start` event — empty handler body with `// TODO: generate board, start round, emit to game room` comment
- Register listener for `game:end` event — empty handler body with `// TODO: calculate summary, update game status, emit results` comment
- Register listener for `game:newround` event — empty handler body with `// TODO: generate new board, increment round, emit to game room` comment
- Use `Server` and `Socket` types from `socket.io`
- Follow project code standards: named exports, no `any`, TypeScript strict

## Files to Create/Modify

- `src/server/socket/game.ts` — create game event handler stub

## Checklist

- [x] Implemented
- [x] Verified

## Verification

- **Check**: File exports `registerGameHandlers` with correct signature
- **Command**: `cat src/server/socket/game.ts`
- **Check**: All three event listeners are registered
- **Command**: `grep -E 'game:start|game:end|game:newround' src/server/socket/game.ts`

## Commit

`feat(socket): add game handler stub with start, end, and newround listeners`
