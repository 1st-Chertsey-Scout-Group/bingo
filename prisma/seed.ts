import 'dotenv/config'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '../src/generated/prisma/client'

const adapter = new PrismaBetterSqlite3({
  url: process.env['DATABASE_URL'] ?? '',
})
const prisma = new PrismaClient({ adapter })

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

  // Delete existing default concrete items and recreate (idempotent)
  await prisma.item.deleteMany({
    where: { isDefault: true, isTemplate: false },
  })

  await prisma.item.createMany({
    data: concreteItems.map((name) => ({
      name,
      isTemplate: false,
      isDefault: true,
    })),
  })

  console.log(`Seeded ${concreteItems.length} concrete items`)
}

main()
  .catch((e: unknown) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
