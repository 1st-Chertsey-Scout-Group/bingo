# Step 068: Build Landing Page PIN Form

## Description

Replace the landing page placeholder with a functional PIN entry form. This is the primary entry point for all users joining a game and must be optimized for mobile touch interaction.

## Requirements

- Update `src/app/page.tsx` to render a client component for the PIN form (either make the page a client component or create a child client component)
- Centered card layout with:
  - "Scout Bingo" as `<h1>` heading, large and prominent
  - PIN input: 4-character numeric input, `inputMode="numeric"`, `pattern="[0-9]*"`, `maxLength={4}`, large font size for readability
  - "Join" button below the input, full width, large touch target (min 48px height)
- Error message area below the button (initially hidden)
- Disable the Join button when input has fewer than 4 characters
- Use shadcn Card, Input, and Button components
- High contrast text and controls for outdoor visibility
- Auto-focus the PIN input on page load

## Files to Create/Modify

- `src/app/page.tsx` — replace placeholder with PIN form UI

## Checklist

- [ ] Implemented
- [ ] Verified

## Verification

- **Check**: Page renders centered card with heading, input, and button
- **Check**: Input only accepts numeric characters and limits to 4
- **Check**: Join button is disabled when fewer than 4 digits entered
- **Check**: Input is auto-focused on page load
- **Check**: Layout is mobile-friendly with large touch targets

## Commit

`feat(ui): build landing page PIN entry form`
