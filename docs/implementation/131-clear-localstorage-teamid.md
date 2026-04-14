# Step 131: Clear localStorage teamId on Lobby Return

## Description

When clients receive the `game:lobby` event, clear the stored teamId from localStorage. This ensures scouts must re-join the lobby for fresh team assignment in the new round, preventing stale team associations.

## Requirements

- In both ScoutGame and LeaderGame, when the `GAME_LOBBY` action is dispatched (triggered by `game:lobby` socket event):
  - Remove `teamId` from localStorage (e.g. `localStorage.removeItem('teamId')`)
- This can be done in the component's effect that handles the `game:lobby` event, or in the reducer's side-effect logic
- Scouts must re-join the lobby to get a fresh team assignment for the next round
- Leaders don't have a teamId in localStorage, but clearing is a no-op safeguard

## Files to Create/Modify

- `src/components/ScoutGame.tsx` — In the `game:lobby` event handler, call `localStorage.removeItem('teamId')` before or after dispatching GAME_LOBBY
- `src/components/LeaderGame.tsx` — In the `game:lobby` event handler, call `localStorage.removeItem('teamId')` as a safeguard

## Checklist

- [ ] Implemented
- [ ] Verified

## Verification

- **Check**: After receiving `game:lobby`, `localStorage.getItem('teamId')` returns null
- **Check**: Scouts returning to the lobby are prompted to join (not auto-assigned to their old team)
- **Command**: In browser devtools, check `localStorage.getItem('teamId')` is null after round reset

## Commit

`feat(client): clear teamId from localStorage on game:lobby for fresh team assignment`
