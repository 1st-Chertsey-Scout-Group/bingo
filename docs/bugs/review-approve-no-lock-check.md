# `review:approve` does not verify the caller holds the lock

**Severity.** Medium.

**Symptom.** A leader whose lock on a square has already been released
(by the 30-second disconnect timeout, or by another leader taking over)
can still approve the submission they had open in their browser.
Approval happens even though the square's current
`roundItem.lockedByLeader` names a different leader — or is `null`.

**Location.** `src/server/socket/submission.ts:275-330`

## Root cause

The `review:approve` transaction reads the `submission` and its
`roundItem`, checks `claimedByTeamId !== null` to guard against a lost
race, and either discards or approves. It does not compare
`roundItem.lockedByLeader` against `leaderName` at any point.

Contrast with `review:close` at `src/server/socket/submission.ts:244`
which correctly refuses to proceed if
`roundItem.lockedByLeader !== leaderName`.

## Failing trace

1. Leader A emits `review:open` on square X, locks it, and receives
   team T's photo in the modal.
2. Leader A's browser stalls, screen is locked, connection drops.
3. 30 seconds later the lock timeout
   (`src/server/socket-handler.ts:38-57`) clears
   `lockedByLeader` on square X.
4. Leader B emits `review:open` on X, takes the lock, sees team T's
   photo, rejects it. Auto-promoted submission is team U's photo.
5. Leader A reconnects. Their browser still has team T's submission
   open. They click Approve. The request hits `review:approve`.
6. Transaction at `:275-330`: submission exists (team T's, still
   `status: 'rejected'` — wait, leader B rejected it, so it's no
   longer pending; the transaction approves it anyway because nothing
   checks status either — **separate bug worth flagging**). Square
   gets claimed by team T despite leader B's active review of team U.

Variant: if team T's submission was _not_ the one leader B rejected —
say leader B rejected team U instead — team T's submission is still
`pending` and leader A's approval succeeds, bypassing leader B's lock.

## Fix direction

Inside the transaction, read `roundItem.lockedByLeader` and refuse the
approval if it does not equal `leaderName`. Additionally, refuse if
`submission.status !== 'pending'` — currently the handler does not
check, so stale buttons on the leader's UI can re-approve a rejected
submission.

Related: [review-reject-no-lock-check.md](review-reject-no-lock-check.md)
has the same shape for the reject path.
