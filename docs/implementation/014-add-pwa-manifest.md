# Step 014: Add PWA Manifest

## Description

Create the web app manifest file that enables Progressive Web App (PWA) features. This allows the app to be installed on mobile devices and provides metadata for the home screen icon, splash screen, and standalone display mode.

## Requirements

- Create `public/manifest.json` at the project root's public directory
- Set `name` to `"Scout Bingo"`
- Set `short_name` to `"Bingo"`
- Set `start_url` to `"/"`
- Set `display` to `"standalone"`
- Set `background_color` to `"#ffffff"`
- Set `theme_color` to `"#16a34a"` (green-600, appropriate for a nature/scout theme)
- Include an `icons` array with placeholder entries for:
  - 192x192 icon (`icon-192x192.png`)
  - 512x512 icon (`icon-512x512.png`)
- Icons reference files in the `/` public path (actual icon files can be added later)

## Files to Create/Modify

- `public/manifest.json` — create with the following content:

```json
{
  "name": "Scout Bingo",
  "short_name": "Bingo",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#16a34a",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## Checklist

- [x] Implemented
- [x] Verified

## Verification

- **Check**: `public/manifest.json` exists and is valid JSON
- **Command**: `cat public/manifest.json`
- **Command**: `node -e "JSON.parse(require('fs').readFileSync('public/manifest.json', 'utf8'))"`

## Commit

`feat(pwa): add web app manifest for standalone mobile experience`
