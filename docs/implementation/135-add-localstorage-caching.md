# Step 135: Add localStorage Session Caching

## Description

Persist session data to localStorage so the app can rejoin a game after a page refresh or browser restart. This is the foundation for the rejoin flow — without cached credentials, the client cannot prove who it was.

## Requirements

- Use a consistent localStorage key: `scout-bingo-session`
- Store data as a JSON string
- Scout session data (written on successful lobby join and state updates):
  ```json
  {
    "gamePin": "3847",
    "gameId": "clx...",
    "teamId": "clx...",
    "teamName": "Red Rabbits",
    "teamColour": "#FF0000",
    "role": "scout"
  }
  ```
- Leader session data (written on successful join):
  ```json
  {
    "gamePin": "3847",
    "leaderPin": "8472",
    "gameId": "clx...",
    "leaderName": "Tim",
    "role": "leader"
  }
  ```
- Write to localStorage via `useEffect` that watches relevant state changes (gameId, teamId for scouts; gameId, leaderName for leaders)
- On `game:lobby` event (between rounds), clear `teamId` from the cached session — scouts must re-join lobby for fresh team assignment
- On game end or explicit leave, clear the entire `scout-bingo-session` key
- Create helper functions: `saveSession(data)`, `loadSession()`, `clearSession()` in a utility file

## Files to Create/Modify

- `src/lib/session.ts` — Create helper functions for localStorage session management
- `src/components/ScoutGame.tsx` — Add useEffect to write scout session on state changes; clear teamId on `game:lobby`
- `src/components/LeaderGame.tsx` — Add useEffect to write leader session on state changes

## Checklist

- [x] Implemented
- [x] Verified

## Verification

- **Check**: Join a game as scout, inspect `localStorage.getItem('scout-bingo-session')` — contains all scout fields
- **Check**: Join a game as leader, inspect localStorage — contains all leader fields
- **Check**: When a new round starts (game:lobby event), teamId is removed from scout session
- **Check**: On game end, localStorage key is cleared
- **Command**: In browser console: `JSON.parse(localStorage.getItem('scout-bingo-session'))`

## Commit

`feat(session): persist scout and leader session data to localStorage for rejoin support`
