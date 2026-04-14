# Step 026: Add Seed Templates and Template Values

## Description
Extend the seed script to also seed the 2 template items and all TemplateValue records. Template items are bingo squares whose display names are generated at game time by substituting a category value (e.g., "Something [colour]" becomes "Something Red").

## Requirements
- Add 2 template items to the seed script with `isTemplate: true` and `isDefault: true`:
  1. `"Something [colour]"`
  2. `"Something [texture]"`
- Add all TemplateValue records for the `colour` category (10 values):
  1. Red
  2. Blue
  3. Green
  4. Yellow
  5. Orange
  6. Brown
  7. White
  8. Black
  9. Purple
  10. Pink
- Add all TemplateValue records for the `texture` category (8 values):
  1. Smooth
  2. Rough
  3. Bumpy
  4. Soft
  5. Spiky
  6. Fuzzy
  7. Hard
  8. Crumbly
- Use upsert on the `[category, value]` unique constraint for TemplateValue to make the seed idempotent
- The total item count after seeding should be 87 (85 concrete + 2 templates)
- The total TemplateValue count should be 18 (10 colours + 8 textures)

## Files to Create/Modify
- `prisma/seed.ts` — extend the existing `main()` function to add the following after the concrete items seeding:

```typescript
  // Template items
  const templateItems = [
    'Something [colour]',
    'Something [texture]',
  ]

  await prisma.item.deleteMany({ where: { isDefault: true, isTemplate: true } })

  await prisma.item.createMany({
    data: templateItems.map((name) => ({
      name,
      isTemplate: true,
      isDefault: true,
    })),
  })

  console.log(`Seeded ${templateItems.length} template items`)

  // Template values
  const templateValues = [
    // colour
    { category: 'colour', value: 'Red' },
    { category: 'colour', value: 'Blue' },
    { category: 'colour', value: 'Green' },
    { category: 'colour', value: 'Yellow' },
    { category: 'colour', value: 'Orange' },
    { category: 'colour', value: 'Brown' },
    { category: 'colour', value: 'White' },
    { category: 'colour', value: 'Black' },
    { category: 'colour', value: 'Purple' },
    { category: 'colour', value: 'Pink' },
    // texture
    { category: 'texture', value: 'Smooth' },
    { category: 'texture', value: 'Rough' },
    { category: 'texture', value: 'Bumpy' },
    { category: 'texture', value: 'Soft' },
    { category: 'texture', value: 'Spiky' },
    { category: 'texture', value: 'Fuzzy' },
    { category: 'texture', value: 'Hard' },
    { category: 'texture', value: 'Crumbly' },
  ]

  for (const tv of templateValues) {
    await prisma.templateValue.upsert({
      where: {
        category_value: {
          category: tv.category,
          value: tv.value,
        },
      },
      update: {},
      create: tv,
    })
  }

  console.log(`Seeded ${templateValues.length} template values`)
```

## Checklist
- [ ] Implemented
- [ ] Verified

## Verification
- **Check**: `prisma/seed.ts` contains both template items and all template values
- **Command**: `cat prisma/seed.ts`
- **Check**: The script references exactly 2 template item names and 18 template values (10 colours + 8 textures)
- **Command**: `grep -c "category:" prisma/seed.ts` (should be 18)

## Commit
`feat(seed): add template items and template values to seed script`
