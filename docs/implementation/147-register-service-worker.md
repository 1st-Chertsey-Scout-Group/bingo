# Step 147: Register Service Worker

## Description

Register the service worker from the app layout so the browser installs it on first visit. Only register in production (or when explicitly enabled) to avoid interfering with development hot-reloading.

## Requirements

- Create a client component (e.g. `src/components/ServiceWorkerRegistrar.tsx`) that registers the service worker on mount
- Registration logic:
  ```typescript
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
  }
  ```
- Only register when `process.env.NODE_ENV === 'production'` or when a feature flag / env var is set (e.g. `NEXT_PUBLIC_ENABLE_SW=true`)
- Import and render this component in `src/app/layout.tsx` (root layout)
- The component renders nothing (`return null`) — it exists only for the side effect
- Handle registration errors gracefully — log to console but do not crash the app
- Mark the component with `'use client'` since it uses browser APIs

## Files to Create/Modify

- `src/components/ServiceWorkerRegistrar.tsx` — Create client component that registers `/sw.js`
- `src/app/layout.tsx` — Import and render `<ServiceWorkerRegistrar />` inside the body

## Checklist

- [x] Implemented
- [x] Verified

## Verification

- **Check**: In production build, service worker is registered (DevTools > Application > Service Workers shows `/sw.js`)
- **Check**: In development mode (without feature flag), service worker is NOT registered
- **Check**: If `serviceWorker` is not in `navigator` (old browser), no error is thrown
- **Command**: `npm run build && npm start` — then check DevTools > Application > Service Workers

## Commit

`feat(pwa): register service worker from root layout in production`
