# Step 089: Emit game:started Event with Board Data

## Description
After creating RoundItems, broadcast the `game:started` event to all clients in the game room. This delivers the board and signals that the round has begun.

## Requirements
- In `src/server/socket/game.ts`, after RoundItem creation (step 088):
  - Query back the created RoundItems: `prisma.roundItem.findMany({ where: { gameId: game.id, round: game.round } })`
  - Map each RoundItem to the client payload shape:
    ```typescript
    {
      roundItemId: roundItem.id,
      displayName: roundItem.displayName,
      claimedByTeamId: null,
      claimedByTeamName: null,
      claimedByTeamColour: null,
      hasPendingSubmissions: false,
      lockedByLeader: null
    }
    ```
  - Emit `game:started` to room `game:{game.id}` with payload:
    ```typescript
    {
      board: RoundItem[],   // array of mapped items above
      roundStartedAt: game.roundStartedAt.toISOString()
    }
    ```
- All clients (scouts and leaders) in the game room receive this event

## Files to Create/Modify
- `src/server/socket/game.ts` — emit `game:started` after RoundItem creation

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: All clients in the game room receive `game:started` event
- **Check**: Payload contains board array with correct number of items
- **Check**: Each board item has roundItemId, displayName, and null claim fields
- **Check**: roundStartedAt is a valid ISO timestamp string

## Commit
`feat(socket): emit game:started event with board data`
