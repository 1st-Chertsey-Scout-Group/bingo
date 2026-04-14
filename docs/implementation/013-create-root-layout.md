# Step 013: Create Root Layout

## Description
Create or update the root layout component that wraps every page in the application. This sets up the HTML structure, global font, Tailwind CSS imports, toast notifications, and mobile-friendly viewport settings.

## Requirements
- Use `src/app/layout.tsx` as the root layout
- Import `src/app/globals.css` for Tailwind CSS styles
- Use the `Inter` font from `next/font/google`
- Set metadata:
  - `title`: `"Scout Bingo"`
  - `description`: `"Nature bingo game for Scout groups"`
- Add the `<Toaster />` component from `sonner` inside the body for toast notifications
- Set viewport meta for mobile: `width=device-width, initial-scale=1, viewport-fit=cover`
- The layout must export a default function that accepts `{ children: React.ReactNode }`
- Apply the Inter font className to the `<body>` element

## Files to Create/Modify
- `src/app/layout.tsx` — create/update with the following structure:

```typescript
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Scout Bingo',
  description: 'Nature bingo game for Scout groups',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
```

## Checklist
- [x] Implemented
- [x] Verified

## Verification
- **Check**: Root layout file exists with correct imports and structure
- **Command**: `cat src/app/layout.tsx`
- **Check**: The dev server renders the page without errors
- **Command**: `npm run dev` (then visit http://localhost:3000 and check for "Scout Bingo" in the page title)

## Commit
`feat(layout): create root layout with Inter font, Sonner toaster, and mobile viewport`
