# Step 073: Create ScoutGame Component Shell

## Description
Create the ScoutGame client component that serves as the main wrapper for the scout's game experience. It connects to the socket, reads game state, and conditionally renders the appropriate UI based on game status.

## Requirements
- Create `src/components/ScoutGame.tsx` as a `'use client'` component
- Named export: `export function ScoutGame({ gameId }: { gameId: string })`
- Wrap all content in `GameProvider` (from `@/components/providers/GameProvider` or similar)
- Call `useSocket()` hook to establish socket connection
- Call `useGame()` hook to read current game state (status, teams, board, etc.)
- Render conditional UI based on `status`:
  - `'lobby'`: render `<Lobby />` component (placeholder `<div>Lobby - Waiting for game to start...</div>` for now)
  - `'active'`: render placeholder `<div>Game is active - Board goes here</div>`
  - `'ended'`: render placeholder `<div>Round over</div>`
  - Default/loading: render `<div>Loading...</div>`
- Pass `gameId` to the GameProvider so it can fetch initial state
- Component should handle the case where game state is not yet loaded (loading state)

## Files to Create/Modify
- `src/components/ScoutGame.tsx` — create the scout game shell component

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: Component renders without errors
- **Check**: GameProvider wraps the content
- **Check**: useSocket is called to establish connection
- **Check**: Correct placeholder renders for each game status
- **Check**: Loading state renders when game state is not yet available

## Commit
`feat(scout): create ScoutGame component shell with status-based rendering`
