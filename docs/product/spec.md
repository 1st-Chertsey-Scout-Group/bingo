# Scout Nature Bingo — Product Spec

## Overview

A real-time web app for scout nature bingo evenings. Teams of 2 scouts race to photograph nature items and activities from a shared bingo board. Leaders review photo submissions and approve/reject them. The first team to have a photo approved for a square claims it exclusively. The team with the most claimed squares wins the round.

## Roles

### Admin
- Typically the organiser (same person as a leader, wearing a different hat)
- Accesses `/admin` with a server-side `ADMIN_PIN`
- Creates games: configures board settings (board size, template item count), sets leader PIN, enters their display name
- On game creation: auto-redirected to the leader lobby as a joined leader (session seeded via localStorage)
- Manages the item pool (add/remove/edit) — this is a pre-event setup task
- Not a separate user account — just a protected page

### Scout (Team)
- Joins via the landing page URL + game PIN
- Auto-assigned a team name and colour on join (MCC-style: "Red Rabbits", "Orange Ocelots", "Lime Llamas", etc.)
- Views the bingo board, taps a square to open camera, submits photo
- Sees real-time updates as squares are claimed by any team

### Leader
- Joins via the same landing page URL with a leader PIN
- Enters their display name (e.g. "Tim") — must be unique among connected leaders
- Reviews photo submissions (approve/reject)
- Controls game flow (start round, end round, new round)
- Multiple leaders can review simultaneously

## Game Flow

### 1. Setup
- Admin (leader) manages the item pool before starting (add/remove/edit)
- Admin creates a game on `/admin`: enters leader PIN, display name, configures board settings
- On creation: receives a game PIN (short, 4-digit), auto-redirected to the leader lobby

### 2. Lobby
- Scouts join with game PIN, get auto-assigned a team name + colour
- Leader sees all joined teams
- Start Round enabled when at least 2 teams have joined (no minimum in development)
- Teams can join/leave between rounds — PIN stays the same across the session

### 3. Round Start
- Leader presses "Start Round"
- Items randomly selected from the pool based on board configuration (default: 25 items). Concrete items are selected first, then template-generated items fill the remaining slots. Items used in the last 2 rounds are avoided where possible (soft constraint — oldest-reused-first when pool is exhausted).
- All scout devices show the board simultaneously

### 4. Active Round
- Scouts go out, photograph items, submit against board squares
- Multiple teams can submit for the same square — submissions are queued per square (FIFO)
- Only the first submission in the queue is reviewable by leaders. If rejected, the next queued submission is automatically promoted
- Submissions are locked in once submitted (no replacing a queued photo)
- Leaders review submissions directly from the board (no separate review queue — see Leader View)
- Leaders approve or reject submissions — no limit on resubmissions after rejection
- On approval: square is exclusively claimed for that team, coloured with team colour on all devices
- On approval: any other queued submissions for that square are auto-discarded
- If a scout submits for an already-claimed square (race condition), the submission is auto-discarded and the scout gets a toast notification
- Scouts see the same "pending" indicator whether their submission is queued or under review

### 5. Round End
Triggered by either:
- All squares on the board are claimed
- Leader presses "End Round"

**Scout screen:** "Head back to base!" overlay with "Your team claimed X squares"

**Leader screen:** Full summary — all teams ranked by squares claimed, with team names and colours

### 6. New Round
- Leader presses "New Round"
- All devices return to the lobby
- All team assignments are cleared — scouts must re-join the lobby to get a fresh team name and colour
- New teams can also join
- Same game PIN persists

## Board

### Layout
- 3-column grid, variable rows based on board size (e.g. 25 items = 9 rows, 9 items = 3 rows)
- Portrait orientation, vertical scroll only — columns fit screen width
- Board size configured per game by admin (9-25 items, default 25)

### Square States (Scout View)
- **Unclaimed** — default/white
- **Claimed by my team** — team's own colour
- **Claimed by another team** — that team's colour (with team name/abbreviation)
- **Submitted by me** — subtle indicator (pending review, visible only on own device)

### Square Interaction
- Tap square opens device camera directly
- Photo taken, auto-submitted for that square
- Brief toast confirmation, return to board

## Leader View

### Board (Active Round)
Leaders interact directly with the board — no separate review queue.

#### Round Header (fixed top)
- **"End Round" button** with confirmation dialog ("End this round?")
- **Timer** — MM:SS since round started
- **Progress** — fraction of claimed squares (e.g. "12/25")

