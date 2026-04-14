# Step 146: Create Service Worker

## Description
Create a hand-written service worker that caches the app shell (HTML, CSS, JS bundles) so the app loads instantly from cache even in a dead zone. This is critical for the field environment — a scout who refreshes in a wooded area gets the cached UI immediately and reconnects when signal returns.

## Requirements
- Create `public/sw.js` — hand-written, no libraries (no Workbox)
- Cache name: `scout-bingo-shell-v1`
- **Install event**:
  - Open the cache
  - Add app shell assets to cache: `/`, and key static assets (CSS, JS bundles)
  - Use `self.skipWaiting()` to activate immediately
- **Activate event**:
  - Delete any old caches whose names don't match `scout-bingo-shell-v1`
  - Use `self.clients.claim()` to take control of all clients immediately
- **Fetch event** — two strategies based on request type:
  1. **Navigation requests** (mode === 'navigate'): Network-first
     - Try the network first
     - If network fails, fall back to the cached `/` (app shell)
  2. **Static assets** (JS, CSS, images matching app bundles): Cache-first
     - Check cache first
     - If not in cache, fetch from network and add to cache
  3. **Everything else** (API requests, socket connections, S3 photo URLs): Pass through to network only — do NOT cache
- Do NOT cache:
  - API responses (`/api/*`)
  - Socket.IO connections (`/socket.io/*`)
  - S3 photo URLs (external domain)
  - Any dynamic data
- Version the cache name so updates can bust the old cache (change `v1` to `v2` on breaking changes)

## Files to Create/Modify
- `public/sw.js` — Create the service worker with install, activate, and fetch handlers

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: After first load, service worker is registered and app shell is cached (DevTools > Application > Cache Storage)
- **Check**: Go offline in DevTools, refresh the page — app shell loads from cache
- **Check**: While offline, the ConnectionBanner appears (socket cannot connect) but the UI is usable
- **Check**: API calls and socket connections are NOT cached (Application > Cache Storage should not contain them)
- **Check**: When a new version is deployed (cache name changed), old cache is deleted on activate
- **Command**: In DevTools > Application > Service Workers — verify status is "activated and running"

## Commit
`feat(pwa): create hand-written service worker with network-first navigation and cache-first static assets`
