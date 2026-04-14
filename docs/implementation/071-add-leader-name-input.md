# Step 071: Add Leader Name Input and Redirect

## Description
Complete the leader join flow by showing a display name input after PIN validation. On submit, store the full leader session in localStorage and redirect to the leader game view.

## Requirements
- When phase is `'leader-name'`, render within the same card layout:
  - Heading or subheading: "Welcome, Leader"
  - Text input for display name, placeholder "Your name", auto-focused
  - "Join as Leader" button, full width, large touch target
  - Button disabled if name input is empty
- On "Join as Leader" submit:
  - Validate name is non-empty after trimming; show inline error if empty
  - Write to localStorage key `scout-bingo-session` a JSON string:
    ```json
    {
      "gamePin": "<validatedPin>",
      "leaderPin": "<validatedPin>",
      "gameId": "<stored gameId>",
      "leaderName": "<name input value>",
      "role": "leader"
    }
    ```
  - Redirect to `/leader/[gameId]` using `router.push` from `next/navigation`
- If localStorage write fails, still attempt the redirect

## Files to Create/Modify
- `src/app/page.tsx` — add leader name input form and redirect logic

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: Leader name input renders after leader PIN validation
- **Check**: "Join as Leader" button is disabled when name is empty
- **Check**: Submit stores full session object in localStorage
- **Check**: Session includes gamePin, leaderPin, gameId, leaderName, and role "leader"
- **Check**: Redirect goes to /leader/[gameId]

## Commit
`feat(ui): add leader name input and redirect to leader view`
