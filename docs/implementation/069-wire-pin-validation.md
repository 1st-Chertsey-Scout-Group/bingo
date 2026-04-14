# Step 069: Wire PIN Form to Validation API

## Description

Connect the landing page PIN form to the POST /api/validate endpoint. Handle scout role responses by storing session data and redirecting to the game view.

## Requirements

- On form submit, send POST request to `/api/validate` with body `{ "pin": "<value>" }`
- While request is in flight, disable the input and button, show loading state
- On response where `valid` is `false`:
  - Display error message "Invalid PIN" below the form
  - Re-enable input and button
  - Clear the PIN input for retry
- On response where `valid` is `true` and `role` is `"scout"`:
  - Write to localStorage key `scout-bingo-session` a JSON string: `{ "gamePin": "<pin>", "gameId": "<response.gameId>", "role": "scout" }`
  - Redirect to `/play/[gameId]` using `router.push` from `next/navigation`
- On response where `valid` is `true` and `role` is `"leader"`:
  - Do NOT redirect yet (handled in step 070)
  - Store `gameId` and `pin` in component state for the next step
- On network error, display "Something went wrong. Please try again."

## Files to Create/Modify

- `src/app/page.tsx` — wire PIN form submit to POST /api/validate

## Checklist

- [ ] Implemented
- [ ] Verified

## Verification

- **Check**: Invalid PIN shows "Invalid PIN" error message
- **Check**: Valid scout PIN stores session in localStorage and redirects to /play/[gameId]
- **Check**: Valid leader PIN does not redirect (yet)
- **Check**: Input and button are disabled during request
- **Check**: Network errors show appropriate message

## Commit

`feat(ui): wire PIN form to validation API with scout redirect`
