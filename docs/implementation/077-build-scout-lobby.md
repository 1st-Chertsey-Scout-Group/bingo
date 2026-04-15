# Step 077: Build Scout Lobby Components

## Description

Create the scout lobby UI that shows the assigned team identity and a live list of all teams in the lobby. This is screen S2 from the spec — the waiting room before the round starts.

## Requirements

- Create `src/components/TeamBadge.tsx`
  - 'use client' directive
  - Props: `{ name: string, colour: string }`
  - Renders a small pill/badge with the team name as text and the team colour as background
  - Text colour: white, font-weight: semibold, padding: `px-3 py-1`, rounded-full
  - Use inline `style={{ backgroundColor: colour }}` for the dynamic colour
- Create `src/components/Lobby.tsx`
  - 'use client' directive
  - Props: `{ myTeam: { name: string, colour: string } | null, teams: Team[], role: 'scout' | 'leader' }`
  - Scout view (when `role === 'scout'`):
    - Hero section: "You are:" label in small text, then the team name in large bold text (`text-3xl font-bold`)
    - Hero background uses the team colour via inline style
    - Text colour: white, padding: `p-6`, rounded-xl, centered text
    - Below hero: "Waiting for the leader to start..." in muted text (`text-muted-foreground`)
    - Scrollable list of all teams using TeamBadge for each, wrapped in `flex flex-wrap gap-2`
  - Named exports for both components

## Files to Create/Modify

- `src/components/TeamBadge.tsx` — create team colour badge component
- `src/components/Lobby.tsx` — create lobby component with scout view

## Checklist

- [x] Implemented
- [x] Verified

## Verification

- **Check**: TeamBadge renders with correct background colour and white text
- **Check**: Lobby displays "You are: [Team Name]" with team colour background
- **Check**: Lobby shows "Waiting for the leader to start..." message
- **Check**: All teams in the list render as TeamBadge components
- **Command**: `npx tsc --noEmit`

## Commit

`feat(ui): build scout lobby and team badge components`
