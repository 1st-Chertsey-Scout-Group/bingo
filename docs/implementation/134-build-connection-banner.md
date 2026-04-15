# Step 134: Build Connection Banner Component

## Description

Create a non-dismissable banner that appears at the top of the screen when the socket connection is lost. This gives scouts and leaders clear feedback that the app is trying to reconnect, without exposing technical details.

## Requirements

- Create a `ConnectionBanner` React component
- Banner text: "No connection — trying to reconnect..."
- Non-dismissable — no close button, no tap-to-dismiss
- Uses fixed positioning at the top of the viewport with a high `z-index` (e.g. 50) so it overlays all content
- Prominent background colour (e.g. amber/yellow or red) with contrasting text
- Must not block interaction with the rest of the UI — content below should still be scrollable and tappable
- Listen for Socket.IO `disconnect` event to show the banner
- Listen for Socket.IO `connect` event to hide the banner
- Banner auto-clears immediately when connection is restored
- Add the component to both `ScoutGame` and `LeaderGame` layouts so it appears on all game screens
- No technical details (no error codes, no retry count, no delay timers)

## Files to Create/Modify

- `src/components/ConnectionBanner.tsx` — Create the banner component with socket event listeners
- `src/components/ScoutGame.tsx` — Add `<ConnectionBanner />` at the top of the component tree
- `src/components/LeaderGame.tsx` — Add `<ConnectionBanner />` at the top of the component tree

## Checklist

- [x] Implemented
- [x] Verified

## Verification

- **Check**: Banner is hidden when connected
- **Check**: Disconnect network in DevTools — banner appears immediately with correct message
- **Check**: Re-enable network — banner disappears when socket reconnects
- **Check**: Banner does not block tapping buttons or scrolling content beneath it
- **Check**: Banner appears on both scout and leader views

## Commit

`feat(ui): add non-dismissable connection banner for socket disconnect state`
