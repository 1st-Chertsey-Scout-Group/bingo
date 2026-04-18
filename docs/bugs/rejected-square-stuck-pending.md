# Rejected square retains orange "needs review" border on leader board

## Summary

After a leader rejects the last pending submission for a square, the square continues to display an orange "needs review" border but clicking it does nothing (no review modal opens), leaving the leader board in a stale visual state.

## Repro steps

1. **Role:** Scout (Team A) and Leader, both connected to an active game.
2. Scout photographs a nature item and submits it for a square (e.g. "Oak Leaf").
3. On the leader board, the "Oak Leaf" square shows an orange border indicating a pending submission.
4. Leader taps the square, opening the review modal.
5. Leader rejects the submission.
6. **Observed:** The review modal closes, but the square still shows the orange pulsing border (`needsReview` style). Clicking the square shows a toast "No photos to review for this square" but does not open a modal.
7. **Expected:** After rejecting the last submission, the square should return to its default unclaimed white style with no orange border.

## Root cause

The `hasPendingSubmissions` field on a `RoundItem` in client state is set to `true` when `square:pending` fires but is **never set back to `false`** on the reject path.

**Data flow on rejection of the last pending submission:**

1. Server handler `review:reject` at `src/server/socket/submission.ts:429-484` rejects the submission, finds no next pending submission (`nextSubmission` is null at line 475), releases the lock (line 479), and broadcasts `square:unlocked` (line 481).

2. The client receives `square:unlocked` at `src/hooks/useLeaderSocket.ts:83-87`, which dispatches `{ type: 'SQUARE_UNLOCKED', roundItemId }`.

3. The reducer case `SQUARE_UNLOCKED` at `src/hooks/useGameState.ts:74-86` sets `lockedByLeader: null` on the matching board item. It does **not** touch `hasPendingSubmissions`.

4. The `Square` component at `src/components/Square.tsx:53-56` computes `needsReview` as:

   ```ts
   role === 'leader' &&
     roundItem.hasPendingSubmissions &&
     isUnclaimed &&
     roundItem.lockedByLeader === null
   ```

   After `SQUARE_UNLOCKED`, `lockedByLeader` is `null` and `hasPendingSubmissions` is still `true` (stale), so `needsReview` evaluates to `true` and the orange border persists.

5. When the leader clicks the stale orange square, `review:open` fires. The server checks `pendingCount === 0` at `src/server/socket/submission.ts:213` and emits an error `'No pending submissions'`, which the client shows as a toast at `src/hooks/useLeaderSocket.ts:128`. No state change occurs.

The only reducer case that ever clears `hasPendingSubmissions` is `SQUARE_CLAIMED` at `src/hooks/useGameState.ts:34-52`. No event on the reject path does so.

**Verification method:** Static trace. Every claim is anchored to specific file:line references above. The control flow is linear and there is no alternative path that clears `hasPendingSubmissions` after rejection -- confirmed by searching for all assignments to `hasPendingSubmissions` in the reducer:

- `GAME_STARTED` (line 24): initial board load from server (server computes the value)
- `SQUARE_CLAIMED` (line 43): sets `false`
- `SQUARE_PENDING` (line 57-60): sets `true`
- `FULL_STATE` (line 147): wholesale state replacement on rejoin

None of these fire on the reject path when no submissions remain.

## Proposed fix

The server already broadcasts `square:unlocked` when the last submission is rejected. The minimal fix is to clear `hasPendingSubmissions` in the `SQUARE_UNLOCKED` reducer case:

```diff
--- a/src/hooks/useGameState.ts
+++ b/src/hooks/useGameState.ts
@@ -76,7 +76,7 @@
       return {
         ...state,
         board: state.board.map((item) =>
           item.roundItemId === action.roundItemId
-            ? { ...item, lockedByLeader: null }
+            ? { ...item, lockedByLeader: null, hasPendingSubmissions: false }
             : item,
         ),
         reviewingRoundItemId: clearReview ? null : state.reviewingRoundItemId,
```

**Why this works:** `square:unlocked` fires in exactly two scenarios:

1. Leader explicitly closes the review modal (`review:close` at `src/server/socket/submission.ts:257-285`). In this case there may still be pending submissions, so clearing `hasPendingSubmissions` would be premature.
2. The last pending submission is rejected (`review:reject` at line 477-482) -- the only case where no submissions remain.

