# Step 145: Handle Between-Rounds Rejoin Edge Case

## Description

Handle the edge case where a scout tries to rejoin between rounds. When the game transitions to lobby state between rounds, team assignments from the previous round are no longer valid. The scout must re-enter through the lobby for fresh team assignment.

## Requirements

- In the server `rejoin` handler (scout path), add validation for the between-rounds state:
  1. If the game status is `lobby` (between rounds or before first round):
     - The cached `teamId` from the previous round will not match any team in the current/upcoming round
     - Emit `rejoin:error` with `{ message: "Round has ended — please rejoin" }`
  2. More specifically: if the team's `roundId` does not match the game's current active round (or there is no active round), treat it as invalid
- This is already partially covered by the "team not in current round" validation in step 136, but ensure the error message is user-friendly for this specific case
- On the client side (already handled by step 140): `rejoin:error` clears localStorage and redirects to `/`, where the scout can re-enter the game PIN and join the lobby for fresh team assignment
- Also ensure the `game:lobby` event handler (from step 135) clears `teamId` from localStorage — so if the scout is still connected when the round ends, their cache is updated and they won't attempt a stale rejoin

## Files to Create/Modify

- `src/server/socket/lobby.ts` — Ensure the rejoin handler returns a clear error message when a scout tries to rejoin during lobby/between-rounds state

## Checklist

- [ ] Implemented
- [ ] Verified

## Verification

- **Check**: Round ends, scout refreshes page during lobby phase — receives `rejoin:error`, redirected to landing page
- **Check**: Scout can re-enter game PIN and join lobby normally after being redirected
- **Check**: If scout is still connected when round ends, `teamId` is cleared from localStorage (no stale rejoin attempted on next refresh)
- **Check**: Scout who refreshes during an active round still rejoins successfully (no false positives)

## Commit

`fix(rejoin): return clear error when scout attempts rejoin between rounds`
