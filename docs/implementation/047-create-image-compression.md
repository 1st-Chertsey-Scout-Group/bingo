# Step 047: Create Image Compression

## Description

Create the client-side image compression utility that prepares photos for upload. Compresses images to WebP format with constrained dimensions and file size to minimize upload time on mobile networks.

## Requirements

- Create `src/lib/image.ts`
- Client-side only module (imported only by client components)
- Import `imageCompression` from `browser-image-compression`
- Export `compressImage(file: File): Promise<Blob>`
- Compression options:
  - `maxWidthOrHeight`: 1200 (pixels)
  - `maxSizeMB`: 0.15 (150 KB target)
  - `fileType`: `'image/webp'`
  - `useWebWorker`: `true`
- Call `imageCompression(file, options)` and return the resulting Blob
- No error handling wrapping needed — let compression errors propagate to the caller

## Files to Create/Modify

- `src/lib/image.ts` — create image compression wrapper

## Checklist

- [ ] Implemented
- [ ] Verified

## Verification

- **Check**: File exports `compressImage` function with correct options
- **Command**: `cat src/lib/image.ts`
- **Check**: Uses `browser-image-compression` import
- **Command**: `grep 'browser-image-compression' src/lib/image.ts`
- **Check**: TypeScript compiles without errors
- **Command**: `npx tsc --noEmit`

## Commit

`feat(image): add client-side image compression with WebP output`
