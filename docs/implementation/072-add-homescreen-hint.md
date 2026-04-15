# Step 072: Add Home Screen Hint Banner

## Description

Add a dismissable "Add to Home Screen" banner to the landing page. This one-time hint improves the PWA experience by encouraging scouts to install the app, and never shows again once dismissed.

## Requirements

- Add a banner component at the top of the landing page (above the PIN card)
- Banner text: "Add to Home Screen for the best experience"
- Include a dismiss button (X icon or "Dismiss" text) on the right side of the banner
- On mount, check localStorage for key `homescreen-hint-dismissed`
  - If the key exists (value is `"true"`), do not render the banner
  - If the key does not exist, render the banner
- On dismiss click:
  - Set localStorage key `homescreen-hint-dismissed` to `"true"`
  - Hide the banner immediately (update component state)
- Visual design:
  - Subtle, non-blocking appearance (e.g., light background, small text)
  - Does not obstruct the PIN form
  - Positioned at the top of the viewport or above the card
  - Responsive width, works on mobile
- If localStorage is unavailable, do not render the banner (fail silently)

## Files to Create/Modify

- `src/app/page.tsx` — add the homescreen hint banner to the landing page

## Checklist

- [x] Implemented
- [x] Verified

## Verification

- **Check**: Banner appears on first visit
- **Check**: Dismissing the banner hides it immediately
- **Check**: Banner does not appear on subsequent visits after dismissal
- **Check**: Banner does not block or overlap the PIN form
- **Check**: Works correctly when localStorage is unavailable

## Commit

`feat(ui): add dismissable home screen hint banner`
