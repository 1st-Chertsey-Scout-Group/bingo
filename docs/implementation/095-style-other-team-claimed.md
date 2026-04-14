# Step 095: Style Other Team Claimed Square

## Description
Add styling for squares claimed by another team. These show the claiming team's colour and an abbreviation of their team name so scouts can see who got there first.

## Requirements
- In `src/components/Square.tsx`, add conditional styling when `!isOwnTeam && roundItem.claimedByTeamId !== null`
- Other-team claimed styling:
  - Background: inline `style={{ backgroundColor: roundItem.claimedByTeamColour }}` with reduced opacity
  - Apply opacity via Tailwind: wrap colour in a container or use `style={{ backgroundColor: roundItem.claimedByTeamColour, opacity: 0.7 }}`
  - Text colour: `text-white`
  - Border: none
  - No pointer/active states: `cursor-default`
  - Show team abbreviation in a small badge area:
    - Extract abbreviation from team name: first word + first letter of second word (e.g., "Red R." from "Red Rabbits")
    - Helper function: `getTeamAbbreviation(name: string): string` — split by space, return `parts[0] + ' ' + parts[1][0] + '.'`
    - Render abbreviation in `text-[10px] font-bold absolute bottom-1 right-1`
  - Item display name still shown

## Files to Create/Modify
- `src/components/Square.tsx` — add other-team claimed state styling with team abbreviation

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: Other-team claimed squares show that team's colour at reduced opacity
- **Check**: Team abbreviation (e.g., "Red R.") appears in the bottom-right corner
- **Check**: Item name is still visible
- **Check**: Square is not interactive
- **Command**: `npx tsc --noEmit`

## Commit
`style(ui): add other-team claimed square styling with abbreviation`
