# Step 080: Wire Leader Game Page to LeaderGame Component

## Description

Update the leader game page route to validate the gameId and render the LeaderGame component. This connects the URL to the leader experience.

## Requirements

- Update `src/app/leader/[gameId]/page.tsx`
  - Server component (no 'use client')
  - Extract `gameId` from route params
  - Query the Game by id using Prisma client
  - If game not found, call `notFound()` from `next/navigation`
  - If game found, render `<LeaderGame gameId={gameId} />`
  - Import LeaderGame from `@/components/LeaderGame`

## Files to Create/Modify

- `src/app/leader/[gameId]/page.tsx` — render LeaderGame with validation

## Checklist

- [ ] Implemented
- [ ] Verified

## Verification

- **Check**: Navigating to `/leader/{validGameId}` renders the LeaderGame component
- **Check**: Navigating to `/leader/{invalidGameId}` returns a 404 page
- **Command**: `npx tsc --noEmit`

## Commit

`feat(page): wire leader game page to LeaderGame component`
