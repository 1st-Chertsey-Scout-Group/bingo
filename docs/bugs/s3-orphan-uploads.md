# Orphaned S3 objects accumulate with no cleanup

**Severity.** Medium.

**Symptom.** Every photo successfully uploaded via `/api/upload` is
stored in the S3 bucket under `games/<gameId>/submissions/<cuid>.webp`
whether or not a corresponding `Submission` row is ever created. There
is no reference-counting, no TTL, and no periodic sweep. Over time the
bucket accumulates unreferenced objects.

**Locations.**

- `src/app/api/upload/route.ts:31-55` — upload endpoint ignores `roundItemId`
- `src/lib/s3.ts:27-51` — key generation
- `src/components/ScoutGame.tsx:245-256` — upload-then-emit flow

## Root cause

`getPresignedUploadUrl` generates a key of the form
`games/${gameId}/submissions/${createId()}`, with no reference to
`roundItemId` or `teamId`. The upload endpoint validates
`roundItemId` for presence but never uses it. No DB row is written
at upload time — the `Submission` row is only created later when
`submission:submit` succeeds.

The client performs the S3 PUT first (`uploadWithRetry`), then emits
`submission:submit` over the socket. If the socket is disconnected
between those two steps, or if the emit fails for any reason, the
S3 object exists with no pointer to it from anywhere in the app.

## Failing trace

1. Scout taps the camera, selects a photo, client calls
   `/api/upload`, receives a presigned URL.
2. Client `uploadWithRetry` PUTs the photo to S3 successfully.
3. Before the client emits `submission:submit`, the socket drops.
4. `socket?.emit('submission:submit', ...)` at
   `ScoutGame.tsx:253` is called on a disconnected socket.
   Socket.IO buffers the emit — good — but if the client process
   terminates before reconnect (tab closed, device sleep that kills
   the worker, OOM kill), the emit is lost.
5. The S3 object sits in the bucket forever. No DB row links to it.

Compound impact when combined with
[upload-endpoint-unauthenticated.md](upload-endpoint-unauthenticated.md):
a malicious caller can loop on `/api/upload` and upload arbitrary
bytes under game-prefixed keys, none of which will ever be cleaned up.

## Fix direction

Two complementary changes:

1. **Write a `PendingUpload` row at upload-URL-issue time.** The row
   stores `{ gameId, teamId, roundItemId, photoKey, issuedAt }`.
   `submission:submit` verifies the submitted `photoUrl` matches a
   `PendingUpload` row owned by the caller (solves
   [submission-photo-url-unvalidated.md](submission-photo-url-unvalidated.md)
   at the same time). A periodic sweep deletes `PendingUpload` rows
   — and their S3 objects — that are older than a threshold and
   never converted to a `Submission`.

2. **Include `teamId` and `roundItemId` in the S3 key.** Prefix of the
   form `games/<gameId>/rounds/<round>/teams/<teamId>/<roundItemId>/
<cuid>.webp` gives a future sweep job a cheap way to enumerate
   candidates for cleanup per round/team without a DB lookup.

The sweep itself can run on a cron or on game-end; aggressive TTL
is fine because legitimate uploads convert to `Submission` rows
within seconds of issue.
