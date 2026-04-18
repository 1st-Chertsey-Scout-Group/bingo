# Team identity spoof via `rejoin`

**Severity.** Critical.

**Symptom.** Any scout who knows another team's `teamId` can take over
that team's socket binding, join its private room, and submit photos on
its behalf. The legitimate team is silently kicked out of its own socket
routing.

**Primary locations.**

- `src/server/socket/lobby.ts:201-225` — scout `rejoin` branch
- `src/server/socket/submission.ts:5-12, 42-48` — team identity lookup
- `src/server/socket/lobby.ts:133-148` — `lobby:teams` broadcast

## Root cause

There is no binding between a socket and a team beyond Socket.IO room
membership. Two independent defects combine:

1. **`rejoin` scout branch does not authenticate the caller.**
   `src/server/socket/lobby.ts:201-221` validates only that the team
   exists, belongs to the game, and is in the current round. On success
   it unconditionally writes `prisma.team.update({ data: { socketId:
socket.id } })` at `:218-221` and joins the `team:<id>` room at
   `:225`. No proof of prior ownership (no token, no cookie, no stored
   secret) is required.

2. **Every scout learns every `teamId`.** The `lobby:teams` broadcast
   at `src/server/socket/lobby.ts:148` is emitted to `game:<gameId>` —
   every scout and leader in the game — and the payload at `:138-142`
   includes each team's `id`. So a teamId is not a secret.

3. **`submission:submit` uses room membership as team identity.**
   `getTeamIdFromSocket` at `src/server/socket/submission.ts:5-12`
   walks `socket.rooms` and returns the first `team:*` room found.
   `submission:submit` (`:23-103`) never verifies `socket.data.role ===
'scout'` or that the team's current `socketId` matches this socket.

## Failing trace

1. Attacker scout joins the game normally, receives the full
   `lobby:teams` list including victim's `teamId`.
2. Attacker emits `rejoin` with `{ gamePin, teamId: <victim's> }`.
3. Server accepts at `:201-215`, rewrites `team.socketId` to attacker's
   socket at `:218-221`, joins attacker's socket to `team:<victim>` at
   `:225`. Victim's socket is still in the room but is no longer the
   `team.socketId` of record.
4. Attacker emits `submission:submit`. `getTeamIdFromSocket` returns the
   victim's team. Submission is created attributed to the victim team.
5. Server emits to `team:<victim>`; attacker receives the broadcast.
   If the victim's socket is still in the room they also receive it,
   but all future server-initiated direct sends via `team.socketId`
   reach the attacker instead.

## Fix direction

Bind team identity to a server-issued secret that the scout must present
on `rejoin`, not to a row id that is broadcast to everyone. A session
token stored in `sessionStorage` alongside `teamId` and verified against
a persisted hash on the `Team` row is the minimal shape. Also add a
`socket.data.role === 'scout'` assertion on `submission:submit` and
verify `team.socketId === socket.id` (or the equivalent under the new
token scheme).

Related: bringing `submission:submit` under the same per-game mutex
discussed in [team-assignment-race.md](team-assignment-race.md) would
close the companion race but not this authorisation hole.
