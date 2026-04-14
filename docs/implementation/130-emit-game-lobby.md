# Step 130: Emit game:lobby to All Clients

## Description
After setting the game back to lobby status, emit `game:lobby` to all clients so they transition out of the round-over screens and back to the lobby view.

## Requirements
- After setting `game.status = 'lobby'` in the `game:newround` handler, emit `game:lobby` to `game:{gameId}` room
- Payload: `{}` (empty object)
- All clients (scouts and leaders) receive this event
- Scouts transition from the round-over overlay back to the lobby/join flow
- Leaders transition from the summary screen back to the lobby with PIN display and team list

## Files to Create/Modify
- `src/server/socket/game.ts` — Add `io.to(\`game:${gameId}\`).emit('game:lobby', {})` after setting lobby status in the newround handler

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: All clients in the game room receive the `game:lobby` event
- **Check**: The event is emitted immediately after the game status is set to 'lobby'

## Commit
`feat(server): emit game:lobby to all clients after new round reset`
