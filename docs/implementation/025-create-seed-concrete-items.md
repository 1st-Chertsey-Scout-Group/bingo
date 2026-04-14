# Step 025: Create Seed Script — Concrete Items

## Description

Create the database seed script that populates the Item table with all 85 concrete bingo items. These are the default items that can appear on bingo boards, organized by category for reference but stored as a flat list in the database.

## Requirements

- Create `prisma/seed.ts`
- Import PrismaClient from `@prisma/client`
- Seed exactly 85 concrete items into the Item table
- All items must have `isDefault: true` and `isTemplate: false`
- Use `upsert` (matching on `name`) or `createMany` with `skipDuplicates` to make the seed idempotent
- The script must handle errors and disconnect the Prisma client on completion
- List every single item name — the complete set of 85 items is:

**Nature — Trees & Plants (20 items):**

1. Oak leaf
2. Pine cone
3. Birch bark
4. Fern frond
5. Moss patch
6. Wild flower
7. Dandelion clock
8. Ivy leaf
9. Holly leaf
10. Bramble bush
11. Fallen log
12. Tree stump
13. Lichen on rock
14. Mushroom
15. Acorn
16. Conker
17. Sycamore seed
18. Nettle patch
19. Clover patch
20. Daisy

**Nature — Animals & Insects (15 items):** 21. Spider web 22. Bird in tree 23. Ant trail 24. Worm 25. Butterfly or moth 26. Snail 27. Slug 28. Beetle 29. Squirrel 30. Bird nest 31. Feather 32. Animal footprint 33. Caterpillar 34. Ladybird 35. Bee on flower

**Nature — Landscape & Features (15 items):** 36. Puddle reflection 37. Cloud shape 38. Stream or ditch 39. Rocky outcrop 40. Muddy patch 41. Animal hole 42. Fallen branch 43. Twisted tree 44. Split in bark 45. Tall tree 46. Tiny plant 47. Heart-shaped leaf 48. Y-shaped stick 49. Tree with no leaves 50. Patch of wildflowers

**Activities & Challenges (15 items):** 51. Team star jump 52. Leaf crown 53. Stick tower 54. Nature face art 55. Tree hug photo 56. Bark rubbing 57. Grass whistle 58. Stone stack 59. Shadow selfie 60. Camouflage team 61. Leaf boat 62. Big stick 63. Team bridge pose 64. Nature letter "S" 65. Mud war paint

**Scavenger Finds (10 items):** 66. Something camouflaged 67. Three different leaves 68. Two different berries 69. Matching pair 70. Something weathered 71. Something nibbled 72. Something man-made 73. Interesting pattern 74. A hole in a leaf 75. Curly twig

**Observation (10 items):** 76. Bird flying 77. Sun through leaves 78. Dew drops 79. Insect home 80. Seed dispersal 81. Decomposing leaf 82. Animal territory mark 83. Wind effect 84. Water source 85. Night-time creature sign

## Files to Create/Modify

- `prisma/seed.ts` — create with the following structure:

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const concreteItems = [
    // Nature — Trees & Plants
    'Oak leaf',
    'Pine cone',
    'Birch bark',
    'Fern frond',
    'Moss patch',
    'Wild flower',
    'Dandelion clock',
    'Ivy leaf',
    'Holly leaf',
    'Bramble bush',
    'Fallen log',
    'Tree stump',
    'Lichen on rock',
    'Mushroom',
    'Acorn',
    'Conker',
    'Sycamore seed',
    'Nettle patch',
    'Clover patch',
    'Daisy',
    // Nature — Animals & Insects
    'Spider web',
    'Bird in tree',
    'Ant trail',
    'Worm',
    'Butterfly or moth',
    'Snail',
    'Slug',
    'Beetle',
    'Squirrel',
    'Bird nest',
    'Feather',
    'Animal footprint',
    'Caterpillar',
    'Ladybird',
    'Bee on flower',
    // Nature — Landscape & Features
    'Puddle reflection',
    'Cloud shape',
    'Stream or ditch',
    'Rocky outcrop',
    'Muddy patch',
    'Animal hole',
    'Fallen branch',
    'Twisted tree',
    'Split in bark',
    'Tall tree',
    'Tiny plant',
    'Heart-shaped leaf',
    'Y-shaped stick',
    'Tree with no leaves',
    'Patch of wildflowers',
    // Activities & Challenges
    'Team star jump',
    'Leaf crown',
    'Stick tower',
    'Nature face art',
    'Tree hug photo',
    'Bark rubbing',
    'Grass whistle',
    'Stone stack',
    'Shadow selfie',
    'Camouflage team',
    'Leaf boat',
    'Big stick',
    'Team bridge pose',
    'Nature letter "S"',
    'Mud war paint',
    // Scavenger Finds
    'Something camouflaged',
    'Three different leaves',
    'Two different berries',
    'Matching pair',
    'Something weathered',
    'Something nibbled',
    'Something man-made',
    'Interesting pattern',
    'A hole in a leaf',
    'Curly twig',
    // Observation
    'Bird flying',
    'Sun through leaves',
    'Dew drops',
    'Insect home',
    'Seed dispersal',
    'Decomposing leaf',
    'Animal territory mark',
    'Wind effect',
    'Water source',
    'Night-time creature sign',
  ]

  for (const name of concreteItems) {
    await prisma.item.upsert({
      where: { id: name },
      update: {},
      create: {
        name,
        isTemplate: false,
        isDefault: true,
      },
    })
  }

  console.log(`Seeded ${concreteItems.length} concrete items`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

Note: Since Item does not have a unique constraint on `name`, the seed script may need to use `createMany` with a check or delete-and-recreate pattern. An alternative approach:

```typescript
// Delete existing default items and recreate
await prisma.item.deleteMany({ where: { isDefault: true, isTemplate: false } })

await prisma.item.createMany({
  data: concreteItems.map((name) => ({
    name,
    isTemplate: false,
    isDefault: true,
  })),
})
```

## Checklist

- [x] Implemented
- [x] Verified

## Verification

- **Check**: `prisma/seed.ts` exists and contains all 85 concrete item names
- **Command**: `cat prisma/seed.ts`
- **Check**: The script compiles without TypeScript errors
- **Command**: `npx tsx --eval "import './prisma/seed.ts'" --dry-run` (or just check syntax)

## Commit

`feat(seed): create seed script with 85 concrete bingo items`
