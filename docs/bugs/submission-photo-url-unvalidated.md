# `submission:submit` accepts any string as `photoUrl`

**Severity.** High.

**Symptom.** A scout can submit a photo URL pointing to any host, not
just the app's S3 bucket. The leader's review modal will load whatever
URL was submitted.

**Location.** `src/server/socket/submission.ts:30-40`

## Root cause

The server validates only that `photoUrl` is a non-empty string:

```ts
if (
  typeof roundItemId !== 'string' ||
  roundItemId.trim() === '' ||
  typeof photoUrl !== 'string' ||
  photoUrl.trim() === ''
) {
  socket.emit('error', { message: 'roundItemId and photoUrl are required' })
  return
}
```

There is no check that the URL's host matches the app's S3 bucket, no
check that it was issued by `/api/upload`, and no persistent binding
between presigned URLs handed out by the upload endpoint and submissions
recorded via the socket handler.

## Failing trace

1. Scout emits `submission:submit` with
   `{ roundItemId: '<valid>', photoUrl: 'https://evil.example/xss.png' }`.
2. Server creates the `Submission` row with the attacker-chosen URL.
3. Leader's `ReviewModal` at `src/components/ReviewModal.tsx:47-51`
   renders `<img src={submission.photoUrl} />`, making an outbound
   request to `evil.example`.

Impact:

- Outbound requests from the leader's browser to an attacker-chosen
  host (IP / user-agent disclosure, possible referer leakage).
- Arbitrary content in the review UI (harassment, inappropriate images).
- Image-decoder vulnerability surface in the leader's browser.

## Fix direction

Require `photoUrl` to match the app's S3 base URL. The bucket hostname
is known server-side (`src/lib/s3.ts`); a prefix check against
`https://<bucket>.s3.<region>.amazonaws.com/games/<gameId>/submissions/`
is sufficient. Reject submissions whose `photoUrl` does not match.

Stronger shape: have `/api/upload` record the issued object key in the
DB (e.g. a `PendingUpload` row) and require `submission:submit` to
reference that record rather than accept a free-form URL.
