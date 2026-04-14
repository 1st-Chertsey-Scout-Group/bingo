# Step 092: Build Square Component

## Description
Create the Square component that renders a single bingo board cell. This step establishes the base structure and touch handling; state-specific styling is added in subsequent steps.

## Requirements
- Create `src/components/Square.tsx`
  - 'use client' directive
  - Named export: `export function Square({ roundItem, role, isOwnTeam, onTap }: SquareProps)`
  - Props type:
    ```typescript
    type SquareProps = {
      roundItem: RoundItem
      role: 'scout' | 'leader'
      isOwnTeam: boolean
      onTap: () => void
    }
    ```
  - Renders a `<button>` element for accessibility and tap handling
  - Base classes: `aspect-square flex items-center justify-center rounded-lg p-1 text-center text-xs font-medium transition-colors`
  - `onClick={onTap}` for tap handling
  - Displays `roundItem.displayName` as the primary content, truncated if too long (`line-clamp-3 break-words`)
  - Large touch target: minimum size handled by grid layout and aspect-square
  - Base background: `bg-white border border-gray-200` (overridden by state-specific styles)

## Files to Create/Modify
- `src/components/Square.tsx` — create the square cell component with base styling

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: Square renders as an aspect-ratio square button
- **Check**: Item display name is shown and truncated for long names
- **Check**: Tapping the square triggers the onTap callback
- **Check**: Base styling applies (white background, rounded, centered text)
- **Command**: `npx tsc --noEmit`

## Commit
`feat(ui): build square component with base structure and touch handling`
