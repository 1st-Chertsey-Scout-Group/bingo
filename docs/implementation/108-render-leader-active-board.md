# Step 108: Render Leader Active Board

## Description
When the game status is 'active', the LeaderGame component renders the Board component with the RoundHeader above it. This gives leaders the visual bingo board they use to monitor progress and tap squares to review submissions.

## Requirements
- In LeaderGame, when `status === 'active'`, render the Board component with `role="leader"` prop
- Render the RoundHeader component above the Board (built in step 109)
- Pass the board array from game state to the Board component
- Pass an `onSquareTap` handler that accepts a `roundItemId` — this will be wired to emit `review:open` in step 115
- For now, the onSquareTap handler can be a no-op or console.log placeholder
- Board should be full-screen landscape layout optimized for the leader's device

## Files to Create/Modify
- `src/components/LeaderGame.tsx` — Add conditional rendering for active state: render RoundHeader + Board with role='leader' and onSquareTap handler

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: When game starts, leader sees the bingo board with all square names displayed
- **Check**: Board renders in landscape-friendly layout
- **Check**: Tapping a square logs the roundItemId (placeholder until step 115)

## Commit
`feat(client): render leader board and RoundHeader when game is active`
