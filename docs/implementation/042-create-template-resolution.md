# Step 042: Create Template Resolution

## Description
Create the template resolution module that substitutes placeholders in bingo item names with random values. For example, "Something [colour]" becomes "Something Red". This enables dynamic board variety across rounds.

## Requirements
- Create `src/lib/templates.ts`
- Export `resolveTemplate(templateName: string, category: string, values: string[], usedValues: Set<string>): string | null`
- The function must:
  - Identify the placeholder in the template name (e.g., `[colour]` or `[texture]`)
  - Filter `values` to exclude any that appear in `usedValues` (matched as the full resolved name, not just the value)
  - Pick a random value from the remaining available values
  - Replace the placeholder bracket expression with the chosen value
  - Add the resolved name to `usedValues` (mutate the Set)
  - Return the resolved name string
  - Return `null` if all values for that category are exhausted (no available values remain)
- Placeholder format: `[category]` where category matches the `category` parameter
- The function should handle templates with exactly one placeholder

## Files to Create/Modify
- `src/lib/templates.ts` — create template resolution function

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: File exports `resolveTemplate` function
- **Command**: `cat src/lib/templates.ts`
- **Check**: TypeScript compiles without errors
- **Command**: `npx tsc --noEmit`

## Commit
`feat(templates): add template resolution with placeholder substitution`
