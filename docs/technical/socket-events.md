# Socket.IO Events

All real-time communication between clients and server.

See [architecture.md](./architecture.md) for room structure (`game:{gameId}`, `leaders:{gameId}`, `team:{teamId}`).

## Server -> All Clients (room: `game:{gameId}`)

| Event            | Payload                                          | Description                                                                                                                               |
| ---------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `game:started`   | `{ board: RoundItem[], roundStartedAt: string }` | Round has begun, full board + timer start sent                                                                                            |
| `square:claimed` | `{ roundItemId, teamId, teamName, teamColour }`  | A square was approved and claimed                                                                                                         |
| `square:pending` | `{ roundItemId }`                                | A new submission has been queued for this square (leaders update board indicator)                                                         |
| `game:ended`     | `{ summary: TeamSummary[] }`                     | Round over — all teams ranked by claims. Triggered by leader pressing "End Round" or all squares claimed. Scouts see "Head back to base!" |
| `game:lobby`     | `{}`                                             | New round — everyone return to lobby. Clients must clear cached teamId from localStorage — scouts re-join for fresh team assignment       |
| `lobby:teams`    | `{ teams: Team[] }`                              | Updated lobby team list (join/leave)                                                                                                      |

### Payload Types

```typescript
type RoundItem = {
  roundItemId: string
  displayName: string // "Oak leaf" or "Something Red"
  claimedByTeamId: string | null
  claimedByTeamName: string | null
  claimedByTeamColour: string | null
  hasPendingSubmissions: boolean // true if any pending submissions queued
  lockedByLeader: string | null // leader name if locked, null otherwise
}

type TeamSummary = {
  teamId: string
  teamName: string
  teamColour: string
  claimedCount: number
}

type Team = {
  id: string
  name: string
  colour: string
}

type SubmissionForReview = {
  submissionId: string
  roundItemId: string
  displayName: string
  teamName: string
  teamColour: string
  photoUrl: string
}
```

## Server -> Joining Scout Only (direct emit)

| Event          | Payload                            | Description                                          |
| -------------- | ---------------------------------- | ---------------------------------------------------- |
| `lobby:joined` | `{ teamId, teamName, teamColour }` | Confirms team assignment after scout joins the lobby |

## Server -> Submitting Scout Only (room: `team:{teamId}`)

| Event                  | Payload                                      | Description                                                                                               |
| ---------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `submission:received`  | `{ roundItemId }`                            | Photo upload acknowledged, square shows pending. Scout sees same indicator whether queued or under review |
| `submission:approved`  | `{ roundItemId }`                            | Their submission was approved                                                                             |
| `submission:rejected`  | `{ roundItemId }`                            | Their submission was rejected — can retry                                                                 |
| `submission:discarded` | `{ roundItemId, reason: 'already_claimed' }` | Square claimed by another team                                                                            |

## Server -> Leaders Only (room: `leaders:{gameId}`)

| Event               | Payload                       | Description                                                                                             |
| ------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------- |
| `square:locked`     | `{ roundItemId, leaderName }` | A leader has opened the review modal for this square                                                    |
| `square:unlocked`   | `{ roundItemId }`             | Lock released (dismissed, acted on, or timed out)                                                       |
| `review:submission` | `SubmissionForReview`         | The reviewable submission for a square (sent when leader opens modal, or auto-promoted after rejection) |

## Client (Scout) -> Server

| Event               | Payload                     | Description                                 |
| ------------------- | --------------------------- | ------------------------------------------- |
| `lobby:join`        | `{ gamePin }`               | Scout joins lobby, server auto-assigns team |
| `submission:submit` | `{ roundItemId, photoUrl }` | Photo submitted for a square                |
| `rejoin`            | `{ gamePin, teamId }`       | Reconnect with cached session               |

## Client (Leader) -> Server

| Event            | Payload                              | Description                                                                                                                                                         |
| ---------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lobby:join`     | `{ gamePin, leaderPin, leaderName }` | Leader joins lobby. Server rejects if another leader with the same display name is already connected                                                                |
| `game:start`     | `{}`                                 | Start the round (selects items per board config, notifies all)                                                                                                      |
| `review:open`    | `{ roundItemId }`                    | Leader opens review modal — server locks square, sends `review:submission` back with the current reviewable submission, broadcasts `square:locked` to other leaders |
| `review:close`   | `{ roundItemId }`                    | Leader dismisses modal without acting — server releases lock, broadcasts `square:unlocked`                                                                          |
| `review:approve` | `{ submissionId, leaderName }`       | Approve a submission — releases lock                                                                                                                                |
| `review:reject`  | `{ submissionId }`                   | Reject a submission — if more queued, auto-promotes next and sends `review:submission` back; otherwise releases lock                                                |
| `game:end`       | `{}`                                 | End the round — triggers `game:ended` to all clients                                                                                                                |
| `game:newround`  | `{}`                                 | New round — everyone to lobby with fresh team assignments                                                                                                           |
| `rejoin`         | `{ gamePin, leaderPin, leaderName }` | Reconnect with cached session                                                                                                                                       |

## Server -> Reconnecting Client

| Event          | Payload               | Description                                                      |
| -------------- | --------------------- | ---------------------------------------------------------------- |
| `rejoin:state` | `GameState`           | Full current state for hydration (see architecture.md for shape) |
| `rejoin:error` | `{ message: string }` | Rejoin failed — client should clear cache and redirect to `/`    |

## Connection Lifecycle

| Event        | Direction        | Behaviour                                                                                                                                   |
| ------------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `connect`    | Client -> Server | Socket.IO auto, client sends `lobby:join` or `rejoin`                                                                                       |
| `disconnect` | Server detects   | Server sets `Team.socketId = null`, preserves all data. For leaders: releases any held lock after 30s timeout, broadcasts `square:unlocked` |
| `reconnect`  | Client auto      | Socket.IO auto-reconnect, client sends `rejoin` with cached data                                                                            |
