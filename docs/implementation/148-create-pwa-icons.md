# Step 148: Create PWA Icons

> **MANUAL STEP** — requires human action.

## Description
Create the required PWA icon files so the app is installable on mobile devices. The PWA manifest references these icons for the home screen and splash screen.

## Requirements
- Create `public/icons/icon-192.png` — 192x192 pixels, PNG format
- Create `public/icons/icon-512.png` — 512x512 pixels, PNG format
- Icons can be simple placeholder designs:
  - Solid background colour (e.g. the app's theme colour)
  - "SB" text centred on the icon
  - Or a simple nature/bingo-related graphic
- Icons must match the paths referenced in the PWA manifest (`/icons/icon-192.png` and `/icons/icon-512.png`)
- Tools you can use: Figma, Canva, any image editor, or an online PWA icon generator (e.g. realfavicongenerator.net)
- Ensure icons have no transparency if targeting Android (Android uses the icon as-is for the home screen)

## Files to Create/Modify
- `public/icons/icon-192.png` — 192x192 PWA icon
- `public/icons/icon-512.png` — 512x512 PWA icon

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: Both files exist at the correct paths: `public/icons/icon-192.png` and `public/icons/icon-512.png`
- **Check**: Files are valid PNG images at the correct dimensions
- **Check**: PWA installability check passes in DevTools > Application > Manifest (no icon warnings)
- **Command**: `file public/icons/icon-192.png public/icons/icon-512.png` — should report PNG image data with correct dimensions

## Commit
`chore(pwa): add placeholder PWA icons (192x192 and 512x512)`
