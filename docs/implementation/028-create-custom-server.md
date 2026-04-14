# Step 028: Create Custom Server

## Description

Create the custom Node.js server entry point that creates an HTTP server, attaches Socket.IO, and passes HTTP requests through to the Next.js request handler. This is the single entry point for both HTTP and WebSocket traffic on port 3000.

## Requirements

- Create `server.ts` in the project root
- Import and initialize Next.js with `next({ dev })` where `dev` is determined by `NODE_ENV !== 'production'`
- Create an HTTP server using `http.createServer()`
- Attach a Socket.IO `Server` instance to the HTTP server with CORS allowing all origins in dev
- Import `registerSocketHandlers` from `@/server/socket-handler` and call it with the Socket.IO server instance
- Pass all HTTP requests to `nextApp.getRequestHandler()`
- Read port from `process.env.PORT` or default to `3000`
- Log "Server listening on http://localhost:{port}" when ready
- Dev mode runs via `tsx watch server.ts`
- Production: compiled to `dist/server.js` and run with `node`

## Files to Create/Modify

- `server.ts` — create the custom server entry point with HTTP + Socket.IO + Next.js integration

## Checklist

- [ ] Implemented
- [ ] Verified

## Verification

- **Check**: `server.ts` exists in the project root and imports `registerSocketHandlers`
- **Command**: `cat server.ts`
- **Check**: TypeScript compiles without errors
- **Command**: `npx tsc --noEmit -p tsconfig.server.json`

## Commit

`feat(server): create custom server with Socket.IO and Next.js integration`
