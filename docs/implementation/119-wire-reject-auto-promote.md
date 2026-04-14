# Step 119: Wire Reject Auto-Promote on Client

## Description
Handle the case where after rejecting a submission, the server sends another `review:submission` event with the next queued photo. The ReviewModal stays open and seamlessly transitions to the new submission.

## Requirements
- In LeaderGame, the `review:submission` socket listener (set up in step 115) already handles incoming submissions
- When a reject triggers a new `review:submission` event, dispatch `REVIEW_PROMOTED` with the new submission data
- The ReviewModal updates its displayed photo, team name, and team colour automatically via props/state change
- No additional user action needed — the transition should be seamless
- The `onReject` callback in LeaderGame emits `review:reject` with `{ submissionId }` to the server
- The leader sees the next photo immediately without the modal closing and reopening

## Files to Create/Modify
- `src/components/LeaderGame.tsx` — Wire the onReject callback to emit `review:reject`. Ensure the existing `review:submission` listener updates state, causing ReviewModal to re-render with new data.

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: After rejecting, if more submissions are queued, the modal stays open and shows the next photo
- **Check**: The team name and colour badge update to reflect the new submission's team
- **Check**: The transition is seamless with no flicker or modal close/reopen

## Commit
`feat(client): wire reject action with auto-promote to next queued submission`
