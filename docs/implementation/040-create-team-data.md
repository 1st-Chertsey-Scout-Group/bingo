# Step 040: Create Team Data

## Description

Create the team data module containing all 30 predefined team names with their colours, plus utility functions for team assignment. Teams are assigned sequentially as scouts join a game.

## Requirements

- Create `src/lib/teams.ts`
- Export a `TEAMS` array containing all 30 teams in order, each with `{ index: number, name: string, colour: string }`
- Primary teams (index 0-14):
  - 0: Red Rabbits #E03131
  - 1: Orange Ocelots #E8590C
  - 2: Yellow Yaks #F59F00
  - 3: Lime Llamas #74B816
  - 4: Green Geckos #2F9E44
  - 5: Teal Turtles #099268
  - 6: Cyan Coyotes #0C8599
  - 7: Blue Bats #1971C2
  - 8: Indigo Iguanas #4263EB
  - 9: Purple Pandas #7048E8
  - 10: Violet Vultures #9C36B5
  - 11: Pink Parrots #D6336C
  - 12: Brown Bears #A0522D
  - 13: Coral Cats #FF6B6B
  - 14: Gold Gorillas #DAA520
- Backup teams (index 15-29):
  - 15: Crimson Cranes #C92A2A
  - 16: Amber Antelopes #FF922B
  - 17: Sage Salamanders #5C940D
  - 18: Emerald Eagles #20C997
  - 19: Aqua Axolotls #22B8CF
  - 20: Navy Newts #1B4F99
  - 21: Magenta Monkeys #CC5DE8
  - 22: Peach Penguins #FF8787
  - 23: Maroon Meerkats #862E2E
  - 24: Tangerine Tigers #FD7E14
  - 25: Mint Mantises #63E6BE
  - 26: Slate Sharks #5C7CFA
  - 27: Plum Platypuses #845EF7
  - 28: Rose Raccoons #F06595
  - 29: Copper Chameleons #B87333
- Export `getTeamByIndex(index: number): { index: number, name: string, colour: string } | undefined` — returns the team at the given 0-based index, or `undefined` if out of range
- Export `getNextTeam(currentTeamCount: number): { index: number, name: string, colour: string } | null` — returns the team at index `currentTeamCount`, or `null` if all 30 teams are assigned
- Follow project code standards: named exports, no `any`, TypeScript strict

## Files to Create/Modify

- `src/lib/teams.ts` — create team data array and utility functions

## Checklist

- [x] Implemented
- [x] Verified

## Verification

- **Check**: TEAMS array has exactly 30 entries
- **Command**: `grep -c 'index:' src/lib/teams.ts` (should be 30)
- **Check**: All team names and hex colours match the specification
- **Command**: `cat src/lib/teams.ts`
- **Check**: TypeScript compiles without errors
- **Command**: `npx tsc --noEmit`

## Commit

`feat(data): add team names, colours, and assignment utilities`
