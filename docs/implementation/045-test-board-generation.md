# Step 045: Test Board Generation

## Description

Write unit tests for the board generation and PIN utility functions to verify correct item selection, template resolution, shuffling, and PIN generation.

## Requirements

- Create `src/lib/game-logic.test.ts`
- Use Vitest as the test runner
- Test cases for `generateBoard`:
  - Returns an array with exactly `boardSize` items
  - Contains exactly `boardSize - templateCount` concrete items and `templateCount` template-resolved items
  - No duplicate `itemId` values in the returned board
  - Avoids items in `recentItemIds` when the pool is large enough
  - Falls back to recent items (oldest first) when the non-recent pool is too small
  - Template-resolved items have display names with placeholders substituted (no `[` or `]` in display names)
  - Returns items in a shuffled order (run multiple times and verify not always identical — statistical test)
  - Works correctly with `templateCount: 0` (all concrete items)
  - Works correctly with an empty `recentItemIds` array
- Test cases for `generatePin`:
  - Returns a string of exactly 4 characters
  - String contains only digits 0-9
  - Generates different values on subsequent calls (run 10 times, verify not all identical)
- Test cases for `validatePinUnique`:
  - Returns `true` when pin is not in the existing pins array
  - Returns `false` when pin is in the existing pins array
  - Returns `true` when existing pins array is empty
- Use mock data for items and template values in tests

## Files to Create/Modify

- `src/lib/game-logic.test.ts` — create unit tests for board generation and PIN utilities

## Checklist

- [ ] Implemented
- [ ] Verified

## Verification

- **Check**: All tests pass
- **Command**: `npx vitest run src/lib/game-logic.test.ts`

## Commit

`test(game): add unit tests for board generation and PIN utilities`
