# `generateBoard` produces short boards when `templateCount` exceeds available templates

**Severity.** Medium.

**Symptom.** If an admin configures a game with `templateCount` greater
than the number of template items in the database, the generated
board has fewer squares than `boardSize` requested. The `RoundItem`
insert succeeds with the reduced count and the board is rendered with
missing tiles.

**Locations.**

- `src/lib/game-logic.ts:82-108` — `generateBoard` template slot loop
- `prisma/schema.prisma:60` — `@@unique([gameId, round, itemId])` on RoundItem

## Root cause

Each template item `Item` can contribute at most one `RoundItem` per
round because of the compound unique on `(gameId, round, itemId)`.
`generateBoard` iterates a shuffled list of templates and consumes
each distinct template file once:

```ts
for (const template of shuffledTemplates) {
  if (templateSlotsFilled >= templateCount) break
  items.push({ itemId: template.id, displayName: resolved })
  templateSlotsFilled++
}
```

If `shuffledTemplates.length < templateCount`, the loop exits with
`templateSlotsFilled < templateCount`. Nothing backfills from concrete
items, and the function returns a short array. `roundItem.createMany`
then inserts fewer rows than `boardSize`.

## Failing trace

1. Admin seeds 2 template items and 50 concrete items. Admin
   configures a 5x5 board with `templateCount = 4`.
2. Leader emits `game:start`. `generateBoard` shuffles the 2 templates
   and iterates — it can fill only 2 template slots. Concrete items
   fill the remaining `25 - 4 = 21` slots (because the concrete loop
   asks for `boardSize - templateCount` of them, not
   `boardSize - templateSlotsFilled`).
3. Final `items.length === 23`, not 25.
4. `roundItem.createMany` inserts 23 rows. The client's board grid
   has two missing squares; the UI either shows gaps or crashes
   depending on how `Board.tsx` handles short arrays.

## Fix direction

Two options:

1. **Backfill when templates run out.** After the template loop,
   compute `remaining = boardSize - items.length` and continue pulling
   concrete items from a filtered pool that excludes IDs already in
   `items`. This treats `templateCount` as a maximum, not a target.
2. **Validate at the admin API.** In
   `src/app/api/game/route.ts` (or wherever `templateCount` is
   validated), reject `templateCount > templateItemsCount`. Reads
   are cheap; this is the least-change option.

Option 1 is more forgiving in operation; option 2 fails loudly at
configuration time which is often preferable. The current behaviour
(silent short board) is the worst case.

Also relevant: the concrete-item loop uses the constant
`boardSize - templateCount` to size its target, so even if templates
are backfilled, the arithmetic there needs to be adjusted accordingly.
