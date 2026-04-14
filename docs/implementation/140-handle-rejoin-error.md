# Step 140: Handle rejoin:error Event on Client

## Description
Listen for the `rejoin:error` socket event and gracefully recover by clearing the stale session and redirecting the user to the landing page. This handles cases where the cached session is no longer valid (game ended, team removed, PIN changed).

## Requirements
- Listen for `rejoin:error` event in both `ScoutGame` and `LeaderGame` components
- The event payload is `{ message: string }`
- On receiving `rejoin:error`:
  1. Call `clearSession()` to remove `scout-bingo-session` from localStorage
  2. Redirect to `/` (landing page) using Next.js `router.push('/')`
  3. Optionally show a brief toast or flash message with the error reason (e.g. "Game has ended") before redirect
- Do NOT show a blocking modal or error page — redirect immediately
- Ensure socket listeners are cleaned up before redirect to prevent memory leaks

## Files to Create/Modify
- `src/components/ScoutGame.tsx` — Listen for `rejoin:error`, clear session, redirect
- `src/components/LeaderGame.tsx` — Listen for `rejoin:error`, clear session, redirect

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: Scout with stale teamId refreshes page — receives `rejoin:error`, localStorage cleared, redirected to `/`
- **Check**: Leader with wrong PIN refreshes — receives `rejoin:error`, localStorage cleared, redirected to `/`
- **Check**: After redirect, user can re-enter PIN and join normally
- **Check**: No orphaned socket listeners after redirect
- **Command**: In browser console after redirect: `localStorage.getItem('scout-bingo-session')` returns `null`

## Commit
`feat(rejoin): handle rejoin:error by clearing session and redirecting to landing page`
