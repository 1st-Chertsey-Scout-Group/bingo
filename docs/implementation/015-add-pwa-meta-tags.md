# Step 015: Add PWA Meta Tags

## Description
Add PWA-related meta tags and link elements to the root layout so that mobile browsers recognize the app as installable and render it correctly in standalone mode, especially on iOS devices.

## Requirements
- Add the following elements to `src/app/layout.tsx` inside the `<head>` (via Next.js metadata/links):
  - `<link rel="manifest" href="/manifest.json">` — link to the PWA manifest
  - `<meta name="theme-color" content="#16a34a">` — browser chrome color
  - `<meta name="apple-mobile-web-app-capable" content="yes">` — iOS standalone mode
  - `<meta name="apple-mobile-web-app-status-bar-style" content="default">` — iOS status bar style
- These can be added via the Next.js `metadata` export or directly in the `<head>` using Next.js conventions

## Files to Create/Modify
- `src/app/layout.tsx` — update the metadata export and add manifest link. The updated file should include:

```typescript
export const metadata: Metadata = {
  title: 'Scout Bingo',
  description: 'Nature bingo game for Scout groups',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}
```

The `viewport` export should already include `themeColor`:
```typescript
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#16a34a',
}
```

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: Root layout metadata includes manifest and PWA settings
- **Command**: `cat src/app/layout.tsx`
- **Check**: The rendered HTML includes the manifest link and PWA meta tags
- **Command**: `npm run dev` (then view page source at http://localhost:3000 and check for manifest link, theme-color, and apple-mobile-web-app-capable)

## Commit
`feat(pwa): add PWA meta tags for mobile app experience`
