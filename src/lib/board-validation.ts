import {
  ALL_CATEGORIES,
  BOARD_CONFIG,
  type ItemCategory,
} from '@/lib/constants'

export function validateCategories(
  categories: unknown,
): categories is string[] {
  if (!Array.isArray(categories)) return false
  const validSet = new Set<string>(ALL_CATEGORIES)
  return categories.every(
    (c) => typeof c === 'string' && validSet.has(c as ItemCategory),
  )
}

export function validateBoardConfig(
  boardSize: unknown,
  templateCount: unknown,
): { boardSize: number; templateCount: number } | null {
  if (
    typeof boardSize !== 'number' ||
    boardSize < BOARD_CONFIG.SIZE_MIN ||
    boardSize > BOARD_CONFIG.SIZE_MAX ||
    boardSize % BOARD_CONFIG.SIZE_STEP !== 0
  ) {
    return null
  }
  if (
    typeof templateCount !== 'number' ||
    templateCount < BOARD_CONFIG.TEMPLATE_MIN ||
    templateCount > BOARD_CONFIG.TEMPLATE_MAX
  ) {
    return null
  }
  if (templateCount > boardSize) return null
  return { boardSize, templateCount }
}
