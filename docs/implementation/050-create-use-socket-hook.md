# Step 050: Create useSocket Hook

## Description

Create the useSocket React hook that manages the Socket.IO client connection lifecycle. The hook creates a connection on mount and cleans it up on unmount, providing the socket instance to components that need real-time communication.

## Requirements

- Create `src/hooks/useSocket.ts`
- Add `'use client'` directive at the top
- Import `getSocket` from `@/lib/socket`
- Export `useSocket()` hook that:
  - Uses `useEffect` to manage connection lifecycle
  - On mount: calls `getSocket()` to get/create the socket instance and calls `socket.connect()` if not already connected
  - On unmount: calls `socket.disconnect()`
  - Stores the socket instance in a `useRef` to avoid re-renders
  - Returns the socket instance (typed as `Socket | null`)
- The hook must be safe to call during SSR (return `null` when `typeof window === 'undefined'`)
- Do NOT configure reconnection options in this step (deferred to step 133)
- Do NOT set up any event listeners in this hook — that responsibility belongs to game components
- Follow project code standards: named exports, no `any`, TypeScript strict

## Files to Create/Modify

- `src/hooks/useSocket.ts` — create the useSocket hook

## Checklist

- [ ] Implemented
- [ ] Verified

## Verification

- **Check**: File exports `useSocket` hook
- **Command**: `cat src/hooks/useSocket.ts`
- **Check**: Uses `useEffect` for lifecycle management
- **Command**: `grep 'useEffect' src/hooks/useSocket.ts`
- **Check**: Returns socket instance or null
- **Check**: TypeScript compiles without errors
- **Command**: `npx tsc --noEmit`

## Commit

`feat(hooks): add useSocket hook for Socket.IO connection lifecycle`
