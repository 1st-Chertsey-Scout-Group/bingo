# Step 097: Add Camera Trigger on Square Tap

## Description

Wire the device camera to square taps using a hidden file input. When a scout taps an unclaimed square, the camera opens to take a proof photo. The selected roundItemId is tracked so the photo is associated with the correct square.

## Requirements

- In `src/components/ScoutGame.tsx`:
  - Create a ref for the hidden file input: `const fileInputRef = useRef<HTMLInputElement>(null)`
  - Create a ref to track which square was tapped: `const pendingRoundItemIdRef = useRef<string | null>(null)`
  - Add a hidden file input in the JSX:
    ```tsx
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      capture="environment"
      className="hidden"
      onChange={handleFileSelected}
    />
    ```
  - Update `handleSquareTap(roundItemId: string)`:
    - Verify square is unclaimed and not already submitted
    - Store roundItemId: `pendingRoundItemIdRef.current = roundItemId`
    - Trigger camera: `fileInputRef.current?.click()`
  - Define `handleFileSelected(e: ChangeEvent<HTMLInputElement>)`:
    - Get the file: `const file = e.target.files?.[0]`
    - If no file or no pendingRoundItemId, return
    - Reset the input value for reuse: `e.target.value = ''`
    - Proceed to compression (step 098) — for now, log the file and roundItemId
    - Clear pendingRoundItemIdRef after handling

## Files to Create/Modify

- `src/components/ScoutGame.tsx` — add hidden file input, camera trigger logic, and file selection handler

## Checklist

- [ ] Implemented
- [ ] Verified

## Verification

- **Check**: Tapping an unclaimed square opens the device camera (on mobile) or file picker (on desktop)
- **Check**: The correct roundItemId is tracked for the opened camera session
- **Check**: File input onChange fires with the captured photo
- **Check**: Input value is reset so the same square can be retried
- **Command**: `npx tsc --noEmit`

## Commit

`feat(ui): add camera trigger on scout square tap`
