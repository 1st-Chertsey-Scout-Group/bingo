# Step 019: Add Item Model

## Description
Add the Item model to the Prisma schema. Items represent the bingo squares that can appear on a board — either concrete items (like "Oak leaf") or template items (like "Something [colour]") that get expanded with random values at game time.

## Requirements
- Add the `Item` model to `prisma/schema.prisma`
- The model must have the following fields:
  - `id` — String, primary key, default `cuid()`
  - `name` — String (display name, e.g., "Oak leaf" or "Something [colour]")
  - `isTemplate` — Boolean, default `false` (true for template items that need value substitution)
  - `isDefault` — Boolean, default `true` (true for items included in the default item pool)
  - `roundItems` — relation to RoundItem[] (one-to-many)

## Files to Create/Modify
- `prisma/schema.prisma` — add the following model:

```prisma
model Item {
  id         String      @id @default(cuid())
  name       String
  isTemplate Boolean     @default(false)
  isDefault  Boolean     @default(true)
  roundItems RoundItem[]
}
```

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: The Item model is present in `prisma/schema.prisma` with all specified fields
- **Command**: `cat prisma/schema.prisma`
- **Check**: Prisma validates the schema (note: may fail until RoundItem model is added in step 021)
- **Command**: `npx prisma validate`

## Commit
`feat(db): add Item model to Prisma schema`
