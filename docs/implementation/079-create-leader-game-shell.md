# Step 079: Create Leader Game Shell Component

## Description

Create the top-level LeaderGame client component that manages leader-side socket connection and renders the appropriate view based on game status. This mirrors ScoutGame but for the leader role.

## Requirements

- Create `src/components/LeaderGame.tsx`
  - 'use client' directive
  - Props: `{ gameId: string }`
  - Wraps children in GameProvider (same context as ScoutGame uses)
  - Uses `useSocket()` hook to get the socket connection
  - Uses `useGame()` hook to read game state
  - Renders based on `state.status`:
    - `'lobby'` — placeholder text "Leader Lobby" (replaced in step 083)
    - `'active'` — placeholder text "Leader Board" (replaced in later steps)
    - `'ended'` — placeholder text "Game Summary" (replaced in later steps)
  - Named export: `export function LeaderGame({ gameId }: { gameId: string })`

## Files to Create/Modify

- `src/components/LeaderGame.tsx` — create leader game shell component

## Checklist

- [ ] Implemented
- [ ] Verified

## Verification

- **Check**: Component renders without errors
- **Check**: GameProvider wraps the component tree
- **Check**: Status-based rendering shows correct placeholder for each state
- **Command**: `npx tsc --noEmit`

## Commit

`feat(ui): create leader game shell component`
