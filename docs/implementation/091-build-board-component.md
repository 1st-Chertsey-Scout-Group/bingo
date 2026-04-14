# Step 091: Build Board Component

## Description

Create the Board component that renders the bingo grid. This is the core visual element of the game, used by both scouts and leaders with role-specific behaviour.

## Requirements

- Create `src/components/Board.tsx`
  - 'use client' directive
  - Named export: `export function Board({ items, role, myTeamId, onSquareTap }: BoardProps)`
  - Props type:
    ```typescript
    type BoardProps = {
      items: RoundItem[]
      role: 'scout' | 'leader'
      myTeamId: string | null
      onSquareTap: (roundItemId: string) => void
    }
    ```
  - Renders a CSS grid container:
    - Classes: `grid grid-cols-3 gap-2 p-2 overflow-y-auto`
    - The grid fills available height: `flex-1` or `h-full`
  - Maps each item to a `<Square />` component (created in step 092), passing:
    - `key={item.roundItemId}`
    - `roundItem={item}`
    - `role={role}`
    - `isOwnTeam={item.claimedByTeamId === myTeamId}`
    - `onTap={() => onSquareTap(item.roundItemId)}`
  - Variable number of rows based on item count (CSS grid auto-rows)

## Files to Create/Modify

- `src/components/Board.tsx` — create the bingo board grid component

## Checklist

- [ ] Implemented
- [ ] Verified

## Verification

- **Check**: Board renders a 3-column grid
- **Check**: Each item in the items array produces a Square component
- **Check**: Grid scrolls vertically when items exceed viewport height
- **Check**: onSquareTap callback is passed to each Square with the correct roundItemId
- **Command**: `npx tsc --noEmit`

## Commit

`feat(ui): build board component with 3-column grid layout`
