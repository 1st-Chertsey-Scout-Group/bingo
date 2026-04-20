import { describe, it, expect } from 'vitest'
import { validateCategories, validateBoardConfig } from '@/lib/board-validation'
import { ALL_CATEGORIES } from '@/lib/constants'

describe('validateCategories', () => {
  it('returns true for valid category array', () => {
    expect(validateCategories(ALL_CATEGORIES)).toBe(true)
  })

  it('returns true for a subset of valid categories', () => {
    expect(validateCategories([ALL_CATEGORIES[0]])).toBe(true)
  })

  it('returns true for empty array', () => {
    expect(validateCategories([])).toBe(true)
  })

  it('returns false for non-array input', () => {
    expect(validateCategories(null)).toBe(false)
    expect(validateCategories(undefined)).toBe(false)
    expect(validateCategories('trees-plants')).toBe(false)
    expect(validateCategories(42)).toBe(false)
  })

  it('returns false for array with non-string elements', () => {
    expect(validateCategories([42])).toBe(false)
    expect(validateCategories([null])).toBe(false)
  })

  it('returns false for array with invalid category strings', () => {
    expect(validateCategories(['not-a-category'])).toBe(false)
    expect(validateCategories([ALL_CATEGORIES[0], 'fake'])).toBe(false)
  })
})

describe('validateBoardConfig', () => {
  it('returns config for valid inputs', () => {
    expect(validateBoardConfig(9, 2)).toEqual({
      boardSize: 9,
      templateCount: 2,
    })
    expect(validateBoardConfig(24, 10)).toEqual({
      boardSize: 24,
      templateCount: 10,
    })
    expect(validateBoardConfig(12, 0)).toEqual({
      boardSize: 12,
      templateCount: 0,
    })
  })

  it('returns null when boardSize is not a number', () => {
    expect(validateBoardConfig('9', 2)).toBeNull()
    expect(validateBoardConfig(null, 2)).toBeNull()
  })

  it('returns null when boardSize is below minimum', () => {
    expect(validateBoardConfig(6, 2)).toBeNull()
  })

  it('returns null when boardSize is above maximum', () => {
    expect(validateBoardConfig(27, 2)).toBeNull()
  })

  it('returns null when boardSize is not divisible by step', () => {
    expect(validateBoardConfig(10, 2)).toBeNull()
    expect(validateBoardConfig(11, 2)).toBeNull()
  })

  it('returns null when templateCount is not a number', () => {
    expect(validateBoardConfig(9, '2')).toBeNull()
    expect(validateBoardConfig(9, null)).toBeNull()
  })

  it('returns null when templateCount is below minimum', () => {
    expect(validateBoardConfig(9, -1)).toBeNull()
  })

  it('returns null when templateCount is above maximum', () => {
    expect(validateBoardConfig(9, 11)).toBeNull()
  })

  it('returns null when templateCount exceeds boardSize', () => {
    expect(validateBoardConfig(9, 10)).toBeNull()
  })
})
