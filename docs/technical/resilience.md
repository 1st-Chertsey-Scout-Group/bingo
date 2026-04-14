# Resilience & Reconnection

The venue is a large field with wooded areas — signal drops and page refreshes are expected.

## Strategy

The app does not support offline play. A connection is required to submit photos and receive real-time updates. However, the app must survive:

1. Brief signal drops (a few seconds)
2. Longer disconnections (walking through dead zone, 30s-2min)
3. Page refresh / browser restart (PWA service worker serves cached app shell instantly, even without signal)
4. Device sleep/wake

## Socket.IO Auto-Reconnect

Socket.IO handles cases 1 and 2 automatically:

```typescript
const socket = io({
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10000,
})
```

- Exponential backoff from 1s to 10s
- Retries indefinitely until connection restored
- Buffered events are replayed on reconnect (Socket.IO default)

## Connection Banner

When the socket disconnects, the client shows a non-dismissable banner at the top of the screen:

> "No connection — trying to reconnect..."

Auto-clears when the connection is restored. No technical details, no error codes.

## Local Storage Cache

On every state change, the client writes to `localStorage`:

```json
{
  "gamePin": "3847",
  "gameId": "clx...",
  "teamId": "clx...",
  "teamName": "Red Rabbits",
  "teamColour": "#FF0000",
  "role": "scout"
}
```

This survives page refresh and browser restart (case 3).

For leaders (seeded by normal join flow OR by admin game creation redirect):

```json
{
  "gamePin": "3847",
  "leaderPin": "8472",
  "gameId": "clx...",
  "leaderName": "Tim",
  "role": "leader"
}
```

Note: The admin game creation page (`/admin`) seeds this localStorage data on successful game creation, then redirects to `/leader/[gameId]`. The LeaderGame component's normal rejoin flow picks it up — no special case needed.

## Rejoin Flow

On page load, if `localStorage` contains cached session data:

1. Client connects to Socket.IO
2. Emits `rejoin` event:
   - Scout: `{ gamePin, teamId }`
   - Leader: `{ gamePin, leaderPin, leaderName }`
3. Server validates:
   - Game still exists and is not stale
   - Team ID matches a team in the current round (scout)
   - Leader PIN is valid (leader)
   - Leader display name is not already taken by another connected leader
4. Server responds with full current state via `FULL_STATE` action:
   - Game status (lobby/active/ended)
   - If active: full board state (all items + claim status)
   - If active: pending submissions for this team (scout) or full review queue (leader)
5. Client hydrates `useGameState` reducer from response
6. Client is re-added to Socket.IO rooms

If validation fails (game no longer exists, invalid team):
- Clear `localStorage`
- Redirect to `/` (enter PIN screen)

**Between rounds:** When the server emits `game:lobby` (new round), clients clear their cached `teamId` from localStorage. The `rejoin` flow only works mid-round. Between rounds, scouts must re-join the lobby to get a fresh team name and colour.

## Device Sleep/Wake (Case 4)

When a phone screen turns off:
- Socket.IO connection may drop after OS suspends the WebSocket
- On wake, Socket.IO auto-reconnect kicks in
- Rejoin flow restores full state
- Connection banner shows briefly during reconnection

## Upload Resilience

Photo uploads go directly to S3 via presigned URL. If an upload fails:

1. Client retries up to 3 times with exponential backoff
2. Square shows inline message: "Photo didn't send — tap to try again"
3. Compressed photo held in memory until successfully uploaded or user dismisses
4. Presigned URL expires after 5 minutes — client requests a fresh one if retries span beyond that

## Leader Board Consistency

When a leader reconnects, the board must be accurate. On rejoin:

1. Server sends full board state including:
   - All round items with claim status
   - Which squares have pending submissions (`hasPendingSubmissions`)
   - Current locks (`lockedByLeader` on each round item)
   - `roundStartedAt` for timer recovery
2. If the reconnecting leader previously held a lock, it was already released by the disconnect timeout (30s)
3. Leader's board hydrates with current state — they can immediately tap squares to review

## Lock Timeout & Cleanup

- When a leader disconnects, the server starts a 30-second timeout for any lock they hold
- After 30s: clear `lockedByLeader` and `lockedAt`, emit `square:unlocked` to other leaders
- If the leader reconnects within 30s: lock is NOT automatically restored — they must re-open the modal
- One lock per leader max: if a leader somehow acquires a second lock (race condition), the server releases the first before granting the second

## Edge Cases

| Scenario | Behaviour |
|----------|-----------|
| Scout submits photo, disconnects before ack | Submission saved server-side with queue position, scout sees status on reconnect |
| Leader approves while another leader is disconnected | Reconnecting leader gets updated board (claimed squares, cleared locks) |
| All leaders disconnect mid-round | Submissions queue up per square, all locks release after 30s, reviewed when a leader reconnects |
| Leader disconnects with lock held | Lock auto-releases after 30s timeout, square becomes available for other leaders |
| Leader disconnects mid-review, reconnects within 30s | Lock already released or releasing — leader must re-open modal to re-lock |
| Two leaders tap same square simultaneously | First lock wins, second gets rejection — must pick a different square |
| Scout refreshes during lobby | Rejoin assigns same team (matched by teamId in localStorage) |
| Scout refreshes between rounds | teamId cleared from localStorage by `game:lobby` event — scout re-joins lobby for fresh team assignment |
| Game PIN collision | PIN generation checks for active games with same PIN, regenerates if needed |
| Leader PIN collision | Same check — no active game/leader PIN overlap |
| Leader joins with duplicate name | Server rejects join — leader must choose a different display name |
| Scout loses connection while camera is open | Photo captured locally, upload attempted on reconnect |
| Submission arrives while square is locked | Queued at next position — leader reviewing current submission is unaffected |
