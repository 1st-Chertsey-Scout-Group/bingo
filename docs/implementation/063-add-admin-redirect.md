# Step 063: Add Post-Creation Redirect to Leader View

## Description
After successful game creation, seed localStorage with the leader session data and redirect to the leader game view. This creates a seamless transition from admin game setup to leading the game.

## Requirements
- On successful game creation (after step 062 success handler):
  - Write to localStorage key `scout-bingo-session` a JSON string containing:
    ```json
    {
      "gamePin": "<response.pin>",
      "leaderPin": "<form leaderPin input value>",
      "gameId": "<response.gameId>",
      "leaderName": "<form display name input value>",
      "role": "leader"
    }
    ```
  - Use `router.push(`/leader/${response.gameId}`)` from `next/navigation` useRouter to redirect
- Import and use `useRouter` from `next/navigation` in the admin page component
- The redirect should happen automatically after a brief delay (500ms) to let the user see the success message, or immediately if preferred
- If localStorage is unavailable (e.g., private browsing), catch the error and still redirect (the leader page will handle missing session gracefully)

## Files to Create/Modify
- `src/app/admin/page.tsx` — add localStorage seeding and redirect after game creation

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: localStorage `scout-bingo-session` is set with correct shape after game creation
- **Check**: Browser redirects to `/leader/[gameId]` after creation
- **Check**: Role is set to "leader" in the stored session
- **Check**: No crash if localStorage is unavailable

## Commit
`feat(admin): seed localStorage and redirect to leader view after game creation`
