# Step 121: Implement review:close Handler

## Description
Implement the server-side `review:close` handler that releases a leader's lock on a square when they dismiss the review modal without approving or rejecting.

## Requirements
- Listen for `review:close` event with payload `{ roundItemId }`
- Validate: round item exists, `lockedByLeader` matches the requesting leader
- Clear `lockedByLeader` and `lockedAt` fields on the RoundItem via Prisma update
- Emit `square:unlocked` to `leaders:{gameId}` room with `{ roundItemId }`
- No changes to any Submission records — pending submissions remain in the queue for another leader to review

## Files to Create/Modify
- `src/server/socket/submission.ts` — Add `review:close` handler with lock clearing and unlock emission

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: Dismissing the modal releases the lock on the round item
- **Check**: Other leaders see the square become unlocked (returns to needs-review state if pending submissions exist)
- **Check**: Pending submissions are NOT affected by the close action
- **Command**: `npx prisma studio` — verify lockedByLeader is null after close

## Commit
`feat(server): implement review:close to release square lock on modal dismiss`
