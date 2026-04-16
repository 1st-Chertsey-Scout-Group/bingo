# `/api/upload` is world-open

**Severity.** Critical.

**Symptom.** Anyone on the internet who knows or guesses a `gameId` and
any `teamId` can request a presigned S3 PUT URL and upload arbitrary
content to the bucket under a game-prefixed key.

**Location.** `src/app/api/upload/route.ts:6-56`

## Root cause

The `POST /api/upload` handler validates that `gameId`, `teamId`,
`roundItemId`, and `contentType` are present strings, looks up the game
and team, and returns a presigned URL. It performs:

- **No** `X-Admin-Pin` check (correctly — this is not an admin route).
- **No** session / cookie / header check.
- **No** verification that the caller is a scout in this game.
- **No** verification that the `teamId` has a `socketId` matching any
  live connection for the caller.

`teamId` is broadcast to every scout and leader via `lobby:teams`
([team-identity-spoof.md](team-identity-spoof.md)), so treating a valid
`teamId` as proof of membership is already broken; here it's not even
required to be secret.

## Failing trace

```
POST /api/upload
Content-Type: application/json

{
  "gameId": "<any valid game id>",
  "teamId": "<any valid team id>",
  "roundItemId": "<any string>",
  "contentType": "image/webp"
}
```

Server returns `{ uploadUrl, photoUrl }`. Attacker uses the presigned
URL (5-minute validity — `src/lib/s3.ts:44`) to PUT arbitrary bytes.
The object is now permanently hosted under
`games/<gameId>/submissions/<cuid>.webp` with public read
(per S3 bucket policy described in `CLAUDE.md`).

## Impact

- Bucket storage consumption and cost — no auth and no per-caller
  limit.
- Content-type abuse when combined with
  [upload-content-type-unvalidated.md](upload-content-type-unvalidated.md):
  attacker can PUT `text/html` under a game path.
- URL laundering when combined with
  [submission-photo-url-unvalidated.md](submission-photo-url-unvalidated.md):
  the attacker-uploaded object can be submitted to the leader's review
  modal as an `<img src>`.

## Fix direction

Require the caller to present something only a legitimate scout holds —
a server-issued session token tied to the team (same primitive needed
for [team-identity-spoof.md](team-identity-spoof.md)). Cheapest shape:
the upload endpoint reads a signed token from a cookie, verifies it
resolves to a team whose `gameId` and `teamId` match the payload.
Rate-limit per team as defence in depth.
