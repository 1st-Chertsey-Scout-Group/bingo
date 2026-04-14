# Step 020: Add TemplateValue Model

## Description
Add the TemplateValue model to the Prisma schema. Template values are the possible substitution values for template items. For example, the template "Something [colour]" can be expanded to "Something Red", "Something Blue", etc. using values from the "colour" category.

## Requirements
- Add the `TemplateValue` model to `prisma/schema.prisma`
- The model must have the following fields:
  - `id` — String, primary key, default `cuid()`
  - `category` — String (e.g., "colour", "texture")
  - `value` — String (e.g., "Red", "Smooth")
- Add a unique constraint on the combination of `category` and `value` to prevent duplicates

## Files to Create/Modify
- `prisma/schema.prisma` — add the following model:

```prisma
model TemplateValue {
  id       String @id @default(cuid())
  category String
  value    String
  @@unique([category, value])
}
```

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: The TemplateValue model is present in `prisma/schema.prisma` with all specified fields and unique constraint
- **Command**: `cat prisma/schema.prisma`
- **Check**: Prisma validates the schema
- **Command**: `npx prisma validate`

## Commit
`feat(db): add TemplateValue model to Prisma schema`
