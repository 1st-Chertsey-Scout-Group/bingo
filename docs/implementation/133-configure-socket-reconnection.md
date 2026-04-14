# Step 133: Configure Socket.IO Reconnection

## Description
Update the Socket.IO client configuration to enable aggressive reconnection with exponential backoff. This is critical because scouts will be playing in a large field with wooded areas where signal drops are expected.

## Requirements
- In `src/lib/socket.ts` (or the `useSocket` hook), configure the Socket.IO client with the following options:
  - `reconnection: true`
  - `reconnectionAttempts: Infinity`
  - `reconnectionDelay: 1000`
  - `reconnectionDelayMax: 10000`
- Exponential backoff starts at 1 second and caps at 10 seconds
- Retries indefinitely until connection is restored
- Buffered events are replayed automatically on reconnect (Socket.IO default behaviour)
- No user-facing UI changes in this step (banner is step 134)

## Files to Create/Modify
- `src/lib/socket.ts` — Add reconnection options to the `io()` constructor call

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: Socket.IO client is created with all four reconnection options set
- **Command**: `grep -A 6 'reconnection' src/lib/socket.ts`
- **Check**: Disconnect the network in DevTools, observe reconnection attempts in the console at increasing intervals (1s, 2s, 4s, 8s, 10s, 10s, ...)

## Commit
`feat(socket): configure Socket.IO reconnection with infinite retries and exponential backoff`
