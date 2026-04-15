# Step 104: Add Scout Submission Toast Notifications

## Description

Add toast notifications for submission lifecycle events so scouts get clear feedback on what happened to their photos. Uses Sonner for lightweight, mobile-friendly toasts.

## Requirements

- In `src/components/ScoutGame.tsx`, add useEffect listeners for submission events on the team-specific channel:
  - `submission:received` — payload: `{ roundItemId: string }`
    - Toast: `toast('Submitted!')` (confirmation that server received the photo)
    - Note: this may overlap with the optimistic toast from step 100; if so, remove the optimistic one from step 100 and rely on this server-confirmed toast instead
  - `submission:approved` — payload: `{ roundItemId: string }`
    - Toast: `toast.success('Approved!', { style: { backgroundColor: state.myTeam?.colour } })` or use `toast('Approved!')` with celebration styling
    - Remove roundItemId from mySubmissions (dispatch `SUBMISSION_RESOLVED` action)
  - `submission:rejected` — payload: `{ roundItemId: string }`
    - Toast: `toast('Rejected — try again!')` with warning styling
    - Remove roundItemId from mySubmissions so the scout can retap the square
    - Dispatch `SUBMISSION_RESOLVED` action
  - `submission:discarded` — payload: `{ roundItemId: string, reason: 'already_claimed' }`
    - Toast: `toast('Already claimed!')` with info styling
    - Remove roundItemId from mySubmissions
    - Dispatch `SUBMISSION_RESOLVED` action
- Add `SUBMISSION_RESOLVED` action to the game state reducer:
  - Payload: `{ roundItemId: string }`
  - Removes the entry from `state.mySubmissions` Map
- Clean up all four listeners on unmount
- Import `toast` from `sonner`

## Files to Create/Modify

- `src/components/ScoutGame.tsx` — add socket listeners for submission events with toast notifications
- Game state reducer file — add `SUBMISSION_RESOLVED` action

## Checklist

- [x] Implemented
- [x] Verified

## Verification

- **Check**: `submission:received` shows "Submitted!" toast
- **Check**: `submission:approved` shows "Approved!" toast
- **Check**: `submission:rejected` shows "Rejected — try again!" toast and allows retap
- **Check**: `submission:discarded` shows "Already claimed!" toast
- **Check**: mySubmissions is cleaned up after each resolution event
- **Check**: All listeners are cleaned up on component unmount
- **Command**: `npx tsc --noEmit`

## Commit

`feat(ui): add scout submission toast notifications`
