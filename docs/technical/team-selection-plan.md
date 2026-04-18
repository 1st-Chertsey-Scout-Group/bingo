# Team Selection in Lobby

## Context

Currently scouts are auto-assigned a random team on join. We want to let scouts swap to a different team while in the lobby, and let leaders lock team selection to stop swapping.

## Current Flow

1. Scout enters game PIN on landing page
2. Server receives `lobby:join`, calls `pickRandomUnusedTeam()` inside `withGameMutex()`
3. Creates a `Team` row in DB with `socketId` and `sessionTokenHash`
4. Emits `lobby:joined` to the scout with `{ teamId, teamName, teamColour, sessionToken }`
5. Broadcasts `lobby:teams` to all clients with updated team list
6. Scout lobby shows their assigned team name/colour + list of all teams as badges

Key constraint: `@@unique([gameId, name])` on Team — no duplicate team names per game.

## Proposed Changes

### New Socket Events

| Event           | Direction        | Payload                                          | Purpose                                    |
| --------------- | ---------------- | ------------------------------------------------ | ------------------------------------------ |
| `team:switch`   | client -> server | `{ targetTeamName: string }`                     | Scout requests to swap to a different team |
| `team:switched` | server -> client | `{ teamId, teamName, teamColour, sessionToken }` | Confirms swap, provides new session token  |
| `team:locked`   | server -> all    | `{ locked: boolean }`                            | Leader toggled team lock state             |
| `team:lock`     | client -> server | `{ locked: boolean }`                            | Leader requests lock toggle                |

### Server Changes (`src/server/socket/lobby.ts`)

**`team:switch` handler:**

1. Validate game is in LOBBY status
2. Check team selection is not locked (new field on Game model or in-memory)
3. Validate target team name is in the preset list (`TEAM_NAMES` from teams.ts)
4. Validate target team name is not already taken (no existing Team row with that name in this game)
5. Wrap in `withGameMutex()` to prevent race conditions
6. Delete old Team row
7. Create new Team row with new name/colour, same socketId, new sessionToken
8. Emit `team:switched` to the scout (same shape as `lobby:joined`)
9. Broadcast `lobby:teams` to all clients

**`team:lock` handler:**

1. Validate caller is a leader (`requireLeaderContext`)
2. Validate game is in LOBBY status
3. Toggle lock state (store on Game model: `teamsLocked Boolean @default(false)`)
4. Broadcast `team:locked` to all clients in game

**Modify `lobby:join` handler:**

- After creating team, also emit current lock state to the joining scout

### Database Changes (`prisma/schema.prisma`)

Add to Game model:

```prisma
teamsLocked Boolean @default(false)
```

### Client Changes

**`src/hooks/useScoutSocket.ts`:**

- Add handler for `team:switched` — update session in localStorage, dispatch state update
- Add handler for `team:locked` — dispatch to store lock state

**`src/hooks/useGameState.ts`:**

- Add `teamsLocked: boolean` to `GameState`
- Add actions: `TEAM_SWITCHED`, `TEAMS_LOCKED`

**`src/components/Lobby.tsx` (scout view):**

- Below the current "You are: Team Name" card, show a list of available teams
- Each team shown as a tappable card/button with name + colour swatch
- Already-taken teams shown greyed out / disabled
- Current team highlighted
- When `teamsLocked` is true, disable all swap buttons + show "Teams locked by leader" message

**`src/components/Lobby.tsx` (leader view):**

- Add a "Lock Teams" toggle button in the lobby controls area
- When locked, button shows "Unlock Teams"
- Emits `team:lock` on toggle

### Edge Cases

- **Scout swaps while another scout joins the same target**: `withGameMutex()` serializes, second request fails with "Team already taken"
- **Leader locks while scout is mid-swap**: Lock check inside mutex, swap rejected
- **Scout disconnects after swap**: Same as current — team deleted in lobby disconnect handler
- **Rejoin after swap**: Session has new teamId/token, rejoin works as normal

## Files to Modify

- `prisma/schema.prisma` — add `teamsLocked` to Game
- `src/server/socket/lobby.ts` — add `team:switch` and `team:lock` handlers, modify `lobby:join`
- `src/hooks/useScoutSocket.ts` — add `team:switched` and `team:locked` handlers
- `src/hooks/useLeaderSocket.ts` — add `team:locked` handler
- `src/hooks/useGameState.ts` — add state + actions
- `src/components/Lobby.tsx` — team picker UI for scouts, lock toggle for leaders
- `src/types.ts` — add new GameAction variants
- `src/lib/teams.ts` — may need to export `TEAM_NAMES` for client-side display
