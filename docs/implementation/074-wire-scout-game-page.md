# Step 074: Wire Scout Game Page to ScoutGame Component

## Description

Update the /play/[gameId] page to validate the game exists on the server and render the ScoutGame client component. This connects the routing layer to the scout game experience.

## Requirements

- Update `src/app/play/[gameId]/page.tsx` as a server component
- Extract `gameId` from route params
- Query the database for the Game by `id` using the Prisma client
  - If the game does not exist, call `notFound()` from `next/navigation` to render the 404 page
- Import and render `ScoutGame` component, passing `gameId` as a prop
- The page itself is a server component; ScoutGame is the client boundary
- Example structure:

  ```tsx
  import { notFound } from 'next/navigation'
  import { prisma } from '@/lib/prisma'
  import { ScoutGame } from '@/components/ScoutGame'

  export default async function PlayPage({
    params,
  }: {
    params: { gameId: string }
  }) {
    const game = await prisma.game.findUnique({ where: { id: params.gameId } })
    if (!game) notFound()
    return <ScoutGame gameId={params.gameId} />
  }
  ```

## Files to Create/Modify

- `src/app/play/[gameId]/page.tsx` — update to validate game and render ScoutGame

## Checklist

- [x] Implemented
- [x] Verified

## Verification

- **Check**: Visiting `/play/[validGameId]` renders ScoutGame component
- **Check**: Visiting `/play/[invalidGameId]` renders 404 page
- **Check**: gameId prop is correctly passed to ScoutGame
- **Command**: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/play/nonexistent`

## Commit

`feat(scout): wire /play/[gameId] page to ScoutGame component with server validation`
