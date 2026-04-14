# Step 034: Create Landing Page Stub

## Description
Create the landing page as a simple server component. This is the entry point for scouts who will enter a game PIN to join. For now it renders a placeholder UI to verify routing works.

## Requirements
- Create `src/app/page.tsx`
- Server component (no `'use client'` directive)
- Render a centered layout with:
  - "Scout Bingo" as an `<h1>` heading
  - A placeholder `<p>` with text "Enter your game PIN to join"
  - No functional PIN input yet (just visual placeholder)
- Use Tailwind CSS classes for centering (e.g., `flex min-h-screen items-center justify-center flex-col gap-4`)
- Named export: `export function LandingPage()` as the page component, or use the Next.js default export convention for pages

## Files to Create/Modify
- `src/app/page.tsx` — create the landing page stub

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: File exists and renders heading text
- **Command**: `cat src/app/page.tsx`
- **Check**: Page loads at `/` in the browser without errors

## Commit
`feat(ui): create landing page stub with placeholder PIN entry`
