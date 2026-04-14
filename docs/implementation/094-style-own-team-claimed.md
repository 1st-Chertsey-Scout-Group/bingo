# Step 094: Style Own Team Claimed Square

## Description
Add celebratory styling for squares claimed by the scout's own team. These squares use the team colour as background and show a checkmark to indicate success.

## Requirements
- In `src/components/Square.tsx`, add conditional styling when `isOwnTeam && roundItem.claimedByTeamId !== null`
- Own-team claimed styling:
  - Background: inline `style={{ backgroundColor: roundItem.claimedByTeamColour }}` for dynamic team colour
  - Text colour: `text-white` (all team colours are dark enough for white text)
  - Border: none (`border-0` or `border-transparent`)
  - No pointer/active states: `cursor-default`
  - Display a checkmark icon: import `Check` from `lucide-react`
    - Render `<Check className="w-4 h-4 text-white absolute top-1 right-1" />` in the corner
    - Square needs `relative` positioning for the absolute checkmark
  - Item display name still shown in white text
- The square should feel "won" — visually distinct and satisfying

## Files to Create/Modify
- `src/components/Square.tsx` — add own-team claimed state styling with checkmark

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: Own-team claimed squares display the team's colour as background
- **Check**: A white checkmark icon appears in the top-right corner
- **Check**: Item name is shown in white text over the team colour
- **Check**: Square is not interactive (no hover/active states)
- **Command**: `npx tsc --noEmit`

## Commit
`style(ui): add own-team claimed square styling with checkmark`
