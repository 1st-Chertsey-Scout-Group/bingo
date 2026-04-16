# Client thundering-herd on `game:lobby` broadcast

**Symptom.** At the start of a new round, every connected scout client
emits `lobby:join` within milliseconds of each other, making the
team-assignment race ([team-assignment-race.md](team-assignment-race.md))
trivial to trigger in practice.

**Location.** `src/components/ScoutGame.tsx:165-172`

## Root cause

`handleGameLobby` re-emits `lobby:join` as soon as the client receives
`game:lobby`:

```ts
const handleGameLobby = () => {
  clearTeamIdFromSession()
  dispatch({ type: 'GAME_LOBBY' })
  if (gamePin) {
    socket.emit('lobby:join', { gamePin })
  }
}
```

The server broadcasts `game:lobby` to the whole room in
`src/server/socket/game.ts:183`, so every scout on the game emits
`lobby:join` simultaneously. This does not cause the underlying race
but dramatically increases the probability that its window is hit.

## Fix direction

Amplifier only — fixing the underlying race with a per-game mutex (see
[team-assignment-race.md](team-assignment-race.md)) is sufficient to
eliminate the symptom. No client-side change required. Jittering the
re-join with a small random delay would also work but is unnecessary
once the server serialises team assignment.
