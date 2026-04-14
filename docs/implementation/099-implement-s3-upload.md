# Step 099: Implement S3 Upload via Presigned URL

## Description
Upload the compressed photo to S3 using the presigned URL from the upload API. This is step 4-5 of the photo pipeline: request a presigned URL, then PUT the blob directly to S3.

## Requirements
- In `src/components/ScoutGame.tsx`, after successful compression, implement the upload flow:
  1. Request presigned URL:
     ```typescript
     const res = await fetch('/api/upload', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         gameId: state.gameId,       // from game state
         teamId: state.myTeam!.id,   // from game state
         roundItemId,                // from pendingRoundItemIdRef
         contentType: 'image/webp'
       })
     })
     const { uploadUrl, photoUrl } = await res.json()
     ```
  2. Upload blob to S3:
     ```typescript
     await fetch(uploadUrl, {
       method: 'PUT',
       body: compressedBlob,
       headers: { 'Content-Type': 'image/webp' }
     })
     ```
  3. Store `photoUrl` for the next step (socket emit)
- Error handling:
  - If presigned URL request fails (non-2xx), show toast: `toast('Upload failed. Try again.')`
  - If S3 PUT fails, show toast: `toast('Upload failed. Try again.')`
  - In either case, clear pending state so the scout can retry the square

## Files to Create/Modify
- `src/components/ScoutGame.tsx` — add presigned URL request and S3 upload after compression

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: Presigned URL is requested with correct gameId, teamId, roundItemId, contentType
- **Check**: Compressed blob is PUT to the presigned URL with correct Content-Type header
- **Check**: photoUrl is captured from the API response for use in socket emit
- **Check**: Upload errors produce user-friendly toast messages
- **Command**: `npx tsc --noEmit`

## Commit
`feat(photo): implement S3 upload via presigned URL in scout flow`
