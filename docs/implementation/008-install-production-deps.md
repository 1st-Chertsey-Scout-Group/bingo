# Step 008: Install Production Dependencies

> **MANUAL STEP** — requires human action.

## Description
Install all production npm dependencies required by the Scout Bingo application. These packages provide the core framework, real-time communication, database access, file storage, and UI components.

## Requirements
- All packages must be installed as production dependencies (not dev dependencies)
- Install the following exact packages:
  - `next` — React framework with App Router
  - `react` — UI library
  - `react-dom` — React DOM renderer
  - `socket.io` — WebSocket server for real-time communication
  - `socket.io-client` — WebSocket client for real-time communication
  - `@prisma/client` — Prisma database client for SQLite
  - `@aws-sdk/client-s3` — AWS S3 client for photo storage
  - `@aws-sdk/s3-request-presigner` — S3 presigned URL generation
  - `browser-image-compression` — Client-side image compression before upload
  - `sonner` — Toast notification library
  - `tailwindcss` — Utility-first CSS framework
  - `@tailwindcss/postcss` — Tailwind CSS PostCSS plugin
  - `class-variance-authority` — Component variant utility (used by shadcn/ui)
  - `clsx` — Conditional class name utility
  - `tailwind-merge` — Tailwind class deduplication utility
  - `lucide-react` — Icon library

## Files to Create/Modify
- `package.json` — updated with production dependencies in the `dependencies` section

## Checklist
- [x] Implemented
- [x] Verified

## Verification
- **Check**: All production packages are listed in `package.json` under `dependencies`
- **Command**: `npm install next react react-dom socket.io socket.io-client @prisma/client @aws-sdk/client-s3 @aws-sdk/s3-request-presigner browser-image-compression sonner tailwindcss @tailwindcss/postcss class-variance-authority clsx tailwind-merge lucide-react`
- **Check**: `node_modules` directory exists and packages are installed
- **Command**: `ls node_modules/socket.io node_modules/@prisma/client node_modules/sonner node_modules/lucide-react`

## Commit
`chore(deps): install production dependencies`