Because scenario 1 can still have pending submissions, blindly clearing the flag in `SQUARE_UNLOCKED` would cause a false negative in that case.

**Better minimal fix:** Extend the `square:unlocked` payload from the server to include the pending status, so the client can set it accurately:

```diff
--- a/src/server/socket/submission.ts
+++ b/src/server/socket/submission.ts
@@ -38,8 +38,13 @@
 function broadcastSquareUnlocked(
   io: Server,
   gameId: string,
   roundItemId: string,
+  hasPendingSubmissions: boolean = true,
 ): void {
-  io.to(SOCKET_ROOMS.leaders(gameId)).emit('square:unlocked', { roundItemId })
+  io.to(SOCKET_ROOMS.leaders(gameId)).emit('square:unlocked', {
+    roundItemId,
+    hasPendingSubmissions,
+  })
 }
```

Then at the call site in `review:reject` (line 481):

```diff
-        broadcastSquareUnlocked(io, gameId, submission.roundItemId)
+        broadcastSquareUnlocked(io, gameId, submission.roundItemId, false)
```

And update the reducer and types:

```diff
--- a/src/types.ts
+++ b/src/types.ts
@@ -67,7 +67,7 @@
   | { type: 'SQUARE_PENDING'; roundItemId: string }
   | { type: 'SQUARE_LOCKED'; roundItemId: string; leaderName: string }
-  | { type: 'SQUARE_UNLOCKED'; roundItemId: string }
+  | { type: 'SQUARE_UNLOCKED'; roundItemId: string; hasPendingSubmissions: boolean }
```

```diff
--- a/src/hooks/useLeaderSocket.ts
+++ b/src/hooks/useLeaderSocket.ts
@@ -83,9 +83,13 @@
-    const handleSquareUnlocked = (payload: { roundItemId: string }) => {
+    const handleSquareUnlocked = (payload: {
+      roundItemId: string
+      hasPendingSubmissions: boolean
+    }) => {
       dispatch({
         type: 'SQUARE_UNLOCKED',
         roundItemId: payload.roundItemId,
+        hasPendingSubmissions: payload.hasPendingSubmissions,
       })
     }
```

```diff
--- a/src/hooks/useGameState.ts
+++ b/src/hooks/useGameState.ts
@@ -76,7 +76,10 @@
       return {
         ...state,
         board: state.board.map((item) =>
           item.roundItemId === action.roundItemId
-            ? { ...item, lockedByLeader: null }
+            ? {
+                ...item,
+                lockedByLeader: null,
+                hasPendingSubmissions: action.hasPendingSubmissions,
+              }
             : item,
         ),
```

This approach is accurate in all unlock scenarios. The default `true` for `broadcastSquareUnlocked` preserves existing behaviour for `review:close` and `review:approve` call sites.

## Related areas & regression risk

- **`review:close` handler** (`src/server/socket/submission.ts:257-285`): Also calls `broadcastSquareUnlocked`. The default parameter `true` keeps current behaviour, but verify this call site still works correctly -- a leader closing the modal when submissions are pending should keep the orange border.
- **`review:approve` handler** (`src/server/socket/submission.ts:405`): Calls `broadcastSquareUnlocked` after claiming. This is followed immediately by `square:claimed` which sets `hasPendingSubmissions: false`, so the flag value in `square:unlocked` is irrelevant here (claimed squares ignore it). Still, passing `false` would be more correct.
- **`rejoin:state` handler** (`src/hooks/useSocketHandlers.ts:81-93`): Receives a full state snapshot including `hasPendingSubmissions` from the server. Verify the server-side rejoin builder correctly computes this field from DB state (if it does, rejoin would mask the bug by resetting to correct values).
- **Scout board**: Scouts also render `Square` but `needsReview` is gated on `role === 'leader'`, so scouts are unaffected. However, scouts see `hasPendingSubmissions` in their state too -- confirm no scout-side rendering depends on it.
- **Reducer test** (`src/lib/game-logic.test.ts`): Should add a test case for `SQUARE_UNLOCKED` verifying that `hasPendingSubmissions` is set from the action payload.
