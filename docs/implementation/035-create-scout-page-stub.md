# Step 035: Create Scout Page Stub

## Description

Create the scout (player) page as a server component that validates the game ID from the URL and renders a placeholder. This establishes the dynamic route and database validation pattern used by player-facing pages.

## Requirements

- Create `src/app/play/[gameId]/page.tsx`
- Server component (async, no `'use client'` directive)
- Receive `params` with `gameId: string` from the dynamic route
- Query the database using Prisma to check if a game with the given `gameId` exists
- If the game does not exist, call `notFound()` from `next/navigation` to return a 404
- If the game exists, render a placeholder `<div>` with text "Scout View - {gameId}"
- Import the Prisma client from `@/lib/prisma`
- Use Tailwind CSS for basic centering

## Files to Create/Modify

- `src/app/play/[gameId]/page.tsx` — create the scout page stub with game validation

## Checklist

- [ ] Implemented
- [ ] Verified

## Verification

- **Check**: File exists with correct dynamic route structure
- **Command**: `cat src/app/play/\\[gameId\\]/page.tsx`
- **Check**: Navigating to `/play/nonexistent-id` returns 404
- **Check**: Prisma `findUnique` is called with the gameId parameter

## Commit

`feat(ui): create scout page stub with game ID validation`
