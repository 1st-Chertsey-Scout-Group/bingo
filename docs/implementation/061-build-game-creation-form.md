# Step 061: Build Game Creation Form

## Description

Build the game creation form within the admin page. This form collects all parameters needed to start a new game and provides visual feedback on slider values.

## Requirements

- Create a `GameCreationForm` component (can be in admin page file or separate component file)
- Receives `adminPin: string` as prop
- Form fields:
  - Leader PIN: text input, maxLength 4, numeric pattern, required
  - Display name: text input, placeholder "Your name", required (this is the leader's display name)
  - Board size: range slider input, min 9, max 25, default 25, displays current value next to the slider
  - Template count: range slider input, min 0, max 10, default 5, displays current value next to the slider
- Template count max is dynamically capped at the current board size value (if boardSize is 15, template count max is 10 since 10 < 15; if boardSize is 9, template count max is 9)
- If the user reduces board size below the current template count, auto-reduce template count to match
- "Create Game" button, disabled while submitting
- All inputs use large touch targets and clear labels
- Use shadcn UI components (Input, Button, Label) where available

## Files to Create/Modify

- `src/app/admin/page.tsx` — add the game creation form to the admin interface

## Checklist

- [ ] Implemented
- [ ] Verified

## Verification

- **Check**: Form renders with all four fields
- **Check**: Board size slider shows current value and constrains to 9-25
- **Check**: Template count slider shows current value and constrains to 0-10
- **Check**: Reducing board size below template count auto-adjusts template count
- **Check**: Create Game button is present and becomes disabled during submission

## Commit

`feat(admin): build game creation form with sliders and validation`
