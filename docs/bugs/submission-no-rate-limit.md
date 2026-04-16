# `submission:submit` allows unlimited pending submissions per team per square

**Severity.** High.

**Symptom.** A scout client (legitimate or malicious) can emit
`submission:submit` repeatedly for the same `roundItemId` and each call
creates a new `Submission` row. The leader's review queue fills with
duplicates from the same team; approving or rejecting one does not
skip the rest.

**Location.** `src/server/socket/submission.ts:23-103`

## Root cause

The handler checks that the round item exists, is in the current round,
and is not already claimed, then creates the submission unconditionally.
It does **not** check whether team T already has a `pending` submission
for `roundItemId`. There is also no unique constraint on
`(roundItemId, teamId, status='pending')` in `prisma/schema.prisma`.

The scout UI prevents repeat clicks via `pendingItems.has(roundItemId)`
at `src/components/ScoutGame.tsx:309`, but the server never enforces
this — the client check is advisory.

## Failing trace

1. Scout takes a photo and emits `submission:submit`. Row 1 is created
   with `position: 1`, `status: 'pending'`.
2. Scout rapidly clicks the photo control (or an attacker script emits
   the event in a loop). Row 2 is created with `position: 2`. Row 3
   with `position: 3`. Etc.
3. Leader opens review. First submission is promoted. They reject it.
   Handler at `:441-459` picks the next pending submission — which is
   the same team's row 2. Leader has to reject it again. And again.

This breaks the implied invariant "one submission per team per square
per round". It also blocks review progress for other teams whose
submissions sit behind the spammer's queue entries.

## Fix direction

In `submission:submit`, after the existing validation, check whether a
pending submission from this team for this `roundItemId` already
exists; if so, reject with a specific error and do not create a
duplicate. Defence in depth: add `@@unique([roundItemId, teamId])`
scoped to pending-or-approved rows (Prisma doesn't support partial
unique constraints directly, so handle with a compound unique on
`(roundItemId, teamId)` and move rejected submissions to a separate
state that doesn't conflict, or simply rely on the handler-level
check).
