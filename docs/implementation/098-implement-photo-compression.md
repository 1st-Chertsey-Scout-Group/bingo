# Step 098: Implement Photo Compression Pipeline

## Description

Compress the captured photo to WebP format before uploading. This reduces file size significantly (targeting 50-150KB) to keep uploads fast on mobile networks.

## Requirements

- In `src/components/ScoutGame.tsx`, update `handleFileSelected` to call the compression pipeline
- Call `compressImage(file)` from `@/lib/image.ts`:
  - This function should already exist (created in a prior step) using `browser-image-compression`
  - Compresses to WebP format, max width ~1200px, target output ~50-150KB
  - Uses Web Worker for non-blocking compression
  - Returns a `Blob` (WebP)
- Wrap the compression call in a try/catch:
  - On success: proceed to S3 upload (step 099) with the compressed blob and `pendingRoundItemIdRef.current`
  - On error: show a toast via Sonner: `toast('Something went wrong. Try again.')` — no technical details
  - In both cases: clear the pending state
- Optionally show a brief loading state on the tapped square while compressing (e.g., set a local `compressingItemId` state)
- Ensure the flow is: tap square → camera → file returned → compress → upload (next step)

## Files to Create/Modify

- `src/components/ScoutGame.tsx` — integrate compressImage into the photo capture flow

## Checklist

- [ ] Implemented
- [ ] Verified

## Verification

- **Check**: Captured photo is passed to compressImage
- **Check**: Compression produces a WebP blob
- **Check**: Compression errors show a user-friendly toast
- **Check**: No technical error messages are exposed to the user
- **Command**: `npx tsc --noEmit`

## Commit

`feat(photo): integrate image compression into scout capture flow`
