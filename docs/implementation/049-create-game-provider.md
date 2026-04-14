# Step 049: Create Game Provider

## Description

Create a React Context provider that makes game state and dispatch available to all nested client components. This avoids prop drilling and provides a clean API for components to read and update game state.

## Requirements

- Create the GameProvider in `src/hooks/useGameState.ts` (same file as the reducer) or in a separate `src/hooks/GameProvider.tsx` file
- Create a React Context with `createContext` holding `{ state: GameState, dispatch: React.Dispatch<GameAction> }`
- Export `GameProvider` component:
  - Accepts `children: React.ReactNode` as props
  - Calls `useGameState()` internally to get `[state, dispatch]`
  - Wraps `children` with the context provider, passing `{ state, dispatch }` as value
  - Must have `'use client'` directive
- Export `useGame()` hook:
  - Calls `useContext` on the game context
  - Throws an error if used outside of a `GameProvider` (context value is undefined/null)
  - Returns `{ state: GameState, dispatch: React.Dispatch<GameAction> }`
- Follow project code standards: named exports, no `any`, TypeScript strict

## Files to Create/Modify

- `src/hooks/useGameState.ts` (or `src/hooks/GameProvider.tsx`) — add GameProvider context and useGame hook

## Checklist

- [x] Implemented
- [x] Verified

## Verification

- **Check**: `GameProvider` and `useGame` are exported
- **Command**: `grep -E 'export.*(GameProvider|useGame)' src/hooks/useGameState.ts` (or GameProvider.tsx)
- **Check**: Context throws when used outside provider
- **Check**: TypeScript compiles without errors
- **Command**: `npx tsc --noEmit`

## Commit

`feat(state): add GameProvider context and useGame hook`
