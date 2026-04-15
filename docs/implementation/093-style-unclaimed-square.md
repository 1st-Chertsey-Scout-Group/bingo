# Step 093: Style Unclaimed Square State

## Description

Define the visual styling for unclaimed squares — the default state when no team has claimed a bingo item. This is the most common state at the start of a round.

## Requirements

- In `src/components/Square.tsx`, add conditional styling for the unclaimed state
- A square is unclaimed when: `roundItem.claimedByTeamId === null` and no pending submission from own team
- Unclaimed styling:
  - Background: `bg-white` (or `bg-card` for theme consistency)
  - Border: `border border-gray-200`
  - Text colour: `text-gray-900`
  - Hover/active: `active:bg-gray-50` for touch feedback
  - Cursor: `cursor-pointer` (for scout role)
- For leader role unclaimed squares: same visual but different interaction (handled in leader board steps)
- Extract a helper function or use conditional class building with `cn()` from `@/lib/utils`:
  ```typescript
  const baseClasses =
    'aspect-square flex items-center justify-center rounded-lg p-1 text-center text-xs font-medium transition-colors'
  const unclaimedClasses =
    'bg-white border border-gray-200 text-gray-900 active:bg-gray-50 cursor-pointer'
  ```

## Files to Create/Modify

- `src/components/Square.tsx` — add unclaimed state conditional styling

## Checklist

- [x] Implemented
- [x] Verified

## Verification

- **Check**: Unclaimed squares display with white background and gray border
- **Check**: Tapping an unclaimed square shows a brief active state
- **Check**: Text is dark and readable against white background
- **Command**: `npx tsc --noEmit`

## Commit

`style(ui): add unclaimed square state styling`
