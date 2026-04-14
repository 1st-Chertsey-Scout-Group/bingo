# Step 084: Build Landscape PIN Display Mode

## Description
Add a fullscreen landscape PIN display to the leader lobby so the leader can hold up their device for scouts to see the join URL and PIN from a distance. Rotating to landscape triggers the display automatically.

## Requirements
- In `src/components/Lobby.tsx` (leader view), add landscape detection and fullscreen PIN overlay
- Use `window.matchMedia('(orientation: landscape)')` in a useEffect to detect orientation changes
  - Track orientation in local state: `const [isLandscape, setIsLandscape] = useState(false)`
  - Add listener on mount, remove on cleanup
  - Also check initial orientation on mount
- When `isLandscape && role === 'leader'`:
  - Render a fullscreen overlay: `fixed inset-0 z-50 bg-white flex flex-col items-center justify-center`
  - Line 1: hostname/URL (e.g., `scoutbingo.app` or `window.location.host`) in `text-4xl font-bold`
  - Line 2: Scout PIN in massive text: `text-[20vw] font-mono font-bold leading-none`
  - Small hint at bottom: "Rotate to portrait to return" in `text-sm text-muted-foreground`
  - Tap anywhere on the overlay to manually dismiss: `onClick={() => setIsLandscape(false)}`
- When rotating back to portrait, overlay automatically hides via the matchMedia listener

## Files to Create/Modify
- `src/components/Lobby.tsx` — add landscape orientation detection and fullscreen PIN overlay

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: Rotating device to landscape shows fullscreen PIN display
- **Check**: URL and PIN are visible from several metres away (very large text)
- **Check**: Tapping the screen dismisses the overlay
- **Check**: Rotating back to portrait automatically hides the overlay
- **Command**: `npx tsc --noEmit`

## Commit
`feat(ui): add landscape fullscreen PIN display for leader lobby`
