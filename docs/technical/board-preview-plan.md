# Board Preview & Category Selection Feature

## Context

Currently, board generation is fully automatic — the leader presses "Start Round" and the server picks random items. Items are managed on the admin page with no categorisation. The leader has no control over what items appear.

The goal: give leaders control over the board. They pick which categories of items to include, preview the generated board, can refresh any item they don't like, then confirm to start the round. Item management moves out of admin entirely.

## Phase 1: Data Model — Add `category` to Items

**Files:**

- `prisma/schema.prisma` — add `category String @default("")` to Item model
- `prisma/seed.ts` — change flat string array to `{ name, category }` objects using slug categories
- `src/lib/constants.ts` — add `ITEM_CATEGORIES`, `ItemCategory`, `ITEM_CATEGORY_LABELS`

**Categories (slug → label):**

- `trees-plants` → Nature — Trees & Plants (20 items)
- `animals-insects` → Nature — Animals & Insects (15 items)
- `landscape-features` → Nature — Landscape & Features (15 items)
- `activities-challenges` → Activities & Challenges (15 items)
- `scavenger-finds` → Scavenger Finds (10 items)
- `observation` → Observation (10 items)

Template items get `category: 'templates'` — not toggleable, controlled by template count slider.

**Migration:** `prisma db push` adds column with default `""`. `prisma db seed` deletes all `isDefault` items and recreates with proper categories.

**Game model:** Remove `boardSize` and `templateCount` from the Game model. These move to the leader lobby as per-round config sent with the preview/start requests. The Game model becomes simpler.

## Phase 2: Board Generation — Category Filtering + Refresh

**Files:**

- `src/lib/game-logic.ts` — add `categories?: string[]` to `GenerateBoardOptions`, filter `allItems` by category before selection. Add `category` to local `Item` type. Add new `refreshBoardItem()` function.
- `src/lib/game-logic.test.ts` — update mock items with `category`, add tests for filtering and refresh.

**`refreshBoardItem(options)`**: Takes current board, index to replace, available items (filtered by ALL enabled categories — not just the original item's category), and returns a new `BoardItem`. Excludes items already on the board. Prefers non-recent items.

## Phase 3: Socket Events — Preview, Refresh, Confirm

**Files:**

- `src/server/socket/game.ts` — add `board:preview` and `board:refresh-item` handlers, modify `game:start`

**New handler: `board:preview`**

- Leader sends: `{ categories: string[], boardSize: number, templateCount: number }`
- Server validates leader context, game in LOBBY, valid categories, valid board config
- Server validates enough items available: `filteredItemCount + templateCount >= boardSize`
- Server calls `generateBoard()` with filtered items
- Server responds to leader only: `{ board: Array<{ itemId, displayName }> }`
- Nothing persisted — stateless

**New handler: `board:refresh-item`**

- Leader sends: `{ currentBoard: Array<{ itemId, displayName }>, indexToReplace: number, categories: string[], boardSize: number, templateCount: number }`
- Server calls `refreshBoardItem()` — picks replacement not already on board
- Server responds to leader only: `{ index: number, item: { itemId, displayName } }`
- Stateless — client owns preview state, sends full board for dedup

**Modified handler: `game:start`**

- Leader sends: `{ confirmedBoard: Array<{ itemId, displayName }> }`
- Server validates all `itemId`s exist in DB
- Server validates board length within bounds
- Server creates RoundItems from confirmed board (replaces current generateBoard call)
- Rest of flow unchanged (sets ACTIVE, emits `game:started`)

## Phase 4: Leader Lobby UI — Categories + Preview + Refresh

**Files:**

- `src/components/Lobby.tsx` — expand leader lobby with category toggles, board config sliders, preview board, refresh controls
- `src/components/LeaderGame.tsx` — add socket listeners for `board:preview` and `board:refresh-item`, add handlers, pass down to Lobby
- `src/hooks/useGameState.ts` — add `previewBoard` to GameState, add `BOARD_PREVIEW`, `BOARD_PREVIEW_REFRESH`, `BOARD_PREVIEW_CLEAR` actions
- `src/types.ts` — add new action types, `PreviewBoardItem` type

**Leader lobby flow (two phases):**

1. **Configure phase** (no preview yet):
   - PINs displayed at top (existing)
   - Teams list (existing)
   - Category toggles — 6 buttons, all ON by default, toggle on/off
   - Board size slider (9–25, default 25)
   - Template count slider (0–10, default 5)
   - "Preview Board" button (disabled if < 2 teams)

2. **Preview phase** (after board:preview response):
   - Board grid displayed (read-only, same 3-column grid layout)
   - Each square tappable → emits `board:refresh-item` for that slot
   - "Regenerate" button → re-emits `board:preview` for a fresh board
   - "Back" button → clears preview, returns to configure phase
   - "Start Round" button → emits `game:start` with confirmed board

**Category toggles UI:** Use existing Button component — `variant="default"` when ON, `variant="outline"` when OFF. Wrap in a responsive grid.

## Phase 5: Admin Cleanup

**Files:**

- `src/app/admin/page.tsx` — remove `ItemList`, `AddItemForm` components and their Card. Remove boardSize/templateCount from `GameCreationForm` (leaders configure these in lobby now). Admin form becomes just: display name + create button.
- Remove unused imports (AlertDialog, Badge, ScrollArea, Trash2, Slider, BOARD_CONFIG, etc.)
- `src/app/api/game/route.ts` — remove boardSize/templateCount from request body and game creation. Game created with just `pin`, `leaderPin`, `status`.
- API routes (`/api/items/*`) left in place — unused but harmless.

## Verification

1. `npx prisma db push` — schema applies cleanly
2. `npx prisma db seed` — items seeded with categories
3. `npx tsc --noEmit` — no type errors
4. `npx vitest run` — all tests pass (including new game-logic tests)
5. `npm run dev` — start dev server
6. Manual test flow:
   - Create game on admin page
   - Join as leader → see category toggles in lobby
   - Toggle some categories off
   - Press "Preview Board" → see generated board
   - Tap a square → item refreshes
   - Press "Start Round" → scouts see the board
   - Full game flow still works (submit photo, review, claim, end round)
   - "New Round" → back to lobby with preview controls
