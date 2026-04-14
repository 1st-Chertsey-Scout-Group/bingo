# Step 078: Wire lobby:teams Socket Event in ScoutGame

## Description
Connect the `lobby:teams` socket event to the ScoutGame component so the lobby updates in real time as new scouts join. This keeps the team list fresh for all connected clients.

## Requirements
- In `src/components/ScoutGame.tsx`, add a `useEffect` that listens for the `lobby:teams` socket event
- Event payload shape: `{ teams: Team[] }` where `Team = { id: string, name: string, colour: string }`
- On receive, dispatch a `LOBBY_TEAMS` action to the game state reducer
- Add `LOBBY_TEAMS` action to the game state reducer in the appropriate file:
  - Action payload: `{ teams: Team[] }`
  - Reducer sets `state.teams = action.teams`
- The Lobby component receives `teams` from state and re-renders automatically
- Clean up the socket listener on unmount (return cleanup function from useEffect)
- When ScoutGame status is `'lobby'`, render the Lobby component with `myTeam={state.myTeam}`, `teams={state.teams}`, `role="scout"`

## Files to Create/Modify
- `src/components/ScoutGame.tsx` — add `lobby:teams` listener and render Lobby
- Game state reducer file — add `LOBBY_TEAMS` action handling

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: When a new scout joins, all existing scouts see the updated team list
- **Check**: The Lobby component re-renders with the new teams array
- **Check**: Socket listener is cleaned up on component unmount
- **Command**: `npx tsc --noEmit`

## Commit
`feat(socket): wire lobby:teams event to scout game state`
