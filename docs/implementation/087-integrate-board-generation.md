# Step 087: Integrate Board Generation into Game Start

## Description

Call the board generation algorithm during game start to select which nature items appear on this round's bingo board. The algorithm avoids repeating items from the last 2 rounds.

## Requirements

- In `src/server/socket/game.ts`, within the `game:start` handler (after the status update from step 086):
  - Query all concrete Items from the database (`where: { isTemplate: false }`)
  - Query all template Items from the database (`where: { isTemplate: true }`)
  - Query all TemplateValues from the database
  - Query RoundItem IDs used in recent rounds: `where: { gameId: game.id, round: { gte: game.round - 2 } }` — select only `itemId` field, deduplicate into a `Set<string>`
  - Call `generateBoard()` from `src/lib/game-logic.ts` with:
    - `boardSize: game.boardSize` (total squares on the board, e.g., 25)
    - `templateCount: game.templateCount` (how many template slots)
    - `concreteItems`: array of concrete items from DB
    - `templateItems`: array of template items from DB
    - `templateValues`: array of template values from DB
    - `recentItemIds`: Set of item IDs used in last 2 rounds
  - Receive back: `Array<{ itemId: string, displayName: string }>`
- If `generateBoard` throws (not enough items), emit error to the leader socket and revert game status to 'lobby'

## Files to Create/Modify

- `src/server/socket/game.ts` — add board generation call within game:start handler

## Checklist

- [ ] Implemented
- [ ] Verified

## Verification

- **Check**: Board generation produces the correct number of items (matching game.boardSize)
- **Check**: Items from the last 2 rounds are excluded where possible
- **Check**: Template items are resolved to concrete display names
- **Check**: Error during generation reverts game status and notifies the leader

## Commit

`feat(socket): integrate board generation into game start flow`
