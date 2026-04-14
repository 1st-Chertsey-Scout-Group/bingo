# Photo Pipeline

End-to-end flow from camera tap to square claimed.

## 1. Camera Capture

- Hidden `<input type="file" accept="image/*" capture="environment">` triggered programmatically on square tap
- Opens the native camera app (rear camera)
- Returns a File object when the photo is taken
- No custom camera UI — native is more reliable across devices

## 2. Client-Side Compression

Using `browser-image-compression` library:

```typescript
import imageCompression from 'browser-image-compression'

const compressed = await imageCompression(file, {
  maxWidthOrHeight: 1200,
  maxSizeMB: 0.15,
  fileType: 'image/webp',
  useWebWorker: true,
})
```

- Offloads compression to a Web Worker (UI stays responsive)
- Outputs WebP at ~50-150KB
- Falls back to JPEG automatically if WebP not supported
- Maintains aspect ratio

## 3. S3 Upload

1. Client requests presigned URL: `POST /api/upload`
2. Server generates presigned PUT URL with:
   - Key: `games/{gameId}/submissions/{cuid}.webp`
   - Content-Type: `image/webp`
   - Expires: 300 seconds
3. Client uploads directly to S3:
   ```typescript
   await fetch(uploadUrl, {
     method: 'PUT',
     body: compressedBlob,
     headers: { 'Content-Type': 'image/webp' },
   })
   ```
4. On success: client emits `submission:submit` via Socket.IO

### Read Access

S3 bucket has public read on the `games/` prefix. Photo URLs are directly accessible — no presigned GET URLs needed. Keys are unguessable CUIDs, photos auto-expire after 7 days.

### Upload Failure

1. Client retries up to 3 times with exponential backoff
2. Square shows inline message: "Photo didn't send — tap to try again"
3. Compressed photo held in memory until success or user dismisses
4. If presigned URL expires (>5 min), client requests a fresh one before retrying

## 4. Submission Processing

Server-side on `submission:submit`:

1. Validate: game is active, round item exists on board, team is valid
2. Check: `RoundItem.claimedByTeamId` — if already claimed, emit `submission:discarded` and stop
3. Assign queue position: `SELECT MAX(position) + 1` for this roundItem (or 1 if first)
4. Create `Submission` record with `status: pending` and assigned `position`
5. Emit `square:pending` to `game:{gameId}` room (all clients update board indicator)
6. Emit `submission:received` to `team:{teamId}` room
7. Submission is now queued — only position 1 with status `pending` is reviewable by leaders

## 5. Leader Review

### Opening a review (on `review:open`):

1. Validate: round item exists, is not claimed, has pending submissions
2. Check lock: if already locked by another leader, reject with error
3. One-lock-per-leader check: if this leader holds a lock on another square, release it first (emit `square:unlocked` for the old square)
4. Set `RoundItem.lockedByLeader = leaderName`, `lockedAt = now()`
5. Emit `square:locked` to `leaders:{gameId}` room
6. Find the lowest-position pending submission for this round item
7. Emit `review:submission` back to the requesting leader with the submission details

### Closing without acting (on `review:close`):

1. Clear `RoundItem.lockedByLeader` and `lockedAt`
2. Emit `square:unlocked` to `leaders:{gameId}` room

### Approving (on `review:approve`):

1. Begin Prisma transaction:
   a. Load submission + round item
   b. If `RoundItem.claimedByTeamId IS NOT NULL`: submission lost the race
   - Set submission status to `discarded`
   - Emit `submission:discarded` to team
   - Return
     c. Set `RoundItem.claimedByTeamId = submission.teamId`
     d. Set submission status to `approved`, `reviewedBy = leaderName`
     e. Clear lock fields (`lockedByLeader`, `lockedAt`)
2. Emit `square:claimed` to `game:{gameId}` room (all clients)
3. Emit `submission:approved` to `team:{teamId}` room
4. Find all other pending submissions for this round item:
   - Set status to `discarded`
   - Emit `submission:discarded` to each affected team
5. Emit `square:unlocked` to `leaders:{gameId}` room
6. Check if all round items for this game's board are now claimed — if so, emit `game:ended`

### Rejecting (on `review:reject`):

1. Set submission status to `rejected`
2. Emit `submission:rejected` to `team:{teamId}` room
3. Find next pending submission for this round item (next lowest position with status `pending`):
   - If found: emit `review:submission` back to the reviewing leader (modal stays open with next photo)
   - If none: clear lock, emit `square:unlocked` to `leaders:{gameId}` room (modal closes)

## 6. S3 Lifecycle

Bucket lifecycle rule:

- Prefix: `games/`
- Expiration: 7 days
- Handles cleanup automatically — no app-side deletion needed

## Sequence Diagram

```
Scout          App Server        S3           Leader
  |                |              |              |
  |-- POST /api/upload --------->|              |
  |<-- presigned URL ------------|              |
  |-- PUT photo (WebP) -------->|              |
  |<-- 200 OK ------------------|              |
  |-- submission:submit ------->|               |
  |                |-- create Submission (pos N) |
  |                |-- square:pending ---------> (all, board indicator)
  |<- submission:received ------|               |
  |                |                             |
  |                |         (leader taps square)|
  |                |<---------- review:open -----|
  |                |-- lock square               |
  |                |-- square:locked ----------->| (other leaders)
  |                |-- review:submission ------->| (photo + details)
  |                |                             |
  |                |<--------- review:approve ---|
  |                |-- transaction: claim        |
  |                |-- square:claimed ---------> (all)
  |                |-- submission:approved ----->|
  |                |-- square:unlocked --------->| (other leaders)
  |                |-- discard queued ---------->| (affected teams)
```
