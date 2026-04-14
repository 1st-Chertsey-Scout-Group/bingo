import { describe, expect, it } from 'vitest'
import { resolveTemplate } from './templates'

describe('resolveTemplate', () => {
  it('resolves [colour] placeholder', () => {
    const result = resolveTemplate(
      'Something [colour]',
      'colour',
      ['Red', 'Blue'],
      new Set(),
    )
    expect(result).toMatch(/^Something (Red|Blue)$/)
  })

  it('never picks a used value', () => {
    for (let i = 0; i < 50; i++) {
      const result = resolveTemplate(
        'Something [colour]',
        'colour',
        ['Red', 'Blue'],
        new Set(['Something Red']),
      )
      expect(result).toBe('Something Blue')
    }
  })

  it('returns null when all values are exhausted', () => {
    const result = resolveTemplate(
      'Something [colour]',
      'colour',
      ['Red'],
      new Set(['Something Red']),
    )
    expect(result).toBeNull()
  })

  it('mutates the usedValues Set', () => {
    const usedValues = new Set<string>()
    const result = resolveTemplate(
      'Something [colour]',
      'colour',
      ['Red'],
      usedValues,
    )
    expect(result).toBe('Something Red')
    expect(usedValues.has('Something Red')).toBe(true)
  })

  it('handles [texture] category', () => {
    const result = resolveTemplate(
      'A [texture] rock',
      'texture',
      ['smooth', 'rough'],
      new Set(),
    )
    expect(result).toMatch(/^A (smooth|rough) rock$/)
  })

  it('returns null for empty values array', () => {
    const result = resolveTemplate(
      'Something [colour]',
      'colour',
      [],
      new Set(),
    )
    expect(result).toBeNull()
  })

  it('with only one value available, always returns that value resolved', () => {
    for (let i = 0; i < 20; i++) {
      const result = resolveTemplate(
        'Something [colour]',
        'colour',
        ['Red'],
        new Set(),
      )
      expect(result).toBe('Something Red')
    }
  })

  it('deduplication stress test: resolves until exhaustion with unique results', () => {
    const values = ['Red', 'Blue', 'Green', 'Yellow', 'Purple']
    const usedValues = new Set<string>()
    const results: string[] = []

    for (let i = 0; i < values.length; i++) {
      const result = resolveTemplate(
        'Something [colour]',
        'colour',
        values,
        usedValues,
      )
      expect(result).not.toBeNull()
      results.push(result as string)
    }

    // All results should be unique
    expect(new Set(results).size).toBe(values.length)

    // Next call should return null
    const exhausted = resolveTemplate(
      'Something [colour]',
      'colour',
      values,
      usedValues,
    )
    expect(exhausted).toBeNull()
  })
})
