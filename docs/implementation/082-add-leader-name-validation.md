# Step 082: Add Leader Name Duplicate Validation

## Description

Prevent two leaders from joining with the same display name. This avoids confusion when multiple leaders are reviewing submissions, since the leader name is shown on locked squares.

## Requirements

- In the leader `lobby:join` handler in `src/server/socket/lobby.ts`, after PIN validation:
  - Check if another currently connected socket in the `leaders:{gameId}` room has the same `leaderName` (case-insensitive comparison)
  - Approach: iterate sockets in the `leaders:{gameId}` room via `io.in(\`leaders:${gameId}\`).fetchSockets()`, check `socket.data.leaderName`
  - If a duplicate name is found, emit error back to the joining socket: `{ error: "That leader name is already in use" }`
  - Do not join the socket to any rooms; return early
- Trim and compare names case-insensitively (`name.trim().toLowerCase()`)

## Files to Create/Modify

- `src/server/socket/lobby.ts` — add duplicate leader name check before room join

## Checklist

- [x] Implemented
- [x] Verified

## Verification

- **Check**: First leader with name "Alice" joins successfully
- **Check**: Second leader with name "Alice" (or "alice") receives duplicate name error
- **Check**: Second leader with name "Bob" joins successfully
- **Check**: After "Alice" disconnects, a new leader can join with name "Alice"

## Commit

`feat(socket): validate unique leader names on lobby join`
