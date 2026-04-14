# Step 054: Create Upload Presigned URL API Route

## Description

Create the POST /api/upload endpoint that returns a presigned S3 URL for photo uploads. Scouts use this to upload proof photos for bingo items directly to S3 without passing through the server.

## Requirements

- Create `src/app/api/upload/route.ts`
- Export a named `POST` handler
- Parse JSON body for `gameId` (string), `teamId` (string), `roundItemId` (string), `contentType` (string)
- Validate all four fields are present and non-empty strings; return 400 `{ error: "gameId, teamId, roundItemId, and contentType are required" }` if any missing
- Validate `gameId` exists in database (query Game by id); return 404 `{ error: "Game not found" }` if not found
- Validate `teamId` exists in database (query Team by id); return 404 `{ error: "Team not found" }` if not found
- Call `getPresignedUploadUrl` from `@/lib/s3` passing the necessary parameters to generate the upload URL
- Return 200 with `{ uploadUrl: "https://...", photoUrl: "https://..." }`
  - `uploadUrl` is the presigned PUT URL with 5-minute expiry
  - `photoUrl` is the public read URL for the uploaded object

## Files to Create/Modify

- `src/app/api/upload/route.ts` — create the presigned upload URL endpoint

## Checklist

- [ ] Implemented
- [ ] Verified

## Verification

- **Check**: Returns 400 when any required field is missing
- **Check**: Returns 404 for non-existent gameId
- **Check**: Returns 404 for non-existent teamId
- **Check**: Returns 200 with uploadUrl and photoUrl on success
- **Check**: uploadUrl is a valid presigned S3 URL

## Commit

`feat(api): create POST /api/upload presigned S3 URL endpoint`
