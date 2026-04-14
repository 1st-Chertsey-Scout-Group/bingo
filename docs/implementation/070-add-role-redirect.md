# Step 070: Handle Leader Role PIN Validation

## Description
When a leader PIN is validated, transition the form to collect the leader's display name before redirecting. This two-step flow ensures the leader provides a name for the lobby display.

## Requirements
- Track a `phase` state in the PIN form component: `'pin'` or `'leader-name'`
- When POST /api/validate returns `{ valid: true, role: "leader" }`:
  - Set phase to `'leader-name'`
  - Store `gameId` from response in component state
  - Store the entered PIN in component state as `validatedPin`
- When phase is `'leader-name'`:
  - Hide the PIN input and Join button
  - Show a new form section (handled in detail by step 071)
  - For now, render placeholder text "Enter your name to continue as leader"
- The transition should feel smooth (the card layout stays the same, just the inner content changes)
- Back button or ability to return to PIN entry phase (optional but recommended)

## Files to Create/Modify
- `src/app/page.tsx` — add phase state management and leader role handling

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: Leader PIN validation transitions form to leader-name phase
- **Check**: PIN input is hidden in leader-name phase
- **Check**: gameId and validatedPin are preserved in state
- **Check**: Scout PIN flow is unaffected (still redirects immediately)

## Commit
`feat(ui): add leader role detection with form phase transition`
