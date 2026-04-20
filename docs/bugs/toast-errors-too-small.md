# Error toasts are too small and subtle for scouts to notice

## Summary

Error toasts (e.g. "you have been disconnected", "upload failed") render in Sonner's default small style, making them easy for young scouts to miss during active gameplay on mobile devices.

## Repro steps

1. **Role:** Scout on a mobile phone (iOS Safari or Android Chrome).
2. Join a game and wait for the round to start.
3. Trigger any error condition (e.g. lose network briefly, submit a photo to an already-claimed square, or let the socket disconnect).
4. **Observed:** A small, standard-sized toast appears briefly at the bottom of the screen. On a bright outdoor screen it is nearly invisible.
5. **Expected:** Error toasts should be large, high-contrast, and impossible to miss -- appropriate for the target audience (8-14 year old scouts outdoors).

## Root cause

Two compounding issues:

### 1. The shadcn Toaster wrapper is never used

`src/app/layout.tsx:3` imports `Toaster` directly from the `sonner` package:

```ts
import { Toaster } from 'sonner'
```

The project has a customised shadcn wrapper at `src/components/ui/sonner.tsx` that provides custom icons, CSS variable theming, border radius, and a `cn-toast` class name (`sonner.tsx:37`). This wrapper is **never imported anywhere** -- the layout bypasses it entirely.

### 2. All error toasts use `toast()` instead of `toast.error()`

Every error-path toast call in the codebase uses the plain `toast(message)` function, which renders with the "normal" style (no icon, no colour differentiation). None use `toast.error()`:

- `src/hooks/useScoutSocket.ts:139,146,151,198` -- rejoin errors, server errors
- `src/hooks/useLeaderSocket.ts:118,124,142` -- rejoin errors, server errors
- `src/hooks/usePhotoUpload.ts:110,139` -- upload failures
- `src/hooks/useGeolocation.ts:46` -- location error

Because plain `toast()` is used, even if the shadcn wrapper were active, the error icon (`OctagonXIcon` at `sonner.tsx:24`) would never appear.

### 3. No size or position customisation

The `<Toaster />` in `layout.tsx:38` is rendered with zero props. Sonner defaults to bottom-right positioning and compact sizing, which is unsuitable for a mobile-first scout app.

**Verification method:** Static trace. The import at `layout.tsx:3` is verifiably `from 'sonner'` not `from '@/components/ui/sonner'`. A global grep for `toast.error` across `src/` returns zero matches.

## Proposed fix

```diff
--- a/src/app/layout.tsx
+++ b/src/app/layout.tsx
@@ -1,6 +1,6 @@
 import type { Metadata, Viewport } from 'next'
 import { Inter } from 'next/font/google'
-import { Toaster } from 'sonner'
+import { Toaster } from '@/components/ui/sonner'
 import { ServiceWorkerRegistrar } from '@/components/ServiceWorkerRegistrar'
 import './globals.css'
```

Then update the wrapper to use mobile-friendly defaults:

```diff
--- a/src/components/ui/sonner.tsx
+++ b/src/components/ui/sonner.tsx
@@ -16,6 +16,8 @@
     <Sonner
       theme={theme as ToasterProps['theme']}
       className="toaster group"
+      position="top-center"
+      expand
       icons={{
```

Finally, change error-path `toast()` calls to `toast.error()` in:

- `src/hooks/useScoutSocket.ts` -- `handleServerError` and `handleRejoinError`
- `src/hooks/useLeaderSocket.ts` -- `handleServerError` and `handleRejoinError`
- `src/hooks/usePhotoUpload.ts` -- the two failure toasts

This ensures the error icon renders and Sonner applies its built-in red/destructive styling.

## Related areas & regression risk

- All `toast()` call sites across `src/hooks/` should be audited for correct severity level (`toast.success`, `toast.error`, `toast.warning`).
- The `cn-toast` class name referenced in `sonner.tsx:37` has no corresponding CSS rule anywhere in the codebase -- it is inert. If custom styling is intended, a rule needs to be added to `globals.css`.
- Switching to `position="top-center"` may overlap with the `ConnectionBanner` component (`src/components/ConnectionBanner.tsx`) which is `fixed top-0`. The banner uses `z-50`; Sonner's default z-index should be checked for conflicts.
- The `expand` prop changes toast height -- verify it does not obscure the `ScoutHeader` on small screens.
