# Step 123: Display Lock Status on Leader Board

## Description

Listen for `square:locked` and `square:unlocked` socket events on the leader client and update the board to reflect which squares are currently being reviewed by which leaders.

## Requirements

- In LeaderGame, listen for `square:locked` event with payload `{ roundItemId, leaderName }`
- Dispatch `SQUARE_LOCKED` action: set `lockedByLeader = leaderName` on the matching board item
- Listen for `square:unlocked` event with payload `{ roundItemId }`
- Dispatch `SQUARE_UNLOCKED` action: set `lockedByLeader = null` on the matching board item
- Board re-renders: locked squares show dimmed with leader name (step 111 styling), unlocked squares return to base state
- Both listeners should be active whenever the game is in 'active' status
- Clean up listeners on unmount

## Files to Create/Modify

- `src/components/LeaderGame.tsx` — Add socket listeners for `square:locked` and `square:unlocked`, dispatch corresponding actions
- `src/hooks/useGameReducer.ts` — Ensure SQUARE_LOCKED and SQUARE_UNLOCKED cases update `lockedByLeader` on the correct board item

## Checklist

- [x] Implemented
- [x] Verified

## Verification

- **Check**: When a leader locks a square, all other leaders see it dimmed with the leader's name
- **Check**: When a lock is released, the square returns to its previous visual state (needs-review if pending, unclaimed otherwise)
- **Check**: Lock events from the current leader's own actions also update the board correctly

## Commit

`feat(client): display square lock status from square:locked and square:unlocked events`
