# Orphan pending submission on approval race

**Severity.** Critical.

**Symptom.** A team that submits a photo concurrently with another
team's approval can end up with a `pending` submission row attached to
a square that is already `claimed`. The scout's UI is stuck showing
"pending" indefinitely and the leader never sees the submission in
their review queue.

**Locations.**

- `src/server/socket/submission.ts:56-98` — `submission:submit` create path
- `src/server/socket/submission.ts:275-381` — `review:approve` transaction + post-commit discard loop

## Root cause

`submission:submit` reads `roundItem` at `:56-67` and checks
`claimedByTeamId !== null` at `:75-81` outside any transaction. The
subsequent `prisma.submission.create` at `:90-98` is a separate Prisma
call.

`review:approve` runs a transaction at `:275-330` that atomically
claims the square and approves one submission, then commits. **After**
commit, at `:365-381`, it loops over all remaining `pending`
submissions for the round item and marks them `discarded` — outside
the transaction.

A `submission:submit` that reads `claimedByTeamId === null` before the
approval commits but writes its new row after the discard loop has run
is neither discarded nor included in the transaction.

## Failing trace

1. Team B's scout emits `submission:submit`. Handler reads
   `roundItem.claimedByTeamId === null` at `:75`.
2. Handler suspends (Node event loop scheduling, DB round-trip).
3. Leader emits `review:approve` for team A's earlier submission. The
   transaction runs, `roundItem.claimedByTeamId` is set to team A,
   team A's submission is marked `approved`. Commit.
4. Post-commit discard loop runs at `:365-381`. `findMany` returns no
   pending submissions (team B's hasn't been written yet).
5. Team B's handler resumes and creates the pending submission row.
6. Team B's scout is stuck: `mySubmissions` in the client shows
   pending, but the square is claimed and `review:open` at `:141-144`
   will refuse to open it (already claimed). No `submission:approved`,
   `submission:rejected`, or `submission:discarded` event will ever
   fire for this row.

## Fix direction

Move the "claimed" check and the insert inside a single transaction
with a `FOR UPDATE`-equivalent read of `roundItem` (SQLite doesn't
support `SELECT FOR UPDATE`, but Prisma's `$transaction` with default
isolation combined with a re-read inside the tx and an abort-if-
claimed is adequate under WAL given a single-writer pattern).

Alternatively, move the discard loop _into_ the approval transaction
so any `pending` row visible at discard time is either already
discarded or will see the claim on read. Then in `submission:submit`,
re-check `claimedByTeamId` atomically before the insert by wrapping
both reads and the write in a transaction.

Related race class: [team-assignment-race.md](team-assignment-race.md).
