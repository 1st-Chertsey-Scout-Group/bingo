# Step 005: Configure Prettier

## Description
Create the Prettier configuration file to enforce consistent code formatting across the project. This config uses no semicolons, single quotes, and integrates with Tailwind CSS for automatic class sorting.

## Requirements
- Create `.prettierrc` at the project root
- Set `semi` to `false`
- Set `singleQuote` to `true`
- Set `tabWidth` to `2`
- Set `trailingComma` to `"all"`
- Include `prettier-plugin-tailwindcss` in the plugins array
- The Prettier dev dependency must already be installed (see step 009)

## Files to Create/Modify
- `.prettierrc` — create with the following exact content:

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "all",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: `.prettierrc` exists and contains valid JSON with all required settings
- **Command**: `cat .prettierrc`
- **Check**: Prettier runs without errors using this config
- **Command**: `npx prettier --check src/app/layout.tsx`

## Commit
`chore(prettier): add Prettier configuration with Tailwind plugin`
