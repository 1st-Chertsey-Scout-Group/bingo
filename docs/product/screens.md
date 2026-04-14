# Screens

All screens are portrait, mobile-first, high contrast, large touch targets. Exception: leader lobby supports landscape for fullscreen PIN display.

## Scout Screens

### S1: Join

- Game PIN input (4 digits)
- "Join" button
- On success: auto-assigned team name + colour, transition to Lobby
- One-time "Add to Home Screen" hint banner (dismissable, stored in localStorage so it only shows once per device)

### S2: Lobby

- "You are: [Team Name]" with team colour background
- "Waiting for the leader to start..."
- List of other teams in the lobby

### S3: Board (Active Round)

- 3-column grid, variable rows based on board size, vertical scroll
- Square states:
  - **Unclaimed**: white/light background, item text
  - **Claimed (own team)**: own team colour, item text, checkmark
  - **Claimed (other team)**: that team's colour, item text, team abbreviation
  - **Submitted (own, pending)**: subtle pulsing/dotted border on own device only
- Tap unclaimed square -> opens device camera
- After photo capture -> auto-submit, toast "Submitted!", return to board
- Toast on rejection: "Rejected — try again!"
- Toast on claim by other team while submitting: "Already claimed!"

### S4: Round Over

- Overlay on top of board
- "Head back to base!"
- "Your team claimed X squares"
- Stays until leader starts new round (returns to S2)

## Leader Screens

### L1: Join

- Same landing page as scouts — enter leader PIN
- Display name input ("Your name") — must be unique among connected leaders
- "Join as Leader" button

### L2: Lobby

- Both PINs displayed prominently, side by side, clearly labelled:
  - "Scout PIN: 3847" — share with all scouts
  - "Leader PIN: 8472" — share privately with other leaders
- List of joined teams (name + colour)
- "Start Round" button (enabled when at least 2 teams joined)
- PINs visible on lobby only — replaced by round header during active round, reappear between rounds

#### Landscape PIN Display

- When leader rotates phone to landscape on the lobby screen, switches to fullscreen scout PIN display
- Two lines, massive text filling the screen:
  - Short URL (e.g. "scoutbingo.app")
  - Scout PIN (e.g. "3847")
- Use as a sign for scouts to read from across the room
- Tap screen or rotate back to portrait to return to normal lobby
- No interaction needed in landscape — purely a display mode

### L3: Board (Active Round)

Leaders review submissions directly from the board — no separate review queue.

#### Round Header (fixed top bar)

- "End Round" button with confirmation dialog ("End this round?")
- Round timer: MM:SS since round started
- Progress: claimed/total fraction (e.g. "12/25")

#### Board Grid

- Same 3-column layout as scout view
- Square states (visual hierarchy, highest to lowest priority):
  - **Needs review**: amber/orange pulsing border — has pending submission(s), tappable
  - **Locked by leader**: dimmed, leader name overlay (e.g. "Tim") — not tappable by other leaders
  - **Claimed**: team colour at ~60% opacity (muted), item text, team abbreviation
  - **Unclaimed, no submissions**: white/default, item text

#### Review Modal (overlay on board)

- Opens when leader taps a "needs review" square
- Shows:
  - Photo (large enough to assess)
  - Item name
  - Team name + colour badge
  - "Approve" button (green, large)
  - "Reject" button (red, large)
  - Close/dismiss (X or tap outside)
- On reject with more queued: stays open, shows next photo automatically
- On reject with none queued: modal closes
- On approve: modal closes, square updates to claimed
- Board interaction blocked while modal is open
- Opening modal locks the square for other leaders (soft lock, 30s timeout on disconnect)

### L4: Round Summary

- Shown when leader presses "End Round" or all squares are claimed
- Teams ranked by squares claimed (descending)
- Each row: rank, team colour, team name, squares claimed count
- "New Round" button -> clears all team assignments, returns all devices to lobby

## Admin Screens

### A1: Game Creation

- Protected by `ADMIN_PIN`
- Leader PIN input (for the new game)
- Display name input ("Your name" — used as leader identity in the game)
- Board size slider (9-25, default 25)
- Template item count slider (0-10, default 5)
- "Create Game" button
- On success: seeds localStorage with leader session data, auto-redirects to L2 (leader lobby) as a joined leader

### A2: Item Pool Management

- Protected by `ADMIN_PIN`
- List of all items with edit/delete controls
- Add new item form (name input)
- Template items shown with indicator
- Pre-event setup task — manage before games start
