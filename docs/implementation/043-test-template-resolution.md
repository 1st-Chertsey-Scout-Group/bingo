# Step 043: Test Template Resolution

## Description

Write unit tests for the template resolution module to verify placeholder substitution, deduplication, and exhaustion handling work correctly.

## Requirements

- Create `src/lib/templates.test.ts`
- Use Vitest as the test runner
- Test cases:
  - Resolves `[colour]` placeholder: `resolveTemplate("Something [colour]", "colour", ["Red", "Blue"], new Set())` returns a string matching either "Something Red" or "Something Blue"
  - Never picks a used value: with `usedValues` containing "Something Red", calling with values ["Red", "Blue"] never returns "Something Red"
  - Returns `null` when all values are exhausted: `resolveTemplate("Something [colour]", "colour", ["Red"], new Set(["Something Red"]))` returns `null`
  - Mutates the `usedValues` Set: after a successful resolution, the Set contains the new resolved name
  - Handles `[texture]` category: `resolveTemplate("A [texture] rock", "texture", ["smooth", "rough"], new Set())` returns "A smooth rock" or "A rough rock"
  - Returns `null` for empty values array: `resolveTemplate("Something [colour]", "colour", [], new Set())` returns `null`
  - With only one value available, always returns that value resolved
  - Run deduplication stress test: resolve the same template multiple times until exhaustion, verify all results are unique and final call returns `null`

## Files to Create/Modify

- `src/lib/templates.test.ts` — create unit tests for template resolution

## Checklist

- [x] Implemented
- [x] Verified

## Verification

- **Check**: All tests pass
- **Command**: `npx vitest run src/lib/templates.test.ts`

## Commit

`test(templates): add unit tests for template resolution and deduplication`
