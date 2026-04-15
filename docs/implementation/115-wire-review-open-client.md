# Step 115: Wire review:open on Client Side

## Description

Connect the leader's square tap to the review:open socket event and handle the server's response by opening the ReviewModal with the submission data.

## Requirements

- In LeaderGame, update the `onSquareTap` handler: when a leader taps a needs-review square, emit `review:open` with `{ roundItemId }` to the server
- Only emit if the square has `hasPendingSubmissions === true` AND `claimedByTeamId === null` AND `lockedByLeader === null` (or locked by this leader)
- Listen for `review:submission` socket event
- On receive, dispatch `REVIEW_PROMOTED` action with the `SubmissionForReview` data to the game reducer
- Store `reviewingRoundItemId` in local component state (or reducer state)
- Open ReviewModal with the submission data
- Pass `onApprove`, `onReject`, and `onDismiss` callback props to ReviewModal (wired in later steps)

## Files to Create/Modify

- `src/components/LeaderGame.tsx` — Update onSquareTap to emit review:open. Add socket listener for review:submission. Add state for reviewingRoundItemId and current submission. Render ReviewModal when submission is present.
- `src/hooks/useGameReducer.ts` — Ensure REVIEW_PROMOTED case stores the current submission for review

## Checklist

- [x] Implemented
- [x] Verified

## Verification

- **Check**: Tapping a needs-review square emits review:open and opens the ReviewModal with the correct photo
- **Check**: Tapping a claimed or unclaimed square does nothing
- **Check**: The ReviewModal displays the submission data from the server
- **Check**: reviewingRoundItemId is set when modal is open

## Commit

`feat(client): wire review:open emission and review:submission listener in LeaderGame`
