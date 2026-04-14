# Step 011: Initialize shadcn/ui

> **MANUAL STEP** — requires human action.

## Description
Initialize the shadcn/ui component library which provides pre-built, customizable UI components built on Radix UI primitives and styled with Tailwind CSS. This sets up the component system, CSS variables, and the `cn()` utility function.

## Requirements
- Run the shadcn/ui initialization command
- Select the following options when prompted:
  - Style: **New York**
  - Base color: **Zinc**
  - CSS variables: **Yes**
- This creates:
  - `components.json` — shadcn/ui configuration file at the project root
  - `src/lib/utils.ts` — the `cn()` utility function (combines `clsx` and `tailwind-merge`)
  - Updates to `src/app/globals.css` — CSS variable definitions for theming
- The `cn()` utility must use `clsx` and `tailwind-merge`:
  ```typescript
  import { type ClassValue, clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'

  export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
  }
  ```

## Files to Create/Modify
- `components.json` — created by shadcn/ui init
- `src/lib/utils.ts` — created with the `cn()` utility function
- `src/app/globals.css` — updated with CSS variable definitions

## Checklist
- [x] Implemented
- [x] Verified

## Verification
- **Check**: shadcn/ui is initialized successfully
- **Command**: `npx shadcn@latest init`
- **Check**: `components.json` exists at the project root
- **Command**: `cat components.json`
- **Check**: `cn()` utility exists
- **Command**: `cat src/lib/utils.ts`

## Commit
`feat(ui): initialize shadcn/ui with New York style and Zinc theme`
