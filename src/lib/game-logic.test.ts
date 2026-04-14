import { describe, expect, it } from 'vitest'
import { generateBoard, generatePin, validatePinUnique } from './game-logic'

const mockConcreteItems = Array.from({ length: 30 }, (_, i) => ({
  id: `item-${i + 1}`,
  name: `Item ${i + 1}`,
  isTemplate: false,
}))

const mockTemplateItems = [
  { id: 'tpl-1', name: 'A [colour] flower', isTemplate: true },
  { id: 'tpl-2', name: 'A [colour] leaf', isTemplate: true },
  { id: 'tpl-3', name: 'A [tree] tree', isTemplate: true },
]

const mockTemplateValues = [
  { id: 'tv-1', category: 'colour', value: 'red' },
  { id: 'tv-2', category: 'colour', value: 'blue' },
  { id: 'tv-3', category: 'colour', value: 'yellow' },
  { id: 'tv-4', category: 'tree', value: 'oak' },
  { id: 'tv-5', category: 'tree', value: 'birch' },
]

describe('generateBoard', () => {
  it('returns an array with exactly boardSize items', () => {
    const board = generateBoard({
      boardSize: 9,
      templateCount: 2,
      allItems: mockConcreteItems,
      templateItems: mockTemplateItems,
      templateValues: mockTemplateValues,
      recentItemIds: [],
    })

    expect(board).toHaveLength(9)
  })

  it('contains the correct number of concrete and template items', () => {
    const boardSize = 9
    const templateCount = 2

    const board = generateBoard({
      boardSize,
      templateCount,
      allItems: mockConcreteItems,
      templateItems: mockTemplateItems,
      templateValues: mockTemplateValues,
      recentItemIds: [],
    })

    const concreteItems = board.filter((b) =>
      mockConcreteItems.some((c) => c.id === b.itemId),
    )
    const templateResolvedItems = board.filter((b) =>
      mockTemplateItems.some((t) => t.id === b.itemId),
    )

    expect(concreteItems).toHaveLength(boardSize - templateCount)
    expect(templateResolvedItems).toHaveLength(templateCount)
  })

  it('has no duplicate itemId values', () => {
    const board = generateBoard({
      boardSize: 9,
      templateCount: 2,
      allItems: mockConcreteItems,
      templateItems: mockTemplateItems,
      templateValues: mockTemplateValues,
      recentItemIds: [],
    })

    const ids = board.map((b) => b.itemId)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('avoids items in recentItemIds when the pool is large enough', () => {
    const recentIds = ['item-1', 'item-2', 'item-3', 'item-4', 'item-5']

    const board = generateBoard({
      boardSize: 9,
      templateCount: 2,
      allItems: mockConcreteItems,
      templateItems: mockTemplateItems,
      templateValues: mockTemplateValues,
      recentItemIds: recentIds,
    })

    const concreteIds = board
      .filter((b) => mockConcreteItems.some((c) => c.id === b.itemId))
      .map((b) => b.itemId)

    for (const id of concreteIds) {
      expect(recentIds).not.toContain(id)
    }
  })

  it('falls back to recent items (oldest first) when the non-recent pool is too small', () => {
    const smallPool = mockConcreteItems.slice(0, 5)
    const recentIds = ['item-1', 'item-2', 'item-3']

    const board = generateBoard({
      boardSize: 7,
      templateCount: 2,
      allItems: smallPool,
      templateItems: mockTemplateItems,
      templateValues: mockTemplateValues,
      recentItemIds: recentIds,
    })

    expect(board).toHaveLength(7)

    const concreteIds = board
      .filter((b) => smallPool.some((c) => c.id === b.itemId))
      .map((b) => b.itemId)

    expect(concreteIds).toHaveLength(5)

    const usedRecentIds = concreteIds.filter((id) => recentIds.includes(id))
    expect(usedRecentIds.length).toBeGreaterThan(0)
  })

  it('template-resolved items have no brackets in display names', () => {
    const board = generateBoard({
      boardSize: 9,
      templateCount: 3,
      allItems: mockConcreteItems,
      templateItems: mockTemplateItems,
      templateValues: mockTemplateValues,
      recentItemIds: [],
    })

    const templateResolvedItems = board.filter((b) =>
      mockTemplateItems.some((t) => t.id === b.itemId),
    )

    for (const item of templateResolvedItems) {
      expect(item.displayName).not.toMatch(/\[/)
      expect(item.displayName).not.toMatch(/\]/)
    }
  })

  it('returns items in a shuffled order (not always identical)', () => {
    const options = {
      boardSize: 9,
      templateCount: 0,
      allItems: mockConcreteItems,
      templateItems: [],
      templateValues: [],
      recentItemIds: [],
    }

    const orders: string[] = []
    for (let i = 0; i < 20; i++) {
      const board = generateBoard(options)
      orders.push(board.map((b) => b.itemId).join(','))
    }

    const uniqueOrders = new Set(orders)
    expect(uniqueOrders.size).toBeGreaterThan(1)
  })

  it('works correctly with templateCount: 0', () => {
    const board = generateBoard({
      boardSize: 9,
      templateCount: 0,
      allItems: mockConcreteItems,
      templateItems: [],
      templateValues: [],
      recentItemIds: [],
    })

    expect(board).toHaveLength(9)

    for (const item of board) {
      expect(mockConcreteItems.some((c) => c.id === item.itemId)).toBe(true)
    }
  })

  it('works correctly with an empty recentItemIds array', () => {
    const board = generateBoard({
      boardSize: 9,
      templateCount: 2,
      allItems: mockConcreteItems,
      templateItems: mockTemplateItems,
      templateValues: mockTemplateValues,
      recentItemIds: [],
    })

    expect(board).toHaveLength(9)
  })
})

describe('generatePin', () => {
  it('returns a string of exactly 4 characters', () => {
    const pin = generatePin()
    expect(pin).toHaveLength(4)
  })

  it('contains only digits 0-9', () => {
    for (let i = 0; i < 20; i++) {
      const pin = generatePin()
      expect(pin).toMatch(/^\d{4}$/)
    }
  })

  it('generates different values on subsequent calls', () => {
    const pins = Array.from({ length: 10 }, () => generatePin())
    const uniquePins = new Set(pins)
    expect(uniquePins.size).toBeGreaterThan(1)
  })
})

describe('validatePinUnique', () => {
  it('returns true when pin is not in the existing pins array', () => {
    expect(validatePinUnique('1234', ['5678', '9012'])).toBe(true)
  })

  it('returns false when pin is in the existing pins array', () => {
    expect(validatePinUnique('1234', ['1234', '5678'])).toBe(false)
  })

  it('returns true when existing pins array is empty', () => {
    expect(validatePinUnique('1234', [])).toBe(true)
  })
})
