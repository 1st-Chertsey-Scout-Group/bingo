# Step 038: Verify Dev Server

> **MANUAL STEP** — requires human action.

## Description
Manually verify that the custom server, page routes, and Socket.IO connection all work together in development mode. This confirms the foundation is solid before building features on top of it.

## Requirements
- Run the dev server using `npm run dev` (which executes `tsx watch server.ts`)
- Verify the server starts and logs "Server listening on http://localhost:3000"
- Verify the landing page loads at `http://localhost:3000/`
- Verify the admin page loads at `http://localhost:3000/admin`
- Verify `/play/test` returns a 404 page (no game with id "test" exists)
- Verify `/leader/test` returns a 404 page (no game with id "test" exists)
- Open browser DevTools and confirm Socket.IO connects (look for WebSocket connection in Network tab or console log from socket-handler.ts)
- Verify no TypeScript compilation errors appear in the terminal

## Files to Create/Modify
- No files to create or modify

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: Server starts without errors on port 3000
- **Command**: `npm run dev`
- **Check**: Landing page renders "Scout Bingo" heading at `/`
- **Check**: Admin page renders "Admin" heading at `/admin`
- **Check**: `/play/test` and `/leader/test` return 404
- **Check**: Socket.IO WebSocket connection established in browser DevTools

## Commit
No commit needed — manual verification step.