#### Square States (Leader View)
- **Unclaimed, no submissions** — white/default, item text
- **Has pending submission(s)** — amber/orange pulsing border, item text. Demands attention
- **Locked by a leader** — dimmed, leader name overlay (e.g. "Tim"). Board interaction blocked while reviewing
- **Claimed** — team colour at ~60% opacity (muted), item text, team abbreviation. Pushed to background
- Visual hierarchy: needs review (highest) > locked > claimed (muted) > unclaimed (lowest)

#### Review Modal
- Triggered by tapping a square with pending submissions
- Overlay on top of board (board visible underneath for spatial context)
- Shows: photo (large), item name, team name + colour badge
- **Approve** button (green, large) / **Reject** button (red, large)
- Dismiss without acting (X button or tap outside)
- On reject: if more submissions are queued, modal stays open and shows the next photo automatically
- On reject: if no more queued, modal closes
- On approve: modal closes, square shows as claimed
- Board interaction blocked while modal is open

#### Soft Locking
- Opening a review modal locks that square for other leaders
- Other leaders see the square as "locked by [name]" — dimmed, not tappable
- **One lock per leader max** — server-side safety net releases previous lock if a second is somehow acquired
- Lock auto-releases after 30 seconds if leader disconnects
- Lock released when leader approves, rejects, or dismisses the modal

## Item Pool

### Structure
- Flat list, no categories
- Each item: short name only (~3 words max)
- Mix of nature finds ("Oak leaf", "Spider web") and activities ("Team star jump", "Leaf crown")
- ~85 concrete items + 2 templates in the default pool
- No subjective/comparative items (no "oldest", "biggest" etc. — items must be yes/no judgeable by a leader)
- Stored in database, seeded from defaults
- Admin manages the item pool before the event via the admin page

### Templates
- "Something [colour]" — values: Red, Blue, Green, Yellow, Orange, Brown, White, Black, Purple, Pink
- "Something [texture]" — values: Smooth, Rough, Bumpy, Soft, Spiky, Fuzzy, Hard, Crumbly
- Resolved at round generation time (e.g. "Something Red", "Something Bumpy")
- No duplicate template+value combos on the same board

### Board Configuration
- Admin configures per game when creating the game:
  - **Board size** (9-25, default 25) — total items on the board
  - **Template count** (0-10, default 5) — how many template-generated items
- Concrete items = board size minus template count
- Settings persist across all rounds in the game

### Per Round
- Concrete items randomly selected from pool (count = board size - template count)
- Items used in the last 2 rounds are avoided where possible (soft constraint — oldest-reused-first when pool is exhausted)
- Remaining slots filled with template-generated items
- All items shuffled into random board order

## Technical Architecture

### Stack
- **Framework:** Next.js
- **Real-time:** Socket.IO
- **Database:** SQLite via Prisma
- **Photo storage:** S3 (existing bucket)
- **Photo format:** WebP, compressed client-side (~1200px wide, ~50-150KB)

### Photo Handling
- Client-side compression to WebP before upload
- Auto-retry on failed uploads with visible indicator
- S3 lifecycle rule: auto-delete after 7 days

### PWA
- Lightweight PWA support: manifest + app shell service worker
- `display: standalone` — fullscreen, no browser chrome (more board space, no accidental back button)
- Service worker caches app shell only (HTML, JS, CSS) — NOT API responses or socket data
- Page refresh in a dead zone loads the UI instantly from cache, reconnects when signal returns
- One-time dismissable "Add to Home Screen" hint shown on the join screen (S1)
- No offline submission, no push notifications, no background sync

### Resilience
- Cache game state locally (game PIN, team assignment, board state)
- Auto-reconnect on Socket.IO disconnect
- Page refresh recovers state from local cache + server sync
- No full offline play — connection required for submissions and real-time updates

### Security
- No user accounts or authentication
- Admin access: `/admin` page protected by `ADMIN_PIN` env var
- Leader access: landing page + leader PIN (per game)
- Scout access: landing page + game PIN
- PINs are short-lived, shared verbally in person
- Sufficient for a single in-person event

## Non-Goals
- User accounts / authentication
- Score tracking across rounds (each round is independent, teams get fresh names)
- Line/bingo detection
- Sound effects or haptic feedback
- Offline photo submission
- Team management in-app (shuffled externally)
- Branding / custom theming
- Landscape orientation support (exception: leader lobby PIN display — see below)
- Historical round viewing (in-the-moment summary only)

## Environment
- Venue: large field with slightly wooded area
- ~15 devices typical, up to 30 supported (teams of 2 scouts)
- Multiple leader devices
- Potentially spotty mobile signal
- Evening / fading light — high contrast UI, large touch targets
- Device support: last 2 years of iOS Safari and Chrome Android
