# Step 033: Create Socket.IO Client

## Description

Create the client-side Socket.IO instance that will be shared across the application. Uses a lazy initialization pattern to avoid issues with server-side rendering and ensures only one socket connection is created.

## Requirements

- Create `src/lib/socket.ts`
- Export a function `getSocket(): Socket` that lazily creates and returns a Socket.IO client instance
- Connect to `window.location.origin` (same host and port as the page)
- Guard against SSR: return `null` or skip initialization when `typeof window === 'undefined'`
- Use lazy initialization: create the socket on first call, return the cached instance on subsequent calls
- Do NOT configure reconnection options in this step (deferred to step 133)
- Import `io` and `Socket` type from `socket.io-client`
- Export the `Socket` type for use by consumers
- Follow project code standards: named exports, no `any`, `'use client'` directive not needed (this is a plain module)

## Files to Create/Modify

- `src/lib/socket.ts` — create the Socket.IO client singleton

## Checklist

- [ ] Implemented
- [ ] Verified

## Verification

- **Check**: File exports `getSocket` function
- **Command**: `cat src/lib/socket.ts`
- **Check**: Uses `socket.io-client` import
- **Command**: `grep 'socket.io-client' src/lib/socket.ts`

## Commit

`feat(client): create Socket.IO client with lazy initialization`
