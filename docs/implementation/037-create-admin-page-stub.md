# Step 037: Create Admin Page Stub

## Description
Create the admin page as a simple server component with a placeholder UI. The admin page will later allow creating and managing games. No authentication or PIN protection is added in this step.

## Requirements
- Create `src/app/admin/page.tsx`
- Server component (no `'use client'` directive)
- Render a centered layout with:
  - "Admin" as an `<h1>` heading
  - A placeholder `<p>` with text "Game management coming soon"
- Use Tailwind CSS classes for centering
- No PIN protection or authentication in this step

## Files to Create/Modify
- `src/app/admin/page.tsx` — create the admin page stub

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: File exists and renders heading text
- **Command**: `cat src/app/admin/page.tsx`
- **Check**: Page loads at `/admin` in the browser without errors

## Commit
`feat(ui): create admin page stub`
