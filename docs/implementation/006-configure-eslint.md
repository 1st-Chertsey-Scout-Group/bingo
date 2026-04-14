# Step 006: Configure ESLint

## Description
Verify that ESLint is configured with Next.js defaults from create-next-app. The configuration should extend `next/core-web-vitals` which includes Next.js-specific linting rules and React best practices.

## Requirements
- ESLint configuration file must exist (`.eslintrc.json` or equivalent)
- Configuration must extend `"next/core-web-vitals"`
- The `eslint` and `eslint-config-next` packages must be installed (eslint-config-next is installed by create-next-app; eslint is a dev dependency from step 009)

## Files to Create/Modify
- `.eslintrc.json` — verify it exists and contains `"extends": "next/core-web-vitals"`. If not present, create it with:

```json
{
  "extends": "next/core-web-vitals"
}
```

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: ESLint configuration file exists with the correct extends value
- **Command**: `cat .eslintrc.json`
- **Check**: ESLint runs without configuration errors
- **Command**: `npx next lint`

## Commit
`chore(eslint): verify ESLint configuration with Next.js defaults`
