# Step 001: Create Devcontainer Configuration

## Description

Create the devcontainer configuration so the development environment has the correct Node.js version, extensions, and settings from the start. All subsequent steps run inside this container.

## Requirements

- Create `.devcontainer/devcontainer.json`
- Use the official Node 20 devcontainer image: `mcr.microsoft.com/devcontainers/javascript-node:20`
- Add the Claude Code passthrough feature: `ghcr.io/timcane/devcontainer-features/claude-code-passthrough:0`
- Forward port 3000 for the dev server
- Configure VS Code extensions:
  - `Prisma.prisma` — Prisma schema syntax highlighting and formatting
  - `bradlc.vscode-tailwindcss` — Tailwind CSS IntelliSense
  - `dbaeumer.vscode-eslint` — ESLint integration
  - `esbenp.prettier-vscode` — Prettier formatting
- Configure VS Code settings:
  - `editor.defaultFormatter`: `esbenp.prettier-vscode`
  - `editor.formatOnSave`: `true`

## Files to Create/Modify

- `.devcontainer/devcontainer.json` — create with the full devcontainer configuration

## Checklist

- [x] Implemented
- [x] Verified

## Verification

- **Check**: `.devcontainer/devcontainer.json` exists and is valid JSON
- **Command**: `cat .devcontainer/devcontainer.json | npx -y json5 --validate` (or open in VS Code — it validates JSON automatically)
- **Check**: Rebuilding the devcontainer succeeds and drops you into a Node 20 environment
- **Command**: `node --version` (should output v20.x.x)

## Commit

`chore(devcontainer): add devcontainer config with Node 20, extensions, and format-on-save`
