# Step 012: Add shadcn/ui Components

> **MANUAL STEP** — requires human action.

## Description
Add all required shadcn/ui components to the project. These pre-built components provide accessible, styled UI elements used throughout the application for buttons, cards, dialogs, forms, and notifications.

## Requirements
- Add the following shadcn/ui components using the CLI:
  - `button` — primary action buttons throughout the app
  - `card` — card containers for game panels, team displays
  - `dialog` — modal dialogs for confirmations, settings
  - `input` — text input fields for game PIN, team name, etc.
  - `label` — form labels for accessibility
  - `slider` — slider controls for board size and template count settings
  - `badge` — status badges for submission states
  - `toast` — toast notifications via Sonner integration
  - `separator` — visual dividers between content sections
- Each component is added to `src/components/ui/` directory
- Run the add command for each component or all at once

## Files to Create/Modify
- `src/components/ui/button.tsx` — button component
- `src/components/ui/card.tsx` — card component
- `src/components/ui/dialog.tsx` — dialog component
- `src/components/ui/input.tsx` — input component
- `src/components/ui/label.tsx` — label component
- `src/components/ui/slider.tsx` — slider component
- `src/components/ui/badge.tsx` — badge component
- `src/components/ui/sonner.tsx` — Sonner toast wrapper component
- `src/components/ui/separator.tsx` — separator component

## Checklist
- [x] Implemented
- [x] Verified

## Verification
- **Check**: All components are installed
- **Command**: `npx shadcn@latest add button card dialog input label slider badge toast separator`
- **Check**: Component files exist in the ui directory
- **Command**: `ls src/components/ui/`

## Commit
`feat(ui): add shadcn/ui components (button, card, dialog, input, label, slider, badge, toast, separator)`
