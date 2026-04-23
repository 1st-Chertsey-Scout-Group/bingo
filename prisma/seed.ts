import 'dotenv/config'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '../src/generated/prisma/client'

const adapter = new PrismaBetterSqlite3({
  url: process.env['DATABASE_URL'] ?? '',
})
const prisma = new PrismaClient({ adapter })

async function main() {
  const concreteItems: Array<{ name: string; category: string }> = [
    // Trees & Plants
    { name: 'Oak leaf', category: 'trees-plants' },
    { name: 'Pine cone', category: 'trees-plants' },
    { name: 'Moss patch', category: 'trees-plants' },
    { name: 'Wild flower', category: 'trees-plants' },
    { name: 'Bluebell', category: 'trees-plants' },
    { name: 'Ivy leaf', category: 'trees-plants' },
    { name: 'Holly leaf', category: 'trees-plants' },
    { name: 'Bramble bush', category: 'trees-plants' },
    { name: 'Fallen log', category: 'trees-plants' },
    { name: 'Tree stump', category: 'trees-plants' },
    { name: 'Blossom on ground', category: 'trees-plants' },
    { name: 'Catkins', category: 'trees-plants' },
    { name: 'New leaf buds', category: 'trees-plants' },
    { name: 'Nettle patch', category: 'trees-plants' },
    { name: 'Clover patch', category: 'trees-plants' },
    { name: 'Buttercup', category: 'trees-plants' },
    { name: 'Dandelion', category: 'trees-plants' },
    { name: 'Fruit tree', category: 'trees-plants' },
    { name: 'Spring bulb', category: 'trees-plants' },
    { name: 'Weed in pavement', category: 'trees-plants' },
    // Animals & Insects
    { name: 'Spider web', category: 'animals-insects' },
    { name: 'Bird in tree', category: 'animals-insects' },
    { name: 'Worm', category: 'animals-insects' },
    { name: 'Butterfly or moth', category: 'animals-insects' },
    { name: 'Snail', category: 'animals-insects' },
    { name: 'Slug', category: 'animals-insects' },
    { name: 'Beetle', category: 'animals-insects' },
    { name: 'Squirrel', category: 'animals-insects' },
    { name: 'Birds home', category: 'animals-insects' },
    { name: 'Feather', category: 'animals-insects' },
    { name: 'Caterpillar', category: 'animals-insects' },
    { name: 'Ladybird', category: 'animals-insects' },
    { name: 'Bee on flower', category: 'animals-insects' },
    // Landscape & Features
    { name: 'Clouds', category: 'landscape-features' },
    { name: 'Old stone wall', category: 'landscape-features' },
    { name: 'Fallen branch', category: 'landscape-features' },
    { name: 'Unusual tree shape', category: 'landscape-features' },
    { name: 'Tall tree', category: 'landscape-features' },
    { name: 'Tiny plant', category: 'landscape-features' },
    { name: 'Heart-shaped leaf', category: 'landscape-features' },
    { name: 'Y-shaped stick', category: 'landscape-features' },
    { name: 'Forked tree trunk', category: 'landscape-features' },
    { name: 'Knobbly root', category: 'landscape-features' },
    { name: 'Park bench', category: 'landscape-features' },
    { name: 'Moss on stone', category: 'landscape-features' },
    { name: 'Mown grass stripes', category: 'landscape-features' },
    { name: 'Flower bed', category: 'landscape-features' },
    { name: 'Sign or noticeboard', category: 'landscape-features' },
    // Activities & Challenges
    { name: 'Leaf crown', category: 'activities-challenges' },
    { name: 'Stick tower', category: 'activities-challenges' },
    { name: 'Face made from nature', category: 'activities-challenges' },
    { name: 'Tree hug photo', category: 'activities-challenges' },
    { name: 'Grass whistle', category: 'activities-challenges' },
    { name: 'Stone stack', category: 'activities-challenges' },
    { name: 'Shadow selfie', category: 'activities-challenges' },
    { name: 'Camouflage team', category: 'activities-challenges' },
    { name: 'Big stick', category: 'activities-challenges' },
    { name: 'Team bridge pose', category: 'activities-challenges' },
    // Scavenger Finds
    { name: 'Three different leaves', category: 'scavenger-finds' },
    { name: 'Matching pair', category: 'scavenger-finds' },
    { name: 'Something weathered', category: 'scavenger-finds' },
    { name: 'Something nibbled', category: 'scavenger-finds' },
    { name: 'Something man-made', category: 'scavenger-finds' },
    { name: 'Interesting pattern', category: 'scavenger-finds' },
    { name: 'A hole in a leaf', category: 'scavenger-finds' },
    { name: 'Curly twig', category: 'scavenger-finds' },
    { name: 'Big leaf', category: 'scavenger-finds' },
    { name: 'Small flower', category: 'scavenger-finds' },
    // Observation
    { name: 'Bird flying', category: 'observation' },
    { name: 'Sun through leaves', category: 'observation' },
    { name: 'Insect home', category: 'observation' },
    { name: 'Brown leaf', category: 'observation' },
    { name: 'Something growing on a tree', category: 'observation' },
    { name: 'Buds about to open', category: 'observation' },
    { name: 'Plant growing through stone', category: 'observation' },
    { name: 'Crack in old stone', category: 'observation' },
    { name: 'Shadow of a tree', category: 'observation' },
  ]

  // Delete existing default concrete items and recreate (idempotent)
  await prisma.item.deleteMany({
    where: { isDefault: true, isTemplate: false },
  })

  await prisma.item.createMany({
    data: concreteItems.map((item) => ({
      name: item.name,
      category: item.category,
      isTemplate: false,
      isDefault: true,
    })),
  })

  console.log(`Seeded ${concreteItems.length} concrete items`)

  // Template items
  const templateItems = ['Something [colour]', 'Something [texture]']

  await prisma.item.deleteMany({ where: { isDefault: true, isTemplate: true } })

  await prisma.item.createMany({
    data: templateItems.map((name) => ({
      name,
      category: 'templates',
      isTemplate: true,
      isDefault: true,
    })),
  })

  console.log(`Seeded ${templateItems.length} template items`)

  // Template values
  const templateValues = [
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
}

main()
  .catch((e: unknown) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
