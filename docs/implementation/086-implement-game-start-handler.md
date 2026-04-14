# Step 086: Implement game:start Socket Handler

## Description
Handle the `game:start` event on the server to transition a game from lobby to active status. This sets up the round metadata before board generation happens in the next steps.

## Requirements
- In `src/server/socket/game.ts`, implement the `game:start` event handler
- Extract `gameId` from `socket.data.gameId`; emit error if not set
- Query the Game by id
- Validate `game.status === 'lobby'`; emit error if game is not in lobby status
- Validate the emitting socket is a leader (`socket.data.role === 'leader'`); emit error if not
- Update the Game record:
  - `round: game.round + 1` (increment round number)
  - `status: 'active'`
  - `roundStartedAt: new Date()`
- Use Prisma `update` to persist these changes
- Do NOT emit `game:started` yet — that happens in step 089 after board generation

## Files to Create/Modify
- `src/server/socket/game.ts` — implement `game:start` handler with status transition and round increment

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: Game status transitions from 'lobby' to 'active' in the database
- **Check**: Game round increments by 1
- **Check**: roundStartedAt is set to current timestamp
- **Check**: Non-leader sockets cannot trigger game start
- **Check**: Games not in lobby status cannot be started

## Commit
`feat(socket): implement game:start handler with status transition`
