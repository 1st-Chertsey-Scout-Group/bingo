# `review:reject` does not verify the caller holds the lock

**Severity.** Medium.

**Symptom.** A leader whose lock on a square has already been released
or transferred can still reject the pending submission they had open.
The reject succeeds, and the auto-promoted next submission is sent to
the rejecting leader — not to the leader who currently holds the lock.

**Location.** `src/server/socket/submission.ts:402-474`

## Root cause

`review:reject` looks up the submission, updates it to `rejected`,
emits `submission:rejected` to the team, then finds the next pending
submission and either auto-promotes it (to the rejecting leader's
socket, line 452) or clears the lock.

It does not read `roundItem.lockedByLeader` or compare it to
`leaderName`. The lock exclusivity invariant — "only the leader who
holds the lock can make review decisions on that square" — is not
enforced on this path.

## Failing trace

1. Leader A locks square X, sees team T's photo.
2. Lock times out (30 s disconnect, or leader B takes over via
   `review:open` after a stale lock scenario).
3. Leader A's UI is stale but still emits `review:reject` on the
   submission.
4. Handler updates team T's submission to `rejected` and broadcasts
   `submission:rejected` to team T.
5. `findFirst` for the next pending submission returns (say) team U's
   submission. `socket.emit('review:submission', ...)` at `:452-459`
   sends that submission to leader A — not to leader B who actually
   holds the lock. Leader A now has team U's photo open in the modal
   and can approve or reject it, again without any lock check.

## Fix direction

Before running the reject, read `roundItem.lockedByLeader` and refuse
if it does not equal `leaderName`. If the handler is changed to emit
the auto-promoted submission to the current lock holder rather than
to `socket`, two leaders reviewing at once stops being possible.

Related: [review-approve-no-lock-check.md](review-approve-no-lock-check.md)
(same defect on the approve path).
