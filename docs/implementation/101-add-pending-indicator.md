# Step 101: Add Pending Submission Indicator to Scout Squares

## Description

Show a visual indicator on squares where the scout has submitted a photo that is awaiting review. This gives scouts feedback that their submission is in the queue.

## Requirements

- In `src/components/Square.tsx`, add conditional styling for the pending state
- A square is pending when: the parent passes a `isPending` prop (or derives from context)
- Add prop to Square: `isPending?: boolean`
- Update Board to pass `isPending`:
  - In `src/components/Board.tsx`, accept an additional prop: `pendingItems?: Set<string>` (set of roundItemIds with pending submissions)
  - Pass `isPending={pendingItems?.has(item.roundItemId) ?? false}` to each Square
- In `src/components/ScoutGame.tsx`, derive pendingItems from `state.mySubmissions`:
  ```typescript
  const pendingItems = new Set(
    [...state.mySubmissions.entries()]
      .filter(([, status]) => status === 'pending')
      .map(([roundItemId]) => roundItemId),
  )
  ```

  - Pass `pendingItems={pendingItems}` to Board
- Pending square styling (only when unclaimed):
  - Dotted border: `border-2 border-dashed border-amber-400`
  - Subtle pulsing animation: `animate-pulse` (Tailwind built-in) at reduced opacity
  - Or custom animation: add a gentle opacity pulse via CSS
  - Background: `bg-amber-50`
  - Not tappable: `cursor-default pointer-events-none` (prevent retap while pending)

## Files to Create/Modify

- `src/components/Square.tsx` — add isPending prop and pending state styling
- `src/components/Board.tsx` — accept and pass pendingItems set
- `src/components/ScoutGame.tsx` — derive pendingItems from mySubmissions and pass to Board

## Checklist

- [ ] Implemented
- [ ] Verified

## Verification

- **Check**: After submitting a photo, the square shows a pulsing dotted border
- **Check**: Pending squares have amber-tinted background
- **Check**: Pending squares cannot be tapped again
- **Check**: Once claimed or rejected, the pending indicator is removed
- **Command**: `npx tsc --noEmit`

## Commit

`style(ui): add pending submission indicator to scout squares`
