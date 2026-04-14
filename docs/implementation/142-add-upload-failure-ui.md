# Step 142: Add Upload Failure UI on Bingo Square

## Description
When all automatic upload retries fail, show an inline error message on the affected bingo square so the scout knows the photo did not send and can manually retry with a single tap.

## Requirements
- After all 3 retries fail (from step 141), update the square's UI state to show an error
- Display inline text on the square: "Photo didn't send — tap to try again"
- Style the error text to be clearly visible on the square (e.g. red text, error icon)
- Tapping the square triggers a fresh upload attempt:
  1. Request a new presigned URL from the server
  2. Upload the compressed photo blob (still held in memory)
  3. Use the same retry logic from step 141 (3 retries with backoff)
- Keep the compressed photo blob in memory until:
  - Upload eventually succeeds (clear error state, mark square as pending)
  - User taps a different square to photograph (discard the failed photo, clear error)
- When upload succeeds after manual retry: clear the error state and transition the square to its normal pending/claimed state
- Only one square can be in the error state at a time — if a new photo fails, the previous error is cleared

## Files to Create/Modify
- `src/components/BingoSquare.tsx` (or equivalent) — Add error state rendering with "Photo didn't send — tap to try again" message
- `src/components/ScoutGame.tsx` — Track which square (if any) has a failed upload; handle tap-to-retry; manage compressed photo blob lifecycle

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: After all retries fail, the square shows "Photo didn't send — tap to try again"
- **Check**: Tapping the error square triggers a new upload attempt with a fresh presigned URL
- **Check**: If manual retry succeeds, error clears and square shows pending state
- **Check**: Taking a new photo for a different square clears the previous error
- **Check**: Compressed photo blob is not leaked — cleared on success or when replaced

## Commit
`feat(ui): show inline upload failure message on bingo square with tap-to-retry`
