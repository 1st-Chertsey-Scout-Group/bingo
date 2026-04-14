# Step 044: Create Board Generation

## Description

Create the game logic module with board generation and PIN utilities. Board generation selects a mix of concrete and template-resolved items, avoids recently used items where possible, and shuffles them into a random order.

## Requirements

- Create `src/lib/game-logic.ts`
- Export `generateBoard(options: { boardSize: number, templateCount: number, allItems: Item[], templateItems: Item[], templateValues: TemplateValue[], recentItemIds: string[] }): BoardItem[]` where:
  - `Item` has at least `{ id: string, name: string, category: string | null }`
  - `TemplateValue` has at least `{ id: string, category: string, value: string }`
  - `BoardItem` is `{ itemId: string, displayName: string }`
  - Select `boardSize - templateCount` concrete items from `allItems`, avoiding items whose `id` is in `recentItemIds` where possible (soft constraint)
  - When the non-recent pool is smaller than needed, fill from recent items using oldest-reused-first order (items appearing earlier in `recentItemIds`)
  - Fill remaining `templateCount` slots using `resolveTemplate` from `@/lib/templates` (no duplicate template+value combos on the same board)
  - Shuffle all items into random order using Fisher-Yates shuffle
  - Return array of `BoardItem`
- Export `generatePin(): string` — generates a random 4-digit string (0000-9999), zero-padded
- Export `validatePinUnique(pin: string, existingPins: string[]): boolean` — returns `true` if the pin is not in the existing pins array
- Import `resolveTemplate` from `@/lib/templates`
- Follow project code standards: named exports, no `any`, TypeScript strict

## Files to Create/Modify

- `src/lib/game-logic.ts` — create board generation and PIN utility functions

## Checklist

- [x] Implemented
- [x] Verified

## Verification

- **Check**: File exports `generateBoard`, `generatePin`, and `validatePinUnique`
- **Command**: `cat src/lib/game-logic.ts`
- **Check**: TypeScript compiles without errors
- **Command**: `npx tsc --noEmit`

## Commit

`feat(game): add board generation, PIN generation, and validation utilities`
