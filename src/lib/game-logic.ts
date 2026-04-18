import { resolveTemplate } from '@/lib/templates'
import type { BoardItem } from '@/types'

type Item = {
  id: string
  name: string
  category: string
  isTemplate: boolean
}

type TemplateValue = {
  id: string
  category: string
  value: string
}

type GenerateBoardOptions = {
  boardSize: number
  templateCount: number
  allItems: Item[]
  templateItems: Item[]
  templateValues: TemplateValue[]
  recentItemIds?: string[]
  categories?: string[]
}

type RefreshBoardItemOptions = {
  currentBoard: BoardItem[]
  indexToReplace: number
  allItems: Item[]
  templateItems: Item[]
  templateValues: TemplateValue[]
  recentItemIds?: string[]
  categories?: string[]
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
    recentItemIds = [],
    categories,
  } = options

  // Filter by selected categories if provided
  const filteredItems = categories
    ? allItems.filter((item) => categories.includes(item.category))
    : allItems

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
  const nonRecent = filteredItems.filter((item) => !recentSet.has(item.id))
  const recent = recentItemIds
    .filter((id) => filteredItems.some((item) => item.id === id))
    .map((id) => filteredItems.find((item) => item.id === id) as Item)

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

export function refreshBoardItem(
  options: RefreshBoardItemOptions,
): BoardItem | null {
  const {
    currentBoard,
    indexToReplace,
    allItems,
    templateItems,
    templateValues,
    recentItemIds = [],
    categories,
  } = options

  if (indexToReplace < 0 || indexToReplace >= currentBoard.length) return null

  // Collect itemIds already on the board (excluding the one being replaced)
  const usedItemIds = new Set(
    currentBoard
      .filter((_, i) => i !== indexToReplace)
      .map((item) => item.itemId),
  )

  // Filter available items by categories
  const filteredItems = categories
    ? allItems.filter((item) => categories.includes(item.category))
    : allItems

  // Exclude items already on the board
  const available = filteredItems.filter((item) => !usedItemIds.has(item.id))

  if (available.length === 0) {
    // Try a template instead
    const usedValues = new Set<string>()
    // Collect existing template display names to avoid duplicates
    for (const boardItem of currentBoard) {
      if (boardItem.itemId !== currentBoard[indexToReplace].itemId) {
        usedValues.add(boardItem.displayName)
      }
    }

    const shuffledTemplates = fisherYatesShuffle(templateItems)
    for (const template of shuffledTemplates) {
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
        return { itemId: template.id, displayName: resolved }
      }
    }

    return null
  }

  // Prefer non-recent items
  const recentSet = new Set(recentItemIds)
  const nonRecent = available.filter((item) => !recentSet.has(item.id))
  const pool = nonRecent.length > 0 ? nonRecent : available

  const randomIndex = Math.floor(Math.random() * pool.length)
  const picked = pool[randomIndex]
  return { itemId: picked.id, displayName: picked.name }
}

export function generateScoutPin(): string {
  // Scout PINs start with 0-4
  const first = Math.floor(Math.random() * 5)
  const rest = Math.floor(Math.random() * 1000)
  return `${String(first)}${rest.toString().padStart(3, '0')}`
}

export function generateLeaderPin(): string {
  // Leader PINs start with 5-9
  const first = 5 + Math.floor(Math.random() * 5)
  const rest = Math.floor(Math.random() * 1000)
  return `${String(first)}${rest.toString().padStart(3, '0')}`
}

export function validatePinUnique(
  pin: string,
  existingPins: string[],
): boolean {
  return !existingPins.includes(pin)
}
