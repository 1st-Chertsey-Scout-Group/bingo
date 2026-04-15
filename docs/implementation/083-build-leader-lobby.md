# Step 083: Build Leader Lobby View

## Description

Add the leader-specific lobby view showing both PINs prominently and a list of joined teams. This is screen L2 from the spec, giving leaders the information they need to onboard scouts.

## Requirements

- Modify `src/components/Lobby.tsx` to handle `role === 'leader'`
- Add props: `gamePin?: string`, `leaderPin?: string`
- Leader view layout:
  - PIN display section: two cards side by side in a flex row (`flex gap-4 justify-center`)
    - Each card: rounded-xl, padded (`p-4`), centered text
    - Left card: label "Scout PIN" in small muted text, PIN value in `text-4xl font-mono font-bold`
    - Right card: label "Leader PIN" in small muted text, PIN value in `text-4xl font-mono font-bold`
  - Teams section: heading "Teams Joined ({count})", then list of TeamBadge components in `flex flex-wrap gap-2`
  - "Start Round" button placeholder (`<div id="start-round-slot" />`) — wired in step 085
- When no teams have joined, show "Waiting for scouts to join..." in muted text

## Files to Create/Modify

- `src/components/Lobby.tsx` — add leader view branch with PIN display and team list

## Checklist

- [x] Implemented
- [x] Verified

## Verification

- **Check**: Leader lobby displays both Scout PIN and Leader PIN in large monospace font
- **Check**: Team list updates as scouts join
- **Check**: Empty state shows "Waiting for scouts to join..."
- **Command**: `npx tsc --noEmit`

## Commit

`feat(ui): build leader lobby view with PIN display`
