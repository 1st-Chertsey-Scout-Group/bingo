# Step 046: Create S3 Utility

## Description
Create the server-side S3 utility for generating presigned upload URLs. Scouts upload photos directly to S3 using these presigned URLs, avoiding the need to proxy large files through the server.

## Requirements
- Create `src/lib/s3.ts`
- Server-side only (no `'use client'` directive)
- Create an S3Client instance using environment variables:
  - `S3_REGION` — AWS region
  - `S3_BUCKET` — bucket name
  - `S3_ACCESS_KEY_ID` — access key
  - `S3_SECRET_ACCESS_KEY` — secret key
  - `S3_ENDPOINT` — optional custom endpoint (for S3-compatible services)
- Export `getPresignedUploadUrl(gameId: string, contentType: string): Promise<{ uploadUrl: string, photoUrl: string }>`
  - Generate a unique key using format: `games/{gameId}/submissions/{cuid}.webp`
  - Create a presigned PUT URL with 300-second expiry using `@aws-sdk/s3-request-presigner`
  - `uploadUrl` is the presigned PUT URL for uploading
  - `photoUrl` is the public read URL (constructed from bucket URL + key, no signing)
  - Use `PutObjectCommand` from `@aws-sdk/client-s3`
- Import `createId` from `@paralleldrive/cuid2` for generating unique keys
- Handle missing environment variables gracefully (log a warning, throw descriptive error)

## Files to Create/Modify
- `src/lib/s3.ts` — create S3 client and presigned URL generation

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: File exports `getPresignedUploadUrl` function
- **Command**: `cat src/lib/s3.ts`
- **Check**: Uses `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` imports
- **Command**: `grep -E '@aws-sdk' src/lib/s3.ts`
- **Check**: TypeScript compiles without errors
- **Command**: `npx tsc --noEmit`

## Commit
`feat(s3): add presigned upload URL generation for photo submissions`
