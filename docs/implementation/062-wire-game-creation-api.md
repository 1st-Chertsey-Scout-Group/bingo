# Step 062: Wire Game Creation Form to API

## Description

Connect the game creation form submission to the POST /api/game endpoint. Handle success and error responses with appropriate user feedback.

## Requirements

- On form submit, send a POST request to `/api/game` with:
  - Header: `X-Admin-Pin` set to the stored admin PIN
  - Header: `Content-Type: application/json`
  - Body: `{ "leaderPin": "<value>", "boardSize": <value>, "templateCount": <value> }`
- While the request is in flight, disable the submit button and show a loading indicator
- On success (201 response):
  - Parse the response JSON: `{ gameId, pin, leaderPin, status, boardSize, templateCount }`
  - Display the created game's PIN prominently (e.g., "Game created! PIN: 3847")
  - Store the response data for use in the redirect step (step 063)
- On error (4xx response):
  - Parse the error response: `{ error: string }`
  - Display the error message to the user (e.g., in a red alert area below the form)
- On network error, display "Failed to create game. Please try again."

## Files to Create/Modify

- `src/app/admin/page.tsx` — wire form submit to POST /api/game

## Checklist

- [ ] Implemented
- [ ] Verified

## Verification

- **Check**: Form submits to POST /api/game with correct headers and body
- **Check**: Success response displays the game PIN
- **Check**: Error response displays the error message
- **Check**: Button is disabled during submission

## Commit

`feat(admin): wire game creation form to POST /api/game`
