# Step 004: Create Server TypeScript Configuration

## Description
Create a separate TypeScript configuration file for the custom server (Socket.IO + Next.js). This config extends the main tsconfig.json but overrides settings needed for server-side compilation to CommonJS output.

## Requirements
- Create `tsconfig.server.json` at the project root
- Must extend `./tsconfig.json`
- Must set `module` to `commonjs`
- Must set `outDir` to `dist`
- Must set `noEmit` to `false` (overriding the Next.js default of `true`)
- Must include `server.ts`, `src/server/**/*`, and `src/lib/prisma.ts`

## Files to Create/Modify
- `tsconfig.server.json` — create with the following exact content:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "commonjs",
    "outDir": "dist",
    "noEmit": false
  },
  "include": ["server.ts", "src/server/**/*", "src/lib/prisma.ts"]
}
```

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: `tsconfig.server.json` exists at the project root and contains the correct configuration
- **Command**: `cat tsconfig.server.json`
- **Check**: The file is valid JSON
- **Command**: `node -e "require('./tsconfig.server.json')"`

## Commit
`chore(ts): add server TypeScript configuration for Socket.IO build`
