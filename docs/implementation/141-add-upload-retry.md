# Step 141: Add Upload Retry with Exponential Backoff

## Description

Enhance the S3 photo upload flow to automatically retry on failure. In a field with patchy signal, uploads may fail mid-transfer. Retrying with backoff gives the best chance of success without overwhelming a weak connection.

## Requirements

- When a photo upload to S3 fails (network error or non-2xx response), retry automatically
- Maximum 3 retries (4 total attempts including the original)
- Exponential backoff delays: 1 second, 2 seconds, 4 seconds between retries
- Before each retry, check if the presigned URL is older than 5 minutes:
  - If expired: request a fresh presigned URL from the server before retrying the upload
  - Track the timestamp when the presigned URL was issued
- Keep the compressed photo blob in memory throughout the retry cycle — do not re-compress
- If all 3 retries fail, do NOT discard the photo — keep it in memory for manual retry (step 142)
- Return a result indicating success or failure so the UI layer can respond appropriately
- Implement as a reusable async function (e.g. `uploadWithRetry(blob, getPresignedUrl)`)
- Log retry attempts to console for debugging (but no user-facing retry count)

## Files to Create/Modify

- `src/lib/upload.ts` — Create or modify the upload function to add retry logic with exponential backoff and presigned URL refresh

## Checklist

- [ ] Implemented
- [ ] Verified

## Verification

- **Check**: Upload succeeds on first attempt — no unnecessary retries
- **Check**: Simulate network failure (DevTools offline mode) — observe 3 retry attempts at 1s, 2s, 4s intervals in console
- **Check**: If presigned URL is >5 minutes old at retry time, a fresh URL is requested
- **Check**: After all retries fail, compressed photo blob is still available in memory
- **Command**: Monitor network tab — should see retry requests spaced at correct intervals

## Commit

`feat(upload): add S3 upload retry with exponential backoff and presigned URL refresh`
