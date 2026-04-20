# Square shows pending (yellow) but no photo was uploaded to S3

## Summary

When a scout disconnects after the `submission:submit` socket emit but before the S3 upload completes (or after getting a presigned URL but before PUT), the square shows a yellow "pending" outline on all clients, but the leader has no photo to review because no image was actually uploaded to S3.

## Repro steps

1. **Role:** Scout on a mobile device with an unreliable connection (e.g. outdoors, spotty WiFi).
2. Join a game, wait for the round to start.
3. Tap a square and take a photo.
4. While the upload overlay shows "Uploading...", lose network connectivity (e.g. walk out of WiFi range, toggle airplane mode).
5. **Observed:** On the scout's device, the upload eventually fails silently or the overlay disappears. On _other_ scouts' and leaders' devices, the square may show as pending (yellow/amber) with `hasPendingSubmissions: true`, but the leader cannot review it because the submission row has a `photoUrl` pointing to an S3 object that was never uploaded, or no submission row exists at all.
6. **Expected:** If the photo never reached S3, the square should not be marked as pending, or the system should detect the missing upload and clean up.

## Root cause

The upload flow has a critical ordering issue across two separate channels (HTTP + Socket.IO):

### Flow analysis

1. **Scout taps square** -- `usePhotoUpload.ts:165-179` sets `pendingRoundItemIdRef` and opens the camera.
2. **Photo selected** -- `usePhotoUpload.ts:120-147` compresses the image and calls `doUpload`.
3. **`doUpload`** at `usePhotoUpload.ts:59-118`:
   - Step A: `fetch('/api/upload', ...)` gets a presigned URL (`usePhotoUpload.ts:77-91`). The server creates a `PendingUpload` row at `src/app/api/upload/route.ts:49-56`.
   - Step B: `uploadWithRetry(blob, getPresignedUrl)` PUTs the image to S3 (`src/lib/upload.ts:40-44`).
   - Step C: On success, emits `socket.emit('submission:submit', { roundItemId, photoUrl })` at `usePhotoUpload.ts:100-103`.
   - Step D: Dispatches `SUBMISSION_SENT` to local state at `usePhotoUpload.ts:104`.

4. **Server receives `submission:submit`** at `src/server/socket/submission.ts:62-179`:
   - Validates the `photoUrl` starts with the expected S3 prefix (`submission.ts:110-114`).
   - Creates a `Submission` row with status `PENDING` (`submission.ts:142-149`).
   - Marks the `PendingUpload` as consumed (`submission.ts:152-155`).
   - Broadcasts `square:pending` to all clients (`submission.ts:175`).

### The race condition

**Scenario 1: Disconnect between step B and step C.**
The S3 PUT succeeds, but the socket disconnects before `submission:submit` is emitted. Socket.IO buffers the emit, but if the tab closes or the device sleeps, the buffer is lost. The S3 object exists but no `Submission` row is ever created. The `PendingUpload` row remains unconsumed. The square is NOT pending in this case (no broadcast happened), but the scout's local state shows it as pending due to the `SUBMISSION_SENT` dispatch.

**Scenario 2: Disconnect between step A and step B.**
The presigned URL was obtained and a `PendingUpload` row exists, but the S3 PUT never completes. If the scout reconnects and the socket emit somehow fires (from Socket.IO buffer), the server creates a `Submission` row with a `photoUrl` pointing to a non-existent S3 object. The leader opens review, sees a broken image, and cannot approve or reject meaningfully.

**Scenario 3 (most visible): Socket reconnects, buffered emit fires.**
The S3 upload fails (step B), but the `uploadWithRetry` returns `{ success: false }`. The client correctly sets `failedUpload` state. However, if the socket reconnected during the retry window and a _previous_ attempt's emit was buffered, it could fire with a `photoUrl` from a partially-uploaded or missing object.

### The `photoUrl` is never validated against S3

The server at `submission.ts:110-114` only checks that `photoUrl` starts with the expected prefix. It does **not** verify the object actually exists in S3 (e.g. via a HEAD request). This means any `photoUrl` that passes the prefix check is accepted, whether or not the upload completed.

**Verification method:** Static trace through `usePhotoUpload.ts:59-118`, `upload/route.ts:44-59`, `submission.ts:62-179`, and `upload.ts:18-65`. The ordering of S3 PUT (step B) vs. socket emit (step C) with no server-side existence check creates the gap.

## Proposed fix

### Option A: Server-side S3 existence check (minimal, targeted)

Before creating the `Submission` row, verify the S3 object exists:

```diff
--- a/src/server/socket/submission.ts
+++ b/src/server/socket/submission.ts
@@ -110,6 +110,15 @@
       if (!photoUrl.startsWith(expectedPrefix)) {
         socket.emit('error', { message: 'Invalid photo URL' })
         return
       }
+
+      // Verify the photo was actually uploaded to S3
+      const photoExists = await headObject(photoUrl)
+      if (!photoExists) {
+        socket.emit('error', { message: 'Photo upload incomplete — please retry' })
+        return
+      }
```

This requires adding a `headObject` utility to `src/lib/s3.ts` that performs an S3 `HeadObject` call.

### Option B: Client-side confirmation before emit

Only emit `submission:submit` after confirming the S3 PUT succeeded AND the socket is connected:

```diff
--- a/src/hooks/usePhotoUpload.ts
+++ b/src/hooks/usePhotoUpload.ts
@@ -96,7 +96,11 @@
         if (result.success) {
+          if (!socket?.connected) {
+            setFailedUpload({ roundItemId, blob })
+            toast('Connection lost during upload — tap to retry')
+            return
+          }
           setUploadStage('submitting')
           setFailedUpload(null)
           socket?.emit('submission:submit', {
```

### Recommended: Both options combined

Option A provides server-side defense-in-depth. Option B provides immediate client-side feedback. Together they close both the "ghost pending" and "broken image" paths.

## Related areas & regression risk

- The existing `sweepOrphanUploads` function at `src/server/socket/game.ts:15-33` only runs at game end. It cleans up `PendingUpload` rows with `consumedAt: null`, but only deletes the S3 objects. It does NOT clean up `Submission` rows that reference missing S3 objects.
- The existing bug report at `docs/bugs/s3-orphan-uploads.md` documents the orphan S3 object accumulation but does not address the user-visible symptom of a pending square with no reviewable photo.
- `uploadWithRetry` at `src/lib/upload.ts:26-64` retries up to 3 times with exponential backoff. If all retries fail, it returns `{ success: false }` and the client correctly enters the "failed" state. The race only occurs when the socket disconnects/reconnects during this window.
- The `PendingUpload.consumedAt` field at `prisma/schema.prisma:98` is the only linkage between the upload endpoint and submission creation. A sweep that runs periodically (not just at game end) would help catch orphaned uploads during active games.
- Adding a HEAD request to S3 in the submission handler adds latency to the submission path. This should be acceptable since it is a single small HTTP call, but it should be monitored.
