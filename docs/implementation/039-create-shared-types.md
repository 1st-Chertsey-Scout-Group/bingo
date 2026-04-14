# Step 039: Create Shared Types

## Description
Create the shared type definitions used across client and server code. These types define the shape of game state, socket event payloads, and data structures passed between components.

## Requirements
- Create `src/types.ts`
- Define and export the following types:

```typescript
type Team = {
  id: string
  index: number
  name: string
  colour: string
  gameId: string
}

type RoundItem = {
  id: string
  itemId: string
  displayName: string
  claimedByTeamId: string | null
  claimedByTeamName: string | null
  claimedByTeamColour: string | null
  status: 'open' | 'pending' | 'claimed'
}

type SubmissionStatus = 'pending' | 'approved' | 'rejected' | 'discarded'

type TeamSummary = {
  teamId: string
  teamName: string
  teamColour: string
  claimedCount: number
}

type SubmissionForReview = {
  id: string
  roundItemId: string
  displayName: string
  photoUrl: string
  teamId: string
  teamName: string
  teamColour: string
}

type BoardItem = {
  itemId: string
  displayName: string
}

type GameState = {
  status: 'lobby' | 'active' | 'ended'
  teams: Team[]
  board: RoundItem[]
  myTeam: Team | null
  mySubmissions: Map<string, SubmissionStatus>
  summary: TeamSummary[] | null
  roundStartedAt: string | null
  locks: Map<string, string>
  reviewingRoundItemId: string | null
}

type GameAction =
  | { type: 'GAME_STARTED'; items: RoundItem[]; roundStartedAt: string }
  | { type: 'SQUARE_CLAIMED'; roundItemId: string; teamId: string; teamName: string; teamColour: string }
  | { type: 'SQUARE_PENDING'; roundItemId: string }
  | { type: 'SQUARE_LOCKED'; roundItemId: string; leaderName: string }
  | { type: 'SQUARE_UNLOCKED'; roundItemId: string }
  | { type: 'SUBMISSION_RECEIVED'; itemId: string }
  | { type: 'SUBMISSION_APPROVED'; itemId: string }
  | { type: 'SUBMISSION_REJECTED'; itemId: string }
  | { type: 'SUBMISSION_DISCARDED'; itemId: string }
  | { type: 'REVIEW_PROMOTED'; roundItemId: string; submission: SubmissionForReview }
  | { type: 'GAME_ENDED'; summary: TeamSummary[] }
  | { type: 'GAME_LOBBY' }
  | { type: 'LOBBY_TEAMS'; teams: Team[] }
  | { type: 'FULL_STATE'; state: GameState }
```

- All types must use `type` keyword, not `interface`
- Named exports only
- No `any` types
- File should have no runtime code, only type definitions

## Files to Create/Modify
- `src/types.ts` — create all shared type definitions

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: All types are exported from `src/types.ts`
- **Command**: `cat src/types.ts`
- **Check**: TypeScript compiles without errors
- **Command**: `npx tsc --noEmit`

## Commit
`feat(types): add shared type definitions for game state and socket events`
