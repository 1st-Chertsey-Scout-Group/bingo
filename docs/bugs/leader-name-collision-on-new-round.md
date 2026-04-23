# Leader sees "That leader name is already in use" on new round transition

## Summary

When a leader starts a new round from the "Round Over" screen, the server rejects the automatic lobby re-join with "That leader name is already in use" because the `lobby:join` handler does not exclude the calling socket when checking for duplicate leader names.

## Repro steps

1. **Role:** Leader. **Precondition:** A game exists with at least one team; the leader "Tim" is connected.
2. Play a round to completion; the leader ends the game (reaching the "Round Over" / ended screen).
3. The leader clicks "New Round."
4. **Observed:** The activity log shows the error "That leader name is already in use." The leader is not re-admitted to the lobby.
5. **Expected:** The leader seamlessly returns to the lobby under the same name without error.

## Root cause

The `game:newround` server handler (`src/server/socket/game.ts:395-426`) transitions the game back to `LOBBY` status and emits `game:lobby` to all sockets in the game room, but it does **not** remove leader sockets from the `leaders:{gameId}` room beforehand.

When the client receives `game:lobby`, the `handleGameLobby` handler in `src/hooks/useLeaderSocket.ts:120-133` re-emits `lobby:join` with the cached `leaderName`:

```typescript
// useLeaderSocket.ts:130-132
if (leaderName) {
  socket.emit('lobby:join', { gamePin, leaderPin, leaderName })
}
```

The server-side `lobby:join` handler at `src/server/socket/lobby.ts:118` calls `isLeaderNameTaken` **without** passing the current socket's ID as the exclusion parameter:

```typescript
// lobby.ts:118
if (await isLeaderNameTaken(io, game.id, leaderName)) {
```

Compare this to the `rejoin` handler at `src/server/socket/lobby.ts:341`, which correctly excludes the calling socket:

```typescript
// lobby.ts:341
if (await isLeaderNameTaken(io, game.id, leaderName, socket.id)) {
```

The `isLeaderNameTaken` function at `src/lib/socket-helpers.ts:85-104` iterates all sockets in the `leaders:{gameId}` room. Since the calling socket is still in that room (it was never removed), and `excludeSocketId` is `undefined`, the condition `remote.id !== excludeSocketId` evaluates to `true` for every socket -- including the caller. The function finds the caller's own `socket.data.leaderName` and returns `true`, causing the "That leader name is already in use" error at `lobby.ts:119-122`.

The error is emitted on the `error` event (not `rejoin:error`), so it is caught by `handleServerError` at `src/hooks/useLeaderSocket.ts:171-189`, which logs it with `LOG_CATEGORY.ERROR` and shows a toast.

**Verification method:** Static trace. The data flow is:

1. `game:newround` handler (`game.ts:425`) emits `game:lobby` while socket remains in `leaders:{gameId}` room.
2. Client `handleGameLobby` (`useLeaderSocket.ts:131`) emits `lobby:join`.
3. Server `lobby:join` (`lobby.ts:118`) calls `isLeaderNameTaken(io, game.id, leaderName)` -- no `excludeSocketId`.
4. `isLeaderNameTaken` (`socket-helpers.ts:98-103`) matches the caller against itself.
5. `lobby.ts:119` emits `{ message: 'That leader name is already in use' }`.

## Proposed fix

Pass `socket.id` as the fourth argument to `isLeaderNameTaken` in the `lobby:join` handler, matching the pattern already used by the `rejoin` handler:

```diff
--- a/src/server/socket/lobby.ts
+++ b/src/server/socket/lobby.ts
@@ -115,7 +115,7 @@
           return
         }

-        if (await isLeaderNameTaken(io, game.id, leaderName)) {
+        if (await isLeaderNameTaken(io, game.id, leaderName, socket.id)) {
           socket.emit('error', {
             message: 'That leader name is already in use',
           })
```

This fix is correct because a socket re-joining the lobby under its own name is not a conflict -- it is the same leader reconnecting. The `excludeSocketId` parameter exists precisely for this scenario and is already used correctly in the `rejoin` path. The uniqueness check still protects against two _different_ sockets using the same leader name.

## Related areas & regression risk

- **`game:newround` room cleanup (`src/server/socket/game.ts:395-426`):** The handler does not remove sockets from game/leader rooms before re-entering the lobby flow. This is arguably a second issue -- the `leaveGameRooms` call at `lobby.ts:125` handles it on re-join, but the window between `game:lobby` emission and `lobby:join` processing leaves stale room membership. A more defensive fix would also clear the leaders room in `game:newround`, but the proposed one-line fix is sufficient and minimal.
- **Multiple leaders in the same game:** If two leaders are connected and both receive `game:lobby`, they both re-emit `lobby:join` concurrently. Because `isLeaderNameTaken` reads live socket state (not a database), concurrent calls should not race -- each socket excludes only itself. However, this has not been tested under concurrency.
- **`handleGameLobby` in `src/hooks/useScoutSocket.ts`:** The scout equivalent of this handler likely re-emits `lobby:join` as well. Since scouts do not have a `leaderName` check, this path is not affected by this specific bug, but it should be verified during fix review.
- **Activity log feature:** The error appears in the activity log via `handleServerError` (`useLeaderSocket.ts:171-189`). No change needed there -- the fix prevents the error from occurring in the first place.
- **`lock-timeout-name-collision.md` (existing bug report):** Documents a related issue where lock timeouts use leader names as keys, which can collide. The same `isLeaderNameTaken` function is involved. A fix to this bug should not regress that one, as the change only adds an exclusion rather than removing the check.
