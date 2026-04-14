# Step 041: Test Team Assignment

## Description
Write unit tests for the team data module to verify the team array integrity and assignment utility functions work correctly.

## Requirements
- Create `src/lib/teams.test.ts`
- Use Vitest as the test runner
- Test cases:
  - `TEAMS` array has exactly 30 entries
  - Every team has a non-empty `name` string
  - Every team has a `colour` string matching the hex pattern `/^#[0-9A-Fa-f]{6}$/`
  - Every team has an `index` matching its position in the array
  - `getTeamByIndex(0)` returns Red Rabbits with colour #E03131
  - `getTeamByIndex(14)` returns Gold Gorillas with colour #DAA520
  - `getTeamByIndex(29)` returns Copper Chameleons with colour #B87333
  - `getTeamByIndex(30)` returns `undefined`
  - `getTeamByIndex(-1)` returns `undefined`
  - `getNextTeam(0)` returns the first team (Red Rabbits)
  - `getNextTeam(15)` returns the 16th team (Crimson Cranes)
  - `getNextTeam(29)` returns the 30th team (Copper Chameleons)
  - `getNextTeam(30)` returns `null`
  - All team names are unique
  - All team colours are unique

## Files to Create/Modify
- `src/lib/teams.test.ts` — create unit tests for team data and utilities

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: All tests pass
- **Command**: `npx vitest run src/lib/teams.test.ts`

## Commit
`test(teams): add unit tests for team data and assignment utilities`
