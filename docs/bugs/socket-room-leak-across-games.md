# Socket rooms leak across games within a single connection

**Severity.** Medium.

**Symptom.** A single browser tab that navigates between games (e.g.
leader joins game A, then visits `/leader/B` without closing the tab)
accumulates `game:*` rooms on the underlying Socket.IO connection.
Handlers that resolve the current game from socket rooms pick a room
non-deterministically and can act against the wrong game.

**Locations.**

- `src/server/socket/submission.ts:14-21` — `getGameIdFromSocket`
- `src/server/socket/lobby.ts:70-71, 124, 225, 317-318` — sites that call `socket.join('game:<id>')`
- `src/server/socket/lobby.ts:293-377` — leader rejoin (does not call `socket.leave` for prior game rooms)
- `src/lib/socket.ts:3-18` — shared singleton socket across route changes

## Root cause

`useSocket` returns a module-level singleton (`src/lib/socket.ts`), so
a client that navigates between `/leader/A` and `/leader/B` without a
hard reload keeps the same underlying Socket.IO connection. Lobby-join
and rejoin handlers call `socket.join` for the new game but never call
`socket.leave` for the previous one. After navigating A → B the socket
is a member of both `game:A` and `game:B`.

`submission.ts` resolves the current game via `getGameIdFromSocket`,
which walks `socket.rooms` and returns the first match. Iteration
order over a `Set` is insertion order, so it returns `game:A` until
that room is explicitly left. `game.ts` handlers use
`socket.data.gameId` instead (set at `lobby.ts:320`), which _is_
overwritten on rejoin — so the two sources of truth disagree.

## Failing trace

1. Leader navigates to `/leader/A`, `rejoin` joins `game:A`,
   `socket.data.gameId = 'A'`.
2. Leader clicks a link / types URL / uses the back button to reach
   `/leader/B` without reloading.
3. `LeaderGame` emits `rejoin` for game B; `lobby.ts:317-320` joins
   `game:B`, `socket.data.gameId = 'B'`. Socket is now in both rooms.
4. Leader emits `review:open` for a square in game B.
   `getGameIdFromSocket` at `submission.ts:14-21` returns `'A'`.
   Handler validates `roundItem.gameId !== gameId` at
   `submission.ts:134` and emits `Invalid round item`. Review is
   rejected.

The immediate user-visible impact is that in-tab navigation between
games breaks reviews. Depending on which handler uses which lookup
style, other edge cases can produce cross-game event leaks.

## Fix direction

Pick a single source of truth. `socket.data.gameId` is already the
canonical value written at every join path; rewrite
`getGameIdFromSocket` to return `socket.data.gameId`. Likewise, make
every rejoin and lobby-join path call `socket.leave` for any
pre-existing `game:*`, `team:*`, and `leaders:*` rooms before joining
the new ones.
