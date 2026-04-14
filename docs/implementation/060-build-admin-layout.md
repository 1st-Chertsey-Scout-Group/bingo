# Step 060: Build Admin Page Layout

## Description

Build the admin page as a client component with PIN-based authentication. The admin must enter the admin PIN before accessing any functionality, providing a simple gate without full auth infrastructure.

## Requirements

- Create `src/app/admin/page.tsx` as a `'use client'` component
- On initial load, display a PIN entry form:
  - Text input for admin PIN (type="password")
  - "Authenticate" submit button
  - Error message area for invalid PIN feedback
- On submit, verify the PIN by making a test request to GET /api/items with the entered PIN as `X-Admin-Pin` header
  - If 200: store the PIN in component state, show the admin interface
  - If 401: display "Invalid admin PIN" error message
- Once authenticated, render two sections:
  - Game Creation section (placeholder for step 061)
  - Item Management section (placeholder for step 064)
- Store `adminPin` in component state (not localStorage, for security)
- Pass `adminPin` down to child components via props or context

## Files to Create/Modify

- `src/app/admin/page.tsx` — create the admin page with PIN gate

## Checklist

- [ ] Implemented
- [ ] Verified

## Verification

- **Check**: Page loads at `/admin` and shows PIN input
- **Check**: Invalid PIN shows error message
- **Check**: Valid PIN reveals admin interface sections
- **Check**: Admin PIN is not persisted to localStorage

## Commit

`feat(admin): build admin page with PIN authentication gate`
