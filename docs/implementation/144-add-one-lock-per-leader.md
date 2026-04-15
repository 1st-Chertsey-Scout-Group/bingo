# Step 144: Enforce One Lock Per Leader

## Description

Ensure a leader can only hold one lock at a time. If a leader opens a review modal for a new square while already holding a lock on another, the old lock is automatically released. This prevents a leader from accidentally blocking multiple squares.

## Requirements

- In the `review:open` (or equivalent lock-acquisition) handler on the server:
  1. Before granting the new lock, query the database for any RoundItem where `lockedByLeader` matches this leader's identifier in the current round
  2. If an existing lock is found on a **different** square:
     - Clear `lockedByLeader` and `lockedAt` on the old RoundItem
     - Emit `square:unlocked` to the leaders room with the old square/RoundItem ID
  3. Then grant the new lock as normal (set `lockedByLeader` and `lockedAt` on the requested RoundItem)
- If the leader is re-locking the **same** square they already hold, just refresh `lockedAt` — no unlock needed
- This is a server-side enforcement — the client does not need to track lock state for this rule

## Files to Create/Modify

- `src/server/socket/handlers.ts` (or the file containing the `review:open` handler) — Add pre-lock check to release any existing lock held by the same leader

## Checklist

- [x] Implemented
- [x] Verified

## Verification

- **Check**: Leader locks square A, then opens square B — square A is unlocked (other leaders see it), square B is locked
- **Check**: Leader locks square A, then re-opens square A — lock is refreshed, no unlock emitted
- **Check**: Two leaders can each hold one lock simultaneously on different squares
- **Check**: `square:unlocked` event is emitted for the old square when a leader switches to a new one

## Commit

`feat(socket): enforce one lock per leader by releasing old lock on new review:open`
