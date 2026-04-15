# Step 111: Style Locked Square for Leader View

## Description

Add visual styling to board squares that are currently locked by a leader for review. This prevents other leaders from tapping the same square and shows who is reviewing it.

## Requirements

- In the Square component, when `role === 'leader'`: apply locked styling when `lockedByLeader !== null` AND `claimedByTeamId === null`
- Visual treatment: dimmed/muted appearance (e.g. reduced opacity or greyed out background)
- Leader name overlay text displayed on the square (e.g. "Tim" in small text)
- Square should NOT be tappable by other leaders (no cursor-pointer, no hover effects)
- Lower visual priority than needs-review (needs-review state takes precedence)
- If the current leader holds the lock, the square is also dimmed (they interact via the modal instead)

## Files to Create/Modify

- `src/components/Square.tsx` — Add conditional CSS classes for the locked state when role is 'leader'. Add leader name overlay text.

## Checklist

- [x] Implemented
- [x] Verified

## Verification

- **Check**: Locked squares appear dimmed with the locking leader's name visible
- **Check**: Locked squares are not interactive (no click handler fires)
- **Check**: When a lock is released, the square returns to its normal state

## Commit

`feat(client): add dimmed styling with leader name overlay to locked squares`
