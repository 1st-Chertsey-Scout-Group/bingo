# Step 085: Add Start Round Button to Leader Lobby

## Description
Add the "Start Round" button to the leader lobby. The button is only enabled when at least 2 teams have joined, preventing games from starting with too few players.

## Requirements
- In `src/components/Lobby.tsx` (leader view), add a "Start Round" button
- Props addition: `onStartRound?: () => void`
- Button specs:
  - Use shadcn Button component
  - Text: "Start Round"
  - Variant: default (primary)
  - Size: `lg` for large touch target
  - Full width: `w-full`
  - Additional classes: `mt-6 text-lg h-14`
  - Disabled when `teams.length < 2`
  - On click: call `onStartRound()` callback
- In `src/components/LeaderGame.tsx`, wire the callback:
  - Pass `onStartRound` to Lobby that emits `game:start` via socket: `socket.emit('game:start', {})`
- When disabled, show helper text below: "Need at least 2 teams to start" in `text-sm text-muted-foreground`

## Files to Create/Modify
- `src/components/Lobby.tsx` — add Start Round button with enabled/disabled logic
- `src/components/LeaderGame.tsx` — wire onStartRound callback to socket emit

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: Button is disabled and shows helper text when fewer than 2 teams
- **Check**: Button becomes enabled when 2 or more teams have joined
- **Check**: Clicking the button emits `game:start` socket event with empty payload
- **Command**: `npx tsc --noEmit`

## Commit
`feat(ui): add start round button to leader lobby`
