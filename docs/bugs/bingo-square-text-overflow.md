# Bingo square text overflows and long item names are unreadable

## Summary

When a bingo item has a long name (e.g. "Something beginning with the letter..."), the text overflows or is aggressively clamped inside the square, making it unreadable. There is no way to see the full item name or interact with a square before committing to a photo.

## Repro steps

1. **Role:** Scout or Leader, any device.
2. **Precondition:** A round is active with at least one item whose `displayName` exceeds ~20 characters (e.g. template-generated items like "Something beginning with the letter B").
3. View the bingo board.
4. **Observed:** Long item names are truncated to 2 lines (`line-clamp-2`) with no ellipsis indicator and no way to read the full text. On smaller phones with a 3-column grid, even moderately long names are cut off.
5. **Expected:** (a) All text should be legible or at least clearly indicate truncation. (b) Tapping a square should show the full item name and offer a "Take Photo" action, rather than immediately opening the camera.

## Root cause

### Text truncation with no disclosure

In `src/components/Square.tsx:132`, unclaimed squares render the display name with:

```tsx
<span className="line-clamp-2 leading-tight break-words">
  {roundItem.displayName}
</span>
```

The `line-clamp-2` utility hard-caps the visible text at 2 lines. Combined with the square's fixed `aspect-square` constraint (`Square.tsx:19`) and `text-base` font size, items longer than about 20 characters on a mobile screen are silently truncated. There is no visual indicator (ellipsis is only added by `line-clamp` if the browser supports it, and even then it is very subtle).

For claimed squares, the same issue exists at `Square.tsx:112`:

```tsx
<span className="line-clamp-2 text-sm leading-tight font-semibold break-words">
  {roundItem.displayName}
</span>
```

### No detail popup or confirmation step

The `handleSquareTap` function in `src/hooks/usePhotoUpload.ts:165-182` directly opens the file input (camera) when a square is tapped:

```ts
pendingRoundItemIdRef.current = roundItemId
fileInputRef.current?.click()
```

There is no intermediate UI showing the full item name or asking the scout to confirm. This means:

- Scouts cannot read what they need to photograph if the name is truncated.
- Accidental taps immediately open the camera with no way to cancel gracefully.

The Board component at `src/components/Board.tsx:39` passes `onSquareTap` straight through to `Square`, which calls it directly on `onClick` at `Square.tsx:69`.

**Verification method:** Static trace through `Square.tsx:19,132`, `usePhotoUpload.ts:165-182`, and `Board.tsx:39`.

## Proposed fix

### 1. Reduce font size and increase clamp for squares

```diff
--- a/src/components/Square.tsx
+++ b/src/components/Square.tsx
@@ -18,7 +18,7 @@
 const baseClasses =
-  'aspect-square flex items-center justify-center rounded-xl p-1.5 text-center text-base font-semibold transition-all duration-200 relative'
+  'aspect-square flex items-center justify-center rounded-xl p-1.5 text-center text-sm font-semibold transition-all duration-200 relative'

@@ -129,7 +129,7 @@
           ) : (
-            <span className="line-clamp-2 leading-tight break-words">
+            <span className="line-clamp-3 text-xs leading-tight break-words">
               {roundItem.displayName}
             </span>
```

### 2. Add a detail/confirm dialog before opening camera

Add a new state and dialog in `ScoutGame.tsx` (or a new `SquareDetailDialog` component) that:

1. Intercepts `handleSquareTap` to show a dialog with the full `displayName`.
2. The dialog has a "Take Photo" button that triggers `fileInputRef.current?.click()`.
3. The dialog has a "Cancel" button to dismiss without action.

The `usePhotoUpload` hook would need a new `triggerUpload(roundItemId: string)` method separated from the tap handler, or the tap handler would be split into `selectSquare` and `confirmCapture` steps.

## Related areas & regression risk

- The leader's board also uses `Square` -- the font size change affects leader review squares. Verify leader squares remain tappable and readable.
- The `aria-label` on the button (`Square.tsx:59-65`) already contains the full `displayName`, so screen reader accessibility is not affected by the truncation. But the visual fix should match.
- Template-generated items from `prisma/seed.ts` can produce particularly long names. The fix should be tested with the longest possible generated names.
- Adding a dialog changes the tap-to-photo latency, which is a gameplay concern. The dialog should be minimal and fast to dismiss.
