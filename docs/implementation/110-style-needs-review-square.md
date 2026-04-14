# Step 110: Style Needs-Review Square for Leader View

## Description
Add visual styling to board squares that have pending submissions awaiting review. This is the highest-priority visual state for leaders, drawing their attention to squares that need action.

## Requirements
- In the Square component, when `role === 'leader'`: apply needs-review styling when `hasPendingSubmissions === true` AND `claimedByTeamId === null` AND `lockedByLeader === null`
- Visual treatment: amber/orange pulsing border animation
- Use CSS animation or Tailwind's `animate-pulse` with a custom amber/orange colour (e.g. `border-amber-500`)
- This is the highest visual priority state — it should stand out above all other states
- The square should appear tappable/interactive (cursor-pointer)
- Square text (item name) remains readable

## Files to Create/Modify
- `src/components/Square.tsx` — Add conditional CSS classes for the needs-review state when role is 'leader'. Add animation keyframes if using custom CSS.
- `src/app/globals.css` — Add custom animation keyframes if not using Tailwind built-in (e.g. `@keyframes pulse-amber`)

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: Squares with pending submissions show an amber/orange pulsing border on the leader's board
- **Check**: The animation is smooth and not distracting but clearly visible
- **Check**: Claimed squares do NOT show the pulsing effect even if they had prior pending submissions
- **Check**: Locked squares do NOT show the pulsing effect

## Commit
`feat(client): add amber pulsing border to needs-review squares on leader board`
