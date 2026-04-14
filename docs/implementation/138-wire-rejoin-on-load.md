# Step 138: Wire Rejoin Emission on Page Load

## Description
On component mount, check localStorage for a cached session and emit the appropriate `rejoin` event instead of the normal join flow. This is the client-side trigger that kicks off the rejoin handshake with the server.

## Requirements
- In `ScoutGame` component's mount `useEffect`:
  1. Call `loadSession()` to read `scout-bingo-session` from localStorage
  2. If session exists and `role === 'scout'` and `gameId` matches the current game context:
     - Emit `rejoin` with `{ gamePin, teamId }`
     - Do NOT emit `lobby:join` — skip the normal join flow
  3. If no cached session or session doesn't match: proceed with normal join flow
- In `LeaderGame` component's mount `useEffect`:
  1. Call `loadSession()` to read from localStorage
  2. If session exists and `role === 'leader'` and `gameId` matches:
     - Emit `rejoin` with `{ gamePin, leaderPin, leaderName }`
     - Do NOT emit the normal leader join event
  3. If no cached session or session doesn't match: proceed with normal join flow
- Show a loading/connecting state while waiting for `rejoin:state` or `rejoin:error` response
- Set a reasonable timeout (e.g. 5 seconds) — if no response, clear cache and redirect to `/`

## Files to Create/Modify
- `src/components/ScoutGame.tsx` — Add rejoin check on mount before normal join flow
- `src/components/LeaderGame.tsx` — Add rejoin check on mount before normal join flow

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: With cached session, page refresh emits `rejoin` (not `lobby:join`) — verify in server logs or network tab
- **Check**: Without cached session, normal join flow proceeds as before
- **Check**: With stale/mismatched session, normal join flow proceeds after cache is ignored
- **Check**: Loading state is shown while awaiting rejoin response

## Commit
`feat(rejoin): emit rejoin event on page load when cached session exists`
