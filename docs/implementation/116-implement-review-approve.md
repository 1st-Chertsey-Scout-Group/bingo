# Step 116: Implement review:approve Handler

## Description

Implement the server-side `review:approve` handler that claims a square for the submitting team. Uses a Prisma transaction to prevent race conditions where two squares could be claimed simultaneously.

## Requirements

- Listen for `review:approve` event with payload `{ submissionId, leaderName }`
- Run a Prisma transaction (`prisma.$transaction`):
  a. Load the Submission record (include roundItem and team relations)
  b. Check `RoundItem.claimedByTeamId` — if NOT null, the race was lost: set submission status to 'discarded', emit `submission:discarded` to `team:{teamId}` with `{ roundItemId, reason: 'already_claimed' }`, and return
  c. Update `RoundItem.claimedByTeamId` = submission.teamId, also set `claimedByTeamName` and `claimedByTeamColour` from the team record
  d. Update submission: `status = 'approved'`, `reviewedBy = leaderName`
  e. Clear lock fields: `lockedByLeader = null`, `lockedAt = null`
- All database operations within the transaction for atomicity

## Files to Create/Modify

- `src/server/socket/submission.ts` — Add `review:approve` handler with Prisma transaction containing all validation and mutation logic

## Checklist

- [ ] Implemented
- [ ] Verified

## Verification

- **Check**: Approving a submission sets `claimedByTeamId`, `claimedByTeamName`, and `claimedByTeamColour` on the RoundItem
- **Check**: The submission status is set to 'approved' with the reviewedBy field
- **Check**: Lock fields are cleared on the RoundItem
- **Check**: If a race condition occurs (square claimed between open and approve), submission is set to 'discarded'
- **Command**: `npx prisma studio` — verify RoundItem and Submission records after approval

## Commit

`feat(server): implement review:approve with Prisma transaction for atomic claim`
