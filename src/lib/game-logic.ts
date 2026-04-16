import { resolveTemplate } from '@/lib/templates'

type Item = {
  id: string
  name: string
  isTemplate: boolean
}

type TemplateValue = {
  id: string
  category: string
  value: string
}

type BoardItem = {
  itemId: string
  displayName: string
}

type GenerateBoardOptions = {
  boardSize: number
  templateCount: number
  allItems: Item[]
  templateItems: Item[]
  templateValues: TemplateValue[]
  recentItemIds: string[]
}

function fisherYatesShuffle<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = result[i]
    result[i] = result[j]
    result[j] = temp
  }
  return result
}

export function generateBoard(options: GenerateBoardOptions): BoardItem[] {
  const {
    boardSize,
    templateCount,
    allItems,
    templateItems,
    templateValues,
    recentItemIds,
  } = options

  const boardItems: BoardItem[] = []

  // Fill template slots first so we know how many concrete slots remain
  const usedValues = new Set<string>()
  const shuffledTemplates = fisherYatesShuffle(templateItems)
  let templateSlotsFilled = 0

  for (const template of shuffledTemplates) {
    if (templateSlotsFilled >= templateCount) break

    const match = template.name.match(/\[(\w+)]/)
    if (!match) continue
    const category = match[1]

    const values = templateValues
      .filter((tv) => tv.category === category)
      .map((tv) => tv.value)

    const resolved = resolveTemplate(
      template.name,
      category,
      values,
      usedValues,
    )
    if (resolved !== null) {
      boardItems.push({ itemId: template.id, displayName: resolved })
      templateSlotsFilled++
    }
  }

  const concreteCount = boardSize - boardItems.length

  // Select concrete items, avoiding recent where possible
  const recentSet = new Set(recentItemIds)
  const nonRecent = allItems.filter((item) => !recentSet.has(item.id))
  const recent = recentItemIds
    .filter((id) => allItems.some((item) => item.id === id))
    .map((id) => allItems.find((item) => item.id === id) as Item)

  const shuffledNonRecent = fisherYatesShuffle(nonRecent)
  const selectedConcrete: Item[] = []

  for (const item of shuffledNonRecent) {
    if (selectedConcrete.length >= concreteCount) break
    selectedConcrete.push(item)
  }

  // Fill remaining from recent items (oldest-reused-first order)
  if (selectedConcrete.length < concreteCount) {
    for (const item of recent) {
      if (selectedConcrete.length >= concreteCount) break
      if (!selectedConcrete.some((s) => s.id === item.id)) {
        selectedConcrete.push(item)
      }
    }
  }

  for (const item of selectedConcrete) {
    boardItems.push({ itemId: item.id, displayName: item.name })
  }

  return fisherYatesShuffle(boardItems)
}

export function generatePin(): string {
  const pin = Math.floor(Math.random() * 10000)
  return pin.toString().padStart(4, '0')
}

export function validatePinUnique(
  pin: string,
  existingPins: string[],
): boolean {
  return !existingPins.includes(pin)
}
