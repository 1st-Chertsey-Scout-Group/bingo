# No way to end a game -- games persist indefinitely

## Summary

Once a game is created, there is no "end game" button accessible from the lobby screen. Games remain in LOBBY or ACTIVE status indefinitely, allowing scouts to connect hours or days later. The only way a game transitions to ENDED is via the "End Round" button during an active round, or when all squares are claimed.

## Repro steps

1. **Role:** Leader.
2. Create a new game via the admin panel.
3. Open the leader view. Note the lobby screen with team list and board config.
4. Start a round, then end the round using "End Round" in the round header.
5. The leader sees the "Round Over" summary screen with a "New Round" button.
6. Click "New Round" -- returns to lobby.
7. Close the browser tab.
8. Hours later, open the game URL again.
9. **Observed:** The game is still in LOBBY status. Scouts can still join. There is no button to end the game permanently or close it to new connections.
10. **Expected:** The leader should have an "End Game" button on the lobby screen to permanently close the game.

## Root cause

### Missing UI control

The leader lobby screen is rendered by `src/components/Lobby.tsx` which delegates to either `LeaderLobbyConfig` or `LeaderBoardPreview` depending on whether a preview board exists. Neither component has an "End Game" or "Close Game" button.

- `src/components/LeaderLobbyConfig.tsx` -- contains team list, board config, "Preview Board" button, team lock toggle. No end game control.
- `src/components/LeaderBoardPreview.tsx` -- contains board preview, "Start Round" button, "Regenerate" button. No end game control.
- `src/components/Lobby.tsx:92-136` -- the leader branch of the Lobby component has no end game affordance.

### The "End Round" button only exists during active play

The "End Round" button at `src/components/RoundHeader.tsx:65-89` only renders when the game status is `ACTIVE` (inside the `LeaderGame`'s `GAME_STATUS.ACTIVE` case at `src/components/LeaderGame.tsx:139-169`).

### The ENDED state is only reachable through round end

The game state machine has these transitions:

- `LOBBY -> ACTIVE` via `game:start` (`src/server/socket/game.ts:241-378`)
- `ACTIVE -> ENDED` via `game:end` (`src/server/socket/game.ts:381-393`) or auto-end when all squares claimed (`submission.ts:416-428`)
- `ENDED -> LOBBY` via `game:newround` (`src/server/socket/game.ts:395-427`)

There is **no** `LOBBY -> ENDED` transition. A game that returns to LOBBY via "New Round" can only be ended by starting another round and ending it.

### The server handler exists but is gated on ACTIVE

The `game:end` handler at `src/server/socket/game.ts:381-393` checks `game.status !== GAME_STATUS.ACTIVE` and rejects the request if the game is in LOBBY:

```ts
if (!game || game.status !== GAME_STATUS.ACTIVE) {
  socket.emit('error', { message: 'Game is not active' })
  return
}
```

**Verification method:** Static trace. No "end game" button exists in any lobby-state component. The `game:end` server handler rejects non-ACTIVE games.

## Proposed fix

### 1. Add an "End Game" button to the leader lobby

```diff
--- a/src/components/Lobby.tsx
+++ b/src/components/Lobby.tsx
@@ -19,6 +19,7 @@
   onStartRound?: () => void
   onClearPreview?: () => void
   onSwitchTeam?: (teamName: string) => void
   onToggleTeamLock?: (locked: boolean) => void
+  onEndGame?: () => void
 }
```

Add the button to both `LeaderLobbyConfig` and `LeaderBoardPreview`, with a confirmation dialog similar to the "End Round" dialog in `RoundHeader.tsx:65-89`.

### 2. Allow `game:end` from LOBBY status

```diff
--- a/src/server/socket/game.ts
+++ b/src/server/socket/game.ts
@@ -381,8 +381,8 @@
   socket.on('game:end', async () => {
     const ctx = requireLeaderContext(socket)
     if (!ctx) return
     const { gameId } = ctx

     const game = await prisma.game.findUnique({ where: { id: gameId } })
-    if (!game || game.status !== GAME_STATUS.ACTIVE) {
-      socket.emit('error', { message: 'Game is not active' })
+    if (!game || game.status === GAME_STATUS.ENDED) {
+      socket.emit('error', { message: 'Game has already ended' })
       return
     }
```

### 3. Wire the button in LeaderGame

```diff
--- a/src/components/LeaderGame.tsx
+++ b/src/components/LeaderGame.tsx
@@ -81,6 +81,11 @@
   const handleEndRound = useCallback(() => {
     if (!socket) return
     socket.emit('game:end', {})
   }, [socket])

+  const handleEndGame = useCallback(() => {
+    if (!socket) return
+    socket.emit('game:end', {})
+  }, [socket])
```

Pass `onEndGame={handleEndGame}` to the `<Lobby>` component in the LOBBY case.

## Related areas & regression risk

- The `endGame` function at `src/server/socket/game.ts:35-69` calls `sweepOrphanUploads` and broadcasts `game:ended`. When called from LOBBY status, there will be no round items or submissions to sweep, which is fine -- the sweep queries return empty results.
- The `game:newround` handler at `game.ts:395-427` deletes all teams, round items, and submissions, then transitions to LOBBY. If "End Game" is pressed from this LOBBY state, the `endGame` function will emit `game:ended` with an empty summary, which the client handles correctly (empty leaderboard).
- The `lobby:join` handler at `lobby.ts:83-88` filters games by `status: { not: GAME_STATUS.ENDED }`. Once a game is ended, new scouts cannot join -- this is the desired behaviour.
- Consider also adding an auto-expire mechanism for games that have been in LOBBY for more than N hours without activity, as a defence against forgotten games.
