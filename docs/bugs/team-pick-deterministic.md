# Team picker is deterministic (first-available)

**Symptom.** In isolation: round 1 team 1 is always the first team in
the declaration list ("Red Rabbits"). Combined with the team-assignment
race ([team-assignment-race.md](team-assignment-race.md)), all concurrent
joiners land on the _same_ team rather than distributed collisions,
making the race highly visible.

**Location.** `src/lib/teams.ts:44-46`

## Root cause

`getNextTeam(teamCount)` returns `TEAMS[teamCount]` — the next team in
declaration order. The 30-team list in `src/lib/teams.ts` is drawn from
`docs/product/team-names.md`. Under sequential joins this is functionally
correct but monotonous. Under the concurrent scenario in
[team-assignment-race.md](team-assignment-race.md), it guarantees
_identical_ collisions rather than random ones.

## Fix direction

Pick a random element from the unused subset (teams with no row in
`Team` for this `(gameId, round)`). A shuffled slice of `TEAMS` filtered
against the current team rows is sufficient.

This is a UX / amplifier fix, not a correctness fix. Once the race is
resolved, the sequential picker would still work — it just produces a
less interesting experience and makes any remaining race more visible.
