# Known bugs

One file per bug. Each documents the symptom, root cause with file:line
references, interactions with other bugs, and fix direction. These are
diagnoses only — fixes are tracked separately.

## Critical

| File                                                                     | Summary                                                             |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| [team-identity-spoof.md](team-identity-spoof.md)                         | `rejoin` accepts any `teamId`; any scout can hijack any team        |
| [upload-endpoint-unauthenticated.md](upload-endpoint-unauthenticated.md) | `/api/upload` is world-open — anyone can request S3 PUT URLs        |
| [submission-approval-race.md](submission-approval-race.md)               | Orphan `pending` submission on a claimed square (read-modify-write) |

## High

| File                                                                       | Summary                                                              |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| [upload-content-type-unvalidated.md](upload-content-type-unvalidated.md)   | `/api/upload` signs URLs for any `contentType` — MIME abuse surface  |
| [submission-photo-url-unvalidated.md](submission-photo-url-unvalidated.md) | `submission:submit` accepts any URL — arbitrary content in review UI |
| [submission-no-rate-limit.md](submission-no-rate-limit.md)                 | Unlimited pending submissions per team per square                    |

## Correctness (round / team state)

| File                                                                   | Summary                                                   |
| ---------------------------------------------------------------------- | --------------------------------------------------------- |
| [team-assignment-race.md](team-assignment-race.md)                     | Concurrent joiners assigned the same team name            |
| [new-round-stale-round.md](new-round-stale-round.md)                   | `game.round` not incremented on `game:newround`           |
| [scout-rejoin-round-mismatch.md](scout-rejoin-round-mismatch.md)       | Scout refresh/reconnect kicks back to landing page        |
| [game-start-non-atomic.md](game-start-non-atomic.md)                   | `game:start` leaves game unrecoverable on partial failure |
| [game-start-no-team-count-check.md](game-start-no-team-count-check.md) | `game:start` permits zero-team rounds                     |
| [template-board-holes.md](template-board-holes.md)                     | Short boards when `templateCount` exceeds templates       |

## Correctness (review / lock exclusivity)

| File                                                                 | Summary                                                         |
| -------------------------------------------------------------------- | --------------------------------------------------------------- |
| [review-approve-no-lock-check.md](review-approve-no-lock-check.md)   | `review:approve` does not verify the caller holds the lock      |
| [review-reject-no-lock-check.md](review-reject-no-lock-check.md)     | `review:reject` does not verify the caller holds the lock       |
| [lock-timeout-name-collision.md](lock-timeout-name-collision.md)     | Lock-timeout map keyed on leader name only (cross-game collide) |
| [lock-stale-on-restart.md](lock-stale-on-restart.md)                 | DB locks survive server restart, no startup sweep               |
| [socket-room-leak-across-games.md](socket-room-leak-across-games.md) | Socket accumulates `game:*` rooms across in-tab navigation      |

## UX / error handling

| File                                                                       | Summary                                                        |
| -------------------------------------------------------------------------- | -------------------------------------------------------------- |
| [team-pick-deterministic.md](team-pick-deterministic.md)                   | Team picker is first-available, not random                     |
| [lobby-thundering-herd.md](lobby-thundering-herd.md)                       | Clients re-join simultaneously on `game:lobby`                 |
| [socket-error-events-unsubscribed.md](socket-error-events-unsubscribed.md) | Server `'error'` events have no client subscriber              |
| [rejoin-error-nuclear-handler.md](rejoin-error-nuclear-handler.md)         | Client wipes session on any `rejoin:error` regardless of cause |
| [s3-orphan-uploads.md](s3-orphan-uploads.md)                               | S3 objects accumulate with no reference or cleanup             |

## Key clusters

- **Team-identity / auth.** `team-identity-spoof.md`,
  `upload-endpoint-unauthenticated.md`,
  `upload-content-type-unvalidated.md`,
  `submission-photo-url-unvalidated.md`. The app has no persistent
  proof-of-membership; teamIds are broadcast to everyone via
  `lobby:teams`, and `/api/upload` is unauthenticated. A single
  session-token primitive would close most of this cluster.

- **Team / round state drift.** `new-round-stale-round.md`,
  `scout-rejoin-round-mismatch.md`. `Team.round` and `Game.round`
  are updated by different handlers at different times. Unifying the
  invariant (either always equal, or an explicit offset rule) fixes
  both and prevents future instances.

- **Read-modify-write without transaction.** `team-assignment-race.md`,
  `submission-approval-race.md`, `game-start-non-atomic.md`. Same
  structural weakness in three different handlers. Transactions plus
  (where applicable) DB unique constraints are the common fix.

- **Lock exclusivity.** `review-approve-no-lock-check.md`,
  `review-reject-no-lock-check.md`, `lock-timeout-name-collision.md`,
  `lock-stale-on-restart.md`. The lock feature is only partly
  enforced. Approve/reject don't check the lock holder; the in-memory
  timeout map is globally keyed; the DB copy is never read.

- **Silent failures.** `socket-error-events-unsubscribed.md`,
  `rejoin-error-nuclear-handler.md`, `lobby-thundering-herd.md`.
  Users don't see server-side error messages; the one error channel
  they do see (rejoin) nukes the session regardless of cause.
