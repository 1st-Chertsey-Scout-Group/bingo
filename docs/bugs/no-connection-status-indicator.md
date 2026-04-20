# No visible connection status indicator for scouts or leaders

## Summary

There is no persistent indicator of socket connection state. Scouts and leaders have no way to know whether they are connected, reconnecting, or disconnected until an action fails or the `ConnectionBanner` appears after a full disconnect.

## Repro steps

1. **Role:** Scout or Leader on a mobile device.
2. Join a game and enter the lobby or active round.
3. Observe the header area -- there is no connection status indicator.
4. Briefly lose network (e.g. walk between WiFi access points).
5. **Observed:** Nothing visible changes during the reconnection phase. The `ConnectionBanner` only appears after Socket.IO fires its `disconnect` event, which may be delayed. When reconnected, the banner disappears but there is no positive "connected" indicator.
6. **Expected:** A persistent indicator in the header showing "Connected" (green), "Reconnecting" (yellow/amber), or "Disconnected" (red) so users always know their connection state.

## Root cause

### ConnectionBanner only shows disconnect, not reconnecting

The `ConnectionBanner` component at `src/components/ConnectionBanner.tsx:6-34` tracks a single boolean `disconnected` state:

```tsx
const [disconnected, setDisconnected] = useState(
  () => socket !== null && !socket.connected,
)
```

It listens to only two Socket.IO events (`ConnectionBanner.tsx:15-16`):

- `disconnect` -> sets `disconnected = true`
- `connect` -> sets `disconnected = false`

It does **not** listen to `reconnect_attempt` or `reconnecting` events, so there is no distinction between "disconnected and idle" vs "actively reconnecting". The banner text at `ConnectionBanner.tsx:31` says "No connection -- trying to reconnect..." but this is displayed for ALL disconnect states, even when reconnection has stopped.

### No "connected" state is ever shown

When `disconnected` is `false`, the component returns `null` at `ConnectionBanner.tsx:27`:

```tsx
if (!disconnected) return null
```

There is never a green "Connected" indicator. Users have no positive confirmation that their connection is healthy.

### The banner is not in the header -- it overlays the top

The banner renders as a `fixed top-0` div (`ConnectionBanner.tsx:30`), which overlaps the content rather than being integrated into the header. On the scout game screen, it overlaps the `ScoutHeader` component. On the leader game screen, it overlaps the `RoundHeader`. This can obscure important game information.

### Socket.IO provides richer connection state

Socket.IO's client emits several events that could drive a three-state indicator:

- `connect` -- connected
- `disconnect` -- disconnected
- `reconnect_attempt` -- actively trying to reconnect
- `reconnect_failed` -- gave up reconnecting
- `reconnect` -- successfully reconnected

The socket configuration at `src/lib/socket.ts:9-15` has `reconnectionAttempts: Infinity`, so the socket will always be in a "reconnecting" state after disconnect, never "gave up". But the UI does not reflect this.

**Verification method:** Static trace through `ConnectionBanner.tsx:6-34` and `socket.ts:9-15`. The component only tracks a binary state and does not render when connected.

## Proposed fix

Replace the `ConnectionBanner` with a `ConnectionStatus` component that shows three states:

```diff
--- a/src/components/ConnectionBanner.tsx
+++ b/src/components/ConnectionBanner.tsx
@@ -1,34 +1,58 @@
 'use client'

-import { useEffect, useState } from 'react'
+import { useEffect, useState, type ReactNode } from 'react'
 import { useSocket } from '@/hooks/useSocket'

-export function ConnectionBanner() {
+type ConnectionState = 'connected' | 'reconnecting' | 'disconnected'
+
+export function ConnectionBanner(): ReactNode {
   const socket = useSocket()
-  const [disconnected, setDisconnected] = useState(
-    () => socket !== null && !socket.connected,
+  const [state, setState] = useState<ConnectionState>(
+    () => (socket !== null && !socket.connected ? 'disconnected' : 'connected'),
   )

   useEffect(() => {
     if (!socket) return

-    const handleDisconnect = () => setDisconnected(true)
-    const handleConnect = () => setDisconnected(false)
+    const handleDisconnect = () => setState('disconnected')
+    const handleConnect = () => setState('connected')
+    const handleReconnectAttempt = () => setState('reconnecting')

     socket.on('disconnect', handleDisconnect)
     socket.on('connect', handleConnect)
+    socket.io.on('reconnect_attempt', handleReconnectAttempt)

     return () => {
       socket.off('disconnect', handleDisconnect)
       socket.off('connect', handleConnect)
+      socket.io.off('reconnect_attempt', handleReconnectAttempt)
     }
   }, [socket])

-  if (!disconnected) return null
+  if (state === 'connected') {
+    return (
+      <div className="flex items-center gap-1.5 px-2">
+        <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
+        <span className="text-xs font-medium text-green-700">Connected</span>
+      </div>
+    )
+  }
+
+  if (state === 'reconnecting') {
+    return (
+      <div className="flex items-center gap-1.5 px-2">
+        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-amber-500" />
+        <span className="text-xs font-medium text-amber-700">Reconnecting...</span>
+      </div>
+    )
+  }

   return (
-    <div className="fixed top-0 right-0 left-0 z-50 animate-pulse bg-amber-500 px-4 py-2.5 text-center text-sm font-bold text-white shadow-md">
-      No connection — trying to reconnect...
+    <div className="flex items-center gap-1.5 px-2">
+      <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
+      <span className="text-xs font-medium text-red-700">Disconnected</span>
     </div>
   )
 }
```

Then integrate the component into the `ScoutHeader` and `RoundHeader` rather than rendering it as a fixed overlay. In `ScoutGame.tsx` and `LeaderGame.tsx`, move `<ConnectionBanner />` inside the header bar instead of above it.

## Related areas & regression risk

- The `ConnectionBanner` is currently rendered in both `ScoutGame.tsx:125` and `LeaderGame.tsx:223`, outside the game state switch. Moving it into the headers requires passing it as a child or rendering it conditionally inside each header component.
- The `socket.io` manager events (`reconnect_attempt`) are on `socket.io`, not `socket` directly. The `useSocket` hook returns a `Socket` instance, but the manager is accessible via `socket.io`. TypeScript types may need adjustment.
- The "connected" indicator should auto-hide after a few seconds to avoid visual clutter during normal operation. Consider showing it only for 3 seconds after reconnection, then fading out. The "reconnecting" and "disconnected" states should persist.
- The lobby screens (`ScoutLobby`, `LeaderLobbyConfig`) currently have no header. The connection indicator may need to be placed differently for lobby views.
- `socket.ts:12` sets `reconnectionAttempts: Infinity`, so the socket never enters a "gave up" state. The "disconnected" state in the UI should only appear briefly before transitioning to "reconnecting".
