# `/api/upload` signs presigned URLs for any `contentType`

**Severity.** High.

**Symptom.** The upload endpoint accepts any string as `contentType` and
signs a presigned S3 PUT URL for that exact content type. An attacker
can obtain a URL that will accept `text/html`, `application/javascript`,
or any other MIME type and PUT an arbitrary payload under a game-
prefixed bucket key.

**Locations.**

- `src/app/api/upload/route.ts:30-53`
- `src/lib/s3.ts:38-44`

## Root cause

`contentType` is taken directly from the request body at `route.ts:31-36`
and passed into `PutObjectCommand.ContentType` at `s3.ts:38-44`. The
presigned URL enforces the `Content-Type` header on the PUT, so the
client must use the same MIME type — but the _server_ signed it with
whatever the caller requested. No whitelist is applied; the legitimate
client only ever sends `image/webp`
(`src/lib/upload.ts:43`).

## Failing trace

Combined with [upload-endpoint-unauthenticated.md](upload-endpoint-unauthenticated.md)
(no auth on `/api/upload`):

1. Attacker POSTs `{ gameId, teamId, roundItemId, contentType: 'text/html' }`.
2. Server signs a URL bound to `ContentType: text/html` and returns it.
3. Attacker PUTs HTML to that URL with matching `Content-Type`.
4. The bucket now contains attacker-controlled HTML at a public-read
   URL under `games/<gameId>/submissions/<cuid>.webp`.

Leader's `ReviewModal` loads photos as `<img src>` (`src/components/ReviewModal.tsx:47-51`)
and an HTML response will silently fail to render, so the immediate
scout-experience impact is limited — but the bucket is now a hosting
vector for arbitrary content under the app's S3 path.

## Fix direction

Reject `contentType` that isn't in a hard-coded whitelist (`image/webp`
is the only one the app produces). Return 400 if it doesn't match. The
signature must be bound to the whitelisted value, not to the caller's
input.
