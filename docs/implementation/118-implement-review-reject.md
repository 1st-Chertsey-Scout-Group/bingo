# Step 118: Implement review:reject Handler

## Description

Implement the server-side `review:reject` handler that rejects a submission and either promotes the next queued submission or releases the lock if the queue is empty.

## Requirements

- Listen for `review:reject` event with payload `{ submissionId }`
- Update the Submission record: set `status = 'rejected'`
- Load the submission to get `teamId` and `roundItemId`
- Emit `submission:rejected` to `team:{teamId}` room with `{ roundItemId }`
- Find the next pending submission for this round item: `WHERE roundItemId = X AND status = 'pending' ORDER BY position ASC LIMIT 1`
- **If next found**: Emit `review:submission` to the reviewing leader's socket with the new `SubmissionForReview` payload (modal stays open, next photo shown)
- **If none found**: Clear `lockedByLeader` and `lockedAt` on the RoundItem. Emit `square:unlocked` to `leaders:{gameId}` room with `{ roundItemId }` (modal closes on client)

## Files to Create/Modify

- `src/server/socket/submission.ts` — Add `review:reject` handler with queue promotion logic

## Checklist

- [x] Implemented
- [x] Verified

## Verification

- **Check**: Rejecting a submission sets its status to 'rejected'
- **Check**: The submitting team receives `submission:rejected`
- **Check**: If more submissions are queued, the next one is sent to the leader automatically
- **Check**: If no more submissions are queued, the lock is released and `square:unlocked` is emitted
- **Command**: `npx prisma studio` — verify submission statuses after reject

## Commit

`feat(server): implement review:reject with queue promotion and lock release`
